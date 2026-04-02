/**
 * KV 封装层 — 替代原来的 sql.js + db/connection.ts
 * 所有 KV 读写集中在这里，上层 handler 不直接操作 KV。
 */

import type {
  TopicRecord, KSRecord, SM2Record, LearningRecord, ReviewIndexEntry,
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

  async deleteTopic(id: string): Promise<void> {
    await this.kv.delete(`topic:${this.userId}:${id}`);
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
    const all = await this.getAllTopics();
    return !all.some(t => t.parentId === topicId);
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
    await this.updateReviewIndex(topicId);
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

  // ─── Review Index ────────────────────────────────────────────────────────

  async getReviewIndex(): Promise<ReviewIndexEntry[]> {
    const raw = await this.kv.get<ReviewIndexEntry[]>(
      `review_index:${this.userId}`, "json"
    );
    return raw ?? [];
  }

  private async updateReviewIndex(topicId: string): Promise<void> {
    const sm2 = await this.getSM2(topicId);
    const topic = await this.getTopic(topicId);
    if (!sm2 || !topic) return;

    const index = await this.getReviewIndex();
    const existing = index.findIndex(e => e.topicId === topicId);
    const entry: ReviewIndexEntry = {
      topicId,
      topicName: topic.name,
      next_review_at: sm2.next_review_at,
    };

    if (existing >= 0) {
      index[existing] = entry;
    } else {
      index.push(entry);
    }

    await this.kv.put(`review_index:${this.userId}`, JSON.stringify(index));
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
