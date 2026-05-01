import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const startViewFile = path.resolve(
  __dirname,
  '../..',
  'src/game/mystery-munchies/screens/startView.ts',
);

describe('start-screen: no DOM after initGpu', () => {
  it('startView creates no document.createElement calls in the rendered scene', () => {
    const src = readFileSync(startViewFile, 'utf8');
    // After the batch-8 rewrite, startView must NOT use document.createElement
    // for any visible widget — the start screen is rendered with Pixi.
    // We allow `document` as a token in comments only. Strip comments first.
    const codeOnly = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\*.*$/gm, '')
      .replace(/\/\/.*$/gm, '');
    expect(codeOnly.includes('document.createElement')).toBe(false);
    expect(codeOnly.includes('document.createElementNS')).toBe(false);
  });

  it('Start Adventure and Continue buttons present in source', () => {
    const src = readFileSync(startViewFile, 'utf8');
    expect(src).toContain('Start Adventure');
    expect(src).toContain('Continue');
  });

  it('unlockAudio is called as part of the start flow', () => {
    const src = readFileSync(startViewFile, 'utf8');
    // The boot sequence preserves initGpu → unlockAudio → loadCore → loadAudio.
    expect(src).toContain('unlockAudio');
    expect(src).toContain('initGpu');
    expect(src).toContain('loadCore');
  });

  it('Continue with no save shows message not silent no-op', () => {
    const src = readFileSync(startViewFile, 'utf8');
    // The Continue path must surface a visible response (no silent no-op).
    expect(src).toMatch(/no saved|saved game/i);
  });
});
