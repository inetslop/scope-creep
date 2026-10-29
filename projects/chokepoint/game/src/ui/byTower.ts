import type Phaser from 'phaser';
import { artScale, augmentTexture } from '../art/textures';
import { PALETTE } from '../content/palette';
import type { Tier } from '../content/types';
import { pipColor } from '../entities/towerLook';
import { makeCard } from './card';
import { textStyle } from './text';

export interface ByTowerEntry {
  /** The tower's first augment (its icon); undefined only if it never got one (shouldn't happen). */
  first: string | undefined;
  kills: number;
  /** The tower's first-augment tier — colors the pip beside the chip's icon. */
  tier?: Tier;
}

const W = 360; // same width as the end card above it
const CHIP_W = 64;
const CHIP_H = 34;
const GAP_X = 8;
const ROW_GAP = 10;
const PER_ROW = 4;

/** The end screen's "By tower" card: a wrapping row of chips, one per tower built this run,
 * each with the tower's first-augment icon and its kills ("×N"), highest kills first. */
export function makeByTowerCard(scene: Phaser.Scene, entries: ByTowerEntry[]): { card: Phaser.GameObjects.Container; height: number } {
  const sorted = [...entries].sort((a, b) => b.kills - a.kills || (a.first ?? '').localeCompare(b.first ?? ''));
  const rows = Math.max(1, Math.ceil(sorted.length / PER_ROW));
  const H = 34 + rows * (CHIP_H + ROW_GAP);
  const card = scene.add.container(0, 0);
  card.add(makeCard(scene, 0, 0, W, H, 22));
  card.add(scene.add.text(-W / 2 + 18, -H / 2 + 12, 'By tower', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0));
  const rowW = PER_ROW * CHIP_W + (PER_ROW - 1) * GAP_X;
  sorted.forEach((t, i) => {
    const x = -rowW / 2 + CHIP_W / 2 + (i % PER_ROW) * (CHIP_W + GAP_X);
    const y = -H / 2 + 34 + Math.floor(i / PER_ROW) * (CHIP_H + ROW_GAP) + CHIP_H / 2;
    const chip = scene.add.container(x, y);
    chip.add(makeCard(scene, 0, 0, CHIP_W, CHIP_H, 12));
    if (t.first) chip.add(artScale(scene.add.image(-CHIP_W / 2 + 14, 0, augmentTexture(t.first)), 0.7));
    if (t.first && t.tier) {
      const g = scene.add.graphics();
      g.fillStyle(pipColor(t.tier), 1);
      g.fillCircle(-10, 8, 4); // tier pip at the icon's bottom right, same r=4 circle as the slot pips
      chip.add(g);
    }
    chip.add(scene.add.text(8, 0, `×${t.kills}`, textStyle(12, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5));
    card.add(chip);
  });
  return { card, height: H };
}
