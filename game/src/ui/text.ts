import type Phaser from 'phaser';
import { cssColor, PALETTE } from '../content/palette';

/** Geometric sans-serif system fonts (Futura is the Bauhaus classic). No web font download. */
export const FONT_FAMILY = 'Futura, "Century Gothic", "Avenir Next", "Trebuchet MS", "Segoe UI", Arial, sans-serif';

/** Standard text style: ink on paper. Rendered at device pixel ratio so it stays crisp on phones. */
export function textStyle(size: number, color: number = PALETTE.ink, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${Math.round(size)}px`,
    color: cssColor(color),
    resolution: Math.min(window.devicePixelRatio || 1, 3),
    ...extra,
  };
}

/** Big bold headline with a hard offset shadow in a primary color. */
export function titleStyle(size: number, color: number = PALETTE.ink, shadow: number = PALETTE.red): Phaser.Types.GameObjects.Text.TextStyle {
  const offset = Math.max(3, Math.round(size / 14));
  return textStyle(size, color, {
    fontStyle: 'bold',
    shadow: { offsetX: offset, offsetY: offset, color: cssColor(shadow), blur: 0, fill: true },
  });
}
