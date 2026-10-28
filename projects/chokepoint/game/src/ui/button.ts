import type Phaser from 'phaser';
import { cssColor, PALETTE } from '../content/palette';
import { CARD_RES, cardTexture } from './card';
import { textStyle } from './text';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  /** Card color. White by default; a bright or ink makes a primary button (white text). */
  fill?: number;
  /** Color of the ring shown when `selected`. */
  accent?: number;
  /** Corner radius (a big one makes a pill or a circle). */
  radius?: number;
  /** Fade out when disabled (default true). Without it a disabled button just stops reacting. */
  fadeWhenDisabled?: boolean;
}

export interface Button {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
  /** Holds the label; add icons here so they lift with it. */
  content: Phaser.GameObjects.Container;
  /** Highlighted: lifted, with a ring in the accent color (e.g. the selected tower). */
  setSelected(selected: boolean): void;
  /** Faded out and not clickable. */
  setEnabled(enabled: boolean): void;
}

/**
 * A rounded card button with a soft shadow. Works with mouse and touch; at least 44px tall.
 * Fires on pointerup when the press also started on it (a board drag that ends on a button
 * doesn't press it), and stops the event so the board underneath never sees it.
 */
export function makeButton(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, opts: ButtonOptions = {}): Button {
  const width = opts.width ?? 220;
  const height = Math.max(44, opts.height ?? 52);
  const fill = opts.fill ?? PALETTE.card;
  const radius = opts.radius ?? Math.min(16, height / 2);
  const primary = fill !== PALETTE.card;
  let hover = false;
  let pressed = false;
  let selected = false;
  let enabled = true;
  const card = scene.add.image(0, 0, cardTexture(scene, width, height, radius, fill)).setScale(1 / CARD_RES);
  const ring = scene.add.graphics();
  const label = scene.add.text(0, 0, text, textStyle(opts.fontSize ?? 20, primary ? PALETTE.card : PALETTE.ink, { fontStyle: 'bold', align: 'center' })).setOrigin(0.5);
  const content = scene.add.container(0, 0, [label]);
  const container = scene.add.container(x, y, [card, ring, content]);
  const draw = (): void => {
    ring.clear();
    if (selected && enabled) {
      ring.lineStyle(3, opts.accent ?? PALETTE.ink, 1);
      ring.strokeRoundedRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, radius + 1);
    }
    const lift = !enabled ? 0 : pressed ? 1 : selected ? -3 : hover ? -2 : 0;
    if (container.input) container.input.cursor = enabled ? 'pointer' : 'default';
    card.setY(lift);
    ring.setY(lift);
    content.setY(lift);
    container.setAlpha(enabled || opts.fadeWhenDisabled === false ? 1 : 0.45);
    label.setColor(cssColor(primary ? PALETTE.card : PALETTE.ink));
  };
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on('pointerover', () => {
    hover = true;
    draw();
  });
  container.on('pointerout', () => {
    hover = false;
    pressed = false;
    draw();
  });
  container.on('pointerdown', () => {
    pressed = true;
    draw();
  });
  container.on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
    event.stopPropagation();
    const wasPressed = pressed;
    pressed = false;
    draw();
    if (enabled && wasPressed) onClick();
  });
  draw();
  return {
    container,
    label,
    content,
    setSelected(value) {
      if (selected === value) return;
      selected = value;
      draw();
    },
    setEnabled(value) {
      if (enabled === value) return;
      enabled = value;
      draw();
    },
  };
}
