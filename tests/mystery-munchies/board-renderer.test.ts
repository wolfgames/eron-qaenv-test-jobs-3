import { describe, expect, it } from 'vitest';
import {
  computeBoardLayout,
  COLOR_TINTS,
  COLOR_LABELS,
} from '~/game/mystery-munchies/renderers/boardLayout';
import { COLORS } from '~/game/mystery-munchies/state/types';

describe('board-renderer: grid layout and tap targets', () => {
  it('cell stride >= 48px at 390px viewport', () => {
    const layout = computeBoardLayout({
      viewportW: 390,
      viewportH: 844,
      reservedTop: 0,
      reservedBottom: 64,
    });
    expect(layout.cellStride).toBeGreaterThanOrEqual(48);
  });

  it('board width <= viewport width at 390px viewport', () => {
    const layout = computeBoardLayout({
      viewportW: 390,
      viewportH: 844,
      reservedTop: 0,
      reservedBottom: 64,
    });
    expect(layout.boardWidth).toBeLessThanOrEqual(390);
  });

  it('all 5 bubble colors visually distinct (tints differ pairwise)', () => {
    const seen = new Set<number>();
    for (const c of COLORS) {
      seen.add(COLOR_TINTS[c]);
    }
    expect(seen.size).toBe(COLORS.length);
  });

  it('all 5 bubble colors have a label/icon for colorblind support', () => {
    for (const c of COLORS) {
      expect(typeof COLOR_LABELS[c]).toBe('string');
      expect(COLOR_LABELS[c].length).toBeGreaterThan(0);
    }
  });

  it('piece visible area >= 48x48px (cellSize fits 44pt floor with padding)', () => {
    const layout = computeBoardLayout({
      viewportW: 390,
      viewportH: 844,
      reservedTop: 0,
      reservedBottom: 64,
    });
    // Visible cell stride is the tap target. Per CoS canvas: piece area >= 48px.
    expect(layout.cellStride).toBeGreaterThanOrEqual(48);
  });

  it('no HUD/board/companion overlap at 390x844', () => {
    const layout = computeBoardLayout({
      viewportW: 390,
      viewportH: 844,
      reservedTop: 0,
      reservedBottom: 64,
    });
    // HUD top reserves 60px; companion bottom reserves 80px above DOM overlay.
    const hudTopReserved = 60;
    const companionReserved = 80;
    const totalUsed = hudTopReserved + layout.boardHeight + companionReserved + 64;
    expect(totalUsed).toBeLessThanOrEqual(844);
    // Board origin must sit below HUD.
    expect(layout.boardOriginY).toBeGreaterThanOrEqual(hudTopReserved);
    // Bottom of board must clear companion area + DOM overlay.
    expect(layout.boardOriginY + layout.boardHeight).toBeLessThanOrEqual(844 - companionReserved - 64);
  });

  it('scales to a smaller viewport without breaking floor', () => {
    const layout = computeBoardLayout({
      viewportW: 375,
      viewportH: 667,
      reservedTop: 0,
      reservedBottom: 64,
    });
    // Even on 375px viewport the per-cell tap target must remain >= 44pt floor.
    expect(layout.cellStride).toBeGreaterThanOrEqual(44);
  });
});
