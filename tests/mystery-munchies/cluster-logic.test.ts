import { describe, expect, it } from 'vitest';
import { findCluster } from '~/game/mystery-munchies/logic/clusterLogic';
import { createGameDatabase } from '~/game/mystery-munchies/state/GamePlugin';
import type { LevelConfig } from '~/game/mystery-munchies/state/types';

function emptyGrid(): string[][] {
  return Array.from({ length: 10 }, () => Array.from({ length: 8 }, () => 'e'));
}

function loadLevel(grid: string[][]) {
  const db = createGameDatabase();
  const config: LevelConfig = {
    id: 'test',
    chapter: 1,
    tapLimit: 20,
    refillEnabled: false,
    grid,
    blockers: [],
    starThresholds: { one: 1, two: 5, three: 10 },
  };
  db.transactions.replaceBoard({ config });
  return db;
}

describe('cluster-logic: flood-fill and pop', () => {
  it('identifies orthogonally-connected same-color group >= 2', () => {
    const grid = emptyGrid();
    grid[0][0] = 'r';
    grid[0][1] = 'r';
    grid[1][0] = 'r';
    const db = loadLevel(grid);
    const cluster = findCluster(db, 0, 0);
    expect(cluster.length).toBe(3);
  });

  it('lone bubble returns empty cluster (size 1 — not a valid pop)', () => {
    const grid = emptyGrid();
    grid[5][5] = 'b';
    const db = loadLevel(grid);
    const cluster = findCluster(db, 5, 5);
    // Lone returns single member; controller treats < 2 as invalid.
    expect(cluster.length).toBe(1);
  });

  it('returns all members of flood-fill group', () => {
    const grid = emptyGrid();
    // Vertical strip of 4 reds.
    grid[3][3] = 'r';
    grid[4][3] = 'r';
    grid[5][3] = 'r';
    grid[6][3] = 'r';
    const db = loadLevel(grid);
    const cluster = findCluster(db, 3, 3);
    expect(cluster.length).toBe(4);
  });

  it('does not cross color boundaries', () => {
    const grid = emptyGrid();
    grid[0][0] = 'r';
    grid[0][1] = 'r';
    grid[0][2] = 'b'; // different color, separator
    grid[0][3] = 'b';
    const db = loadLevel(grid);
    const cluster = findCluster(db, 0, 0);
    expect(cluster.length).toBe(2);
  });

  it('does not include diagonally-adjacent bubbles', () => {
    const grid = emptyGrid();
    grid[2][2] = 'g';
    grid[3][3] = 'g'; // diagonal — must NOT join
    const db = loadLevel(grid);
    const cluster = findCluster(db, 2, 2);
    expect(cluster.length).toBe(1);
  });
});
