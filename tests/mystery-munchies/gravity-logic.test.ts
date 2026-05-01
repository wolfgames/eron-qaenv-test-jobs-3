import { describe, expect, it } from 'vitest';
import { computeGravityDrop } from '~/game/mystery-munchies/logic/gravityLogic';
import { createGameDatabase } from '~/game/mystery-munchies/state/GamePlugin';
import type { LevelConfig } from '~/game/mystery-munchies/state/types';

function loadLevel(grid: string[][], refillEnabled = false) {
  const db = createGameDatabase();
  const config: LevelConfig = {
    id: 'test',
    chapter: 1,
    tapLimit: 20,
    refillEnabled,
    grid,
    blockers: [],
    starThresholds: { one: 1, two: 5, three: 10 },
  };
  db.transactions.replaceBoard({ config });
  return db;
}

function emptyGrid(): string[][] {
  return Array.from({ length: 10 }, () => Array.from({ length: 8 }, () => 'e'));
}

describe('gravity-logic: board-diff and fall animation', () => {
  it('bubbles above empty cells fall to fill them (stable identity)', () => {
    const grid = emptyGrid();
    // Column 0: r at row 0 only — should fall to row 9 with no obstacles.
    grid[0][0] = 'r';
    const db = loadLevel(grid);
    const drop = computeGravityDrop(db);
    const moved = drop.moved.find((m) => m.col === 0);
    expect(moved).toBeDefined();
    expect(moved?.toRow).toBe(9);
  });

  it('only moved entities play fall animation (board-diff)', () => {
    const grid = emptyGrid();
    grid[8][0] = 'r'; // already at the bottom of its column → should NOT move
    const db = loadLevel(grid);
    const drop = computeGravityDrop(db);
    // No movement expected on the floor cell.
    const movedAtCol0 = drop.moved.filter((m) => m.col === 0);
    // r at row 8 falls to row 9 (empty).
    expect(movedAtCol0.length).toBe(1);
    expect(movedAtCol0[0].toRow).toBe(9);
  });

  it('refill spawns at top when refillEnabled=true', () => {
    const grid = emptyGrid();
    // Column 0 is fully empty.
    const db = loadLevel(grid, true);
    const drop = computeGravityDrop(db, { refillEnabled: true });
    // Expect spawned cells to fill column 0 to >= height threshold (3).
    const spawnedInCol0 = drop.spawned.filter((s) => s.col === 0);
    expect(spawnedInCol0.length).toBeGreaterThanOrEqual(3);
  });

  it('no refill when refillEnabled=false', () => {
    const grid = emptyGrid();
    const db = loadLevel(grid, false);
    const drop = computeGravityDrop(db, { refillEnabled: false });
    expect(drop.spawned.length).toBe(0);
  });
});
