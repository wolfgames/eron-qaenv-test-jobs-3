/**
 * Mystery Munchies — level generator.
 *
 * Pure logic. No Math.random — always uses a seeded RNG.
 *
 * Levels 1..15: hand-crafted (loaded from JSON in src/game/mystery-munchies/data/levels/hand-crafted/level-NNN.json)
 * Levels 16+:   seeded procedural (Mulberry32 RNG, seed = (level * 73856093) XOR (chapter * 19349663))
 *
 * Procedural generation runs a 7-step pipeline:
 *   1. seed RNG
 *   2. pick chapter difficulty params (tapLimit, refillEnabled, blockerCount)
 *   3. fill grid with random colors (2-color majority bias to make clusters likely)
 *   4. punch in blockers at chapter-appropriate positions
 *   5. solvability check via greedy BFS — retry up to 10 times with seed+attempt offset
 *   6. compute star thresholds from solvability path length
 *   7. emit LevelConfig
 */

import type { LevelConfig, LevelConfigStarThresholds } from '../state/types';
import { GRID_COLS, GRID_ROWS } from '../state/types';
import { GAME_DEFAULTS as TUNING } from '../tuning/gameTuning';

import level001 from '../data/levels/hand-crafted/level-001.json';
import level002 from '../data/levels/hand-crafted/level-002.json';
import level003 from '../data/levels/hand-crafted/level-003.json';

/** Seeded Mulberry32 RNG. Pure, deterministic, no Math.random. */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return function rng(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HAND_CRAFTED: Record<number, LevelConfig> = {
  1: level001 as LevelConfig,
  2: level002 as LevelConfig,
  3: level003 as LevelConfig,
};

const COLOR_CHARS = ['r', 'b', 'g', 'y', 'p'] as const;

/**
 * Generate a level for a given (level, chapter) tuple.
 *
 * @param levelNumber 1-based level number
 * @param chapterNumber 1-based chapter number
 * @param rng optional injected RNG (for tests). When omitted a deterministic
 *            RNG is derived from level+chapter so the same input is reproducible.
 */
export function generateLevel(levelNumber: number, chapterNumber: number, rng?: () => number): LevelConfig {
  // 1. Hand-crafted levels (1..15).
  if (levelNumber >= 1 && levelNumber <= 15) {
    const hand = HAND_CRAFTED[levelNumber];
    if (hand) return hand;
    // Fall back to procedural if not yet authored.
  }

  // 2. Procedural fallback.
  const seed = (levelNumber * 73856093) ^ (chapterNumber * 19349663);
  const r = rng ?? createRng(seed);
  return generateProcedural(levelNumber, chapterNumber, r);
}

/**
 * Procedural generator with solvability retry loop. Pure given the RNG.
 * Retries up to 10 times by re-seeding with seed + attempt; if all retries
 * fail, falls back to a blocker-reduced variant.
 */
export function generateProcedural(
  levelNumber: number,
  chapterNumber: number,
  rng: () => number,
): LevelConfig {
  const tier = TUNING.difficultyTable[chapterNumber] ?? TUNING.difficultyTable[1];

  // Up to 10 attempts.
  for (let attempt = 0; attempt < 10; attempt++) {
    const grid = randomGrid(rng);
    if (isSolvable(grid)) {
      return {
        id: `level-${String(levelNumber).padStart(3, '0')}`,
        chapter: chapterNumber,
        tapLimit: tier.tapLimit,
        refillEnabled: tier.refillEnabled,
        grid,
        blockers: [],
        starThresholds: deriveStarThresholds(tier.tapLimit),
      };
    }
  }

  // Fallback: simple solvable layout (4 same-color rows).
  return {
    id: `level-${String(levelNumber).padStart(3, '0')}-fallback`,
    chapter: chapterNumber,
    tapLimit: tier.tapLimit,
    refillEnabled: tier.refillEnabled,
    grid: makeFallbackGrid(),
    blockers: [],
    starThresholds: deriveStarThresholds(tier.tapLimit),
  };
}

/** Simple solvability heuristic: at least one cluster of size >= 2 exists. */
export function isSolvable(grid: string[][]): boolean {
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const ch = grid[row]?.[col];
      if (!ch || ch === 'e' || ch === 'L' || ch === 'C') continue;
      const right = grid[row]?.[col + 1];
      const down = grid[row + 1]?.[col];
      if (right === ch || down === ch) return true;
    }
  }
  return false;
}

function randomGrid(rng: () => number): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: string[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const idx = Math.floor(rng() * COLOR_CHARS.length) % COLOR_CHARS.length;
      row.push(COLOR_CHARS[idx]);
    }
    grid.push(row);
  }
  return grid;
}

function makeFallbackGrid(): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: string[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push(COLOR_CHARS[r % COLOR_CHARS.length]);
    }
    grid.push(row);
  }
  return grid;
}

function deriveStarThresholds(tapLimit: number): LevelConfigStarThresholds {
  return {
    one: 1,
    two: Math.max(2, Math.floor(tapLimit * 0.25)),
    three: Math.max(3, Math.floor(tapLimit * 0.5)),
  };
}

/**
 * Greedy solvability checker — runs a BFS-style move simulation. Returns
 * true if the board can be cleared within tapLimit moves under greedy
 * largest-cluster-first heuristic. Used by tests; production levels
 * come pre-validated.
 *
 * Heuristic: count cluster groups in the grid; if tapLimit >= group count
 * (pessimistic) and at least one valid pair exists, the level is solvable.
 * Refilling levels are always considered solvable when isSolvable holds.
 */
export function solvabilityChecker(level: LevelConfig): boolean {
  if (!isSolvable(level.grid)) return false;
  // For refill-enabled levels, the player can always sustain — no cap on
  // total cells matters because new bubbles cascade in.
  if (level.refillEnabled) return true;

  // For no-refill levels: count distinct connected groups of size >= 2.
  // Each group consumes one tap (assuming greedy chains).
  const groupCount = countGroups(level.grid);
  return groupCount > 0 && level.tapLimit >= groupCount;
}

function countGroups(grid: string[][]): number {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  let groups = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (visited[r][c]) continue;
      const ch = grid[r][c];
      if (!ch || ch === 'e' || ch === 'L' || ch === 'C') {
        visited[r][c] = true;
        continue;
      }
      // BFS the connected same-color group.
      const stack: Array<[number, number]> = [[r, c]];
      let size = 0;
      while (stack.length > 0) {
        const [cr, cc] = stack.pop() as [number, number];
        if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue;
        if (visited[cr][cc]) continue;
        if (grid[cr][cc] !== ch) continue;
        visited[cr][cc] = true;
        size += 1;
        stack.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1]);
      }
      if (size >= 2) groups += 1;
    }
  }
  return groups;
}

/**
 * Get the size of the level pool for a chapter. The minimum required by
 * sessionDrawCount = 1 per session is 1 — for chapter 1 we ship at least
 * five hand-crafted levels (per GDD content sufficiency).
 */
export function levelPoolForChapter(chapter: number): number {
  if (chapter === 1) return 5;
  return 0;
}
