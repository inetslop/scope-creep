import type Phaser from 'phaser';
import { cssColor, PALETTE } from '../content/palette';
import { display } from './display';

/** Rounded system fonts where there are some (macOS/iOS ui-rounded), clean sans-serif elsewhere. No web font download. */
export const FONT_FAMILY = 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif';

/** Standard text style: ink. Rendered at the canvas pixel ratio (ui/display.ts) so it stays crisp. */
export function textStyle(size: number, color: number = PALETTE.ink, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${Math.round(size)}px`,
    color: cssColor(color),
    resolution: display.ratio,
    ...extra,
  };
}

/** Big bold headline. */
export function titleStyle(size: number, color: number = PALETTE.ink): Phaser.Types.GameObjects.Text.TextStyle {
  return textStyle(size, color, { fontStyle: 'bold' });
}
