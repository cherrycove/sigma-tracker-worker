import { KVStore } from "../kv/store";

export async function handleReviewPlan(
  limit: number,
  includeFuture: boolean,
  store: KVStore
): Promise<object> {
  const now = Math.floor(Date.now() / 1000);
  const index = await store.getReviewIndex();

  const due = index
    .filter(e => e.next_review_at <= now)
    .sort((a, b) => a.next_review_at - b.next_review_at)
    .slice(0, limit);

  const dueReviews = await Promise.all(due.map(async entry => {
    const ks = await store.getKS(entry.topicId);
    const sm2 = await store.getSM2(entry.topicId);
    const overdueDays = round((now - entry.next_review_at) / 86400);
    return {
      topic_id: entry.topicId,
      topic_name: entry.topicName,
      next_review_at: new Date(entry.next_review_at * 1000).toISOString(),
      p_known: ks ? round(ks.p_known) : 0.1,
      interval_days: sm2?.interval_days ?? 1,
      ease_factor: sm2 ? round(sm2.ease_factor) : 2.5,
      repetitions: sm2?.repetitions ?? 0,
      overdue_days: overdueDays,
      priority: overdueDays > 7 ? "high" : overdueDays > 2 ? "medium" : "low",
    };
  }));

  let upcomingReviews: object[] = [];
  if (includeFuture) {
    const upcoming = index
      .filter(e => e.next_review_at > now)
      .sort((a, b) => a.next_review_at - b.next_review_at)
      .slice(0, limit);

    upcomingReviews = await Promise.all(upcoming.map(async entry => {
      const ks = await store.getKS(entry.topicId);
      const sm2 = await store.getSM2(entry.topicId);
      return {
        topic_id: entry.topicId,
        topic_name: entry.topicName,
        next_review_at: new Date(entry.next_review_at * 1000).toISOString(),
        p_known: ks ? round(ks.p_known) : 0.1,
        interval_days: sm2?.interval_days ?? 1,
        days_until: round((entry.next_review_at - now) / 86400),
      };
    }));
  }

  return {
    due_count: dueReviews.length,
    due_reviews: dueReviews,
    ...(includeFuture ? { upcoming_reviews: upcomingReviews } : {}),
    generated_at: new Date().toISOString(),
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
