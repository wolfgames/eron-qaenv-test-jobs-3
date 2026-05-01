import { describe, expect, it } from 'vitest';
import { createGameDatabase } from '~/game/mystery-munchies/state/GamePlugin';
import { PhaseCode } from '~/game/mystery-munchies/state/types';

describe('ecs-plugin: resource initialization', () => {
  it('resources present with initial values', () => {
    const db = createGameDatabase();
    const r = db.resources;
    expect(r.score).toBe(0);
    expect(r.tapsRemaining).toBe(20);
    expect(r.starsEarned).toBe(0);
    expect(r.mysteryMeterProgress).toBe(0);
    expect(r.boardPhase).toBe(PhaseCode.idle);
    expect(r.level).toBe(1);
    expect(r.chapter).toBe(1);
    expect(r.clearedCells).toBe(0);
    expect(r.totalNonBlockerCells).toBe(0);
    expect(r.chainDepth).toBe(0);
    expect(r.tutorialMode).toBe(false);
  });

  it('plugin property order correct (extends → services → components → resources → archetypes → computed → transactions → actions → systems)', () => {
    // If the order is wrong, Database.Plugin.create throws at import time.
    // We re-import here to assert no throw, and assert key shape.
    const db = createGameDatabase();
    expect(db).toBeDefined();
    expect(db.transactions).toBeDefined();
    expect(typeof db.transactions.replaceBoard).toBe('function');
    expect(typeof db.transactions.addScore).toBe('function');
    expect(typeof db.transactions.decrementTaps).toBe('function');
    expect(typeof db.transactions.setPhase).toBe('function');
  });

  it('addScore transaction increments score resource', () => {
    const db = createGameDatabase();
    db.transactions.addScore({ delta: 50 });
    expect(db.resources.score).toBe(50);
    db.transactions.addScore({ delta: 25 });
    expect(db.resources.score).toBe(75);
  });

  it('decrementTaps clamps at zero', () => {
    const db = createGameDatabase();
    for (let i = 0; i < 25; i++) db.transactions.decrementTaps({});
    expect(db.resources.tapsRemaining).toBe(0);
  });

  it('replaceBoard inserts entities matching the grid', () => {
    const db = createGameDatabase();
    const grid: string[][] = [
      ['r', 'r', 'b', 'b', 'g', 'g', 'y', 'y'],
      ['p', 'p', 'r', 'r', 'b', 'b', 'g', 'g'],
      ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
      ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
      ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
      ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
      ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
      ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
      ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
      ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
    ];
    db.transactions.replaceBoard({
      config: {
        id: 'test',
        chapter: 1,
        tapLimit: 15,
        refillEnabled: false,
        grid,
        blockers: [],
        starThresholds: { one: 1, two: 5, three: 10 },
      },
    });
    expect(db.resources.totalNonBlockerCells).toBe(16);
    expect(db.resources.tapsRemaining).toBe(15);
    expect(db.resources.boardPhase).toBe(PhaseCode.idle);
  });
});
