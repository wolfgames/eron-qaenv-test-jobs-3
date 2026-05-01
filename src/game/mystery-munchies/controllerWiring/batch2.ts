/**
 * Batch-2 wiring: BoardRenderer init + initial level placement.
 *
 * After Pixi layers are created in GameController.init(), this hook
 * instantiates the BoardRenderer, loads a starting board state into ECS,
 * and registers a destroy hook on internals.cleanups.
 */

import type { ControllerInternals } from '../GameController';
import { BoardRenderer } from '../renderers/BoardRenderer';
import { generateLevel } from '../logic/levelGenerator';

export function wireBatch2(internals: ControllerInternals): void {
  if (!internals.boardLayer || !internals.app || !internals.db) return;

  const { width, height } = internals.app.screen;
  const renderer = new BoardRenderer();
  renderer.init(internals.boardLayer, width, height, 0, 64);

  // Load level-001 (hand-crafted) on first init.
  const level = generateLevel(1, 1);
  internals.db.transactions.replaceBoard({ config: level });
  internals.db.transactions.setLevel({ level: 1 });
  internals.db.transactions.setChapter({ chapter: 1 });

  // Initial sync.
  renderer.syncFromDb(internals.db);

  // Stash the renderer so later batches can talk to it without re-creating.
  (internals as ControllerInternals & { boardRenderer?: BoardRenderer }).boardRenderer = renderer;

  internals.cleanups.push(() => renderer.destroy());
}
