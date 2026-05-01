/**
 * ClueRenderer — parchment-style background reveal beneath rows 7..9.
 *
 * Renders a translucent parchment "art" rectangle in the bg layer and
 * adjusts its opacity proportional to clueRowsCleared / totalClueRows.
 * Pure visual: subscribes to the ECS resource via subscribeToDb.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import type { GameDatabase } from '../state/GamePlugin';
import { computeClueRevealOpacity } from '../logic/clueLogic';

export class ClueRenderer {
  private parent: Container | null = null;
  private container: Container | null = null;
  private parchment: Graphics | null = null;
  private hint: Text | null = null;
  private dbUnsubscribers: Array<() => void> = [];
  private cellStride = 0;

  init(parent: Container, viewportW: number, viewportH: number, _reservedTop = 0, reservedBottom = 64): void {
    this.parent = parent;
    this.container = new Container();
    this.container.eventMode = 'none';
    this.container.alpha = 0;

    // Compute clue rectangle: aligned with rows 7..9 of the board.
    // BoardRenderer owns the canonical layout; we reuse the same width-driven
    // stride math to position our parchment.
    const stride = Math.max(44, Math.floor(viewportW / 8));
    this.cellStride = stride;
    const boardWidth = stride * 8;
    const boardOriginX = Math.floor((viewportW - boardWidth) / 2);
    // Y depends on actual board origin which is centered in remaining space.
    // Simplification: place parchment in the bottom 3 rows of the board area.
    const HUD_TOP = 60;
    const COMPANION_BOTTOM = 80;
    const verticalAvailable = viewportH - reservedBottom - HUD_TOP - COMPANION_BOTTOM;
    const boardHeight = stride * 10;
    const slack = Math.max(0, verticalAvailable - boardHeight);
    const boardOriginY = HUD_TOP + Math.floor(slack / 2);
    const clueY = boardOriginY + 7 * stride;

    this.parchment = new Graphics()
      .roundRect(boardOriginX, clueY, boardWidth, 3 * stride, 8)
      .fill({ color: 0xF5DEB3, alpha: 0.85 });
    // Faint Mystery Inc. badge / parchment scribbles.
    this.parchment.rect(boardOriginX + 12, clueY + 12, 16, 4).fill({ color: 0x5B3A8A });
    this.parchment.rect(boardOriginX + 12, clueY + 22, 60, 3).fill({ color: 0x5B3A8A, alpha: 0.6 });
    this.parchment.rect(boardOriginX + 12, clueY + 30, 50, 3).fill({ color: 0x5B3A8A, alpha: 0.6 });
    this.container.addChild(this.parchment);

    this.hint = new Text({
      text: 'Keep Playing to Reveal',
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        fontWeight: '700',
        fill: 0x5B3A8A,
      }),
    });
    this.hint.anchor.set(0.5, 0.5);
    this.hint.position.set(boardOriginX + boardWidth / 2, clueY + 1.5 * stride);
    this.hint.alpha = 0.7;
    this.container.addChild(this.hint);

    parent.addChild(this.container);
  }

  /** Subscribe to ECS resources that drive opacity. */
  subscribeToDb(db: GameDatabase): void {
    this.dbUnsubscribers.push(
      db.observe.resources.clueRowsCleared((cleared: number) => {
        const total = db.resources.totalClueRows || 1;
        this.setOpacity(computeClueRevealOpacity(cleared, total));
      }),
    );
  }

  setOpacity(opacity: number): void {
    if (!this.container) return;
    gsap.to(this.container, { alpha: opacity, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
  }

  destroy(): void {
    for (const u of this.dbUnsubscribers) {
      try { u(); } catch { /* ignore */ }
    }
    this.dbUnsubscribers.length = 0;
    if (this.container) {
      gsap.killTweensOf(this.container);
      this.container.parent?.removeChild(this.container);
      this.container.destroy({ children: true });
      this.container = null;
    }
    this.parent = null;
  }
}
