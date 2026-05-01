/**
 * Batch-6 wiring: CompanionRenderer + game-audio dispatch.
 *
 * Companion reacts to ECS phase changes via subscribeToDb. The bark on
 * pop is fired separately when the controller emits the cluster-tap event
 * (we tap into the same event published by batch 3). Audio dispatch on
 * pop / win / loss is also fired here so wiring stays in one place.
 */

import type { ControllerInternals } from '../GameController';
import type { GameControllerDeps } from '~/game/mygame-contract';
import { CompanionRenderer } from '../renderers/CompanionRenderer';
import { playCompanionReaction } from '../audio/companionAudio';
import { playMM } from '~/game/audio/sounds';
import { PhaseCode } from '../state/types';

interface ClusterTapPayload {
  hit: { row: number; col: number };
  cluster: Array<{ row: number; col: number }>;
}

export function wireBatch6(internals: ControllerInternals, deps: GameControllerDeps): void {
  if (!internals.app || !internals.uiLayer || !internals.db) return;

  // 1. CompanionRenderer.
  const companion = new CompanionRenderer();
  const { width, height } = internals.app.screen;
  const reservedBottom = 64;
  companion.init(internals.uiLayer, width, height, reservedBottom);
  companion.subscribeToDb(internals.db);

  // 2. Phase audio: win / loss.
  let lastPhase = internals.db.resources.boardPhase;
  const unobservePhase = internals.db.observe.resources.boardPhase((phase: number) => {
    if (phase === lastPhase) return;
    const previous = lastPhase;
    lastPhase = phase;
    if (phase === PhaseCode.won && previous !== PhaseCode.won) {
      playMM(deps.audio, 'win-fanfare');
      playCompanionReaction(deps.audio, 'victory');
    } else if (phase === PhaseCode.lost && previous !== PhaseCode.lost) {
      playMM(deps.audio, 'loss-whimper');
      playCompanionReaction(deps.audio, 'sad');
    }
  });

  // 3. Cluster-tap audio + companion bark.
  const onClusterTap = (_payload: ClusterTapPayload) => {
    playMM(deps.audio, 'bubble-pop');
    playCompanionReaction(deps.audio, 'bark');
    companion.triggerReaction('bark');
  };
  internals.app.stage.on('mystery-munchies:cluster-tap', onClusterTap);

  internals.cleanups.push(() => {
    internals.app?.stage.off('mystery-munchies:cluster-tap', onClusterTap);
    try { unobservePhase(); } catch { /* ignore */ }
    companion.destroy();
  });
}
