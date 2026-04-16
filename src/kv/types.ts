/**
 * KV 数据结构定义
 *
 * KV key 规则（userId = token 前8位，用于多用户隔离）:
 *   topic:{userId}:{topicId}          → TopicRecord
 *   topic_index:{userId}              → string[]  (所有 topicId 列表)
 *   ks:{userId}:{topicId}             → KSRecord  (BKT 知识状态)
 *   sm2:{userId}:{topicId}            → SM2Record (SM-2 复习计划)
 *   record:{userId}:{topicId}:{ts}    → LearningRecord
 *   record_index:{userId}:{topicId}   → string[]  (该主题的学习记录 ts 列表)
 *   prereq:{userId}:{topicId}         → string[]  (直接先决知识 topicId 列表)
 */

export interface TopicRecord {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface KSRecord {
  p_known: number;
  p_transit: number;
  p_slip: number;
  p_guess: number;
  updatedAt: number;
}

export interface SM2Record {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  next_review_at: number;
}

export interface LearningRecord {
  id: string;
  topicId: string;
  masteryLevel: number;
  notes: string | null;
  sessionType: string;
  createdAt: number;
}
