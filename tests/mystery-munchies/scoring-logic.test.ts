import { describe, expect, it } from 'vitest';
import {
  computeScore,
  computeChainMultiplier,
} from '~/game/mystery-munchies/logic/scoringLogic';
import { GAME_DEFAULTS } from '~/game/mystery-munchies/tuning/gameTuning';

describe('scoring-logic: multiplicative formula', () => {
  it('size-3 cluster at depth-1 produces correct delta', () => {
    const score = computeScore(3, 0, GAME_DEFAULTS);
    // size * basePts * (chainMultiplier at depth 0 = 1) = 3 * 10 * 1 = 30
    expect(score).toBe(3 * GAME_DEFAULTS.popBasePts * 1);
  });

  it('size-5 cluster at depth-2 produces correct delta', () => {
    const score = computeScore(5, 1, GAME_DEFAULTS);
    // chain depth 1 → multiplier 2 → 5 * 10 * 2 = 100
    expect(score).toBe(5 * GAME_DEFAULTS.popBasePts * 2);
  });

  it('skilled vs beginner score ratio >= 3x on same level', () => {
    // Skilled: 8 clusters of size 5 with depth-2 chains.
    let skilled = 0;
    for (let i = 0; i < 8; i++) {
      skilled += computeScore(5, 1, GAME_DEFAULTS);
    }
    // Beginner: many small 2-cluster pops at depth 0.
    let beginner = 0;
    for (let i = 0; i < 8; i++) {
      beginner += computeScore(2, 0, GAME_DEFAULTS);
    }
    expect(skilled).toBeGreaterThanOrEqual(beginner * 3);
  });

  it('chain multiplier grows with chain depth', () => {
    expect(computeChainMultiplier(0)).toBe(1);
    expect(computeChainMultiplier(1)).toBe(2);
    expect(computeChainMultiplier(2)).toBe(3);
  });
});
