import type Phaser from 'phaser';
import { getLevelAugment } from '../../content/levels';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

const CHIP_H = 22;
const CHIP_GAP = 6;
/** Just under the stats card, which is 12..84 (StatsCard.layout). */
const TOP = 12 + 72 + 6;

/**
 * Under the stats card: one white chip per level augment on for the run, its name only. The
 * multiplier's effect already rides on the coin tally and the pause's worth line, and the menu
 * said the number before the run — nothing shown twice. Hidden when none are on.
 */
export class LevelChips implements HudPart {
  private readonly chips: { card: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text; w: number }[] = [];

  constructor(scene: Phaser.Scene, game: GameScene) {
    // run.level is final before the HUD scene exists (new, ghost and resumed runs alike), so the
    // chips are built once here; rebuilding in update() would leak objects every frame.
    for (const id of game.run.level) {
      const def = getLevelAugment(id);
      if (!def) continue;
      const label = scene.add.text(0, 0, def.name, textStyle(11, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
      const w = Math.ceil(label.width) + 16;
      const card = makeCard(scene, 0, 0, w, CHIP_H, CHIP_H / 2);
      this.chips.push({ card, label, w });
    }
  }

  layout(width: number): void {
    let x = EDGE;
    let y = TOP;
    for (const chip of this.chips) {
      if (x + chip.w > width - EDGE && x > EDGE) {
        x = EDGE; // five or fewer chips fit one line at 412x915 and 1280x720; wrap only if ever needed
        y += CHIP_H + CHIP_GAP;
      }
      chip.card.setPosition(x + chip.w / 2, y + CHIP_H / 2);
      chip.label.setPosition(x + chip.w / 2, y + CHIP_H / 2);
      x += chip.w + CHIP_GAP;
    }
  }

  update(): void {
    // The chips are fixed for the run; there is nothing to refresh.
  }
}
