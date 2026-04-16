import { KVStore } from "../kv/store";

interface ReviewCandidate {
  topicId: string;
  topicName: string;
  nextReviewAt: number;
  pKnown: number;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export async function handleReviewPlan(
  limit: number,
  includeFuture: boolean,
  store: KVStore
): Promise<object> {
  const now = Math.floor(Date.now() / 1000);
  const candidates = await loadReviewCandidates(store);
  const dueReviews = candidates
    .filter(candidate => candidate.nextReviewAt <= now)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
    .slice(0, limit)
    .map(candidate => toDueReview(candidate, now));

  const upcomingReviews = includeFuture
    ? candidates
        .filter(candidate => candidate.nextReviewAt > now)
        .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
        .slice(0, limit)
        .map(candidate => toUpcomingReview(candidate, now))
    : [];

  return {
    due_count: dueReviews.length,
    due_reviews: dueReviews,
    ...(includeFuture ? { upcoming_reviews: upcomingReviews } : {}),
    generated_at: new Date().toISOString(),
  };
}

async function loadReviewCandidates(store: KVStore): Promise<ReviewCandidate[]> {
  const leafTopics = await store.getLeafTopics();
  const candidates = await Promise.all(leafTopics.map(topic => loadReviewCandidate(store, topic.id, topic.name)));
  return candidates.filter((candidate): candidate is ReviewCandidate => candidate !== null);
}

async function loadReviewCandidate(
  store: KVStore,
  topicId: string,
  topicName: string
): Promise<ReviewCandidate | null> {
  const [ks, sm2] = await Promise.all([store.getKS(topicId), store.getSM2(topicId)]);
  if (!sm2) {
    return null;
  }

  return {
    topicId,
    topicName,
    nextReviewAt: sm2.next_review_at,
    pKnown: ks ? round(ks.p_known) : 0.1,
    intervalDays: sm2.interval_days,
    easeFactor: round(sm2.ease_factor),
    repetitions: sm2.repetitions,
  };
}

function toDueReview(candidate: ReviewCandidate, now: number): object {
  const overdueDays = round((now - candidate.nextReviewAt) / 86400);
  return {
    topic_id: candidate.topicId,
    topic_name: candidate.topicName,
    next_review_at: toIso(candidate.nextReviewAt),
    p_known: candidate.pKnown,
    interval_days: candidate.intervalDays,
    ease_factor: candidate.easeFactor,
    repetitions: candidate.repetitions,
    overdue_days: overdueDays,
    priority: overdueDays > 7 ? "high" : overdueDays > 2 ? "medium" : "low",
  };
}

function toUpcomingReview(candidate: ReviewCandidate, now: number): object {
  return {
    topic_id: candidate.topicId,
    topic_name: candidate.topicName,
    next_review_at: toIso(candidate.nextReviewAt),
    p_known: candidate.pKnown,
    interval_days: candidate.intervalDays,
    days_until: round((candidate.nextReviewAt - now) / 86400),
  };
}

function toIso(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
