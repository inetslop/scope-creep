import type Phaser from 'phaser';
import { HUD } from '../../config';
import { getAugment } from '../../content/augments';
import { PALETTE } from '../../content/palette';
import { artScale, augmentTexture } from '../../art/textures';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton } from '../button';
import { makeCard } from '../card';
import { drawTierFrame, gemRow, tierFrameColor, tierName } from '../tierLook';
import { textStyle } from '../text';
import { CARD, EDGE, isNarrow, NEXT_SIZE, type HudPart } from './hud';

/**
 * Bottom left: the hand, one card per augment waiting to be placed (key 1-9 on each); the selected
 * one lifted with a ring. Tapping one calls Building.pickCard. Rebuilt when Building.uiVersion changes.
 */
export class HandBar implements HudPart {
  private readonly scene: Phaser.Scene;
  private box: Phaser.GameObjects.Container | undefined;
  private size = { width: 0, height: 0 };
  private builtVersion = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  layout(width: number, height: number): void {
    this.size = { width, height };
    this.builtVersion = -1;
  }

  update(game: GameScene): void {
    if (this.builtVersion === game.building.uiVersion) return;
    this.builtVersion = game.building.uiVersion;
    this.build(game);
  }

  private build(game: GameScene): void {
    const scene = this.scene;
    this.box?.destroy();
    const { width, height } = this.size;
    const bottom = height - HUD.bottom / 2;
    const ids = game.run.hand;
    const space = width - EDGE * 2 - NEXT_SIZE - 14 - (isNarrow(width) ? 0 : 120);
    const items: Phaser.GameObjects.GameObject[] = [];
    if (ids.length === 0) {
      const w = Math.min(220, space);
      items.push(
        makeCard(scene, EDGE + w / 2, bottom, w, CARD, 20).setAlpha(0.6),
        scene.add.text(EDGE + w / 2, bottom, 'Next augment\nafter this wave', textStyle(14, PALETTE.muted, { align: 'center', lineSpacing: 4 })).setOrigin(0.5),
      );
    }
    const gap = 8;
    const per = (space - gap * (ids.length - 1)) / Math.max(1, ids.length);
    const base = Math.max(56, Math.min(CARD, per)); // today's width
    // "Name" for Common, "Name · Rare"/"Name · Epic" otherwise; measure it so the card fits the line.
    const measure = scene.add.text(0, 0, '', textStyle(13, PALETTE.ink, { fontStyle: 'bold' }));
    const widths = ids.map((copy) => {
      if (copy.tier === 'common') return base;
      measure.setText(`${getAugment(copy.id).name} · ${tierName(copy.tier)}`);
      return Math.max(base, measure.width + 12); // 6 px of room each side
    });
    measure.destroy();
    let x = EDGE;
    ids.forEach((copy, i) => {
      const a = getAugment(copy.id);
      const w = widths[i];
      const b = makeButton(scene, x + w / 2, bottom, '', () => game.building.pickCard(i), { width: w, height: CARD, radius: 20, accent: PALETTE[a.look.color] });
      const icon = artScale(scene.add.image(0, -13, augmentTexture(copy.id)), Math.min(1.1, w / 75));
      const name = scene.add.text(0, 12, a.name, textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
      const word = copy.tier === 'common' ? undefined : scene.add.text(0, 12, `· ${tierName(copy.tier)}`, textStyle(13, tierFrameColor(copy.tier)!, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      if (word) {
        name.setOrigin(0, 0.5);
        const total = name.width + 4 + word.width; // "Name" + space + "· Rare", centered
        name.x = -total / 2;
        word.x = name.x + name.width + 4;
      }
      const key = i < 9 ? [scene.add.text(-w / 2 + 9, -CARD / 2 + 7, String(i + 1), textStyle(11, PALETTE.faint, { fontStyle: 'bold' }))] : [];
      b.content.add([icon, name, ...(word ? [word] : []), gemRow(scene, copy.tier, 0, 29), ...key]);
      // The frame goes in the content, so it lifts with the card; last, so it draws on top.
      const frame = drawTierFrame(scene, copy.tier, w, CARD, 20);
      if (frame) b.content.add(frame);
      b.setSelected(game.building.selectedAugment === i);
      items.push(b.container);
      x += w + gap;
    });
    this.box = scene.add.container(0, 0, items);
  }
}
