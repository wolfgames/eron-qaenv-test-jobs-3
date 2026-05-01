import { describe, expect, it } from 'vitest';
import {
  classifyCompanionReaction,
} from '~/game/mystery-munchies/logic/companionLogic';
import { PhaseCode } from '~/game/mystery-munchies/state/types';

describe('companion-renderer: reactions', () => {
  it('valid pop triggers bark animation', () => {
    expect(classifyCompanionReaction({ event: 'cluster-pop' })).toBe('bark');
  });

  it('win triggers victory sequence', () => {
    expect(classifyCompanionReaction({ event: 'phase-change', phase: PhaseCode.won })).toBe('victory');
  });

  it('loss triggers sad sequence', () => {
    expect(classifyCompanionReaction({ event: 'phase-change', phase: PhaseCode.lost })).toBe('sad');
  });

  it('idle phase change returns idle reaction', () => {
    expect(classifyCompanionReaction({ event: 'phase-change', phase: PhaseCode.idle })).toBe('idle');
  });
});
