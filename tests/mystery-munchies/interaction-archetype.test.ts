import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const file = path.resolve(
  __dirname,
  '../..',
  'src/game/mystery-munchies/interaction-archetype.md',
);

describe('interaction-archetype: document exists with required fields', () => {
  it('interaction-archetype.md exists', () => {
    expect(existsSync(file)).toBe(true);
  });

  it('contains required sections', () => {
    const md = readFileSync(file, 'utf8');
    expect(md.toLowerCase()).toContain('gesture');
    expect(md.toLowerCase()).toContain('pointer');
    expect(md.toLowerCase()).toContain('cancel');
    expect(md.toLowerCase()).toContain('wobble');
    expect(md.toLowerCase()).toContain('feel');
  });
});
