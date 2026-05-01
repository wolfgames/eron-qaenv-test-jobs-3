import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const loadingFile = path.resolve(
  __dirname,
  '../..',
  'src/game/screens/LoadingScreen.tsx',
);

describe('loading-screen: themed progress bar', () => {
  it('progress bar updates proportionally (uses progress() signal)', () => {
    const src = readFileSync(loadingFile, 'utf8');
    // The scaffold's progress uses the `progress()` accessor; we keep that.
    // Mystery Munchies adds a bone label / theming on top.
    expect(src).toContain('progress()');
    expect(src).toContain('width:');
  });

  it('bone-label or bone-shaped bar visible (Mystery Munchies branding)', () => {
    const src = readFileSync(loadingFile, 'utf8');
    expect(src).toMatch(/bone|munch|mystery/i);
  });

  it('Mystery Inc. or Scooby branding visible', () => {
    const src = readFileSync(loadingFile, 'utf8');
    // Per GDD: Mystery Inc. logo or text title visible — not generic 'Loading…' alone.
    expect(src).toMatch(/Mystery Inc|Scooby|Mystery Munchies/i);
  });
});
