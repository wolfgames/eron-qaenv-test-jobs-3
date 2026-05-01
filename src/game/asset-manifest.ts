/**
 * Asset manifest — single source for bundle list and paths.
 *
 * This file is intentionally free of runtime imports (no Solid.js, no ~/core)
 * so it can be imported by CLI scripts (scripts/check-manifest.ts) running
 * under plain Bun without the Vite/app dependency graph.
 *
 * cdnBase and localBase are static placeholders here. config.ts resolves the
 * real CDN URL at runtime and patches cdnBase before handing to the asset system.
 *
 * Types are imported directly from @wolfgames/components/core — this is the
 * single source of truth for the manifest schema.
 *
 * Bundle naming determines which loader handles the assets:
 *
 *   boot-*   → DOM only   — splash screen assets
 *   theme-*  → DOM only   — branding/logo (loading screen, pre-GPU)
 *   scene-*  → GPU (Pixi) — game spritesheets, backgrounds, tiles, characters
 *   core-*   → GPU (Pixi) — in-game UI atlases
 *   fx-*     → GPU (Pixi) — particles, effects, VFX spritesheets
 *   audio-*  → Howler     — sound effects, music
 *   data-*   → DOM        — JSON config files
 *
 * Game atlases MUST use scene-* or core-* to be accessible via Pixi
 * (createSprite, getTexture, hasSheet). Using theme-* for game atlases
 * will silently fail — Pixi never sees them.
 */

import type { Manifest } from '@wolfgames/components/core';

export const LOCAL_ASSET_PATH = '/assets';

export const manifest: Manifest = {
  cdnBase: LOCAL_ASSET_PATH,
  localBase: LOCAL_ASSET_PATH,
  bundles: [
    // ── DOM — branding logo shown on loading screen (pre-GPU)
    {
      name: 'theme-branding',
      assets: [{ alias: 'atlas-branding-wolf', src: 'atlas-branding-wolf.json' }],
    },

    // ── GPU (Pixi) — Mystery Munchies bubble grid + blockers + UI
    {
      name: 'scene-bubbles',
      assets: [{ alias: 'scene-bubbles', src: 'atlas-bubbles-mystery-munchies.json' }],
    },
    {
      name: 'scene-blockers',
      assets: [{ alias: 'scene-blockers', src: 'atlas-blockers-mystery-munchies.json' }],
    },
    {
      name: 'scene-ui',
      assets: [{ alias: 'scene-ui', src: 'atlas-ui-mystery-munchies.json' }],
    },

    // ── GPU (Pixi) — VFX
    {
      name: 'fx-pop',
      assets: [{ alias: 'fx-pop', src: 'vfx-pop-mystery-munchies.json' }],
    },
    {
      name: 'fx-power',
      assets: [{ alias: 'fx-power', src: 'vfx-power-mystery-munchies.json' }],
    },

    // ── Howler — game audio
    {
      name: 'audio-sfx-mysterymunchies',
      assets: [{ alias: 'audio-sfx-mysterymunchies', src: 'sfx-mystery-munchies.json' }],
    },
    {
      name: 'audio-music-mysterymunchies',
      assets: [{ alias: 'audio-music-mysterymunchies', src: 'music-mystery-munchies.json' }],
    },

    // ── DOM data — level JSON
    {
      name: 'data-levels',
      assets: [{ alias: 'data-levels', src: 'data-levels-mystery-munchies.json' }],
    },
  ],
};
