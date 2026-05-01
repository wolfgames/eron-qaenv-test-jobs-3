/**
 * Batch-5 wiring: win/loss boardPhase observer + screen transition.
 *
 * Subscribes to the ECS boardPhase resource. When it transitions to
 * `won` or `lost`, schedules a brief sequence delay (per win/loss step
 * timing tables) then calls `deps.goto('results')` so the player sees
 * the results screen with the right branch (driven by ECS-bridged
 * gameState.boardPhaseCode).
 */

import type { ControllerInternals } from '../GameController';
import type { GameControllerDeps } from '~/game/mygame-contract';
import { PhaseCode } from '../state/types';
import { buildLossSequenceSteps, buildWinSequenceSteps } from '../logic/winLossSequences';

export function wireBatch5(internals: ControllerInternals, deps: GameControllerDeps): void {
  if (!internals.db || !deps.goto) return;
  const goto = deps.goto;

  // Sequences — total durations driven by step tables.
  const winSteps = buildWinSequenceSteps();
  const winTotalMs = winSteps[winSteps.length - 1].delayMs + winSteps[winSteps.length - 1].durationMs;
  const lossSteps = buildLossSequenceSteps();
  const lossTotalMs = lossSteps[lossSteps.length - 1].delayMs + lossSteps[lossSteps.length - 1].durationMs;

  let lastPhase = internals.db.resources.boardPhase;
  const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  const unobserve = internals.db.observe.resources.boardPhase((phase: number) => {
    if (phase === lastPhase) return;
    const previous = lastPhase;
    lastPhase = phase;
    // Edge-trigger: only fire once on transition into won / lost.
    if (phase === PhaseCode.won && previous !== PhaseCode.won) {
      const t = setTimeout(() => goto('results'), winTotalMs);
      pendingTimeouts.push(t);
    } else if (phase === PhaseCode.lost && previous !== PhaseCode.lost) {
      const t = setTimeout(() => goto('results'), lossTotalMs);
      pendingTimeouts.push(t);
    }
  });

  internals.cleanups.push(() => {
    for (const t of pendingTimeouts) clearTimeout(t);
    try { unobserve(); } catch { /* ignore */ }
  });
}
