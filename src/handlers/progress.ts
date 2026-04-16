import { KVStore } from "../kv/store";
import { defaultBKTParams } from "../lib/knowledge-tracing";

export async function handleProgress(
  topicFilter: string | null,
  period: string,
  store: KVStore
): Promise<object> {
  const topics = await store.getAllTopics();
  const topicPaths = await store.getTopicPaths(topics);
  const now = Math.floor(Date.now() / 1000);

  // 时间过滤
  let since: number | null = null;
  if (period !== "all") {
    const match = period.match(/^(\d+)([dhw])$/);
    if (match) {
      const num = parseInt(match[1]);
      const unit = match[2];
      const secs = unit === "d" ? num * 86400 : unit === "h" ? num * 3600 : num * 7 * 86400;
      since = now - secs;
    }
  }

  // 过滤主题
  let filteredTopics = topics;
  if (topicFilter) {
    const parts = topicFilter.split("/").map(p => p.trim()).filter(Boolean);
    const lastName = parts[parts.length - 1].toLowerCase();
    filteredTopics = topics.filter(t => t.name.toLowerCase().includes(lastName));
  }

  // 构建每个主题的状态
  const topicStates = await Promise.all(
    filteredTopics.map(async topic => {
      const ks = await store.getKS(topic.id);
      const sm2 = await store.getSM2(topic.id);
      const records = await store.getLearningRecords(topic.id);

      const filteredRecords = since
        ? records.filter(r => r.createdAt >= since!)
        : records;

      const pKnown = ks ? round(ks.p_known) : defaultBKTParams().p_known;
      const lastStudied = records.length > 0
        ? new Date(Math.max(...records.map(r => r.createdAt)) * 1000).toISOString()
        : null;

      return {
        topic_id: topic.id,
        topic_name: topic.name,
        topic_path: topicPaths[topic.id] ?? topic.name,
        parent_id: topic.parentId,
        p_known: pKnown,
        status: statusLabel(pKnown),
        session_count: filteredRecords.length,
        last_studied: lastStudied,
        next_review: sm2
          ? new Date(sm2.next_review_at * 1000).toISOString()
          : null,
        overdue: sm2 ? sm2.next_review_at < now : false,
      };
    })
  );

  // 按知识树分组：找根节点
  const roots = topicStates
    .filter(t => t.parent_id === null)
    .sort((a, b) => a.topic_name.localeCompare(b.topic_name));

  const leafStates = filterLeafStates(topicStates);
  const total = leafStates.length;
  const mastered = leafStates.filter(t => t.p_known >= 0.8).length;
  const overdue = leafStates.filter(t => t.overdue).length;

  return {
    summary: {
      total_topics: total,
      mastered,
      in_progress: leafStates.filter(t => t.p_known >= 0.4 && t.p_known < 0.8).length,
      beginning: leafStates.filter(t => t.p_known < 0.4).length,
      overdue_reviews: overdue,
    },
    topics: topicStates,
    root_topics: roots,
    period,
    generated_at: new Date().toISOString(),
  };
}

function filterLeafStates<T extends { topic_id: string; parent_id: string | null }>(topics: T[]): T[] {
  const parentIds = new Set(
    topics
      .filter(topic => topic.parent_id !== null)
      .map(topic => topic.parent_id as string)
  );
  return topics.filter(topic => !parentIds.has(topic.topic_id));
}

function statusLabel(p: number): string {
  if (p >= 0.8) return "mastered";
  if (p >= 0.6) return "strong";
  if (p >= 0.4) return "developing";
  return "beginning";
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
