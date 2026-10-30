import type Phaser from 'phaser';
import { NAME_LENGTH, stepLetter } from '../core/boardName';
import { PALETTE } from '../content/palette';
import { makeButton } from './button';
import { makeCard } from './card';
import { titleStyle } from './text';

const SLOT_W = 54;
const SLOT_GAP = 10;
const LETTER_H = 64;
const ARROW_H = 44;
const ARROW_GAP = 6;

export const PICKER_W = NAME_LENGTH * SLOT_W + (NAME_LENGTH - 1) * SLOT_GAP;
export const PICKER_H = ARROW_H * 2 + ARROW_GAP * 2 + LETTER_H;

export interface LetterPicker {
  container: Phaser.GameObjects.Container;
  /** The four letters as one name. */
  value(): string;
  /** Typing: a letter fills the current slot and moves on; Backspace and the arrow keys move and step. */
  key(event: KeyboardEvent): void;
}

/**
 * Four letter slots, arcade style: each with an up and a down arrow (tap to step through the
 * alphabet) and the current slot ringed; typing works too. Centered on (0, 0), PICKER_W wide.
 */
export function makeLetterPicker(scene: Phaser.Scene, start: string): LetterPicker {
  const letters = Array.from({ length: NAME_LENGTH }, (_, i) => (/^[A-Z]$/.test(start[i] ?? '') ? start[i]! : 'A'));
  let current = 0;
  const parts: Phaser.GameObjects.GameObject[] = [];
  const texts: Phaser.GameObjects.Text[] = [];
  const rings: Phaser.GameObjects.Graphics[] = [];

  const refresh = (): void => {
    texts.forEach((t, i) => t.setText(letters[i]!));
    rings.forEach((r, i) => r.setVisible(i === current));
  };
  const step = (i: number, by: number): void => {
    letters[i] = stepLetter(letters[i]!, by);
    current = i;
    refresh();
  };

  const arrow = (x: number, y: number, up: boolean, i: number): Phaser.GameObjects.Container => {
    const b = makeButton(scene, x, y, '', () => step(i, up ? 1 : -1), { width: SLOT_W, height: ARROW_H, radius: 14 });
    const g = scene.add.graphics();
    g.fillStyle(PALETTE.ink, 1);
    if (up) g.fillTriangle(-8, 4, 8, 4, 0, -5);
    else g.fillTriangle(-8, -4, 8, -4, 0, 5);
    b.content.add(g);
    return b.container;
  };

  for (let i = 0; i < NAME_LENGTH; i++) {
    const x = -PICKER_W / 2 + SLOT_W / 2 + i * (SLOT_W + SLOT_GAP);
    const top = -PICKER_H / 2;
    parts.push(arrow(x, top + ARROW_H / 2, true, i));
    const cy = top + ARROW_H + ARROW_GAP + LETTER_H / 2;
    const slot = makeCard(scene, x, cy, SLOT_W, LETTER_H, 14);
    slot.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      current = i;
      refresh();
    });
    const ring = scene.add.graphics();
    ring.lineStyle(3, PALETTE.ink, 1);
    ring.strokeRoundedRect(x - SLOT_W / 2 - 1, cy - LETTER_H / 2 - 1, SLOT_W + 2, LETTER_H + 2, 15);
    const text = scene.add.text(x, cy, '', titleStyle(32)).setOrigin(0.5);
    parts.push(slot, ring, text);
    texts.push(text);
    rings.push(ring);
    parts.push(arrow(x, cy + LETTER_H / 2 + ARROW_GAP + ARROW_H / 2, false, i));
  }
  refresh();

  return {
    container: scene.add.container(0, 0, parts),
    value: () => letters.join(''),
    key: (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      if (/^[A-Z]$/.test(k)) {
        letters[current] = k;
        current = Math.min(NAME_LENGTH - 1, current + 1);
      } else if (k === 'Backspace' || k === 'ArrowLeft') current = Math.max(0, current - 1);
      else if (k === 'ArrowRight') current = Math.min(NAME_LENGTH - 1, current + 1);
      else if (k === 'ArrowUp') letters[current] = stepLetter(letters[current]!, 1);
      else if (k === 'ArrowDown') letters[current] = stepLetter(letters[current]!, -1);
      else return;
      refresh();
    },
  };
}
