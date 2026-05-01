/**
 * CompanionRenderer — Scooby sprite below the board.
 *
 * Visual: a glyph-based stand-in for Scooby (centered text, gold tint)
 * that bounces/wags on bark, leaps on victory, and droops on sad.
 *
 * Pure render: subscribes to ECS phase + game-event observers via
 * subscribeToDb / triggerReaction. No state owned here.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import { PhaseCode } from '../state/types';
import type { GameDatabase } from '../state/GamePlugin';
import {
  classifyCompanionReaction,
  type CompanionReaction,
} from '../logic/companionLogic';

export class CompanionRenderer {
  private parent: Container | null = null;
  private container: Container | null = null;
  private body: Graphics | null = null;
  private label: Text | null = null;
  private viewportH = 0;
  private dbUnsubscribers: Array<() => void> = [];

  init(parent: Container, viewportW: number, viewportH: number, reservedBottom: number): void {
    this.parent = parent;
    this.viewportH = viewportH;
    this.container = new Container();
    this.container.eventMode = 'none';

    // Position the companion in the bottom GPU layer above the DOM overlay.
    const cx = viewportW / 2;
    const cy = viewportH - reservedBottom - 40;
    this.container.position.set(cx, cy);

    this.body = new Graphics();
    this.body.roundRect(-32, -32, 64, 64, 14).fill({ color: 0xC78B43, alpha: 1 });
    this.body.circle(-12, -10, 6).fill({ color: 0x000000 });
    this.body.circle(12, -10, 6).fill({ color: 0x000000 });
    this.body.roundRect(-10, 6, 20, 8, 4).fill({ color: 0x000000 });
    this.container.addChild(this.body);

    this.label = new Text({
      text: 'Scooby',
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        fontWeight: '700',
        fill: 0xFFC857,
      }),
    });
    this.label.anchor.set(0.5, 0);
    this.label.position.set(0, 36);
    this.container.addChild(this.label);

    parent.addChild(this.container);
  }

  /** Subscribe to ECS observers (phase changes, etc.). */
  subscribeToDb(db: GameDatabase): void {
    let lastPhase = db.resources.boardPhase;
    this.dbUnsubscribers.push(
      db.observe.resources.boardPhase((phase: number) => {
        if (phase === lastPhase) return;
        lastPhase = phase;
        const reaction = classifyCompanionReaction({ event: 'phase-change', phase });
        this.playReaction(reaction);
      }),
    );
  }

  /** Public hook: caller (controller) signals a non-phase reaction (e.g. bark on pop). */
  triggerReaction(reaction: CompanionReaction): void {
    this.playReaction(reaction);
  }

  private playReaction(reaction: CompanionReaction): void {
    if (!this.container) return;
    const c = this.container;
    gsap.killTweensOf(c.scale);
    gsap.killTweensOf(c.rotation);
    switch (reaction) {
      case 'bark':
        gsap.fromTo(
          c.scale,
          { x: 1, y: 1 },
          { x: 1.15, y: 1.15, duration: 0.12, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' },
        );
        return;
      case 'victory':
        gsap.fromTo(
          c.scale,
          { x: 1, y: 1 },
          { x: 1.3, y: 1.3, duration: 0.4, ease: 'back.out(2)', yoyo: true, repeat: 3, overwrite: 'auto' },
        );
        return;
      case 'sad':
        gsap.to(c.scale, { x: 0.95, y: 0.95, duration: 1, ease: 'power2.out', overwrite: 'auto' });
        return;
      case 'idle':
      default:
        return;
    }
  }

  destroy(): void {
    for (const u of this.dbUnsubscribers) {
      try { u(); } catch { /* ignore */ }
    }
    this.dbUnsubscribers.length = 0;
    if (this.container) {
      gsap.killTweensOf(this.container.scale);
      gsap.killTweensOf(this.container.rotation);
      this.container.parent?.removeChild(this.container);
      this.container.destroy({ children: true });
      this.container = null;
    }
    this.parent = null;
  }
}

// Used by the controller via PhaseCode comparisons.
export { PhaseCode };
