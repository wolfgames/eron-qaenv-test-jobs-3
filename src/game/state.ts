import { createSignal, createRoot } from 'solid-js';

/**
 * Game state that persists across screens.
 * Created in a root to avoid disposal issues.
 *
 * Mystery Munchies game state is sourced from the ECS database
 * (src/game/mystery-munchies/state/GamePlugin.ts). This file is the
 * DOM bridge — DOM screens read these signals; the bridge writes them.
 *
 * Pause state lives in core/systems/pause (scaffold feature).
 */

export interface GameState {
  score: () => number;
  setScore: (score: number) => void;
  addScore: (amount: number) => void;

  level: () => number;
  setLevel: (level: number) => void;
  incrementLevel: () => void;

  tapsRemaining: () => number;
  setTapsRemaining: (taps: number) => void;

  starsEarned: () => number;
  setStarsEarned: (stars: number) => void;

  /** Board phase encoded as integer code (PhaseCode in mystery-munchies/state/types.ts). */
  boardPhaseCode: () => number;
  setBoardPhaseCode: (code: number) => void;

  mysteryMeterProgress: () => number;
  setMysteryMeterProgress: (progress: number) => void;

  reset: () => void;
}

function createGameState(): GameState {
  const [score, setScore] = createSignal(0);
  const [level, setLevel] = createSignal(1);
  const [tapsRemaining, setTapsRemaining] = createSignal(20);
  const [starsEarned, setStarsEarned] = createSignal(0);
  const [boardPhaseCode, setBoardPhaseCode] = createSignal(0);
  const [mysteryMeterProgress, setMysteryMeterProgress] = createSignal(0);

  return {
    score,
    setScore,
    addScore: (amount: number) => setScore((s) => s + amount),

    level,
    setLevel,
    incrementLevel: () => setLevel((l) => l + 1),

    tapsRemaining,
    setTapsRemaining,

    starsEarned,
    setStarsEarned,

    boardPhaseCode,
    setBoardPhaseCode,

    mysteryMeterProgress,
    setMysteryMeterProgress,

    reset: () => {
      setScore(0);
      setLevel(1);
      setTapsRemaining(20);
      setStarsEarned(0);
      setBoardPhaseCode(0);
      setMysteryMeterProgress(0);
    },
  };
}

export const gameState = createRoot(createGameState);
