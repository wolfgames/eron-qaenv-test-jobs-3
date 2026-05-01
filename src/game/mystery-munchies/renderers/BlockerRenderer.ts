/**
 * BlockerRenderer — animation hooks for blocker cells.
 *
 * Ghost barriers and crate blockers are drawn by BoardRenderer.syncFromDb;
 * this module exposes the rattle / crack / burst animations driven by
 * the controller when blockers take damage.
 */

import { Graphics } from 'pixi.js';
import { gsap } from 'gsap';

export class BlockerRenderer {
  /** Brief horizontal rattle on a blocker hit. */
  static rattle(target: Graphics | null): Promise<void> {
    if (!target) return Promise.resolve();
    const startX = target.position.x;
    return new Promise<void>((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          target.position.x = startX;
          resolve();
        },
      });
      tl.to(target.position, { x: startX + 3, duration: 0.04, ease: 'power2.out' })
        .to(target.position, { x: startX - 3, duration: 0.06, ease: 'power2.inOut' })
        .to(target.position, { x: startX + 2, duration: 0.04, ease: 'power2.inOut' })
        .to(target.position, { x: startX, duration: 0.03, ease: 'power2.out' });
    });
  }

  /** Crack flash on the first hit of a 2-hit ghost barrier. */
  static crackFlash(target: Graphics | null): Promise<void> {
    if (!target) return Promise.resolve();
    return new Promise<void>((resolve) => {
      gsap.fromTo(
        target,
        { alpha: 1 },
        {
          alpha: 0.4,
          duration: 0.1,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          overwrite: 'auto',
          onComplete: () => resolve(),
        },
      );
    });
  }
}
