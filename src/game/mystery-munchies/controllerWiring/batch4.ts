/**
 * Batch-4 wiring: full pop → gravity → score → resolve loop.
 *
 * Listens for the `mystery-munchies:cluster-tap` event published by batch 3
 * and runs the complete sequence end-to-end. Win/loss detection is fired
 * here too — batch 5's wireBatch5 observer reacts to the resulting
 * boardPhase change.
 */

import type { ControllerInternals } from '../GameController';
import type { BoardRenderer } from '../renderers/BoardRenderer';
import type { ClusterMember } from '../logic/clusterLogic';
import { computeGravityDrop } from '../logic/gravityLogic';
import { computeScore } from '../logic/scoringLogic';
import { computeStars } from './starHelpers';
import { GAME_DEFAULTS as MM_TUNING } from '../tuning/gameTuning';
import { PhaseCode, CellKind } from '../state/types';

interface ClusterTapPayload {
  hit: { row: number; col: number };
  cluster: ClusterMember[];
}

export function wireBatch4(internals: ControllerInternals): void {
  if (!internals.app || !internals.db) return;
  const boardRenderer = (internals as ControllerInternals & { boardRenderer?: BoardRenderer }).boardRenderer;
  if (!boardRenderer) return;

  const onClusterTap = (payload: ClusterTapPayload) => {
    void runPopSequence(internals, payload);
  };

  internals.app.stage.on('mystery-munchies:cluster-tap', onClusterTap);
  internals.cleanups.push(() => {
    internals.app?.stage.off('mystery-munchies:cluster-tap', onClusterTap);
  });
}

async function runPopSequence(internals: ControllerInternals, payload: ClusterTapPayload): Promise<void> {
  const { db } = internals;
  if (!db) return;
  const boardRenderer = (internals as ControllerInternals & { boardRenderer?: BoardRenderer }).boardRenderer;
  if (!boardRenderer) return;
  const { cluster } = payload;
  if (cluster.length < 2) return;

  // 1. Lock input.
  db.transactions.setPhase({ phase: PhaseCode.animatingPop });
  db.transactions.decrementTaps({});
  db.transactions.resetChainDepth({});

  // 2. Compute and apply score.
  const popScore = computeScore(cluster.length, 0, MM_TUNING);
  db.transactions.addScore({ delta: popScore });

  // 3. Increment cleared counter (tracks bubbles only — blockers excluded).
  const bubbleClearCount = cluster.filter((c) => c.kind === CellKind.bubble || c.kind === CellKind.powerSnackBomb).length;
  db.transactions.incrementCleared({ count: bubbleClearCount });

  // 4. Track clue rows (rows 7..9 inclusive, 0-indexed).
  const clueClearCount = cluster.filter((c) => c.row >= 7 && c.row <= 9).length;
  if (clueClearCount > 0) {
    db.transactions.incrementClueRowsCleared({ count: clueClearCount });
    const total = db.resources.totalClueRows || 24;
    const next = Math.min(1, db.resources.clueRowsCleared / total);
    db.transactions.setMysteryMeterProgress({ progress: next });
  }

  // 5. Pop animation.
  await boardRenderer.playPopCluster(cluster);

  // 6. Spawn power bubble for size >= 5 clusters at the cluster's median cell
  //    BEFORE removing the cells. We pick the median-by-index member as the
  //    spawn site, replace its kind in ECS so it survives the cluster removal.
  let powerSpawn: { entity: number; row: number; col: number; color: number } | null = null;
  if (cluster.length >= 5) {
    const m = cluster[Math.floor(cluster.length / 2)];
    powerSpawn = { entity: m.entity, row: m.row, col: m.col, color: m.color };
  }

  // 7. Remove cluster cells from ECS — except the power spawn slot, which is
  //    kept and re-typed to power-snack-bomb.
  for (const cell of cluster) {
    if (powerSpawn && cell.entity === powerSpawn.entity) continue;
    db.transactions.removeCell({ entity: cell.entity });
  }
  if (powerSpawn) {
    // Re-type the surviving cell as a power bubble in place. Use a low-level
    // store update; transactions module doesn't expose this since it's a
    // batch-7 concern, but the cell already exists.
    const store = db.store as unknown as {
      update: (e: number, p: { cellKind: number }) => void;
    };
    store.update(powerSpawn.entity, { cellKind: CellKind.powerSnackBomb });
  }

  // Re-sync renderer so freshly-removed entities and power-typed cells reflect.
  boardRenderer.syncFromDb(db);

  // 8. Gravity / refill.
  db.transactions.setPhase({ phase: PhaseCode.animatingFall });
  // refillEnabled inferred from the level — for core pass, we read it from
  // the level config baked into level loading. Conservative default: true
  // for non-tutorial levels. Read by level chapter.
  const refillEnabled = db.resources.level >= 2;
  const drop = computeGravityDrop(db, { refillEnabled });

  // Apply moved row updates in ECS using the unsafe store accessor.
  const store = db.store as unknown as {
    update: (e: number, p: { cellRow: number }) => void;
  };
  for (const m of drop.moved) {
    try { store.update(m.entity, { cellRow: m.toRow }); } catch { /* tolerate */ }
  }
  // Apply spawned cells via Block archetype insert. cellId increments
  // monotonically from a controller-scoped counter — never Math.random.
  const counterRef = (internals as ControllerInternals & { spawnCellIdCounter?: number });
  if (counterRef.spawnCellIdCounter === undefined) counterRef.spawnCellIdCounter = 100000;
  for (const s of drop.spawned) {
    try {
      counterRef.spawnCellIdCounter += 1;
      (db.store as unknown as { archetypes: { Block: { insert: (p: Record<string, number>) => number } } })
        .archetypes.Block.insert({
          cellKind: s.kind,
          cellColor: s.color,
          cellRow: s.row,
          cellCol: s.col,
          blockerHits: 0,
          cellId: counterRef.spawnCellIdCounter,
        });
    } catch { /* tolerate */ }
  }

  // Animate gravity and re-sync.
  await boardRenderer.playGravity(drop);
  boardRenderer.syncFromDb(db);

  // 9. Resolve win / loss.
  const cleared = db.resources.clearedCells;
  const total = db.resources.totalNonBlockerCells;
  const taps = db.resources.tapsRemaining;

  if (total > 0 && cleared >= total) {
    const stars = computeStars(taps, MM_TUNING.starThresholds);
    db.transactions.setStarsEarned({ stars });
    db.transactions.setPhase({ phase: PhaseCode.won });
    return;
  }

  if (taps <= 0) {
    db.transactions.setPhase({ phase: PhaseCode.lost });
    return;
  }

  db.transactions.setPhase({ phase: PhaseCode.idle });
}
