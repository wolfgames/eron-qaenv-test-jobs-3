/**
 * Game-specific tuning values for Mystery Munchies.
 *
 * Pure constants. Read by GamePlugin transactions, BoardRenderer animations,
 * and scoringLogic. Never mutated at runtime by gameplay code.
 */

import type { LevelConfigStarThresholds } from '~/game/mystery-munchies/state/types';

export interface DifficultyTier {
  /** Tap budget for procedural levels in this chapter. */
  tapLimit: number;
  /** Whether columns refill when they drop below threshold. */
  refillEnabled: boolean;
  /** Density of blockers per board (count). */
  blockerCount: number;
}

export interface MysteryMunchiesTuning {
  /** Pop dissolve animation duration per bubble (ms). */
  popDuration: number;
  /** Per-row gravity drop duration (ms). */
  fallDuration: number;
  /** Refill bubble drop duration (ms). */
  refillDuration: number;
  /** Maximum chain depth for cascading power activations. */
  chainMax: number;
  /** Score earned per popped bubble (multiplied by cluster size and chain depth). */
  popBasePts: number;
  /** Base multiplier added per chain depth step. */
  chainMultiplierBase: number;
  /** Bonus score awarded for activating a power bubble. */
  powerBubbleBonus: number;
  /** Default star thresholds (taps remaining at win) when a level omits them. */
  starThresholds: LevelConfigStarThresholds;
  /** Per-chapter difficulty parameters used by procedural level generator. */
  difficultyTable: Record<number, DifficultyTier>;
}

export const GAME_DEFAULTS: MysteryMunchiesTuning = {
  popDuration: 300,
  fallDuration: 250,
  refillDuration: 150,
  chainMax: 3,
  popBasePts: 10,
  chainMultiplierBase: 1,
  powerBubbleBonus: 50,
  starThresholds: { one: 1, two: 5, three: 10 },
  difficultyTable: {
    1: { tapLimit: 20, refillEnabled: false, blockerCount: 0 },
    2: { tapLimit: 18, refillEnabled: true, blockerCount: 0 },
    3: { tapLimit: 16, refillEnabled: true, blockerCount: 2 },
    4: { tapLimit: 15, refillEnabled: true, blockerCount: 3 },
    5: { tapLimit: 14, refillEnabled: true, blockerCount: 4 },
  },
};
