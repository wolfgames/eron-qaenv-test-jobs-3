/**
 * BubbleRenderer — single bubble sprite component.
 *
 * Pure visual: a Container with a tinted Graphics circle and a glyph label.
 * No game state — caller manages position, lifecycle, and animation.
 *
 * No texture atlases are loaded in core pass; the Graphics + Text fallback
 * is the shipped visual (per design-smells: never ship invisible / ungraded
 * placeholders — these are real visual elements with distinct color + glyph).
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { COLOR_LABELS, COLOR_TINTS } from './boardLayout';
import { COLORS, type CellColor } from '../state/types';

export interface BubbleRendererOptions {
  /** Visual diameter in stage px. */
  diameter: number;
}

export class BubbleRenderer {
  readonly container: Container;
  private g: Graphics;
  private label: Text;
  private color: CellColor;

  constructor(color: CellColor, options: BubbleRendererOptions) {
    this.color = color;
    this.container = new Container();
    this.container.eventMode = 'static';
    const radius = options.diameter / 2;

    this.g = new Graphics()
      .circle(0, 0, radius)
      .fill({ color: COLOR_TINTS[color], alpha: 1 })
      .circle(-radius * 0.3, -radius * 0.3, radius * 0.25)
      .fill({ color: 0xFFFFFF, alpha: 0.4 });

    this.label = new Text({
      text: COLOR_LABELS[color],
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: Math.floor(radius * 0.9),
        fontWeight: '700',
        fill: 0xFFFFFF,
        align: 'center',
      }),
    });
    this.label.anchor.set(0.5);
    this.label.position.set(0, 0);

    this.container.addChild(this.g, this.label);
  }

  setColor(color: CellColor, diameter: number): void {
    this.color = color;
    this.g.clear()
      .circle(0, 0, diameter / 2)
      .fill({ color: COLOR_TINTS[color], alpha: 1 })
      .circle(-(diameter / 2) * 0.3, -(diameter / 2) * 0.3, (diameter / 2) * 0.25)
      .fill({ color: 0xFFFFFF, alpha: 0.4 });
    this.label.text = COLOR_LABELS[color];
  }

  destroy(): void {
    this.container.parent?.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}

/** Re-export the color list and tint map for callers. */
export { COLORS, COLOR_TINTS, COLOR_LABELS };
export type { CellColor };
