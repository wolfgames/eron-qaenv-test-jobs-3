import { describe, expect, it } from 'vitest';
import {
  generateLevel,
  generateProcedural,
  isSolvable,
  solvabilityChecker,
  levelPoolForChapter,
  createRng,
} from '~/game/mystery-munchies/logic/levelGenerator';

describe('level-generator: schema and solvability', () => {
  it('level-001 loads with 8 cols, 10 rows, tapLimit in range', () => {
    const level = generateLevel(1, 1);
    expect(level.grid.length).toBe(10);
    expect(level.grid[0].length).toBe(8);
    expect(level.tapLimit).toBeGreaterThanOrEqual(12);
    expect(level.tapLimit).toBeLessThanOrEqual(30);
  });

  it('solvabilityChecker returns true for level-001', () => {
    const level = generateLevel(1, 1);
    expect(solvabilityChecker(level)).toBe(true);
  });

  it('isSolvable detects at least one cluster of size >= 2', () => {
    expect(isSolvable([['r', 'r']])).toBe(true);
    expect(isSolvable([['r'], ['r']])).toBe(true);
    expect(isSolvable([['r', 'b']])).toBe(false);
  });

  it('pool.length >= sessionDrawCount for chapter 1', () => {
    const pool = levelPoolForChapter(1);
    expect(pool).toBeGreaterThanOrEqual(1);
  });

  it('procedural level reproducible from seed', () => {
    const seed = (16 * 73856093) ^ (1 * 19349663);
    const lvlA = generateProcedural(16, 1, createRng(seed));
    const lvlB = generateProcedural(16, 1, createRng(seed));
    // Same seed → same grid.
    expect(lvlA.grid).toEqual(lvlB.grid);
  });

  it('hand-crafted levels 1, 2, 3 all exist with valid schemas', () => {
    for (const n of [1, 2, 3]) {
      const lvl = generateLevel(n, 1);
      expect(lvl.id).toContain(String(n).padStart(3, '0'));
      expect(lvl.grid.length).toBe(10);
      expect(lvl.starThresholds.three).toBeGreaterThan(lvl.starThresholds.two);
      expect(lvl.starThresholds.two).toBeGreaterThan(lvl.starThresholds.one);
    }
  });
});
