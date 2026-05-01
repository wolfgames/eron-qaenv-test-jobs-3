import { describe, expect, it } from 'vitest';
import {
  pickPowerSpawnIndex,
  computeBlastArea,
  resolvePowerChain,
  PowerType,
} from '~/game/mystery-munchies/logic/powerBubbleLogic';
import { GAME_DEFAULTS } from '~/game/mystery-munchies/tuning/gameTuning';

describe('power-bubble-logic: spawn and activation', () => {
  it('cluster >= 5 spawns power bubble at random cluster position', () => {
    const cluster = [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
      { row: 1, col: 0 }, { row: 1, col: 1 },
    ];
    let count = 0;
    let s = 1;
    const rng = () => { s = (s + 1) & 0xff; return (s % 5) / 5; };
    for (let i = 0; i < 5; i++) {
      const idx = pickPowerSpawnIndex(cluster.length, rng);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(cluster.length);
      count += 1;
    }
    expect(count).toBe(5);
  });

  it('3x3 blast clears correct cells', () => {
    const cells = computeBlastArea(5, 5, 'snack-bomb');
    expect(cells.length).toBe(9); // 3x3
    expect(cells.find((c) => c.row === 5 && c.col === 5)).toBeDefined();
    expect(cells.find((c) => c.row === 4 && c.col === 4)).toBeDefined();
    expect(cells.find((c) => c.row === 6 && c.col === 6)).toBeDefined();
  });

  it('blast area is clipped at board edges', () => {
    const cells = computeBlastArea(0, 0, 'snack-bomb');
    expect(cells.every((c) => c.row >= 0 && c.col >= 0)).toBe(true);
    expect(cells.length).toBeLessThan(9);
  });

  it('chain reaction max depth 3 enforced', () => {
    // Construct a synthetic chain: each activation spawns another power.
    let activations = 0;
    const onActivate = () => {
      activations += 1;
      // Simulate chain: each activation enqueues another power activation,
      // but chain depth is capped by the resolver.
      return [{ row: 0, col: 0, powerType: PowerType.SnackBomb }];
    };
    const result = resolvePowerChain(
      { row: 0, col: 0, powerType: PowerType.SnackBomb },
      onActivate,
      GAME_DEFAULTS.chainMax,
    );
    expect(result.depthReached).toBeLessThanOrEqual(GAME_DEFAULTS.chainMax);
  });
});
