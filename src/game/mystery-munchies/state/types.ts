/**
 * Mystery Munchies — ECS state types and constants.
 *
 * Pure type / value definitions shared by GamePlugin, renderers, and logic.
 * No Pixi imports, no DOM access, no Math.random.
 */

export type CellColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
export type CellKindString =
  | 'empty'
  | 'bubble'
  | 'ghost-barrier'
  | 'crate-blocker'
  | 'power-snack-bomb';

/**
 * Phases of the board state machine.
 *  - idle:           input accepted; player may tap.
 *  - animating-pop:  cluster pop animation is in progress; input blocked.
 *  - animating-fall: gravity drop in progress; input blocked.
 *  - won:            level cleared; win sequence playing.
 *  - lost:           tap counter ran out without win; loss sequence playing.
 */
export type BoardPhase =
  | 'idle'
  | 'animating-pop'
  | 'animating-fall'
  | 'won'
  | 'lost';

export const COLORS: readonly CellColor[] = ['red', 'blue', 'green', 'yellow', 'purple'] as const;

export interface LevelConfigStarThresholds {
  /** Tap count remaining for 1 star (any win). */
  one: number;
  /** Tap count remaining for 2 stars. */
  two: number;
  /** Tap count remaining for 3 stars. */
  three: number;
}

export interface LevelConfig {
  id: string;
  chapter: number;
  tapLimit: number;
  refillEnabled: boolean;
  /** 2D array of color characters: r/b/g/y/p/e (empty), L (locked/ghost barrier), C (crate). */
  grid: string[][];
  blockers: Array<{ row: number; col: number; kind: 'ghost-barrier' | 'crate-blocker' }>;
  /** Optional reference to a data-* bundle alias for clue artwork. */
  clueAsset?: string;
  starThresholds: LevelConfigStarThresholds;
}

/** Cell kind enum encoded as small integer for ECS schema (string components are heavier). */
export const CellKind = {
  empty: 0,
  bubble: 1,
  ghostBarrier: 2,
  crateBlocker: 3,
  powerSnackBomb: 4,
} as const;
export type CellKindCode = (typeof CellKind)[keyof typeof CellKind];

export const ColorIndex = {
  red: 0,
  blue: 1,
  green: 2,
  yellow: 3,
  purple: 4,
} as const;
export type ColorIndexCode = (typeof ColorIndex)[keyof typeof ColorIndex];

export function colorFromIndex(idx: number): CellColor {
  return COLORS[idx] ?? 'red';
}

/**
 * Grid character → cellKind/color decoding.
 * r/b/g/y/p → bubble of color
 * e → empty
 * L → ghost-barrier blocker
 * C → crate blocker
 */
export function decodeCell(ch: string): { kind: CellKindCode; color: ColorIndexCode } {
  switch (ch) {
    case 'r': return { kind: CellKind.bubble, color: ColorIndex.red };
    case 'b': return { kind: CellKind.bubble, color: ColorIndex.blue };
    case 'g': return { kind: CellKind.bubble, color: ColorIndex.green };
    case 'y': return { kind: CellKind.bubble, color: ColorIndex.yellow };
    case 'p': return { kind: CellKind.bubble, color: ColorIndex.purple };
    case 'L': return { kind: CellKind.ghostBarrier, color: ColorIndex.red };
    case 'C': return { kind: CellKind.crateBlocker, color: ColorIndex.red };
    case 'e':
    default:
      return { kind: CellKind.empty, color: ColorIndex.red };
  }
}

/** Phase encoded as integer for ECS schema. */
export const PhaseCode = {
  idle: 0,
  animatingPop: 1,
  animatingFall: 2,
  won: 3,
  lost: 4,
} as const;
export type PhaseCodeValue = (typeof PhaseCode)[keyof typeof PhaseCode];

export function phaseFromCode(code: number): BoardPhase {
  switch (code) {
    case PhaseCode.idle: return 'idle';
    case PhaseCode.animatingPop: return 'animating-pop';
    case PhaseCode.animatingFall: return 'animating-fall';
    case PhaseCode.won: return 'won';
    case PhaseCode.lost: return 'lost';
    default: return 'idle';
  }
}

export function phaseToCode(phase: BoardPhase): PhaseCodeValue {
  switch (phase) {
    case 'idle': return PhaseCode.idle;
    case 'animating-pop': return PhaseCode.animatingPop;
    case 'animating-fall': return PhaseCode.animatingFall;
    case 'won': return PhaseCode.won;
    case 'lost': return PhaseCode.lost;
  }
}

export const GRID_COLS = 8;
export const GRID_ROWS = 10;
