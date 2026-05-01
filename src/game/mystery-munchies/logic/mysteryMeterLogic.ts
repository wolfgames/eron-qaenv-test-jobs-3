/**
 * Mystery Munchies — pure mystery meter math.
 *
 * The meter fills proportionally as clue cells (rows 7..9) clear.
 * Clamps at [0, 1].
 */

export function computeMysteryMeterFromCleared(cleared: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = cleared / total;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return ratio;
}
