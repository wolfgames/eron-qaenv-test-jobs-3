/**
 * Mystery Munchies — cluster (flood-fill) logic.
 *
 * Pure: no Math.random, no Pixi imports, no DOM access.
 * Reads ECS state via the database accessor and returns plain data.
 */

import { GRID_COLS, GRID_ROWS } from '../state/types';
import { CellKind } from '../state/GamePlugin';
import type { GameDatabase } from '../state/GamePlugin';

export interface ClusterMember {
  /** ECS entity id. Stable across the cluster lifetime. */
  entity: number;
  row: number;
  col: number;
  /** Color index of the cluster (all members share). */
  color: number;
  /** Cell kind for the member (bubble vs power-snack-bomb). */
  kind: number;
}

interface CellSnapshot {
  entity: number;
  kind: number;
  color: number;
}

/**
 * Build a sparse snapshot of the board indexed by row*COLS+col.
 * Only bubble cells (kind == 1) and power bubbles (kind == 4) are returned —
 * blockers are NOT included as cluster candidates (they are destroyed via
 * adjacency hits, not cluster pops).
 */
function snapshotBoard(db: GameDatabase): Map<number, CellSnapshot> {
  const map = new Map<number, CellSnapshot>();
  for (const e of db.store.select(['cellKind', 'cellColor', 'cellRow', 'cellCol'])) {
    const data = db.store.read(e);
    if (!data) continue;
    const kind = Number(data.cellKind ?? 0);
    if (kind !== CellKind.bubble && kind !== CellKind.powerSnackBomb) continue;
    const row = Number(data.cellRow ?? 0);
    const col = Number(data.cellCol ?? 0);
    map.set(row * GRID_COLS + col, {
      entity: e,
      kind,
      color: Number(data.cellColor ?? 0),
    });
  }
  return map;
}

/**
 * Find the orthogonally-connected same-color cluster containing (row, col).
 *
 * @returns the list of cluster members, including the tap origin. If the
 *          tapped cell is empty or a blocker, returns an empty array.
 *          A lone bubble returns a single-member array.
 */
export function findCluster(db: GameDatabase, row: number, col: number): ClusterMember[] {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return [];
  const board = snapshotBoard(db);
  const startKey = row * GRID_COLS + col;
  const start = board.get(startKey);
  if (!start) return [];
  const targetColor = start.color;
  const visited = new Set<number>();
  const stack: number[] = [startKey];
  const cluster: ClusterMember[] = [];

  while (stack.length > 0) {
    const key = stack.pop() as number;
    if (visited.has(key)) continue;
    visited.add(key);
    const cell = board.get(key);
    if (!cell || cell.color !== targetColor) continue;
    const r = Math.floor(key / GRID_COLS);
    const c = key % GRID_COLS;
    cluster.push({ entity: cell.entity, row: r, col: c, color: cell.color, kind: cell.kind });
    // Orthogonal neighbors only (no diagonals).
    if (r > 0) stack.push((r - 1) * GRID_COLS + c);
    if (r + 1 < GRID_ROWS) stack.push((r + 1) * GRID_COLS + c);
    if (c > 0) stack.push(r * GRID_COLS + (c - 1));
    if (c + 1 < GRID_COLS) stack.push(r * GRID_COLS + (c + 1));
  }

  return cluster;
}
