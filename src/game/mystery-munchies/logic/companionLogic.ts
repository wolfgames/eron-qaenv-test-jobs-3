/**
 * Mystery Munchies — pure companion (Scooby) reaction classifier.
 *
 * The CompanionRenderer subscribes to game events and ECS phase changes.
 * It maps each event to a single reaction kind. Pure data — no Pixi.
 */

import { PhaseCode, type PhaseCodeValue } from '../state/types';

export type CompanionReaction = 'bark' | 'victory' | 'sad' | 'idle';

export type CompanionEvent =
  | { event: 'cluster-pop' }
  | { event: 'phase-change'; phase: PhaseCodeValue | number };

export function classifyCompanionReaction(input: CompanionEvent): CompanionReaction {
  if (input.event === 'cluster-pop') return 'bark';
  // phase-change.
  switch (input.phase) {
    case PhaseCode.won: return 'victory';
    case PhaseCode.lost: return 'sad';
    default: return 'idle';
  }
}
