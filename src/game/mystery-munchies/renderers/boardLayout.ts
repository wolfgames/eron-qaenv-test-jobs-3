/**
 * Board layout — pure geometry helper.
 *
 * Computes the grid origin, cell stride, and bubble visual size from a
 * viewport box. Pure, no Pixi imports — drives BoardRenderer placement
 * and is testable in node.
 *
 * Tap-target rules:
 *   - Cell stride must be >= 44px (mobile-constraints) and ideally >= 48px
 *     (canvas CoS minimum piece size).
 *   - Bubble visual diameter is the cell stride minus a 4px gap.
 */

import { GRID_COLS, GRID_ROWS, type CellColor } from '../state/types';

export interface BoardLayoutInput {
  viewportW: number;
  viewportH: number;
  reservedTop: number;
  reservedBottom: number;
}

export interface BoardLayout {
  /** Per-cell stride (tap target side length) in CSS px. */
  cellStride: number;
  /** Bubble visual diameter (cell stride minus inter-cell gap). */
  bubbleDiameter: number;
  /** Total board width in px (cellStride * cols). */
  boardWidth: number;
  /** Total board height in px (cellStride * rows). */
  boardHeight: number;
  /** Top-left x of the board area in stage coords. */
  boardOriginX: number;
  /** Top-left y of the board area in stage coords. */
  boardOriginY: number;
  /** Reserved HUD height at top of viewport. */
  hudTopHeight: number;
  /** Reserved companion area at bottom (above DOM overlay). */
  companionBottomHeight: number;
}

const CELL_GAP = 4;
const HUD_TOP_RESERVED = 60;
const COMPANION_BOTTOM_RESERVED = 80;
const MIN_TAP_TARGET = 44;

export function computeBoardLayout(input: BoardLayoutInput): BoardLayout {
  const { viewportW, viewportH, reservedTop, reservedBottom } = input;

  // Width-driven stride: divide viewport width by columns, floor to integer.
  const stride = Math.max(MIN_TAP_TARGET, Math.floor(viewportW / GRID_COLS));
  const boardWidth = stride * GRID_COLS;
  const boardHeight = stride * GRID_ROWS;

  const boardOriginX = Math.floor((viewportW - boardWidth) / 2);

  const verticalAvailable = viewportH - reservedTop - reservedBottom - HUD_TOP_RESERVED - COMPANION_BOTTOM_RESERVED;
  // Center board in remaining vertical space, but never go above HUD.
  const baseY = reservedTop + HUD_TOP_RESERVED;
  const slack = Math.max(0, verticalAvailable - boardHeight);
  const boardOriginY = baseY + Math.floor(slack / 2);

  return {
    cellStride: stride,
    bubbleDiameter: Math.max(MIN_TAP_TARGET - 4, stride - CELL_GAP),
    boardWidth,
    boardHeight,
    boardOriginX,
    boardOriginY,
    hudTopHeight: HUD_TOP_RESERVED,
    companionBottomHeight: COMPANION_BOTTOM_RESERVED,
  };
}

/**
 * Convert pixel coordinates to grid (row, col), or null if outside board.
 */
export function pixelToCell(layout: BoardLayout, x: number, y: number): { row: number; col: number } | null {
  const lx = x - layout.boardOriginX;
  const ly = y - layout.boardOriginY;
  if (lx < 0 || ly < 0) return null;
  const col = Math.floor(lx / layout.cellStride);
  const row = Math.floor(ly / layout.cellStride);
  if (col < 0 || col >= GRID_COLS) return null;
  if (row < 0 || row >= GRID_ROWS) return null;
  return { row, col };
}

/**
 * Convert grid (row, col) to the pixel center for placing a sprite.
 */
export function cellCenter(layout: BoardLayout, row: number, col: number): { x: number; y: number } {
  return {
    x: layout.boardOriginX + col * layout.cellStride + layout.cellStride / 2,
    y: layout.boardOriginY + row * layout.cellStride + layout.cellStride / 2,
  };
}

/**
 * Per-color tint values used by BubbleRenderer's Graphics fallback.
 *
 * GDD specifies: Ghastly Green, Phantom Purple, Boo Blue, Fright Orange, Scooby Brown.
 * We map our 5 internal colors (red/blue/green/yellow/purple) to that palette.
 */
export const COLOR_TINTS: Record<CellColor, number> = {
  red: 0xE54B4B,    // Fright Orange-Red
  blue: 0x3B82F6,   // Boo Blue
  green: 0x4ADE80,  // Ghastly Green
  yellow: 0xF59E0B, // Scooby Brown-Gold
  purple: 0x9333EA, // Phantom Purple
};

/**
 * Per-color text label / icon glyph used for colorblind support.
 * Each color has a uniquely-shaped emoji/glyph stamped on the bubble.
 */
export const COLOR_LABELS: Record<CellColor, string> = {
  red: '!',
  blue: '*',
  green: '+',
  yellow: '$',
  purple: '#',
};
