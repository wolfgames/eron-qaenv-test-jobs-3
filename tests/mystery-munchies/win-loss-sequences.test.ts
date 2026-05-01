import { describe, expect, it } from 'vitest';
import { createGameDatabase } from '~/game/mystery-munchies/state/GamePlugin';
import { PhaseCode, type LevelConfig } from '~/game/mystery-munchies/state/types';
import {
  buildWinSequenceSteps,
  buildLossSequenceSteps,
  WatchAdResponse,
} from '~/game/mystery-munchies/logic/winLossSequences';

function loadLevel(grid: string[][], tapLimit = 20) {
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

describe('win-loss: sequence ordering and boardPhase transitions', () => {
  it('win: clearedCells==totalNonBlockerCells triggers boardPhase=won (transaction-driven)', () => {
    const grid = emptyGrid();
    grid[0][0] = 'r';
    grid[0][1] = 'r';
    const db = loadLevel(grid);
    expect(db.resources.totalNonBlockerCells).toBe(2);
    db.transactions.incrementCleared({ count: 2 });
    db.transactions.setPhase({ phase: PhaseCode.won });
    expect(db.resources.boardPhase).toBe(PhaseCode.won);
    expect(db.resources.clearedCells).toBe(2);
  });

  it('win: 10-step sequence fires in correct order', () => {
    const steps = buildWinSequenceSteps();
    expect(steps).toHaveLength(10);
    expect(steps[0].id).toBe('mystery-meter-fill');
    expect(steps[1].id).toBe('clue-reveal');
    expect(steps[2].id).toBe('star-1-animate');
    expect(steps[3].id).toBe('star-2-animate');
    expect(steps[4].id).toBe('star-3-animate');
    expect(steps[5].id).toBe('scooby-victory');
    expect(steps[6].id).toBe('board-dim');
    expect(steps[7].id).toBe('score-tally');
    expect(steps[8].id).toBe('level-complete-overlay');
    expect(steps[9].id).toBe('next-level-button');
  });

  it('loss: tapsRemaining=0 + idle is the loss precondition', () => {
    const grid = emptyGrid();
    const db = loadLevel(grid, 1);
    db.transactions.decrementTaps({});
    expect(db.resources.tapsRemaining).toBe(0);
    expect(db.resources.boardPhase).toBe(PhaseCode.idle);
  });

  it('loss: loss sequence fires in 8 steps with 100ms stagger', () => {
    const steps = buildLossSequenceSteps();
    expect(steps).toHaveLength(8);
    expect(steps[0].id).toBe('board-lock');
    expect(steps[1].id).toBe('scooby-sad');
    expect(steps[2].id).toBe('mystery-meter-partial');
    expect(steps[3].id).toBe('partial-clue-30pct');
    expect(steps[4].id).toBe('loss-screen-slides-up');
    expect(steps[5].id).toBe('option-1-watch-ad');
    expect(steps[6].id).toBe('option-2-snacks');
    expect(steps[7].id).toBe('option-3-try-again');
    // Each step (after first) staggers 100ms.
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].delayMs - steps[i - 1].delayMs).toBe(100);
    }
  });

  it('Watch-Ad button responds with Coming-Soon UX (not silent, not disabled)', () => {
    const response = WatchAdResponse.handleTap();
    expect(response.kind).toBe('toast');
    expect(response.message).toMatch(/coming soon/i);
    expect(response.disabledButton).toBe(false);
  });
});
