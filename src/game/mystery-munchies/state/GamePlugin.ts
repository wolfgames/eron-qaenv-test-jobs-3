/**
 * Mystery Munchies — ECS plugin (source of truth for game state).
 *
 * Plugin property order is enforced at runtime by `Database.Plugin.create`:
 *   extends → services → components → resources → archetypes → computed →
 *   transactions → actions → systems
 *
 * State is kept here, never written directly to SolidJS signals. Bridge
 * propagates a curated subset of resources to DOM via bridgeEcsToSignals.
 */

import { Database } from '@adobe/data/ecs';
import { F32, U32 } from '@adobe/data/math';
import {
  CellKind,
  ColorIndex,
  GRID_COLS,
  GRID_ROWS,
  PhaseCode,
  decodeCell,
  type CellKindCode,
  type ColorIndexCode,
  type LevelConfig,
  type PhaseCodeValue,
} from './types';

/**
 * The plugin definition. Property order matters — Database.Plugin.create
 * throws if the order is wrong (see project rule ecs-state.mdc).
 */
export const gamePlugin = Database.Plugin.create({
  components: {
    // Cell kind (0=empty, 1=bubble, 2=ghost-barrier, 3=crate-blocker, 4=power-snack-bomb)
    cellKind: U32.schema,
    // Color index (0..4) — meaningful for bubble + power kinds.
    cellColor: U32.schema,
    // Grid coordinates.
    cellRow: U32.schema,
    cellCol: U32.schema,
    // Hits remaining for ghost-barrier blockers (starts at 2). Used by Batch 7.
    blockerHits: U32.schema,
    // Stable identity reused on gravity drops (incrementing counter populated on insert).
    cellId: F32.schema,
  },
  resources: {
    // Score: integer.
    score: { default: 0 as number },
    // Tap budget remaining for the current level.
    tapsRemaining: { default: 20 as number },
    // Stars earned on level completion (0..3).
    starsEarned: { default: 0 as number },
    // Mystery meter progress: 0..1 fraction of clue rows revealed.
    mysteryMeterProgress: { default: 0 as number },
    // Phase code — see PhaseCode in types.ts.
    boardPhase: { default: PhaseCode.idle as PhaseCodeValue },
    // Current level number (1-based).
    level: { default: 1 as number },
    // Current chapter number (1-based).
    chapter: { default: 1 as number },
    // Cells cleared in this level (for win condition: == totalNonBlockerCells).
    clearedCells: { default: 0 as number },
    // Total non-blocker cells at level start (for win condition).
    totalNonBlockerCells: { default: 0 as number },
    // Chain depth tracker for cascading power activations (0 = no chain).
    chainDepth: { default: 0 as number },
    // True for tutorial levels: HUD tap counter is suppressed.
    tutorialMode: { default: false as boolean },
    // Cumulative count of clue cells revealed (tracked separately from cleared bubbles).
    clueRowsCleared: { default: 0 as number },
    // Total clue cells in the level (rows 7..9 inclusive — bottom 3 rows of the 8x10 board).
    totalClueRows: { default: 24 as number },
  },
  archetypes: {
    /**
     * Bubble / blocker / power cell archetype.
     * Every populated grid cell in the board is a Block entity.
     * Empty cells are NOT entities — they are simply the absence of a Block.
     */
    Block: ['cellKind', 'cellColor', 'cellRow', 'cellCol', 'blockerHits', 'cellId'],
  },
  transactions: {
    /**
     * Replace the entire board with a new state derived from a LevelConfig.
     * Clear-and-rebuild pattern recommended for grid games (see ecs-state.mdc).
     * Emits boardPhase=idle, resets clearedCells, populates totalNonBlockerCells.
     */
    replaceBoard(store, args: { config: LevelConfig }) {
      // 1. Clear existing block entities.
      for (const entity of store.select(['cellKind'])) {
        store.delete(entity);
      }
      // 2. Insert new block entities and count non-blocker cells.
      let nonBlockerCount = 0;
      let cellIdCounter = 1;
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const ch = args.config.grid[row]?.[col] ?? 'e';
          const decoded = decodeCell(ch);
          if (decoded.kind === CellKind.empty) continue;
          const isBubble = decoded.kind === CellKind.bubble;
          if (isBubble) nonBlockerCount += 1;
          const blockerHits = decoded.kind === CellKind.ghostBarrier ? 2 : 0;
          store.archetypes.Block.insert({
            cellKind: decoded.kind as number,
            cellColor: decoded.color as number,
            cellRow: row,
            cellCol: col,
            blockerHits,
            cellId: cellIdCounter++,
          });
        }
      }
      store.resources.totalNonBlockerCells = nonBlockerCount;
      store.resources.clearedCells = 0;
      store.resources.chainDepth = 0;
      store.resources.boardPhase = PhaseCode.idle;
      store.resources.tapsRemaining = args.config.tapLimit;
      store.resources.starsEarned = 0;
      store.resources.mysteryMeterProgress = 0;
      store.resources.clueRowsCleared = 0;
    },
    /** Add to the score resource. */
    addScore(store, args: { delta: number }) {
      store.resources.score += args.delta;
    },
    /** Decrement tap budget. Negative is clamped to 0. */
    decrementTaps(store, _args: Record<string, never>) {
      const next = store.resources.tapsRemaining - 1;
      store.resources.tapsRemaining = next < 0 ? 0 : next;
    },
    /** Set the board phase to a new value. */
    setPhase(store, args: { phase: PhaseCodeValue }) {
      store.resources.boardPhase = args.phase;
    },
    /** Increment cleared-cell counter (drives win condition). */
    incrementCleared(store, args: { count: number }) {
      store.resources.clearedCells += args.count;
    },
    /** Increment chain depth (cascading power activations). */
    incrementChainDepth(store, _args: Record<string, never>) {
      store.resources.chainDepth += 1;
    },
    /** Reset chain depth to zero. */
    resetChainDepth(store, _args: Record<string, never>) {
      store.resources.chainDepth = 0;
    },
    /** Update mystery meter progress (0..1). */
    setMysteryMeterProgress(store, args: { progress: number }) {
      const p = args.progress;
      store.resources.mysteryMeterProgress = p < 0 ? 0 : p > 1 ? 1 : p;
    },
    /** Increment clue rows cleared. */
    incrementClueRowsCleared(store, args: { count: number }) {
      store.resources.clueRowsCleared += args.count;
    },
    /** Set stars earned (0..3). */
    setStarsEarned(store, args: { stars: number }) {
      store.resources.starsEarned = args.stars;
    },
    /** Set tutorial mode. */
    setTutorialMode(store, args: { enabled: boolean }) {
      store.resources.tutorialMode = args.enabled;
    },
    /** Set current level number. */
    setLevel(store, args: { level: number }) {
      store.resources.level = args.level;
    },
    /** Set current chapter number. */
    setChapter(store, args: { chapter: number }) {
      store.resources.chapter = args.chapter;
    },
    /** Reset all per-level state to defaults. */
    resetLevel(store, _args: Record<string, never>) {
      store.resources.score = 0;
      store.resources.tapsRemaining = 20;
      store.resources.starsEarned = 0;
      store.resources.mysteryMeterProgress = 0;
      store.resources.clearedCells = 0;
      store.resources.totalNonBlockerCells = 0;
      store.resources.chainDepth = 0;
      store.resources.clueRowsCleared = 0;
      store.resources.boardPhase = PhaseCode.idle;
    },
    /** Remove a specific cell entity (e.g. on cluster pop). */
    removeCell(store, args: { entity: number }) {
      store.delete(args.entity);
    },
    /** Decrement blocker hit counter (for ghost barriers). */
    hitBlocker(store, args: { entity: number }) {
      const row = store.read(args.entity);
      if (row && row.blockerHits !== undefined) {
        const next = row.blockerHits - 1;
        if (next <= 0) {
          store.delete(args.entity);
        } else {
          store.update(args.entity, { blockerHits: next });
        }
      }
    },
  },
});

/** The concrete Database type for Mystery Munchies. */
export type GameDatabase = Database.FromPlugin<typeof gamePlugin>;

/** Factory: create a fresh game database. */
export function createGameDatabase(): GameDatabase {
  return Database.create(gamePlugin);
}

/** Re-exports for convenience. */
export { CellKind, ColorIndex, PhaseCode, GRID_COLS, GRID_ROWS };
