import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const file = path.resolve(
  __dirname,
  '../..',
  'src/game/screens/ResultsScreen.tsx',
);

describe('results-screen: copy and branching', () => {
  it('win branch shows no "Game Over" text', () => {
    const src = readFileSync(file, 'utf8');
    // Strip block comments and line comments before scanning for player-facing
    // string literals. The collision-resolved:results-copy invariant is that
    // 'Game Over' never reaches the rendered DOM.
    const codeOnly = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\*.*$/gm, '')
      .replace(/\/\/.*$/gm, '');
    expect(codeOnly).toContain('Mystery Solved');
    expect(codeOnly.includes('Game Over')).toBe(false);
  });

  it('loss branch shows Shaggy line copy', () => {
    const src = readFileSync(file, 'utf8');
    expect(src).toContain('Zoinks!');
  });

  it('loss branch shows three recovery options', () => {
    const src = readFileSync(file, 'utf8');
    expect(src).toContain('Watch Ad');
    expect(src).toContain('+5 Snacks');
    expect(src).toContain('Try Again');
  });

  it('Watch-Ad button responds with Coming-Soon UX (no silent no-op)', () => {
    const src = readFileSync(file, 'utf8');
    expect(src).toMatch(/Coming Soon/i);
  });
});
