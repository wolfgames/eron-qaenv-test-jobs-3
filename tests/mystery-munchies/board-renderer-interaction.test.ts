import { describe, expect, it } from 'vitest';
import {
  detectInputBlocked,
  classifyTapOutcome,
} from '~/game/mystery-munchies/logic/tapLogic';
import { PhaseCode } from '~/game/mystery-munchies/state/types';

describe('board-renderer: pop animation and wobble feedback (logic-level)', () => {
  it('input is blocked during animating-pop phase', () => {
    expect(detectInputBlocked(PhaseCode.animatingPop)).toBe(true);
    expect(detectInputBlocked(PhaseCode.animatingFall)).toBe(true);
    expect(detectInputBlocked(PhaseCode.idle)).toBe(false);
  });

  it('valid tap classification fires for a cluster size >= 2', () => {
    expect(classifyTapOutcome({ clusterSize: 3, phase: PhaseCode.idle })).toBe('pop');
    expect(classifyTapOutcome({ clusterSize: 2, phase: PhaseCode.idle })).toBe('pop');
  });

  it('lone-bubble tap classification returns wobble (not pop, not silent)', () => {
    expect(classifyTapOutcome({ clusterSize: 1, phase: PhaseCode.idle })).toBe('wobble');
    expect(classifyTapOutcome({ clusterSize: 0, phase: PhaseCode.idle })).toBe('wobble');
  });

  it('tap during animating-pop is ignored', () => {
    expect(classifyTapOutcome({ clusterSize: 5, phase: PhaseCode.animatingPop })).toBe('ignore');
    expect(classifyTapOutcome({ clusterSize: 1, phase: PhaseCode.animatingFall })).toBe('ignore');
  });
});
