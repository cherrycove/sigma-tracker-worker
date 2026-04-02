/**
 * Bayesian Knowledge Tracing (BKT)
 *
 * Estimates the probability that a learner has mastered a knowledge component
 * based on their observable performance (correct/incorrect responses).
 *
 * Parameters:
 * - p_known (P(L₀)): Prior probability of knowing the skill
 * - p_transit (P(T)): Probability of learning on each opportunity
 * - p_slip (P(S)): Probability of incorrect response despite knowing
 * - p_guess (P(G)): Probability of correct response despite not knowing
 */

export interface BKTParams {
  p_known: number;   // P(L_n): current probability of knowing
  p_transit: number;  // P(T): transition probability (learn rate)
  p_slip: number;     // P(S): slip probability
  p_guess: number;    // P(G): guess probability
}

export interface BKTResult extends BKTParams {
  p_correct: number;  // predicted probability of correct response
}

/**
 * Default BKT parameters for a new knowledge component.
 */
export function defaultBKTParams(): BKTParams {
  return {
    p_known: 0.1,
    p_transit: 0.3,
    p_slip: 0.1,
    p_guess: 0.2,
  };
}

/**
 * Predict the probability of a correct response given current knowledge state.
 */
export function predictCorrect(params: BKTParams): number {
  const { p_known, p_slip, p_guess } = params;
  return p_known * (1 - p_slip) + (1 - p_known) * p_guess;
}

/**
 * Update knowledge state after observing a response.
 *
 * Uses Bayes' theorem:
 * P(L_n | obs) = P(obs | L_n) * P(L_n) / P(obs)
 *
 * Then applies learning transition:
 * P(L_{n+1}) = P(L_n | obs) + (1 - P(L_n | obs)) * P(T)
 *
 * @param params - Current BKT parameters
 * @param correct - Whether the observed response was correct
 * @returns Updated BKT parameters
 */
export function updateBKT(params: BKTParams, correct: boolean): BKTResult {
  const { p_known, p_transit, p_slip, p_guess } = params;

  // Step 1: Posterior update using Bayes' theorem
  let p_known_posterior: number;

  if (correct) {
    // P(L_n | correct) = P(correct | L_n) * P(L_n) / P(correct)
    const p_correct_given_known = 1 - p_slip;
    const p_correct = p_known * p_correct_given_known + (1 - p_known) * p_guess;
    p_known_posterior = (p_correct_given_known * p_known) / p_correct;
  } else {
    // P(L_n | incorrect) = P(incorrect | L_n) * P(L_n) / P(incorrect)
    const p_incorrect_given_known = p_slip;
    const p_incorrect = p_known * p_incorrect_given_known + (1 - p_known) * (1 - p_guess);
    p_known_posterior = (p_incorrect_given_known * p_known) / p_incorrect;
  }

  // Step 2: Learning transition
  // P(L_{n+1}) = P(L_n | obs) + (1 - P(L_n | obs)) * P(T)
  const p_known_new = p_known_posterior + (1 - p_known_posterior) * p_transit;

  // Clamp to valid probability range
  const clamped = Math.max(0.001, Math.min(0.999, p_known_new));

  const p_correct_predicted = clamped * (1 - p_slip) + (1 - clamped) * p_guess;

  return {
    p_known: clamped,
    p_transit,
    p_slip,
    p_guess,
    p_correct: p_correct_predicted,
  };
}

/**
 * Convert mastery_level (0-1 continuous) to a correct/incorrect observation.
 * mastery >= 0.5 is treated as "correct", otherwise "incorrect".
 * For more nuanced updates, we can do multiple BKT updates based on mastery level.
 */
export function masteryToObservation(mastery: number): boolean {
  return mastery >= 0.5;
}

/**
 * Perform a nuanced BKT update based on continuous mastery level.
 * Does multiple micro-updates to better reflect the quality of the response.
 */
export function updateBKTWithMastery(params: BKTParams, mastery: number): BKTResult {
  // For extreme values, do a single update
  if (mastery <= 0.2) {
    return updateBKT(params, false);
  }
  if (mastery >= 0.8) {
    return updateBKT(params, true);
  }

  // For intermediate values, do a weighted update
  // Simulate by computing both outcomes and blending
  const resultCorrect = updateBKT(params, true);
  const resultIncorrect = updateBKT(params, false);

  // Weight by mastery level (mastery acts as probability of correct)
  const blended_p_known = mastery * resultCorrect.p_known + (1 - mastery) * resultIncorrect.p_known;

  return {
    p_known: Math.max(0.001, Math.min(0.999, blended_p_known)),
    p_transit: params.p_transit,
    p_slip: params.p_slip,
    p_guess: params.p_guess,
    p_correct: blended_p_known * (1 - params.p_slip) + (1 - blended_p_known) * params.p_guess,
  };
}
