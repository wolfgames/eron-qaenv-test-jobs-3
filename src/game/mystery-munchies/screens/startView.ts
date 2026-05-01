/**
 * Mystery Munchies — start screen view (Pixi).
 *
 * After batch-8 rework: every visible element is a Pixi Container, Sprite,
 * Graphics, or Text. There are zero `document.createElement` calls — this
 * satisfies guardrail #1 (no DOM in GPU code) once initGpu fires.
 *
 * Boot order is preserved:
 *   tap → initGpu → unlockAudio → loadCore → loadAudio → goto('game')
 *
 * Buttons sit in the bottom 40% of the viewport (thumb zone) and respect
 * the 44pt minimum tap target. The Continue button is always present —
 * tapping with no saved game surfaces a visible "No saved game" toast
 * (never a silent no-op, never disabled).
 */

import { Application, Container, Graphics, Text, TextStyle, type FederatedPointerEvent } from 'pixi.js';
import { gsap } from 'gsap';
import type {
  StartScreenDeps,
  StartScreenController,
  SetupStartScreen,
} from '~/game/mygame-contract';

const TITLE_FILL = 0xFFC857;
const SUBTITLE_FILL = 0xFFFFFF;
const BG_FILL = 0x5B3A8A;
const BUTTON_FILL = 0xFFC857;
const BUTTON_TEXT = 0x1A1030;
const BUTTON_OUTLINE = 0xFFC857;

interface ButtonHandle {
  container: Container;
  setEnabled: (v: boolean) => void;
  destroy: () => void;
}

function createButton(
  label: string,
  variant: 'primary' | 'secondary',
  width: number,
  height: number,
  onTap: () => void,
): ButtonHandle {
  const c = new Container();
  c.eventMode = 'static';
  c.cursor = 'pointer';

  const bg = new Graphics();
  if (variant === 'primary') {
    bg.roundRect(-width / 2, -height / 2, width, height, 12).fill({ color: BUTTON_FILL });
  } else {
    bg.roundRect(-width / 2, -height / 2, width, height, 12)
      .stroke({ color: BUTTON_OUTLINE, width: 2 });
  }

  const txt = new Text({
    text: label,
    style: new TextStyle({
      fontFamily: 'system-ui, sans-serif',
      fontSize: 18,
      fontWeight: '700',
      fill: variant === 'primary' ? BUTTON_TEXT : BUTTON_OUTLINE,
    }),
  });
  txt.anchor.set(0.5, 0.5);

  c.addChild(bg, txt);

  // Hit area expanded for the 44pt floor.
  const hitW = Math.max(width, 44);
  const hitH = Math.max(height, 44);
  const hitArea = { contains: (x: number, y: number) => x >= -hitW / 2 && x <= hitW / 2 && y >= -hitH / 2 && y <= hitH / 2 };
  // Pixi hitArea
  (c as Container & { hitArea: unknown }).hitArea = hitArea;

  let enabled = true;

  c.on('pointertap', () => {
    if (!enabled) return;
    onTap();
  });

  c.on('pointerdown', () => {
    if (!enabled) return;
    gsap.to(c.scale, { x: 0.95, y: 0.95, duration: 0.08, ease: 'power2.out', overwrite: 'auto' });
  });
  c.on('pointerup', () => {
    gsap.to(c.scale, { x: 1, y: 1, duration: 0.12, ease: 'back.out(2)', overwrite: 'auto' });
  });
  c.on('pointerupoutside', () => {
    gsap.to(c.scale, { x: 1, y: 1, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
  });

  return {
    container: c,
    setEnabled: (v: boolean) => {
      enabled = v;
      c.alpha = v ? 1 : 0.5;
      c.eventMode = v ? 'static' : 'none';
    },
    destroy: () => {
      gsap.killTweensOf(c.scale);
      c.removeAllListeners();
      c.parent?.removeChild(c);
      c.destroy({ children: true });
    },
  };
}

export const setupStartScreen: SetupStartScreen = (deps: StartScreenDeps): StartScreenController => {
  let app: Application | null = null;
  let containerEl: HTMLDivElement | null = null;
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;
  let buttons: ButtonHandle[] = [];
  let toastContainer: Container | null = null;

  return {
    backgroundColor: '#5B3A8A',

    init(container: HTMLDivElement) {
      containerEl = container;
      // Mobile-constraints: block browser gestures while the start screen
      // is mounted (we don't want pinch-zoom on the title).
      container.style.touchAction = 'none';
      container.style.userSelect = 'none';
      (container.style as unknown as { webkitUserSelect: string }).webkitUserSelect = 'none';
      container.style.overscrollBehavior = 'contain';

      app = new Application();
      void app
        .init({
          resizeTo: container,
          background: BG_FILL,
          antialias: true,
          resolution: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
        })
        .then(() => {
          if (!app) return;
          container.appendChild(app.canvas as HTMLCanvasElement);

          app.ticker.addOnce(() => {
            if (!app) return;
            const w = app.screen.width;
            const h = app.screen.height;

            // ── Background layer: scenery glyphs (mystery machine, Scooby peek)
            const bg = new Container();
            bg.eventMode = 'none';

            // Mystery Machine glyph (van placeholder).
            const machine = new Graphics()
              .roundRect(-60, -22, 120, 44, 8).fill({ color: 0xFFD1B0 })
              .roundRect(-50, -10, 30, 18, 4).fill({ color: 0x80E0FF, alpha: 0.6 })
              .roundRect(-15, -10, 70, 18, 4).fill({ color: 0x80E0FF, alpha: 0.6 })
              .circle(-35, 24, 10).fill({ color: 0x222222 })
              .circle(35, 24, 10).fill({ color: 0x222222 });
            const machineText = new Text({
              text: 'Mystery Machine',
              style: new TextStyle({
                fontFamily: 'system-ui, sans-serif',
                fontSize: 10,
                fontWeight: '700',
                fill: 0x5B3A8A,
              }),
            });
            machineText.anchor.set(0.5, 0.5);
            const machineGroup = new Container();
            machineGroup.addChild(machine, machineText);
            machineGroup.position.set(w / 2, h * 0.45);
            bg.addChild(machineGroup);

            // Scooby peek — bouncing collared head behind the machine.
            const scooby = new Container();
            const scoobyBody = new Graphics()
              .roundRect(-26, -26, 52, 52, 14).fill({ color: 0xC78B43 })
              .circle(-9, -8, 5).fill({ color: 0x000000 })
              .circle(9, -8, 5).fill({ color: 0x000000 })
              .roundRect(-8, 4, 16, 6, 3).fill({ color: 0x000000 });
            const collar = new Graphics()
              .roundRect(-22, 14, 44, 6, 3).fill({ color: 0x4A8C1C });
            scooby.addChild(scoobyBody, collar);
            scooby.position.set(w / 2 - 70, h * 0.45 - 30);
            bg.addChild(scooby);
            // Bouncing animation for delight.
            gsap.to(scooby.position, { y: '-=8', duration: 0.7, ease: 'power2.inOut', yoyo: true, repeat: -1 });

            app.stage.addChild(bg);

            // ── Title text
            const titleText = new Text({
              text: 'Mystery Munchies',
              style: new TextStyle({
                fontFamily: 'system-ui, sans-serif',
                fontSize: Math.min(36, Math.floor(w / 12)),
                fontWeight: '800',
                fill: TITLE_FILL,
                stroke: { color: 0x1A1030, width: 4 },
              }),
            });
            titleText.anchor.set(0.5, 0.5);
            titleText.position.set(w / 2, h * 0.18);

            const subtitleText = new Text({
              text: "Scooby's Bubble Pop",
              style: new TextStyle({
                fontFamily: 'system-ui, sans-serif',
                fontSize: Math.min(20, Math.floor(w / 22)),
                fontWeight: '700',
                fill: SUBTITLE_FILL,
              }),
            });
            subtitleText.anchor.set(0.5, 0.5);
            subtitleText.position.set(w / 2, h * 0.18 + 32);

            app.stage.addChild(titleText, subtitleText);

            // ── Tagline
            const tagline = new Text({
              text: 'Every snack reveals a secret — if you dare to look.',
              style: new TextStyle({
                fontFamily: 'system-ui, sans-serif',
                fontSize: 12,
                fontWeight: '600',
                fill: 0xFFFFFF,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: w - 60,
              }),
            });
            tagline.anchor.set(0.5, 0);
            tagline.position.set(w / 2, h * 0.18 + 64);
            tagline.alpha = 0.85;
            app.stage.addChild(tagline);

            // ── Buttons (bottom 40% of viewport — thumb zone)
            const buttonY = h - 64 - 60; // above DOM overlay (64) + 60 spacing
            const startBtn = createButton('Start Adventure', 'primary', 220, 56, async () => {
              startBtn.setEnabled(false);
              continueBtn.setEnabled(false);
              try {
                await deps.initGpu();
                deps.unlockAudio();
                await deps.loadCore();
                try { await deps.loadAudio(); } catch (audioErr) {
                  // eslint-disable-next-line no-console
                  console.warn('[mystery-munchies] audio load failed', audioErr);
                }
                deps.analytics.trackGameStart({ start_source: 'play_button', is_returning_player: false });
                deps.goto('game');
              } catch (err) {
                // eslint-disable-next-line no-console
                console.error('[mystery-munchies] start failed', err);
                showToast('Loading failed — please retry.');
                startBtn.setEnabled(true);
                continueBtn.setEnabled(true);
              }
            });
            startBtn.container.position.set(w / 2, buttonY);

            const continueBtn = createButton('Continue', 'secondary', 180, 48, () => {
              showToast('No saved game — tap Start Adventure to begin.');
            });
            continueBtn.container.position.set(w / 2, buttonY + 64);

            buttons = [startBtn, continueBtn];
            app.stage.addChild(startBtn.container, continueBtn.container);

            // ── WolfGames bottom logo padding is handled by the screen shell
            // DOM overlay; we leave the bottom 64px clear here by stopping
            // buttons above buttonY + 64 + 24 = buttonY + 88.

            app.stage.eventMode = 'static';

            function showToast(message: string): void {
              if (!app) return;
              if (toastContainer) {
                gsap.killTweensOf(toastContainer);
                toastContainer.parent?.removeChild(toastContainer);
                toastContainer.destroy({ children: true });
              }
              if (toastTimeout) clearTimeout(toastTimeout);
              toastContainer = new Container();
              const bgRect = new Graphics()
                .roundRect(-130, -18, 260, 36, 8).fill({ color: 0x1A1030, alpha: 0.92 });
              const t = new Text({
                text: message,
                style: new TextStyle({
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 12,
                  fontWeight: '700',
                  fill: 0xFFC857,
                  align: 'center',
                }),
              });
              t.anchor.set(0.5, 0.5);
              toastContainer.addChild(bgRect, t);
              toastContainer.position.set(w / 2, buttonY + 132);
              toastContainer.alpha = 0;
              app.stage.addChild(toastContainer);
              gsap.to(toastContainer, { alpha: 1, duration: 0.18, ease: 'power2.out', overwrite: 'auto' });
              toastTimeout = setTimeout(() => {
                if (!toastContainer) return;
                gsap.to(toastContainer, {
                  alpha: 0,
                  duration: 0.25,
                  ease: 'power2.in',
                  overwrite: 'auto',
                  onComplete: () => {
                    if (!toastContainer) return;
                    toastContainer.parent?.removeChild(toastContainer);
                    toastContainer.destroy({ children: true });
                    toastContainer = null;
                  },
                });
              }, 2400);
            }
          });
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[mystery-munchies] start-screen Pixi init failed', err);
        });
    },

    destroy() {
      if (toastTimeout) {
        clearTimeout(toastTimeout);
        toastTimeout = null;
      }
      for (const b of buttons) b.destroy();
      buttons = [];
      if (toastContainer) {
        gsap.killTweensOf(toastContainer);
        toastContainer.parent?.removeChild(toastContainer);
        toastContainer.destroy({ children: true });
        toastContainer = null;
      }
      if (app) {
        try { app.destroy(true, { children: true }); } catch { /* ignore */ }
      }
      app = null;
      containerEl = null;
    },
  };
};
