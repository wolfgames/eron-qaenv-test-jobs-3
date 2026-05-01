import { describe, expect, it } from 'vitest';
import { createGameDatabase } from '~/game/mystery-munchies/state/GamePlugin';
import { PhaseCode, type LevelConfig } from '~/game/mystery-munchies/state/types';

function loadLevel(grid: string[][], tapLimit = 20): ReturnType<typeof createGameDatabase> {
  const db = createGameDatabase();
  const config: LevelConfig = {
    id: 'test',
    chapter: 1,
    tapLimit,
    refillEnabled: false,
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

describe('game-plugin: tap action and state transitions', () => {
  it('valid tap decrements tapsRemaining via decrementTaps transaction', () => {
    const grid = emptyGrid();
    grid[0][0] = 'r';
    grid[0][1] = 'r';
    const db = loadLevel(grid, 20);
    expect(db.resources.tapsRemaining).toBe(20);
    db.transactions.decrementTaps({});
    expect(db.resources.tapsRemaining).toBe(19);
  });

  it('lone-bubble path does not require decrement (controller-side check)', () => {
    // The plugin transaction itself always decrements. The controller is
    // responsible for skipping decrement on a lone-bubble (cluster < 2).
    // This test asserts the plugin contract: decrementTaps is a primitive
    // and does not branch on cluster size.
    const db = loadLevel(emptyGrid(), 5);
    db.transactions.decrementTaps({});
    expect(db.resources.tapsRemaining).toBe(4);
  });

  it('setPhase moves boardPhase between codes', () => {
    const db = loadLevel(emptyGrid());
    expect(db.resources.boardPhase).toBe(PhaseCode.idle);
    db.transactions.setPhase({ phase: PhaseCode.animatingPop });
    expect(db.resources.boardPhase).toBe(PhaseCode.animatingPop);
    db.transactions.setPhase({ phase: PhaseCode.lost });
    expect(db.resources.boardPhase).toBe(PhaseCode.lost);
  });

  it('tapsRemaining 0 + idle is reachable (loss precondition)', () => {
    const db = loadLevel(emptyGrid(), 1);
    db.transactions.decrementTaps({});
    expect(db.resources.tapsRemaining).toBe(0);
    expect(db.resources.boardPhase).toBe(PhaseCode.idle);
    // Loss-detection itself happens in the controller after gravity resolves.
  });
});
