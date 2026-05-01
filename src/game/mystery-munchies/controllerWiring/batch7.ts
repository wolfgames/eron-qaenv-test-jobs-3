/**
 * Batch-7 wiring: clue layer renderer + adjacent-blocker hit handler.
 *
 * Subscribes to the cluster-tap event published by batch 3 and applies
 * a `hitBlocker` transaction for each ghost barrier that is orthogonally
 * adjacent to the popped cluster. The clue renderer is initialized in
 * the bg layer and wired to clueRowsCleared.
 */

import type { ControllerInternals } from '../GameController';
import { ClueRenderer } from '../renderers/ClueRenderer';
import {
  countAdjacentClusterHits,
} from '../logic/blockerLogic';
import { CellKind } from '../state/types';

interface ClusterTapPayload {
  hit: { row: number; col: number };
  cluster: Array<{ row: number; col: number }>;
}

export function wireBatch7(internals: ControllerInternals): void {
  if (!internals.app || !internals.bgLayer || !internals.db) return;

  // 1. Clue renderer — parchment background that fades in as clue rows clear.
  const clue = new ClueRenderer();
  const { width, height } = internals.app.screen;
  clue.init(internals.bgLayer, width, height, 0, 64);
  clue.subscribeToDb(internals.db);

  // 2. Adjacent-blocker hit handler. Runs on every cluster-tap.
  const onClusterTap = (payload: ClusterTapPayload) => {
    const db = internals.db;
    if (!db) return;
    // Find ghost barriers on the board.
    const barriers: Array<{ entity: number; row: number; col: number }> = [];
    for (const e of db.store.select(['cellKind', 'cellRow', 'cellCol', 'blockerHits'])) {
      const data = db.store.read(e);
      if (!data) continue;
      if (Number(data.cellKind ?? 0) !== CellKind.ghostBarrier) continue;
      barriers.push({ entity: e, row: Number(data.cellRow ?? 0), col: Number(data.cellCol ?? 0) });
    }
    for (const barrier of barriers) {
      const hits = countAdjacentClusterHits(payload.cluster, barrier);
      if (hits > 0) {
        db.transactions.hitBlocker({ entity: barrier.entity });
      }
    }
  };
  internals.app.stage.on('mystery-munchies:cluster-tap', onClusterTap);

  internals.cleanups.push(() => {
    internals.app?.stage.off('mystery-munchies:cluster-tap', onClusterTap);
    clue.destroy();
  });
}
