import { KVStore } from "../kv/store";
import { updateBKTWithMastery, defaultBKTParams } from "../lib/knowledge-tracing";
import { sm2Calculate, masteryToQuality, defaultSM2State } from "../lib/spaced-repetition";
import type { KSRecord, SM2Record, LearningRecord } from "../kv/types";

export async function handleRecord(body: unknown, store: KVStore): Promise<object> {
  const { topic, mastery_level, notes, session_type = "learn" } = body as {
    topic: string;
    mastery_level: number;
    notes?: string;
    session_type?: string;
  };

  if (!topic || typeof mastery_level !== "number") {
    throw new Error("topic (string) and mastery_level (number) are required");
  }

  const mastery = Math.max(0, Math.min(1, mastery_level));
  const topicId = await store.resolveTopicPath(topic);

  if (!(await store.isLeafTopic(topicId))) {
    throw new Error(
      `"${topic}" is a category node. Record learning only on leaf topics (e.g. "Python/装饰器/带参数装饰器").`
    );
  }

  const ts = Math.floor(Date.now() / 1000);

  // ── BKT update ──────────────────────────────────────────────────────────
  const existingKS = await store.getKS(topicId);
  const bktParams = existingKS
    ? { p_known: existingKS.p_known, p_transit: existingKS.p_transit, p_slip: existingKS.p_slip, p_guess: existingKS.p_guess }
    : defaultBKTParams();

  const bktResult = updateBKTWithMastery(bktParams, mastery);

  const newKS: KSRecord = {
    p_known: bktResult.p_known,
    p_transit: bktResult.p_transit,
    p_slip: bktResult.p_slip,
    p_guess: bktResult.p_guess,
    updatedAt: ts,
  };

  // ── SM-2 update ──────────────────────────────────────────────────────────
  const existingSM2 = await store.getSM2(topicId);
  const sm2State = existingSM2
    ? { interval_days: existingSM2.interval_days, ease_factor: existingSM2.ease_factor, repetitions: existingSM2.repetitions }
    : defaultSM2State();

  const sm2Result = sm2Calculate(masteryToQuality(mastery), sm2State);

  const newSM2: SM2Record = {
    interval_days: sm2Result.interval_days,
    ease_factor: sm2Result.ease_factor,
    repetitions: sm2Result.repetitions,
    next_review_at: sm2Result.next_review_at,
  };

  // ── Learning record ──────────────────────────────────────────────────────
  const record: LearningRecord = {
    id: crypto.randomUUID(),
    topicId,
    masteryLevel: mastery,
    notes: notes ?? null,
    sessionType: session_type,
    createdAt: ts,
  };

  // 并发写入（KV 支持并发 put）
  await Promise.all([
    store.putKS(topicId, newKS),
    store.putSM2(topicId, newSM2),
    store.putLearningRecord(record),
  ]);

  return {
    record_id: record.id,
    topic_id: topicId,
    topic_path: topic,
    mastery_level: mastery,
    session_type,
    bkt_state: {
      p_known: round(bktResult.p_known),
      p_correct: round(bktResult.p_correct),
    },
    next_review: new Date(sm2Result.next_review_at * 1000).toISOString(),
    interval_days: sm2Result.interval_days,
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
