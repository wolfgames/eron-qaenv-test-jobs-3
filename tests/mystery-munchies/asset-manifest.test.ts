import { describe, expect, it } from 'vitest';
import { manifest } from '~/game/asset-manifest';

describe('asset-manifest: bundle prefixes', () => {
  it('GPU asset bundles use scene-* or fx-* prefix (not theme-*)', () => {
    const bubbleBundle = manifest.bundles.find((b) => b.name === 'scene-bubbles');
    const blockerBundle = manifest.bundles.find((b) => b.name === 'scene-blockers');
    const popBundle = manifest.bundles.find((b) => b.name === 'fx-pop');
    const powerBundle = manifest.bundles.find((b) => b.name === 'fx-power');
    expect(bubbleBundle).toBeDefined();
    expect(blockerBundle).toBeDefined();
    expect(popBundle).toBeDefined();
    expect(powerBundle).toBeDefined();
  });

  it('audio bundles use audio-* prefix', () => {
    const sfx = manifest.bundles.find((b) => b.name === 'audio-sfx-mysterymunchies');
    const music = manifest.bundles.find((b) => b.name === 'audio-music-mysterymunchies');
    expect(sfx).toBeDefined();
    expect(music).toBeDefined();
  });

  it('data bundles use data-* prefix', () => {
    const data = manifest.bundles.find((b) => b.name === 'data-levels');
    expect(data).toBeDefined();
  });

  it('no GPU asset uses theme-* prefix', () => {
    // theme-* is reserved for DOM branding only — using it for GPU assets
    // silently fails in Pixi. Mystery Munchies game assets must NOT live here.
    const themeOnly = manifest.bundles.filter((b) => b.name.startsWith('theme-'));
    for (const bundle of themeOnly) {
      // theme-branding is the only allowed theme bundle (scaffold WolfGames logo).
      expect(bundle.name).toBe('theme-branding');
    }
  });

  it('all bundle names match [a-z][a-z0-9-]*', () => {
    const re = /^[a-z][a-z0-9-]*$/;
    for (const bundle of manifest.bundles) {
      expect(bundle.name).toMatch(re);
    }
  });
});
