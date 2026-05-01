/**
 * Bridge ECS resources → SolidJS signals (DOM bridge).
 *
 * Game state is owned by the ECS database. DOM screens (ResultsScreen, etc.)
 * read these signals via gameState. This bridge subscribes to specific
 * resource observables and propagates updates one-way (ECS → signals).
 *
 * Returns a cleanup function — call it on game destroy BEFORE setActiveDb(null).
 */

import { gameState } from '~/game/state';
import type { GameDatabase } from './GamePlugin';

export function bridgeEcsToSignals(db: GameDatabase): () => void {
  const unsubscribers: Array<() => void> = [];

  // score → gameState.setScore
  unsubscribers.push(
    db.observe.resources.score((value: number) => {
      gameState.setScore(value);
    }),
  );

  // level → gameState.setLevel
  unsubscribers.push(
    db.observe.resources.level((value: number) => {
      gameState.setLevel(value);
    }),
  );

  // tapsRemaining → gameState.setTapsRemaining (when present)
  unsubscribers.push(
    db.observe.resources.tapsRemaining((value: number) => {
      gameState.setTapsRemaining?.(value);
    }),
  );

  // starsEarned → gameState.setStarsEarned (when present)
  unsubscribers.push(
    db.observe.resources.starsEarned((value: number) => {
      gameState.setStarsEarned?.(value);
    }),
  );

  // boardPhase code → gameState.setBoardPhaseCode (when present)
  unsubscribers.push(
    db.observe.resources.boardPhase((value: number) => {
      gameState.setBoardPhaseCode?.(value);
    }),
  );

  // mysteryMeterProgress → gameState.setMysteryMeterProgress (when present)
  unsubscribers.push(
    db.observe.resources.mysteryMeterProgress((value: number) => {
      gameState.setMysteryMeterProgress?.(value);
    }),
  );

  return () => {
    for (const u of unsubscribers) {
      try { u(); } catch { /* ignore double-unsubscribe */ }
    }
  };
}
