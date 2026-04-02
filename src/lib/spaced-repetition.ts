/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak.
 * Calculates optimal review intervals based on performance quality.
 */

export interface SM2State {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

export interface SM2Result extends SM2State {
  next_review_at: number; // unix timestamp
}

/**
 * Calculate next review using SM-2 algorithm.
 * @param quality - Quality of response, 0-5 scale (0=forgot, 5=perfect)
 * @param current - Current SM-2 state
 * @returns Updated SM-2 state with next review timestamp
 */
export function sm2Calculate(quality: number, current: SM2State): SM2Result {
  // Clamp quality to 0-5
  quality = Math.max(0, Math.min(5, quality));

  let { interval_days, ease_factor, repetitions } = current;

  if (quality >= 3) {
    // Successful recall
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor * 10) / 10;
    }
    repetitions++;
  } else {
    // Failed recall - reset
    repetitions = 0;
    interval_days = 1;
  }

  // Update ease factor
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ease_factor = Math.max(1.3, ease_factor); // minimum ease factor

  const now = Math.floor(Date.now() / 1000);
  const next_review_at = now + Math.floor(interval_days * 86400);

  return { interval_days, ease_factor, repetitions, next_review_at };
}

/**
 * Convert mastery_level (0-1) to SM-2 quality (0-5).
 */
export function masteryToQuality(mastery: number): number {
  return Math.round(mastery * 5);
}

/**
 * Get default SM-2 state for a new topic.
 */
export function defaultSM2State(): SM2State {
  return {
    interval_days: 1,
    ease_factor: 2.5,
    repetitions: 0,
  };
}
