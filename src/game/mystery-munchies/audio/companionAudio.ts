/**
 * Mystery Munchies — companion (Scooby) audio dispatcher.
 *
 * Thin wrapper over the GameAudioManager that maps companion reactions
 * (bark / victory / sad) to the right SFX. Falls back to a no-op when
 * the audio bundle isn't loaded yet — never throws.
 */

import { playMM } from '~/game/audio/sounds';
import type { CompanionReaction } from '../logic/companionLogic';

export function playCompanionReaction(audio: unknown, reaction: CompanionReaction): void {
  switch (reaction) {
    case 'bark':
      playMM(audio, 'scooby-bark');
      return;
    case 'victory':
      playMM(audio, 'win-fanfare');
      return;
    case 'sad':
      playMM(audio, 'scooby-whimper');
      return;
    case 'idle':
    default:
      return;
  }
}
