import { describe, expect, it } from 'vitest';
import {
  countAdjacentClusterHits,
  applyGhostBarrierHit,
  isCrateDestroyableByBlast,
} from '~/game/mystery-munchies/logic/blockerLogic';

describe('blocker-logic: hit tracking and destruction', () => {
  it('Ghost Barrier tracks hit count; destroyed at 2 adjacent hits', () => {
    let hits = 2;
    const r1 = applyGhostBarrierHit(hits);
    hits = r1.remainingHits;
    expect(r1.destroyed).toBe(false);
    expect(hits).toBe(1);
    const r2 = applyGhostBarrierHit(hits);
    expect(r2.destroyed).toBe(true);
    expect(r2.remainingHits).toBe(0);
  });

  it('Crate Blocker survives adjacent cluster pops (not power blast)', () => {
    expect(isCrateDestroyableByBlast(false)).toBe(false);
  });

  it('Crate Blocker destroyed by power blast', () => {
    expect(isCrateDestroyableByBlast(true)).toBe(true);
  });

  it('countAdjacentClusterHits counts orthogonal hits only (not diagonal)', () => {
    // Cluster contains only (0,0); barrier at (1,1) is diagonally adjacent only.
    expect(countAdjacentClusterHits([{ row: 0, col: 0 }], { row: 1, col: 1 })).toBe(0);

    // Cluster at (1,0); barrier at (1,1): orthogonal — hit.
    expect(countAdjacentClusterHits([{ row: 1, col: 0 }], { row: 1, col: 1 })).toBe(1);

    // Cluster has both an orthogonal and a diagonal neighbor; only the
    // orthogonal one counts.
    expect(
      countAdjacentClusterHits([
        { row: 0, col: 1 }, // orthogonal to (1,1) → counts
        { row: 0, col: 0 }, // diagonal to (1,1) → ignored
      ], { row: 1, col: 1 }),
    ).toBe(1);
  });
});
