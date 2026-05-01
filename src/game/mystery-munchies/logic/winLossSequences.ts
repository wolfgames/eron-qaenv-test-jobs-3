/**
 * Mystery Munchies — Win / Loss sequence definitions (pure data).
 *
 * These describe the strict step ordering of the 10-step win and 8-step
 * loss sequences. The GameController consumes the array, advancing one
 * step at a time and dispatching the matching renderer/audio call.
 *
 * Pure data — no Pixi, no GSAP — testable.
 */

export interface SequenceStep {
  id: string;
  /** Cumulative delay from the start of the sequence (ms). */
  delayMs: number;
  /** Per-step duration hint for animation (ms). */
  durationMs: number;
}

const WIN_STEPS: SequenceStep[] = [
  { id: 'mystery-meter-fill',    delayMs: 0,    durationMs: 300 },
  { id: 'clue-reveal',            delayMs: 300,  durationMs: 400 },
  { id: 'star-1-animate',         delayMs: 700,  durationMs: 200 },
  { id: 'star-2-animate',         delayMs: 900,  durationMs: 200 },
  { id: 'star-3-animate',         delayMs: 1100, durationMs: 200 },
  { id: 'scooby-victory',         delayMs: 1300, durationMs: 800 },
  { id: 'board-dim',              delayMs: 1500, durationMs: 300 },
  { id: 'score-tally',            delayMs: 1800, durationMs: 600 },
  { id: 'level-complete-overlay', delayMs: 2400, durationMs: 400 },
  { id: 'next-level-button',      delayMs: 2800, durationMs: 200 },
];

const LOSS_STEPS: SequenceStep[] = [
  { id: 'board-lock',            delayMs: 0,   durationMs: 200 },
  { id: 'scooby-sad',            delayMs: 100, durationMs: 600 },
  { id: 'mystery-meter-partial', delayMs: 200, durationMs: 400 },
  { id: 'partial-clue-30pct',    delayMs: 300, durationMs: 400 },
  { id: 'loss-screen-slides-up', delayMs: 400, durationMs: 500 },
  { id: 'option-1-watch-ad',     delayMs: 500, durationMs: 200 },
  { id: 'option-2-snacks',       delayMs: 600, durationMs: 200 },
  { id: 'option-3-try-again',    delayMs: 700, durationMs: 200 },
];

export function buildWinSequenceSteps(): SequenceStep[] {
  return WIN_STEPS.map((s) => ({ ...s }));
}

export function buildLossSequenceSteps(): SequenceStep[] {
  return LOSS_STEPS.map((s) => ({ ...s }));
}

/**
 * Watch-Ad button response (per q-continue-system-ad-integration decision).
 *
 * Honest absent-feature UX: the button is visible and responds, but the
 * response says 'Coming Soon' rather than connecting to a real ad SDK.
 * Critical: never silent, never disabled — the player must always know
 * the button works and what it does.
 */
export const WatchAdResponse = {
  handleTap(): { kind: 'toast'; message: string; disabledButton: boolean } {
    return {
      kind: 'toast',
      message: 'Coming Soon — Scooby is fetching the ad-mascot.',
      disabledButton: false,
    };
  },
};
