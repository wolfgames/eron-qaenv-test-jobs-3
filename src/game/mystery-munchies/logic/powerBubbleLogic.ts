/**
 * Mystery Munchies — power bubble logic (pure).
 *
 * Pure functions: no Math.random, no Pixi.
 *  - pickPowerSpawnIndex: chooses a member of the popped cluster to host the
 *    new power bubble (seeded RNG passed by caller).
 *  - computeBlastArea: returns the cells affected by a power bubble blast,
 *    clipped to the 8×10 board bounds.
 *  - resolvePowerChain: cascades power activations up to chainMax depth.
 */

import { GRID_COLS, GRID_ROWS } from '../state/types';

export const PowerType = {
  SnackBomb: 'snack-bomb',
  MysteryMachine: 'mystery-machine',
  UnmaskingOrb: 'unmasking-orb',
} as const;

export type PowerTypeValue = (typeof PowerType)[keyof typeof PowerType];

export interface BlastCell { row: number; col: number; }

export interface PowerSpawnRequest {
  row: number;
  col: number;
  powerType: PowerTypeValue;
}

export function pickPowerSpawnIndex(clusterSize: number, rng: () => number): number {
  if (clusterSize <= 0) return 0;
  return Math.floor(rng() * clusterSize) % clusterSize;
}

export function computeBlastArea(row: number, col: number, type: PowerTypeValue): BlastCell[] {
  const out: BlastCell[] = [];
  if (type === PowerType.SnackBomb) {
    // 3x3 centered on (row, col).
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue;
        out.push({ row: r, col: c });
      }
    }
    return out;
  }
  if (type === PowerType.MysteryMachine) {
    // Full row + full column.
    for (let c = 0; c < GRID_COLS; c++) out.push({ row, col: c });
    for (let r = 0; r < GRID_ROWS; r++) {
      if (r === row) continue;
      out.push({ row: r, col });
    }
    return out;
  }
  if (type === PowerType.UnmaskingOrb) {
    // Caller resolves: clears all of one color. We return [] and let the
    // controller iterate by color.
    return [];
  }
  return out;
}

export interface ChainResult {
  totalCells: BlastCell[];
  depthReached: number;
}

export function resolvePowerChain(
  initial: PowerSpawnRequest,
  /** Returns the next-tier power spawns produced by this activation. */
  onActivate: (req: PowerSpawnRequest, depth: number) => PowerSpawnRequest[],
  chainMax: number,
): ChainResult {
  const totalCells: BlastCell[] = [];
  let depth = 0;
  let frontier: PowerSpawnRequest[] = [initial];
  while (frontier.length > 0 && depth <= chainMax) {
    const next: PowerSpawnRequest[] = [];
    for (const req of frontier) {
      totalCells.push(...computeBlastArea(req.row, req.col, req.powerType));
      const spawned = onActivate(req, depth);
      for (const s of spawned) next.push(s);
    }
    if (depth === chainMax) break;
    depth += 1;
    frontier = next;
  }
  return { totalCells, depthReached: depth };
}

/**
 * Convenience: activate one power bubble against a board. Used by tests
 * and the controller wiring as a single-shot helper. Returns the cleared
 * cells without applying ECS mutations — caller is responsible for that.
 */
export function activatePower(req: PowerSpawnRequest, chainMax: number): ChainResult {
  return resolvePowerChain(req, () => [], chainMax);
}
