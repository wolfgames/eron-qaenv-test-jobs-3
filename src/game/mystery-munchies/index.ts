/**
 * Mystery Munchies — game contract entry.
 *
 * Exports `setupGame` (the controller factory) and `setupStartScreen`
 * (the start screen factory), satisfying the scaffold's `mygame` contract.
 */

export { setupGame } from './GameController';
export { setupStartScreen } from './screens/startView';
export type {
  SetupGame,
  SetupStartScreen,
  GameControllerDeps,
  StartScreenDeps,
  GameController,
  StartScreenController,
  GameMode,
} from '~/game/mygame-contract';
