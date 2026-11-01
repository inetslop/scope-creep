import type Phaser from 'phaser';
import { getLevelAugment } from '../../content/levels';
import { PALETTE } from '../../content/palette';
import type { GameScene } from '../../scenes/GameScene';
import { makeCard } from '../card';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

const CHIP_H = 22;
const CHIP_GAP = 6;
const GAP = 6;
/** The stats card's bottom edge while its bank line is hidden (StatsCard sets 'statsCardBottom'). */
const TOP = 12 + 72 + GAP;

/**
 * Under the stats card: one white chip per level augment on for the run, its name only. The
 * multiplier's effect already rides on the coin tally and the pause's worth line, and the menu
 * said the number before the run — nothing shown twice. Hidden when none are on.
 */
export class LevelChips implements HudPart {
  private readonly scene: Phaser.Scene;
  private readonly chips: { card: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text; w: number; x: number; yOff: number }[] = [];
  private lastBottom: number | undefined;

  constructor(scene: Phaser.Scene, game: GameScene) {
    this.scene = scene;
    // run.level is final before the HUD scene exists (new, ghost and resumed runs alike), so the
    // chips are built once here; rebuilding in update() would leak objects every frame.
    for (const id of game.run.level) {
      const def = getLevelAugment(id);
      if (!def) continue;
      const label = scene.add.text(0, 0, def.name, textStyle(11, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
      const w = Math.ceil(label.width) + 16;
      const card = makeCard(scene, 0, 0, w, CHIP_H, CHIP_H / 2);
      this.chips.push({ card, label, w, x: 0, yOff: 0 });
    }
  }

  layout(width: number): void {
    let x = EDGE;
    let y = 0;
    for (const chip of this.chips) {
      if (x + chip.w > width - EDGE && x > EDGE) {
        x = EDGE; // five or fewer chips fit one line at 412x915 and 1280x720; wrap only if ever needed
        y += CHIP_H + CHIP_GAP;
      }
      chip.x = x + chip.w / 2;
      chip.yOff = y;
      x += chip.w + CHIP_GAP;
    }
    this.place();
  }

  /** GAP below the stats card's bottom edge; its bank line can grow the card mid-run, so the chips follow (StatsCard). */
  private place(): void {
    const bottom = (this.scene.registry.get('statsCardBottom') as number | undefined) ?? TOP - GAP;
    for (const chip of this.chips) {
      chip.card.setPosition(chip.x, bottom + GAP + chip.yOff + CHIP_H / 2);
      chip.label.setPosition(chip.x, bottom + GAP + chip.yOff + CHIP_H / 2);
    }
  }

  update(): void {
    // The chips are fixed for the run, but the card's bank line can grow it mid-run: follow the edge (StatsCard).
    const bottom = this.scene.registry.get('statsCardBottom') as number | undefined;
    if (bottom !== this.lastBottom) { this.lastBottom = bottom; this.place(); }
  }
}
