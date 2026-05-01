import { describe, expect, it } from 'vitest';
import { GAME_DEFAULTS } from '~/game/mystery-munchies/tuning/gameTuning';

describe('tuning: game defaults', () => {
  it('GAME_DEFAULTS keys all defined', () => {
    expect(GAME_DEFAULTS.popDuration).toBeGreaterThan(0);
    expect(GAME_DEFAULTS.fallDuration).toBeGreaterThan(0);
    expect(GAME_DEFAULTS.refillDuration).toBeGreaterThan(0);
    expect(GAME_DEFAULTS.chainMax).toBeGreaterThan(0);
    expect(GAME_DEFAULTS.popBasePts).toBeGreaterThan(0);
    expect(GAME_DEFAULTS.chainMultiplierBase).toBeGreaterThanOrEqual(0);
    expect(GAME_DEFAULTS.powerBubbleBonus).toBeGreaterThanOrEqual(0);
    expect(GAME_DEFAULTS.starThresholds).toBeDefined();
    expect(GAME_DEFAULTS.starThresholds.three).toBeGreaterThan(GAME_DEFAULTS.starThresholds.two);
    expect(GAME_DEFAULTS.starThresholds.two).toBeGreaterThan(GAME_DEFAULTS.starThresholds.one);
    expect(GAME_DEFAULTS.difficultyTable).toBeDefined();
    expect(Object.keys(GAME_DEFAULTS.difficultyTable).length).toBeGreaterThan(0);
  });

  it('chainMax matches GDD spec (3)', () => {
    expect(GAME_DEFAULTS.chainMax).toBe(3);
  });
});
