import { KVStore } from "../kv/store";
import { defaultBKTParams } from "../lib/knowledge-tracing";

export async function handleMastery(
  topic: string,
  threshold: number,
  store: KVStore
): Promise<object> {
  const topics = await store.getAllTopics();
  const parts = topic.split("/").map(p => p.trim()).filter(Boolean);
  const lastName = parts[parts.length - 1];

  const found = topics.find(t => t.name === lastName);
  if (!found) {
    return {
      error: `Topic "${topic}" not found`,
      suggestion: "Use POST /record to create the topic first",
    };
  }

  const ks = await store.getKS(found.id);
  const defaults = defaultBKTParams();
  const pKnown = ks ? ks.p_known : defaults.p_known;

  // 先决知识检查
  const allPrereqIds = await store.getAllPrerequisites(found.id);
  const allPrereqs = await Promise.all(
    allPrereqIds.map(async id => {
      const t = await store.getTopic(id);
      const prereqKS = await store.getKS(id);
      const p = prereqKS ? prereqKS.p_known : defaults.p_known;
      return { topic_id: id, name: t?.name ?? id, p_known: round(p), is_weak: p < threshold };
    })
  );

  const weakPrereqs = allPrereqs.filter(p => p.is_weak);
  const mastered = pKnown >= threshold;

  return {
    topic_id: found.id,
    topic_name: found.name,
    mastery: {
      p_known: round(pKnown),
      mastered,
      status: pKnown >= 0.8 ? "strong" : pKnown >= threshold ? "adequate" : pKnown >= 0.3 ? "developing" : "beginning",
    },
    prerequisites: {
      total: allPrereqs.length,
      weak_count: weakPrereqs.length,
      all: allPrereqs,
      weak: weakPrereqs,
      ready_to_learn: weakPrereqs.length === 0,
    },
    recommendation: {
      should_backtrack: weakPrereqs.length > 0,
      backtrack_path: weakPrereqs,
      suggested_action: weakPrereqs.length > 0
        ? `先复习薄弱先决知识: ${weakPrereqs.map(p => p.name).join(" → ")}`
        : mastered
          ? "已掌握，可进阶相关主题"
          : "先决知识扎实，专注深化当前主题",
    },
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
