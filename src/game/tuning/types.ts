import type { GameTuningBase } from '~/core/systems/tuning/types';
import type { MysteryMunchiesTuning } from '~/game/mystery-munchies/tuning/gameTuning';

// ============================================
// GAME TUNING TYPES — Template
//
// Add your game-specific tuning interfaces here.
// Each section maps to a Tweakpane folder in dev mode.
// ============================================

export interface DevModeConfig {
  /** Skip the start screen and go directly into gameplay */
  skipStartScreen: boolean;
}

export interface GameScreensConfig {
  startBackgroundColor: string;
  loadingBackgroundColor: string;
}

export interface GameTuning extends GameTuningBase {
  devMode: DevModeConfig;
  screens: GameScreensConfig;
  /** Mystery Munchies game-specific tuning constants. */
  mysteryMunchies?: MysteryMunchiesTuning;
}

// ============================================
// DEFAULT VALUES
// ============================================

import { GAME_DEFAULTS as MM_DEFAULTS } from '~/game/mystery-munchies/tuning/gameTuning';

export const GAME_DEFAULTS: GameTuning = {
  version: '1.0.0',
  devMode: {
    skipStartScreen: false,
  },
  screens: {
    startBackgroundColor: '#5B3A8A',
    loadingBackgroundColor: '#5B3A8A',
  },
  mysteryMunchies: MM_DEFAULTS,
};

// ============================================
// HELPERS
// ============================================

/** Parse theme from URL params — override in your game if needed */
export function getThemeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('theme') ?? null;
}
