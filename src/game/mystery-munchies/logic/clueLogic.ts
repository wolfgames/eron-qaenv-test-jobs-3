/**
 * Mystery Munchies — pure clue layer logic.
 *
 * Clue rows are the bottom 3 rows of the 8×10 board (rows 7, 8, 9 in
 * 0-indexed coordinates). The clue artwork reveals proportionally as
 * those bubbles clear.
 */

export interface ClueOpacityOptions {
  /** Minimum opacity used on the results screen for partial reveals. */
  partialFloor?: number;
}

export function isClueRow(row: number): boolean {
  return row >= 7 && row <= 9;
}

export function computeClueRevealOpacity(
  cleared: number,
  total: number,
  options: ClueOpacityOptions = {},
): number {
  const ratio = total > 0 ? cleared / total : 0;
  const clamped = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
  if (options.partialFloor !== undefined) {
    return Math.max(options.partialFloor, clamped);
  }
  return clamped;
}
