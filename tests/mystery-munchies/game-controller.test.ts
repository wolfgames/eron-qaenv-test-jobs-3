import { describe, expect, it } from 'vitest';
import { setupGame } from '~/game/mystery-munchies';

/**
 * GameController contract tests.
 *
 * The controller has hard runtime dependencies on a real DOM container and
 * the WebGPU/Canvas — neither is available under Vitest's `node` environment.
 * These tests verify the contract surface (return shape, gameMode, ariaText
 * accessor, presence of init/destroy methods) and ensure the factory itself
 * does not throw when constructed.
 */

function makeStubDeps() {
  return {
    coordinator: {} as never,
    tuning: { scaffold: {}, game: {} } as never,
    audio: { playSound: () => 0 },
    gameData: null,
    analytics: { trackGameStart: () => undefined },
    goto: (_screen: string) => undefined,
  };
}

describe('game-controller: pixi bootstrap', () => {
  it('setupGame returns GameController without DOM elements (no throw on factory)', () => {
    const ctrl = setupGame(makeStubDeps());
    expect(ctrl).toBeDefined();
    expect(typeof ctrl.init).toBe('function');
    expect(typeof ctrl.destroy).toBe('function');
    expect(typeof ctrl.ariaText).toBe('function');
    expect(typeof ctrl.ariaText()).toBe('string');
  });

  it('controller is in pixi gameMode (not dom)', () => {
    const ctrl = setupGame(makeStubDeps());
    expect(ctrl.gameMode).toBe('pixi');
  });

  it('destroy is idempotent before init', () => {
    const ctrl = setupGame(makeStubDeps());
    expect(() => ctrl.destroy()).not.toThrow();
    expect(() => ctrl.destroy()).not.toThrow();
  });
});
