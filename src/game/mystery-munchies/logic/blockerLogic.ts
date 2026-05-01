/**
 * Mystery Munchies — pure blocker logic.
 *
 *  - countAdjacentClusterHits: count how many cluster members are
 *    orthogonally adjacent to a barrier cell. Diagonal does NOT count.
 *  - applyGhostBarrierHit: decrement the barrier's hit counter and report
 *    whether it was destroyed.
 *  - isCrateDestroyableByBlast: a crate is only destroyed by a power blast,
 *    never by a normal cluster pop.
 */

export interface RowCol { row: number; col: number; }

export function countAdjacentClusterHits(
  cluster: ReadonlyArray<RowCol>,
  barrier: RowCol,
): number {
  let hits = 0;
  for (const c of cluster) {
    const dr = Math.abs(c.row - barrier.row);
    const dc = Math.abs(c.col - barrier.col);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) hits += 1;
  }
  return hits;
}

export interface GhostBarrierHitResult {
  destroyed: boolean;
  remainingHits: number;
}

export function applyGhostBarrierHit(currentHits: number, hitsApplied = 1): GhostBarrierHitResult {
  const next = Math.max(0, currentHits - hitsApplied);
  return { destroyed: next <= 0, remainingHits: next };
}

export function isCrateDestroyableByBlast(isPowerBlast: boolean): boolean {
  return isPowerBlast === true;
}
