/**
 * KV 封装层 — 替代原来的 sql.js + db/connection.ts
 * 所有 KV 读写集中在这里，上层 handler 不直接操作 KV。
 */

import type {
  TopicRecord, KSRecord, SM2Record, LearningRecord,
} from "./types";

export class KVStore {
  constructor(private kv: KVNamespace, private userId: string) {}

  // ─── Topic ──────────────────────────────────────────────────────────────

  async getTopic(id: string): Promise<TopicRecord | null> {
    return this.kv.get<TopicRecord>(`topic:${this.userId}:${id}`, "json");
  }

  async putTopic(topic: TopicRecord): Promise<void> {
    await this.kv.put(`topic:${this.userId}:${topic.id}`, JSON.stringify(topic));
    await this.addToIndex("topic_index", topic.id);
  }

  async getAllTopics(): Promise<TopicRecord[]> {
    const index = await this.getIndex("topic_index");
    const topics = await Promise.all(index.map(id => this.getTopic(id)));
    return topics.filter((t): t is TopicRecord => t !== null);
  }

  async getLeafTopics(topics?: TopicRecord[]): Promise<TopicRecord[]> {
    const allTopics = topics ?? await this.getAllTopics();
    const parentIds = collectParentIds(allTopics);
    return allTopics.filter(topic => !parentIds.has(topic.id));
  }

  async getTopicPaths(topics?: TopicRecord[]): Promise<Record<string, string>> {
    const allTopics = topics ?? await this.getAllTopics();
    const topicById = Object.fromEntries(allTopics.map(topic => [topic.id, topic]));
    const cache: Record<string, string> = {};
    allTopics.forEach(topic => {
      cache[topic.id] = resolveTopicPath(topic, topicById, cache);
    });
    return cache;
  }

  async deleteTopic(id: string): Promise<void> {
    await this.kv.delete(`topic:${this.userId}:${id}`);
    await this.removeFromIndex("topic_index", id);
  }

  /**
   * 递归删除一个主题及其所有子孙节点，同时清理关联数据
   * （ks / sm2 / learning records / prerequisites）
   */
  async deleteTopicCascade(topicId: string): Promise<{ deleted: string[] }> {
    const all = await this.getAllTopics();
    const toDelete = this.collectSubtree(topicId, all);
    await Promise.all(toDelete.map(id => this.deleteOneTopicAndData(id)));
    return { deleted: toDelete };
  }

  /** 收集 topicId 本身 + 所有子孙节点 id（BFS） */
  private collectSubtree(rootId: string, all: TopicRecord[]): string[] {
    const result: string[] = [];
    const queue = [rootId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      result.push(id);
      all.filter(t => t.parentId === id).forEach(c => queue.push(c.id));
    }
    return result;
  }

  /** 删除单个节点及其所有关联 KV 数据 */
  private async deleteOneTopicAndData(id: string): Promise<void> {
    const recordIndex = await this.getIndex(`record_index:${id}`);

    await Promise.all([
      this.kv.delete(`topic:${this.userId}:${id}`),
      this.kv.delete(`ks:${this.userId}:${id}`),
      this.kv.delete(`sm2:${this.userId}:${id}`),
      this.kv.delete(`prereq:${this.userId}:${id}`),
      this.kv.delete(`record_index:${id}:${this.userId}`),
      ...recordIndex.map(ts =>
        this.kv.delete(`record:${this.userId}:${id}:${ts}`)
      ),
    ]);

    await this.removeFromIndex("topic_index", id);
  }

  /**
   * 按路径查找或创建主题（支持 "A/B/C" 自动创建中间节点）
   */
  async resolveTopicPath(path: string): Promise<string> {
    const parts = path.split("/").map(p => p.trim()).filter(p => p.length > 0);
    const topics = await this.getAllTopics();
    let parentId: string | null = null;

    for (const part of parts) {
      const existing = topics.find(t => t.name === part && t.parentId === parentId);
      if (existing) {
        parentId = existing.id;
      } else {
        const id = crypto.randomUUID();
        const newTopic: TopicRecord = { id, name: part, parentId, createdAt: now() };
        await this.putTopic(newTopic);
        topics.push(newTopic); // 本次操作内可见
        parentId = id;
      }
    }

    return parentId!;
  }

  async isLeafTopic(topicId: string): Promise<boolean> {
    const leafTopics = await this.getLeafTopics();
    return leafTopics.some(topic => topic.id === topicId);
  }

  // ─── Knowledge State (BKT) ───────────────────────────────────────────────

  async getKS(topicId: string): Promise<KSRecord | null> {
    return this.kv.get<KSRecord>(`ks:${this.userId}:${topicId}`, "json");
  }

  async putKS(topicId: string, ks: KSRecord): Promise<void> {
    await this.kv.put(`ks:${this.userId}:${topicId}`, JSON.stringify(ks));
  }

  // ─── SM-2 Review Schedule ────────────────────────────────────────────────

  async getSM2(topicId: string): Promise<SM2Record | null> {
    return this.kv.get<SM2Record>(`sm2:${this.userId}:${topicId}`, "json");
  }

  async putSM2(topicId: string, sm2: SM2Record): Promise<void> {
    await this.kv.put(`sm2:${this.userId}:${topicId}`, JSON.stringify(sm2));
  }

  // ─── Learning Records ────────────────────────────────────────────────────

  async putLearningRecord(record: LearningRecord): Promise<void> {
    const key = `record:${this.userId}:${record.topicId}:${record.createdAt}`;
    await this.kv.put(key, JSON.stringify(record));
    await this.addToIndex(`record_index:${record.topicId}`, String(record.createdAt));
  }

  async getLearningRecords(topicId: string): Promise<LearningRecord[]> {
    const index = await this.getIndex(`record_index:${topicId}`);
    const records = await Promise.all(
      index.map(ts => this.kv.get<LearningRecord>(
        `record:${this.userId}:${topicId}:${ts}`, "json"
      ))
    );
    return records.filter((r): r is LearningRecord => r !== null);
  }

  // ─── Prerequisites ───────────────────────────────────────────────────────

  async getPrerequisites(topicId: string): Promise<string[]> {
    const raw = await this.kv.get<string[]>(`prereq:${this.userId}:${topicId}`, "json");
    return raw ?? [];
  }

  async setPrerequisites(topicId: string, prereqIds: string[]): Promise<void> {
    await this.kv.put(
      `prereq:${this.userId}:${topicId}`,
      JSON.stringify(prereqIds)
    );
  }

  async getAllPrerequisites(topicId: string): Promise<string[]> {
    const visited = new Set<string>();
    const queue = [topicId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const prereqs = await this.getPrerequisites(current);
      for (const p of prereqs) {
        if (!visited.has(p)) {
          visited.add(p);
          queue.push(p);
        }
      }
    }
    return Array.from(visited);
  }

  // ─── Index helpers ───────────────────────────────────────────────────────

  private async getIndex(name: string): Promise<string[]> {
    const raw = await this.kv.get<string[]>(`${name}:${this.userId}`, "json");
    return raw ?? [];
  }

  private async addToIndex(name: string, value: string): Promise<void> {
    const index = await this.getIndex(name);
    if (!index.includes(value)) {
      index.push(value);
      await this.kv.put(`${name}:${this.userId}`, JSON.stringify(index));
    }
  }

  private async removeFromIndex(name: string, value: string): Promise<void> {
    const index = await this.getIndex(name);
    const filtered = index.filter(v => v !== value);
    await this.kv.put(`${name}:${this.userId}`, JSON.stringify(filtered));
  }
}

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function collectParentIds(topics: TopicRecord[]): Set<string> {
  return new Set(
    topics
      .filter(topic => topic.parentId !== null)
      .map(topic => topic.parentId as string)
  );
}

function resolveTopicPath(
  topic: TopicRecord,
  topicById: Record<string, TopicRecord>,
  cache: Record<string, string>
): string {
  const cached = cache[topic.id];
  if (cached) {
    return cached;
  }

  if (!topic.parentId) {
    return topic.name;
  }

  const parent = topicById[topic.parentId];
  if (!parent) {
    return topic.name;
  }

  const parentPath = resolveTopicPath(parent, topicById, cache);
  const fullPath = `${parentPath}/${topic.name}`;
  cache[topic.id] = fullPath;
  return fullPath;
}
