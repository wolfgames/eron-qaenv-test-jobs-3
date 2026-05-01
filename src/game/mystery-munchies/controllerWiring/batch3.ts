/**
 * Batch-3 wiring: cluster-pop pointertap dispatch + HUD tap counter.
 *
 * Replaces the GameController's stub pointertap handler with one that
 * resolves the tapped cell, finds the cluster, classifies the outcome,
 * and dispatches the right transactions + animations.
 *
 * Also instantiates HudRenderer and subscribes it to ECS resource
 * observables so the tap counter, score, mystery meter, and stars
 * display updates as state changes.
 */

import type { ControllerInternals } from '../GameController';
import type { GameControllerDeps } from '~/game/mygame-contract';
import type { FederatedPointerEvent } from 'pixi.js';
import type { BoardRenderer } from '../renderers/BoardRenderer';
import { HudRenderer } from '../renderers/HudRenderer';
import { findCluster } from '../logic/clusterLogic';
import { classifyTapOutcome } from '../logic/tapLogic';
import { PhaseCode } from '../state/types';

export function wireBatch3(internals: ControllerInternals, _deps: GameControllerDeps): void {
  if (!internals.app || !internals.hudLayer || !internals.db) return;
  const boardRenderer = (internals as ControllerInternals & { boardRenderer?: BoardRenderer }).boardRenderer;
  if (!boardRenderer) return;

  // 1. HUD renderer.
  const { width, height } = internals.app.screen;
  const hudRenderer = new HudRenderer();
  hudRenderer.init(internals.hudLayer, width, height);
  hudRenderer.syncFromDb(internals.db);
  hudRenderer.subscribeToDb(internals.db);

  (internals as ControllerInternals & { hudRenderer?: HudRenderer }).hudRenderer = hudRenderer;
  internals.cleanups.push(() => hudRenderer.destroy());

  // 2. Replace stage pointertap with the cluster-pop dispatcher.
  const tapHandler = (e: FederatedPointerEvent) => {
    if (!internals.db || !boardRenderer || !internals.boardLayer) return;
    const phase = internals.db.resources.boardPhase;
    if (phase !== PhaseCode.idle) return;
    const local = internals.boardLayer.toLocal(e.global);
    const hit = boardRenderer.hitTest(local.x, local.y);
    if (!hit) return;
    const cluster = findCluster(internals.db, hit.row, hit.col);
    const outcome = classifyTapOutcome({ clusterSize: cluster.length, phase });
    if (outcome === 'ignore') return;
    if (outcome === 'wobble') {
      // Visible rejection — never silent. No state change, no tap consumed.
      void boardRenderer.playWobbleAt(hit.row, hit.col);
      return;
    }
    // outcome === 'pop': handed to batch-4 (and batch-5/7) for full sequence.
    // Batch 3 publishes a CustomEvent on the stage that batch-4 consumes.
    internals.app?.stage.emit('mystery-munchies:cluster-tap', { hit, cluster });
  };

  // Remove the previous default handler if any was registered.
  internals.app.stage.removeAllListeners('pointertap');
  internals.app.stage.on('pointertap', tapHandler);
  internals.cleanups.push(() => {
    internals.app?.stage.off('pointertap', tapHandler);
  });
}
