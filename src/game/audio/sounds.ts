/**
 * Sound Catalog — Mystery Munchies.
 *
 * Each SoundDefinition maps to a Howler sprite channel + sprite name.
 * Channel names match `asset-manifest.ts` audio-* bundles.
 *
 * Bundle naming convention:
 *   audio-sfx-mysterymunchies  → sound effects
 *   audio-music-mysterymunchies → music tracks
 */

import type { SoundDefinition } from '~/core/systems/audio';

export type { SoundDefinition };

const SFX = 'audio-sfx-mysterymunchies';
const MUSIC = 'audio-music-mysterymunchies';

/** Generic UI button click — kept for scaffold compatibility. */
export const SOUND_BUTTON_CLICK: SoundDefinition = {
  channel: SFX,
  sprite: 'button_click',
  volume: 0.7,
};

export const SOUND_BUBBLE_POP: SoundDefinition = {
  channel: SFX,
  sprite: 'bubble_pop',
  volume: 0.8,
};

export const SOUND_POWER_ACTIVATE: SoundDefinition = {
  channel: SFX,
  sprite: 'power_activate',
  volume: 0.9,
};

export const SOUND_SCOOBY_BARK: SoundDefinition = {
  channel: SFX,
  sprite: 'scooby_bark',
  volume: 0.85,
};

export const SOUND_SCOOBY_WHIMPER: SoundDefinition = {
  channel: SFX,
  sprite: 'scooby_whimper',
  volume: 0.85,
};

export const SOUND_WIN_FANFARE: SoundDefinition = {
  channel: MUSIC,
  sprite: 'win_fanfare',
  volume: 0.8,
};

export const SOUND_LOSS_WHIMPER: SoundDefinition = {
  channel: SFX,
  sprite: 'loss_whimper',
  volume: 0.8,
};

/** Catalog keyed by short name. Used by `playMM` for safe dispatch. */
const CATALOG = {
  'button-click': SOUND_BUTTON_CLICK,
  'bubble-pop': SOUND_BUBBLE_POP,
  'power-activate': SOUND_POWER_ACTIVATE,
  'scooby-bark': SOUND_SCOOBY_BARK,
  'scooby-whimper': SOUND_SCOOBY_WHIMPER,
  'win-fanfare': SOUND_WIN_FANFARE,
  'loss-whimper': SOUND_LOSS_WHIMPER,
} as const;

export type SoundKey = keyof typeof CATALOG;

interface AudioLike {
  playSound?: (def: SoundDefinition) => unknown;
}

/**
 * Play a Mystery Munchies sound by name. Safe for unknown audio managers
 * (no-op if the manager is missing or the key is unknown). Wraps the
 * scaffold's GameAudioManager.playSound dispatch with key-based lookup.
 *
 * Audio is unlocked at the start screen on the player's first tap; that
 * flow is handled by the scaffold's loadAudio() call. If audio is muted
 * or the SFX bundle isn't loaded yet, the underlying playSound is a
 * silent no-op (handled by core/systems/audio) — callers do not need to
 * branch on availability.
 */
export function playMM(audio: unknown, key: SoundKey): void {
  if (!audio) return;
  const a = audio as AudioLike;
  if (typeof a.playSound !== 'function') return;
  const def = CATALOG[key];
  if (!def) return;
  try { a.playSound(def); } catch { /* mobile-audio-not-unlocked is silent */ }
}
