import { describe, expect, it } from 'vitest';
import {
  computeClueRevealOpacity,
  isClueRow,
} from '~/game/mystery-munchies/logic/clueLogic';

describe('clue-renderer: reveal progression', () => {
  it('row 7 clear contributes to clue layer reveal (rows 7..9 are clue rows)', () => {
    expect(isClueRow(7)).toBe(true);
    expect(isClueRow(8)).toBe(true);
    expect(isClueRow(9)).toBe(true);
    expect(isClueRow(6)).toBe(false);
  });

  it('reveal opacity scales with clue rows cleared', () => {
    expect(computeClueRevealOpacity(0, 24)).toBe(0);
    expect(computeClueRevealOpacity(12, 24)).toBe(0.5);
    expect(computeClueRevealOpacity(24, 24)).toBe(1);
  });

  it('partial clue shown at 30% on results screen if not fully revealed', () => {
    // Per GDD: when level ends before clue is fully revealed, partial clue
    // is shown at 30% opacity. computeClueRevealOpacity exposes a partial
    // floor variant for the results-screen branch.
    expect(computeClueRevealOpacity(2, 24, { partialFloor: 0.3 })).toBe(0.3);
    expect(computeClueRevealOpacity(0, 24, { partialFloor: 0.3 })).toBe(0.3);
    // Once cleared > floor proportion, the actual proportion is used.
    expect(computeClueRevealOpacity(20, 24, { partialFloor: 0.3 })).toBeGreaterThan(0.3);
  });
});
