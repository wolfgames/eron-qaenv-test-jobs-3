/**
 * Mystery Munchies — pure gravity logic.
 *
 * Reads the current ECS Block entities. Returns a description of:
 *  - moved[]: entities whose row should change (from → to)
 *  - spawned[]: new entities to insert at the top to refill columns
 *
 * Pure: no Math.random (uses a closure-bound RNG passed by caller, OR
 * the local fallback RNG is OK because the result of refill is randomly
 * colored bubbles — but per project rule we use a seeded RNG for
 * reproducibility).
 *
 * Stable identity principle: existing entities keep their id when they
 * fall — only the row changes. New refill bubbles get a fresh id assigned
 * by the ECS store when inserted.
 *
 * Refill is gated by the level's `refillEnabled` flag — but that flag
 * is not stored on ECS resources directly (it lives on LevelConfig).
 * This logic accepts an optional `{refillEnabled, rng}` arg; when omitted
 * it uses the inferred rule (refill columns whose post-drop height drops
 * below 3) only if a refillEnabled hint is true.
 */

import { GRID_COLS, GRID_ROWS, COLORS, ColorIndex } from '../state/types';
import { CellKind } from '../state/GamePlugin';
import type { GameDatabase } from '../state/GamePlugin';

export interface MovedEntry {
  entity: number;
  fromRow: number;
  toRow: number;
  col: number;
  /** Number of rows fallen (for animation duration scaling). */
  distance: number;
}

export interface SpawnedEntry {
  /** The cellKind for the spawned cell (always 1 = bubble for refills). */
  kind: number;
  /** ColorIndex (0..4). */
  color: number;
  row: number;
  col: number;
}

export interface GravityResult {
  moved: MovedEntry[];
  spawned: SpawnedEntry[];
}

const COLUMN_REFILL_THRESHOLD = 3;

interface CellSnapshot {
  entity: number;
  kind: number;
  color: number;
  row: number;
  col: number;
}

function snapshotBoard(db: GameDatabase): CellSnapshot[] {
  const out: CellSnapshot[] = [];
  for (const e of db.store.select(['cellKind', 'cellColor', 'cellRow', 'cellCol'])) {
    const data = db.store.read(e);
    if (!data) continue;
    out.push({
      entity: e,
      kind: Number(data.cellKind ?? 0),
      color: Number(data.cellColor ?? 0),
      row: Number(data.cellRow ?? 0),
      col: Number(data.cellCol ?? 0),
    });
  }
  return out;
}

/**
 * Compute the post-pop gravity drop result.
 *
 * @param db          current ECS database
 * @param options.refillEnabled whether to refill columns from the top
 * @param options.rng optional seeded RNG for refill colors (for tests). When
 *                    omitted, a fixed deterministic RNG is used so the
 *                    result is reproducible.
 */
export function computeGravityDrop(
  db: GameDatabase,
  options: { refillEnabled?: boolean; rng?: () => number } = {},
): GravityResult {
  const cells = snapshotBoard(db);
  const moved: MovedEntry[] = [];
  const spawned: SpawnedEntry[] = [];

  // Group cells by column. Crate blockers do not fall (immovable per GDD).
  const byCol: Map<number, CellSnapshot[]> = new Map();
  for (let c = 0; c < GRID_COLS; c++) byCol.set(c, []);
  for (const cell of cells) byCol.get(cell.col)?.push(cell);

  for (let col = 0; col < GRID_COLS; col++) {
    const colCells = (byCol.get(col) ?? []).slice().sort((a, b) => b.row - a.row); // bottom-up
    // Build the post-drop column from the bottom.
    let writeRow = GRID_ROWS - 1;
    // Pre-pass: identify static (non-falling) cells — crate blockers.
    const newColumn: Array<CellSnapshot | null> = Array.from({ length: GRID_ROWS }, () => null);

    // First pass — place crate blockers in their original rows.
    for (const cell of colCells) {
      if (cell.kind === CellKind.crateBlocker) {
        newColumn[cell.row] = cell;
      }
    }
    // Second pass — fall bubbles + ghost barriers + power bubbles bottom-up.
    for (const cell of colCells) {
      if (cell.kind === CellKind.crateBlocker) continue;
      // Find the lowest empty (or non-crate) row at or below the current writeRow.
      while (writeRow >= 0 && newColumn[writeRow] !== null) writeRow -= 1;
      if (writeRow < 0) break; // overflow — shouldn't happen in 8x10
      newColumn[writeRow] = cell;
      if (cell.row !== writeRow) {
        moved.push({
          entity: cell.entity,
          fromRow: cell.row,
          toRow: writeRow,
          col,
          distance: Math.max(0, writeRow - cell.row),
        });
      }
      writeRow -= 1;
    }

    // Refill: count populated cells in this column post-drop.
    if (options.refillEnabled) {
      const populated = newColumn.filter((c) => c !== null).length;
      // Bring column up to COLUMN_REFILL_THRESHOLD * 2 (but never overflow).
      const target = Math.min(GRID_ROWS, Math.max(populated, COLUMN_REFILL_THRESHOLD * 2));
      let rng = options.rng;
      if (!rng) {
        // Cheap seeded RNG anchored to col so test runs are deterministic
        // without callers needing to plumb an RNG.
        let s = (col * 0x9E3779B1 + 1) >>> 0;
        rng = () => {
          s = (s + 0x6D2B79F5) >>> 0;
          let t = s;
          t = Math.imul(t ^ (t >>> 15), t | 1);
          t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
      }
      const needed = target - populated;
      for (let r = 0; r < needed; r++) {
        const colorIdx = Math.floor(rng() * COLORS.length) % COLORS.length;
        spawned.push({
          kind: CellKind.bubble,
          color: colorIdx,
          row: r,
          col,
        });
      }
    }
  }

  return { moved, spawned };
}

/** Re-export ColorIndex so callers can map color indices to readable names. */
export { ColorIndex };
