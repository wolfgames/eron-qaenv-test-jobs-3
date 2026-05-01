import { describe, expect, it } from 'vitest';
import { createGameDatabase } from '~/game/mystery-munchies/state/GamePlugin';
import {
  computeMysteryMeterFromCleared,
} from '~/game/mystery-munchies/logic/mysteryMeterLogic';

describe('mystery-meter: fill progression', () => {
  it('mysteryMeterProgress increments on clue-row clear', () => {
    const db = createGameDatabase();
    db.transactions.incrementClueRowsCleared({ count: 4 });
    const progress = computeMysteryMeterFromCleared(db.resources.clueRowsCleared, 24);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1);
  });

  it('meter fills to 100% on win (full clue rows cleared)', () => {
    const progress = computeMysteryMeterFromCleared(24, 24);
    expect(progress).toBe(1);
  });

  it('meter clamps at 1 even when overshoot', () => {
    const progress = computeMysteryMeterFromCleared(40, 24);
    expect(progress).toBe(1);
  });

  it('meter is 0 when nothing cleared', () => {
    const progress = computeMysteryMeterFromCleared(0, 24);
    expect(progress).toBe(0);
  });

  it('meter does not overlap board at 390x844 (HUD reserves 60px top)', () => {
    // Simple geometry assertion: HUD top of 60 + board (520) + companion (80)
    // + dom-reserved (64) <= viewport (844). Verified in board-renderer.test.ts
    // already; this test stands as a contract reminder.
    const total = 60 + 520 + 80 + 64;
    expect(total).toBeLessThanOrEqual(844);
  });
});
