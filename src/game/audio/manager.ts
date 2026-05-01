/**
 * Mystery Munchies Audio Manager.
 *
 * Extends BaseAudioManager with game-specific sound methods.
 *
 * Inherited from BaseAudioManager:
 * - playSound() / playRandomSound() — sound playback
 * - startMusic() / stopMusic() — music playback
 * - isMusicPlaying() — music state check
 */

import type { AudioLoader } from '~/core/systems/assets/loaders/audio';
import { BaseAudioManager } from '~/core/systems/audio';
import {
  SOUND_BUTTON_CLICK,
  SOUND_BUBBLE_POP,
  SOUND_POWER_ACTIVATE,
  SOUND_SCOOBY_BARK,
  SOUND_SCOOBY_WHIMPER,
  SOUND_WIN_FANFARE,
  SOUND_LOSS_WHIMPER,
} from './sounds';

export class GameAudioManager extends BaseAudioManager {
  constructor(audioLoader: AudioLoader) {
    super(audioLoader);
  }

  playButtonClick(): void {
    this.playSound(SOUND_BUTTON_CLICK);
  }

  playBubblePop(): void {
    this.playSound(SOUND_BUBBLE_POP);
  }

  playPowerBubbleActivate(): void {
    this.playSound(SOUND_POWER_ACTIVATE);
  }

  playScoobyBark(): void {
    this.playSound(SOUND_SCOOBY_BARK);
  }

  playScoobyWhimper(): void {
    this.playSound(SOUND_SCOOBY_WHIMPER);
  }

  playWinFanfare(): void {
    this.playSound(SOUND_WIN_FANFARE);
  }

  playLossWhimper(): void {
    this.playSound(SOUND_LOSS_WHIMPER);
  }
}
