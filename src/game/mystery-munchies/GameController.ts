/**
 * Mystery Munchies — GameController (batch-1 foundation).
 *
 * Central integration point. Wires Pixi rendering, ECS state, and the
 * scaffold's screen contract together. Created from `src/game/index.ts`'s
 * setupGame export.
 *
 * Lifecycle (init):
 *   1. Create ECS database from gamePlugin.
 *   2. setActiveDb(db) so the Inspector sees state.
 *   3. bridgeEcsToSignals(db) so DOM screens see updates.
 *   4. Initialize the Pixi Application asynchronously.
 *   5. Build the layer Containers (bg → board → hud → ui).
 *   6. Register a stage-level pointertap dispatcher (renderers wire in
 *      subsequent batches as features land).
 *
 * Lifecycle (destroy):
 *   1. Kill all GSAP tweens that may target our objects.
 *   2. Destroy renderers (each kills its own tweens, removeChild, destroy).
 *   3. app.destroy() — Pixi teardown first.
 *   4. Run bridge cleanup.
 *   5. setActiveDb(null) — Inspector releases the reference.
 */

import { createSignal } from 'solid-js';
import { Application, Container, type FederatedPointerEvent } from 'pixi.js';
import { gsap } from 'gsap';
import { setActiveDb } from '~/core/systems/ecs';
import type {
  GameControllerDeps,
  GameController,
  SetupGame,
} from '~/game/mygame-contract';
import { createGameDatabase, type GameDatabase } from './state/GamePlugin';
import { PhaseCode } from './state/types';
import { bridgeEcsToSignals } from './state/bridge';

// Renderer / logic modules are added in later batches — see batch headers in
// implementation-plan.yml. Each batch extends this controller's init() with
// its own renderer and observer wiring.

export type PointerTapDispatcher = (e: FederatedPointerEvent) => void;

/**
 * Mutable controller bag exposed to internal modules in later batches.
 * Renderers and per-batch wiring read/write fields here so the same
 * GameController file does not need a top-level rewrite per batch.
 */
export interface ControllerInternals {
  app: Application | null;
  bgLayer: Container | null;
  boardLayer: Container | null;
  hudLayer: Container | null;
  uiLayer: Container | null;
  db: GameDatabase | null;
  destroyed: boolean;
  /** Per-batch cleanup hooks; called in reverse order on destroy. */
  cleanups: Array<() => void>;
  /** Screens to navigate to from this controller (e.g. `results`). */
  goto?: (screen: string) => void;
}

export const setupGame: SetupGame = (deps: GameControllerDeps): GameController => {
  const [ariaText, setAriaText] = createSignal('Game loading...');

  const internals: ControllerInternals = {
    app: null,
    bgLayer: null,
    boardLayer: null,
    hudLayer: null,
    uiLayer: null,
    db: null,
    destroyed: false,
    cleanups: [],
    goto: (deps as unknown as { goto?: (s: string) => void }).goto,
  };

  let containerEl: HTMLDivElement | null = null;
  let bridgeCleanup: (() => void) | null = null;
  let pointerTapHandler: PointerTapDispatcher | null = null;
  let initialized = false;

  function isInputBlocked(): boolean {
    const db = internals.db;
    if (!db) return true;
    return db.resources.boardPhase !== PhaseCode.idle;
  }

  /** Stage-level pointertap dispatcher. Renderers wired by later batches
   *  override / extend this via `installPointerTap` below. */
  function defaultPointerTap(_e: FederatedPointerEvent): void {
    if (isInputBlocked()) return;
    // Batch 3+ replaces this with a real cluster-pop dispatcher.
  }

  return {
    gameMode: 'pixi',

    init(container: HTMLDivElement) {
      if (initialized) return;
      initialized = true;
      containerEl = container;

      // Mobile-constraints rule: block browser gestures on the game container.
      container.style.touchAction = 'none';
      container.style.userSelect = 'none';
      (container.style as unknown as { webkitUserSelect: string }).webkitUserSelect = 'none';
      container.style.overscrollBehavior = 'contain';

      // 1-3: ECS DB → setActiveDb → bridge.
      const db = createGameDatabase();
      internals.db = db;
      setActiveDb(db);
      bridgeCleanup = bridgeEcsToSignals(db);

      // 4: Pixi Application init (async).
      const app = new Application();
      internals.app = app;
      void app
        .init({
          resizeTo: container,
          background: '#1A1030',
          antialias: true,
          resolution: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
        })
        .then(() => {
          if (internals.destroyed || !internals.app) return;
          container.appendChild(app.canvas as HTMLCanvasElement);

          // Wait one frame for resizeTo to settle before reading screen dims.
          app.ticker.addOnce(() => {
            if (internals.destroyed || !internals.app) return;

            // 5: Layers.
            internals.bgLayer = new Container();
            internals.bgLayer.eventMode = 'none';
            internals.boardLayer = new Container();
            internals.boardLayer.eventMode = 'passive';
            internals.hudLayer = new Container();
            internals.hudLayer.eventMode = 'passive';
            internals.uiLayer = new Container();
            internals.uiLayer.eventMode = 'passive';

            app.stage.addChild(
              internals.bgLayer,
              internals.boardLayer,
              internals.hudLayer,
              internals.uiLayer,
            );
            app.stage.eventMode = 'static';
            app.stage.hitArea = app.screen;

            // 6: Stage-level pointertap dispatch.
            pointerTapHandler = defaultPointerTap;
            app.stage.on('pointertap', pointerTapHandler);

            // Per-batch wiring runs here. Each later batch's `wireBatchN(internals, deps)`
            // pushes its cleanup onto internals.cleanups.
            void wireBatch2(internals);
            void wireBatch3(internals, deps);
            void wireBatch4(internals);
            void wireBatch5(internals, deps);
            void wireBatch6(internals, deps);
            void wireBatch7(internals);

            setAriaText('Mystery Munchies — find the cluster, pop the bubbles');
          });
        })
        .catch((err) => {
          // GUARDRAIL: async failures must not produce a blank screen.
          // eslint-disable-next-line no-console
          console.error('[mystery-munchies] Pixi init failed:', err);
          setAriaText('Game failed to load. Please reload the page.');
        });
    },

    destroy() {
      if (internals.destroyed) return;
      internals.destroyed = true;

      // 1. Kill all GSAP tweens that may target our objects.
      gsap.globalTimeline.getChildren(true, true, true).forEach((t) => t.kill());

      // 2. Run per-batch cleanups in reverse install order (renderers, observers).
      for (let i = internals.cleanups.length - 1; i >= 0; i--) {
        try { internals.cleanups[i](); } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[mystery-munchies] cleanup error', e);
        }
      }
      internals.cleanups.length = 0;

      // 3. Pixi destroy.
      if (internals.app) {
        if (pointerTapHandler) internals.app.stage.off('pointertap', pointerTapHandler);
        try { internals.app.destroy(true, { children: true }); } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[mystery-munchies] app.destroy error', e);
        }
      }
      internals.app = null;
      internals.bgLayer = null;
      internals.boardLayer = null;
      internals.hudLayer = null;
      internals.uiLayer = null;

      // 4. Bridge cleanup.
      try { bridgeCleanup?.(); } catch { /* idempotent */ }
      bridgeCleanup = null;

      // 5. Inspector reference.
      setActiveDb(null);
      internals.db = null;

      containerEl = null;
    },

    ariaText,
  };
};

// ────────────────────────────────────────────────────────────────────────────
// Per-batch wiring stubs.
//
// Each later batch fills its wireBatchN with renderer init + observer
// subscription. Cleanups are pushed onto internals.cleanups so destroy()
// runs them in reverse order. The stubs are no-ops at batch 1 and become
// real wirings by the batch they reference.
// ────────────────────────────────────────────────────────────────────────────

import { wireBatch2 } from './controllerWiring/batch2';
import { wireBatch3 } from './controllerWiring/batch3';
import { wireBatch4 } from './controllerWiring/batch4';
import { wireBatch5 } from './controllerWiring/batch5';
import { wireBatch6 } from './controllerWiring/batch6';
import { wireBatch7 } from './controllerWiring/batch7';
