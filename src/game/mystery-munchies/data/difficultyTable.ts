/**
 * Per-chapter difficulty parameters.
 *
 * Drives procedural level generator constraints. Source of truth lives in
 * `tuning/gameTuning.ts` (`difficultyTable`); this file re-exports it for
 * callers that prefer a data import path.
 */

export { GAME_DEFAULTS as TUNING_DEFAULTS } from '../tuning/gameTuning';
export type { DifficultyTier } from '../tuning/gameTuning';

import { GAME_DEFAULTS } from '../tuning/gameTuning';
export const difficultyTable = GAME_DEFAULTS.difficultyTable;
