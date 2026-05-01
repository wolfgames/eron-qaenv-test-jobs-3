/**
 * Mystery Munchies — pure scoring formula.
 *
 * Score is multiplicative across two dimensions:
 *  1. Cluster size — bigger groups are worth more per bubble.
 *  2. Chain depth  — chained activations multiply the base.
 *
 * Per CoS scoring (multiplicative-spread + ≥ 3x skilled-vs-beginner gap),
 * the chain multiplier scales linearly: depth 0 → ×1, depth 1 → ×2, depth 2 → ×3.
 *
 * No Math.random, no Pixi — pure function callable from tests.
 */

import type { MysteryMunchiesTuning } from '../tuning/gameTuning';

/**
 * Chain multiplier given a chain depth (0 = first hit, 1 = first chain).
 * Returns a positive integer; clamped at chainMax + 1.
 */
export function computeChainMultiplier(chainDepth: number, max = 3): number {
  const d = Math.max(0, Math.min(chainDepth, max));
  return d + 1;
}

/**
 * Compute the score delta for a single cluster pop or power activation.
 *
 * @param clusterSize number of cells cleared in this single hit
 * @param chainDepth  0 for the first hit, 1+ for cascading power chains
 * @param tuning      game tuning values (popBasePts, chainMax)
 */
export function computeScore(
  clusterSize: number,
  chainDepth: number,
  tuning: MysteryMunchiesTuning,
): number {
  if (clusterSize <= 0) return 0;
  const multiplier = computeChainMultiplier(chainDepth, tuning.chainMax);
  return clusterSize * tuning.popBasePts * multiplier;
}
