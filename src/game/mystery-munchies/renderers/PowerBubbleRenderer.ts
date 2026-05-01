/**
 * PowerBubbleRenderer — overlay ring + glow for power-typed cells.
 *
 * Power bubbles are rendered as standard Bubble cells with a gold ring
 * overlay (BoardRenderer applies the ring during syncFromDb). This module
 * exposes the pulse animation hook used by the controller during
 * activation.
 */

import { Container } from 'pixi.js';
import { gsap } from 'gsap';

export class PowerBubbleRenderer {
  /** Pulse the gold ring overlay during activation. */
  static pulse(container: Container | null): Promise<void> {
    if (!container) return Promise.resolve();
    return new Promise<void>((resolve) => {
      gsap.fromTo(
        container.scale,
        { x: 1, y: 1 },
        {
          x: 1.3,
          y: 1.3,
          duration: 0.18,
          ease: 'power3.out',
          yoyo: true,
          repeat: 1,
          overwrite: 'auto',
          onComplete: () => resolve(),
        },
      );
    });
  }
}
