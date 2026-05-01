/**
 * Mystery Munchies — pure tap classification.
 *
 * Decides what should happen for a given (clusterSize, phase) tuple.
 * Pure logic — no ECS reads, no Pixi imports — driven entirely by the
 * inputs the controller passes in.
 */

import { PhaseCode, type PhaseCodeValue } from '../state/types';

export type TapOutcome = 'pop' | 'wobble' | 'ignore';

/**
 * Returns true when the board is in a phase that blocks player input.
 * Used by the GameController's pointertap dispatcher.
 */
export function detectInputBlocked(phase: PhaseCodeValue): boolean {
  return phase !== PhaseCode.idle;
}

export interface TapInput {
  clusterSize: number;
  phase: PhaseCodeValue;
}

/**
 * Classify the desired outcome of a tap.
 *
 * - `ignore`: tap arrived during a non-idle phase; do nothing.
 * - `pop`:    valid cluster (size >= 2). Controller fires pop sequence.
 * - `wobble`: lone bubble or empty tap. Visible rejection animation.
 *             A cluster of size 0 (tap on empty cell) is also wobble — the
 *             controller can suppress wobble for empty cells if desired.
 */
export function classifyTapOutcome(input: TapInput): TapOutcome {
  if (detectInputBlocked(input.phase)) return 'ignore';
  if (input.clusterSize >= 2) return 'pop';
  return 'wobble';
}
