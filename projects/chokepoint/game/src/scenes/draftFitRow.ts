import Phaser from 'phaser';
import { artScale, augmentTexture } from '../art/textures';
import { PALETTE } from '../content/palette';
import type { AugmentCopy } from '../content/types';
import type { Tower } from '../entities/Tower';
import { TowerGhost } from '../systems/towerGhost';
import { textStyle } from '../ui/text';

const FIT = { token: 0.5, step: 26, height: 42 } as const;

export interface FitRow {
  container: Phaser.GameObjects.Container; // row content, centered on (0,0)
  height: number;                          // display height in CSS px, already × k
}

/**
 * The draft's version of the ghost: where this offered card would land, one small token per run
 * tower with a free slot — its first-augment icon wearing the card's what-if marker, at full
 * alpha (the draft's tokens carry no dim rule). The first three towers in build order, then a
 * muted "…". Display only: the card's buttons and picks are untouched.
 */
export function buildFitRow(scene: Phaser.Scene, k: number, copy: AugmentCopy, towers: Tower[]): FitRow | undefined {
  const free = towers.filter((t) => t.freeSlots > 0);
  if (free.length === 0) return undefined;
  const shown = free.slice(0, 3);
  const container = scene.add.container(0, 0);
  shown.forEach((tower, i) => {
    const x = (i - (shown.length - 1) / 2) * FIT.step * k;
    const icon = artScale(scene.add.image(x, 0, augmentTexture(tower.augments[0]!.id)), FIT.token * k);
    const marker = scene.add.graphics().setPosition(x, 0).setScale(FIT.token * k);
    TowerGhost.drawMarker(marker, copy);
    container.add([icon, marker]);
  });
  if (free.length > 3) {
    const dot = scene.add.text(0, 0, '…', textStyle(12, PALETTE.muted));
    dot.setOrigin(0, 0.5);
    dot.setPosition((shown.length - 1) * FIT.step * k * 0.5 + 11 * k + dot.width / 2, -2 * k);
    container.add(dot);
  }
  return { container, height: FIT.height * k };
}
