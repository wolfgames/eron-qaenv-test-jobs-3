/**
 * Mystery Munchies — pure star-rating logic.
 *
 * Stars are derived from how many taps remain at win.
 * - tapsRemaining >= thresholds.three → 3 stars
 * - tapsRemaining >= thresholds.two   → 2 stars
 * - any other win                     → 1 star (minimum win award)
 */

import type { LevelConfigStarThresholds } from '../state/types';

export function computeStars(
  tapsRemaining: number,
  thresholds: LevelConfigStarThresholds,
): number {
  if (tapsRemaining >= thresholds.three) return 3;
  if (tapsRemaining >= thresholds.two) return 2;
  return 1;
}
