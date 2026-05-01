import { describe, expect, it, vi } from 'vitest';
import {
  SOUND_BUBBLE_POP,
  SOUND_POWER_ACTIVATE,
  SOUND_SCOOBY_BARK,
  SOUND_WIN_FANFARE,
  SOUND_LOSS_WHIMPER,
  playMM,
} from '~/game/audio/sounds';

describe('game-audio: sound catalog and dispatch', () => {
  it('catalog sounds reference audio-* channel prefixes', () => {
    for (const sound of [
      SOUND_BUBBLE_POP,
      SOUND_POWER_ACTIVATE,
      SOUND_SCOOBY_BARK,
      SOUND_WIN_FANFARE,
      SOUND_LOSS_WHIMPER,
    ]) {
      expect(sound.channel.startsWith('audio-')).toBe(true);
      expect(typeof sound.sprite).toBe('string');
      expect(sound.sprite.length).toBeGreaterThan(0);
    }
  });

  it('playMM dispatches to manager.playSound when present', () => {
    const playSound = vi.fn();
    const audio = { playSound };
    playMM(audio, 'bubble-pop');
    expect(playSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith(SOUND_BUBBLE_POP);
  });

  it('playMM is a no-op when audio manager is null', () => {
    expect(() => playMM(null, 'bubble-pop')).not.toThrow();
  });

  it('playMM is a no-op when sound key is unknown', () => {
    const playSound = vi.fn();
    const audio = { playSound };
    playMM(audio, 'unknown-sound' as never);
    expect(playSound).not.toHaveBeenCalled();
  });
});
