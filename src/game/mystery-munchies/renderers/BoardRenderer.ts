/**
 * BoardRenderer — owns the 8×10 bubble grid visuals.
 *
 * Reads cell data from ECS (`Block` archetype), instantiates a BubbleRenderer
 * per cell, and positions sprites by grid coordinates. Animation methods
 * (pop, wobble, gravity) are entry points for batches 3 and 4.
 *
 * State-source-of-truth principle: this renderer never holds game state.
 * It mirrors ECS via syncFromDb / cell observers.
 */

import { Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { computeBoardLayout, cellCenter, pixelToCell, type BoardLayout } from './boardLayout';
import { BubbleRenderer } from './BubbleRenderer';
import {
  CellKind,
  ColorIndex,
  COLORS,
  GRID_COLS,
  GRID_ROWS,
  colorFromIndex,
  type CellColor,
} from '../state/types';
import type { GameDatabase } from '../state/GamePlugin';

interface CellRenderEntry {
  entity: number;
  bubble: BubbleRenderer | null;
  /** non-bubble blocker visualization (Graphics square) — used by batch 7. */
  blocker: Graphics | null;
}

export class BoardRenderer {
  private parent: Container | null = null;
  private boardContainer: Container | null = null;
  private clueBackingLayer: Container | null = null;
  private layout: BoardLayout | null = null;
  /** Sparse map row*COLS+col → CellRenderEntry. */
  private cells: Map<number, CellRenderEntry> = new Map();

  init(parent: Container, viewportW: number, viewportH: number, reservedTop = 0, reservedBottom = 64): void {
    this.parent = parent;
    this.layout = computeBoardLayout({ viewportW, viewportH, reservedTop, reservedBottom });

    this.boardContainer = new Container();
    this.boardContainer.eventMode = 'passive';
    this.boardContainer.position.set(0, 0);

    // Clue backing layer — translucent rectangle behind rows 7..9 (0-indexed).
    this.clueBackingLayer = new Container();
    this.clueBackingLayer.eventMode = 'none';
    const clueY = this.layout.boardOriginY + 7 * this.layout.cellStride;
    const clueH = 3 * this.layout.cellStride;
    const backing = new Graphics()
      .rect(this.layout.boardOriginX, clueY, this.layout.boardWidth, clueH)
      .fill({ color: 0xFFE9B0, alpha: 0.18 });
    this.clueBackingLayer.addChild(backing);

    parent.addChild(this.clueBackingLayer);
    parent.addChild(this.boardContainer);
  }

  /**
   * Populate cells from current ECS Block entities. One-shot sync — call
   * after replaceBoard or when first wiring the renderer.
   */
  syncFromDb(db: GameDatabase): void {
    if (!this.boardContainer || !this.layout) return;

    // Build a fresh map of {row,col → entity, kind, color}.
    const wanted = new Map<number, { entity: number; kind: number; color: number }>();
    for (const e of db.store.select(['cellKind', 'cellColor', 'cellRow', 'cellCol'])) {
      const data = db.store.read(e);
      if (!data) continue;
      const row = Number(data.cellRow ?? 0);
      const col = Number(data.cellCol ?? 0);
      const key = row * GRID_COLS + col;
      wanted.set(key, {
        entity: e,
        kind: Number(data.cellKind ?? 0),
        color: Number(data.cellColor ?? 0),
      });
    }

    // Remove sprites for cells no longer present.
    for (const [key, entry] of this.cells) {
      if (!wanted.has(key)) {
        if (entry.bubble) {
          gsap.killTweensOf(entry.bubble.container);
          entry.bubble.destroy();
        }
        if (entry.blocker) {
          gsap.killTweensOf(entry.blocker);
          entry.blocker.parent?.removeChild(entry.blocker);
          entry.blocker.destroy();
        }
        this.cells.delete(key);
      }
    }

    // Add or update sprites for present cells.
    for (const [key, w] of wanted) {
      const row = Math.floor(key / GRID_COLS);
      const col = key % GRID_COLS;
      const center = cellCenter(this.layout, row, col);
      let entry = this.cells.get(key);
      if (!entry) {
        entry = { entity: w.entity, bubble: null, blocker: null };
        this.cells.set(key, entry);
      } else {
        entry.entity = w.entity;
      }

      if (w.kind === CellKind.bubble || w.kind === CellKind.powerSnackBomb) {
        const colorIdx = Math.min(Math.max(w.color, 0), COLORS.length - 1);
        const color: CellColor = colorFromIndex(colorIdx);
        if (!entry.bubble) {
          entry.bubble = new BubbleRenderer(color, { diameter: this.layout.bubbleDiameter });
          this.boardContainer.addChild(entry.bubble.container);
        } else {
          entry.bubble.setColor(color, this.layout.bubbleDiameter);
        }
        entry.bubble.container.position.set(center.x, center.y);
        // Power bubbles get a gold ring overlay.
        if (w.kind === CellKind.powerSnackBomb) {
          const ringName = '__powerRing';
          const existing = entry.bubble.container.getChildByName(ringName);
          if (!existing) {
            const ring = new Graphics()
              .circle(0, 0, this.layout.bubbleDiameter / 2 + 3)
              .stroke({ color: 0xFFD24A, width: 3 });
            ring.label = ringName;
            entry.bubble.container.addChild(ring);
          }
        }
        // Remove blocker visual if it transitioned to a bubble.
        if (entry.blocker) {
          entry.blocker.parent?.removeChild(entry.blocker);
          entry.blocker.destroy();
          entry.blocker = null;
        }
      } else if (w.kind === CellKind.ghostBarrier || w.kind === CellKind.crateBlocker) {
        // Remove bubble visual if it transitioned to blocker.
        if (entry.bubble) {
          gsap.killTweensOf(entry.bubble.container);
          entry.bubble.destroy();
          entry.bubble = null;
        }
        if (!entry.blocker) {
          const blockerColor = w.kind === CellKind.ghostBarrier ? 0x8C8AA8 : 0x7A4F2C;
          const sz = this.layout.bubbleDiameter;
          const g = new Graphics();
          g.roundRect(-sz / 2, -sz / 2, sz, sz, 6).fill({ color: blockerColor, alpha: 0.95 });
          if (w.kind === CellKind.ghostBarrier) {
            g.circle(0, 0, sz * 0.25).fill({ color: 0xFFFFFF, alpha: 0.7 });
          }
          entry.blocker = g;
          this.boardContainer.addChild(g);
        }
        entry.blocker.position.set(center.x, center.y);
      }
    }
  }

  /** Hit-test a stage-local pixel coord; returns {row, col} or null. */
  hitTest(x: number, y: number): { row: number; col: number } | null {
    if (!this.layout) return null;
    return pixelToCell(this.layout, x, y);
  }

  /** Lookup an entity for a (row, col); returns null if no cell. */
  entityAt(row: number, col: number): number | null {
    const entry = this.cells.get(row * GRID_COLS + col);
    return entry?.entity ?? null;
  }

  /** Bubble container for animation targeting. */
  bubbleContainerAt(row: number, col: number): Container | null {
    const entry = this.cells.get(row * GRID_COLS + col);
    return entry?.bubble?.container ?? null;
  }

  /** Layout accessor for callers that need to compute coordinates. */
  getLayout(): BoardLayout | null {
    return this.layout;
  }

  /**
   * Play a wobble animation on the bubble at (row, col).
   * Resolves on completion. ~200ms horizontal oscillation with power2.out easing.
   */
  playWobbleAt(row: number, col: number): Promise<void> {
    const target = this.bubbleContainerAt(row, col);
    if (!target || !this.layout) return Promise.resolve();
    const center = cellCenter(this.layout, row, col);
    return new Promise<void>((resolve) => {
      gsap.killTweensOf(target.position);
      const tl = gsap.timeline({
        onComplete: () => {
          target.position.set(center.x, center.y);
          resolve();
        },
      });
      tl.to(target.position, { x: center.x + 4, duration: 0.05, ease: 'power2.out' })
        .to(target.position, { x: center.x - 4, duration: 0.07, ease: 'power2.inOut' })
        .to(target.position, { x: center.x + 3, duration: 0.05, ease: 'power2.inOut' })
        .to(target.position, { x: center.x, duration: 0.04, ease: 'power2.out' });
    });
  }

  /**
   * Play a staggered dissolve animation for a cluster. Resolves when all
   * bubbles have completed. Caller is responsible for removing the cell
   * entities from ECS *after* the promise resolves.
   *
   * Per GDD: 300ms dissolve per bubble, staggered 20ms apart, max 500ms total.
   */
  playPopCluster(cluster: Array<{ row: number; col: number }>): Promise<void> {
    if (cluster.length === 0) return Promise.resolve();
    const targets: Container[] = [];
    for (const c of cluster) {
      const t = this.bubbleContainerAt(c.row, c.col);
      if (t) targets.push(t);
    }
    if (targets.length === 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      gsap.to(targets, {
        pixi: { alpha: 0, scale: 0.2 },
        duration: 0.3,
        stagger: 0.02,
        ease: 'power2.in',
        onComplete: () => resolve(),
      });
    });
  }

  /**
   * Animate a gravity drop. Receives the moved/spawned arrays from
   * computeGravityDrop and animates only the changed entities (board-diff).
   * Per GDD: 250ms per row of fall, power2.out easing.
   */
  playGravity(drop: { moved: Array<{ entity: number; fromRow: number; toRow: number; col: number; distance: number }>; spawned: Array<{ row: number; col: number; color?: number; kind?: number }> }): Promise<void> {
    if (!this.layout) return Promise.resolve();
    const promises: Promise<void>[] = [];

    // Animate moved cells. Look up bubble container by current row,col
    // BEFORE the entity row is updated in ECS — caller updates row after
    // the animation completes to keep render position in sync.
    for (const m of drop.moved) {
      const target = this.bubbleContainerAt(m.fromRow, m.col);
      if (!target) continue;
      const center = cellCenter(this.layout, m.toRow, m.col);
      const duration = 0.25 * Math.max(1, m.distance);
      promises.push(new Promise<void>((resolve) => {
        gsap.to(target.position, {
          y: center.y,
          duration,
          ease: 'power2.out',
          overwrite: 'auto',
          onComplete: () => resolve(),
        });
      }));
      // Update the cell map key for this entity so subsequent hitTest works.
      // (Cell map is rebuilt on next syncFromDb.)
    }

    return Promise.all(promises).then(() => undefined);
  }

  destroy(): void {
    for (const entry of this.cells.values()) {
      if (entry.bubble) {
        gsap.killTweensOf(entry.bubble.container);
        entry.bubble.destroy();
      }
      if (entry.blocker) {
        gsap.killTweensOf(entry.blocker);
        entry.blocker.parent?.removeChild(entry.blocker);
        entry.blocker.destroy();
      }
    }
    this.cells.clear();
    if (this.clueBackingLayer) {
      this.clueBackingLayer.parent?.removeChild(this.clueBackingLayer);
      this.clueBackingLayer.destroy({ children: true });
      this.clueBackingLayer = null;
    }
    if (this.boardContainer) {
      this.boardContainer.parent?.removeChild(this.boardContainer);
      this.boardContainer.destroy({ children: true });
      this.boardContainer = null;
    }
    this.parent = null;
    this.layout = null;
  }
}

/** Re-exports for tests that don't import the layout module directly. */
export { GRID_COLS, GRID_ROWS, ColorIndex };
