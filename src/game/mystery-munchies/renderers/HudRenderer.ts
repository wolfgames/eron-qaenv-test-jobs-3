/**
 * HudRenderer — top of viewport HUD.
 *
 * Renders:
 *   - Tap counter ("Taps: N") on the left side of the HUD row.
 *   - Score in the center.
 *   - Mystery meter bar on the right (populated by batch 6).
 *   - Star display (populated by batch 5).
 *
 * Pure visual: reads from ECS via syncFromDb / observers. No state held.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import { PhaseCode } from '../state/types';
import type { GameDatabase } from '../state/GamePlugin';

const HUD_HEIGHT = 60;
const HUD_PAD_X = 12;

export class HudRenderer {
  private parent: Container | null = null;
  private hudContainer: Container | null = null;
  private bg: Graphics | null = null;
  private tapText: Text | null = null;
  private scoreText: Text | null = null;
  private mysteryBarBg: Graphics | null = null;
  private mysteryBarFill: Graphics | null = null;
  private starsContainer: Container | null = null;
  private viewportW = 0;
  private suppressTapCounter = false;
  private dbUnsubscribers: Array<() => void> = [];

  init(parent: Container, viewportW: number, _viewportH: number): void {
    this.parent = parent;
    this.viewportW = viewportW;
    this.hudContainer = new Container();
    this.hudContainer.eventMode = 'none';

    this.bg = new Graphics()
      .rect(0, 0, viewportW, HUD_HEIGHT)
      .fill({ color: 0x100828, alpha: 0.5 });
    this.hudContainer.addChild(this.bg);

    const labelStyle = new TextStyle({
      fontFamily: 'system-ui, sans-serif',
      fontSize: 18,
      fontWeight: '700',
      fill: 0xFFC857,
    });
    const scoreStyle = new TextStyle({
      fontFamily: 'system-ui, sans-serif',
      fontSize: 22,
      fontWeight: '800',
      fill: 0xFFFFFF,
    });

    this.tapText = new Text({ text: 'Taps: 20', style: labelStyle });
    this.tapText.position.set(HUD_PAD_X, (HUD_HEIGHT - 24) / 2);
    this.hudContainer.addChild(this.tapText);

    this.scoreText = new Text({ text: '0', style: scoreStyle });
    this.scoreText.anchor.set(0.5, 0.5);
    this.scoreText.position.set(viewportW / 2, HUD_HEIGHT / 2);
    this.hudContainer.addChild(this.scoreText);

    // Mystery meter — right side, 100x10 px.
    const meterW = 96;
    const meterH = 10;
    const meterX = viewportW - HUD_PAD_X - meterW;
    const meterY = (HUD_HEIGHT - meterH) / 2 + 8;

    this.mysteryBarBg = new Graphics()
      .roundRect(meterX, meterY, meterW, meterH, 4)
      .fill({ color: 0x2D1A4A, alpha: 0.9 });
    this.mysteryBarFill = new Graphics()
      .roundRect(meterX, meterY, 0, meterH, 4)
      .fill({ color: 0xFFC857, alpha: 1 });
    const meterLabel = new Text({
      text: 'Mystery',
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 10,
        fontWeight: '700',
        fill: 0xFFC857,
      }),
    });
    meterLabel.position.set(meterX, meterY - 12);
    this.hudContainer.addChild(this.mysteryBarBg);
    this.hudContainer.addChild(this.mysteryBarFill);
    this.hudContainer.addChild(meterLabel);

    // Stars container (populated in batch 5).
    this.starsContainer = new Container();
    this.starsContainer.position.set(viewportW / 2, HUD_HEIGHT - 12);
    this.hudContainer.addChild(this.starsContainer);

    parent.addChild(this.hudContainer);
  }

  /** One-shot read from current ECS resources to populate the HUD. */
  syncFromDb(db: GameDatabase): void {
    this.suppressTapCounter = !!db.resources.tutorialMode;
    this.updateTapText(db.resources.tapsRemaining);
    this.updateScoreText(db.resources.score);
    this.updateMysteryMeter(db.resources.mysteryMeterProgress);
    this.updateStars(db.resources.starsEarned);
  }

  /** Subscribe to ECS resource observers; returns this for chaining. */
  subscribeToDb(db: GameDatabase): void {
    this.dbUnsubscribers.push(
      db.observe.resources.tapsRemaining((value: number) => {
        this.updateTapText(value);
      }),
    );
    this.dbUnsubscribers.push(
      db.observe.resources.score((value: number) => {
        this.updateScoreText(value);
      }),
    );
    this.dbUnsubscribers.push(
      db.observe.resources.mysteryMeterProgress((value: number) => {
        this.updateMysteryMeter(value);
      }),
    );
    this.dbUnsubscribers.push(
      db.observe.resources.starsEarned((value: number) => {
        this.updateStars(value);
      }),
    );
    this.dbUnsubscribers.push(
      db.observe.resources.tutorialMode((value: boolean) => {
        this.suppressTapCounter = !!value;
        if (this.tapText) this.tapText.visible = !this.suppressTapCounter;
      }),
    );
    this.dbUnsubscribers.push(
      db.observe.resources.boardPhase((phase: number) => {
        // Won/lost: dim HUD slightly to focus attention on results overlay.
        if (this.hudContainer) {
          this.hudContainer.alpha = phase === PhaseCode.won || phase === PhaseCode.lost ? 0.6 : 1;
        }
      }),
    );
  }

  private updateTapText(taps: number): void {
    if (!this.tapText) return;
    if (this.suppressTapCounter) {
      this.tapText.visible = false;
      return;
    }
    this.tapText.visible = true;
    this.tapText.text = `Taps: ${taps}`;
  }

  private updateScoreText(score: number): void {
    if (!this.scoreText) return;
    this.scoreText.text = String(score);
    // Brief pulse for score delta visibility.
    gsap.killTweensOf(this.scoreText.scale);
    this.scoreText.scale.set(1.2);
    gsap.to(this.scoreText.scale, { x: 1, y: 1, duration: 0.25, ease: 'back.out(1.6)', overwrite: 'auto' });
  }

  private updateMysteryMeter(progress: number): void {
    if (!this.mysteryBarFill) return;
    const meterW = 96;
    const meterH = 10;
    const meterX = this.viewportW - HUD_PAD_X - meterW;
    const meterY = (HUD_HEIGHT - meterH) / 2 + 8;
    const filled = Math.max(0, Math.min(1, progress)) * meterW;
    this.mysteryBarFill.clear()
      .roundRect(meterX, meterY, filled, meterH, 4)
      .fill({ color: 0xFFC857, alpha: 1 });
    // Shimmer pulse on update.
    gsap.killTweensOf(this.mysteryBarFill);
    gsap.fromTo(this.mysteryBarFill, { alpha: 0.6 }, { alpha: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  }

  private updateStars(stars: number): void {
    if (!this.starsContainer) return;
    this.starsContainer.removeChildren().forEach((c) => {
      gsap.killTweensOf(c);
      c.destroy();
    });
    if (stars <= 0) return;
    const styleText = new TextStyle({
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      fontWeight: '800',
      fill: 0xFFD24A,
    });
    for (let i = 0; i < stars; i++) {
      const star = new Text({ text: '*', style: styleText });
      star.anchor.set(0.5, 0.5);
      star.position.set((i - (stars - 1) / 2) * 18, 0);
      this.starsContainer.addChild(star);
      gsap.from(star.scale, { x: 0, y: 0, duration: 0.4, ease: 'back.out(2.0)', delay: i * 0.2 });
    }
  }

  destroy(): void {
    for (const u of this.dbUnsubscribers) {
      try { u(); } catch { /* ignore */ }
    }
    this.dbUnsubscribers.length = 0;
    if (this.scoreText) gsap.killTweensOf(this.scoreText.scale);
    if (this.mysteryBarFill) gsap.killTweensOf(this.mysteryBarFill);
    if (this.starsContainer) {
      for (const c of this.starsContainer.children) gsap.killTweensOf(c);
    }
    if (this.hudContainer) {
      this.hudContainer.parent?.removeChild(this.hudContainer);
      this.hudContainer.destroy({ children: true });
      this.hudContainer = null;
    }
    this.parent = null;
  }
}
