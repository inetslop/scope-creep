import type Phaser from 'phaser';
import { HUD, MAX_SLOTS } from '../../config';
import { getAugment } from '../../content/augments';
import { cssColor, PALETTE } from '../../content/palette';
import { describeSpec, slotCost } from '../../core/augments';
import { tierAddedLine } from '../../core/tiers';
import { artScale, augmentTexture, COIN_TEXTURE } from '../../art/textures';
import type { Tower } from '../../entities/Tower';
import type { GameScene } from '../../scenes/GameScene';
import { makeButton, type Button } from '../button';
import { makeCard } from '../card';
import { drawTierFrame, gemRow, tierGemCount, tierName } from '../tierLook';
import { textStyle } from '../text';
import { EDGE, isNarrow, type HudPart } from './hud';

const PANEL_W = 340;
const ROW_H = 64;
const ROW_GAP = 6;
const SLOT = 50;

/**
 * Above the hand, while a tower is selected: what its augments make it, one card per augment
 * (icon, "Name · Tier", the tier's gems, its added line), its stats, and its slots (filled,
 * free, the next one's price, locked). The panel grows with the number of augments. Rebuilt when
 * Building.uiVersion changes; the unlock price turns red while the gold is short.
 */
export class TowerPanel implements HudPart {
  private readonly scene: Phaser.Scene;
  private box: Phaser.GameObjects.Container | undefined;
  private unlock: { button: Button; cost: number; price: Phaser.GameObjects.Text } | undefined;
  private killsText: Phaser.GameObjects.Text | undefined;
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
    if (this.builtVersion !== game.building.uiVersion) {
      this.builtVersion = game.building.uiVersion;
      this.build(game);
    }
    const tower = game.building.selectedTower;
    if (this.killsText && tower) this.killsText.setText(`kills ${tower.kills}`); // no-op while unchanged
    if (this.unlock) {
      const affordable = game.run.canAfford(this.unlock.cost);
      this.unlock.price.setColor(cssColor(affordable ? PALETTE.ink : PALETTE.red));
      this.unlock.button.content.setAlpha(affordable ? 1 : 0.6);
    }
  }

  private build(game: GameScene): void {
    this.box?.destroy();
    this.box = undefined;
    this.unlock = undefined;
    this.killsText = undefined;
    const tower = game.building.selectedTower;
    if (!tower) return;
    const scene = this.scene;
    const { width, height } = this.size;
    const w = Math.min(PANEL_W, width - EDGE * 2);
    const left = -w / 2 + 18;
    const n = tower.augments.length;
    const H = (ROW_H + ROW_GAP) * n + 146 + 18; // room for the kills line
    const top = -H / 2;
    // The card swallows taps, so tapping the panel never builds on the board under it.
    const card = makeCard(scene, 0, 0, w, H, 22).setInteractive();
    const desc = scene.add.text(left, top + 12, describeSpec(tower.spec), textStyle(13, PALETTE.muted, { wordWrap: { width: w - 36 } })).setOrigin(0, 0);
    const stats = scene.add.text(left, top + 54, statsLine(tower), textStyle(13, PALETTE.ink, { fontStyle: 'bold', wordWrap: { width: w - 36 } })).setOrigin(0, 0);
    const close = makeButton(scene, w / 2 - 26, top + 26, '×', () => game.building.closePanel(), { width: 44, height: 44, radius: 22, fontSize: 24 });
    const items: Phaser.GameObjects.GameObject[] = [card, desc, stats, close.container];
    // One row per augment, like the draft cards: the icon, "Name · Tier", the tier's gems and its added line.
    const RW = w - 36;
    tower.augments.forEach((c, i) => {
      const a = getAugment(c.id);
      const row = scene.add.container(0, top + 104 + i * (ROW_H + ROW_GAP));
      row.add([
        makeCard(scene, 0, 0, RW, ROW_H, 12),
        artScale(scene.add.image(-RW / 2 + 17, 0, augmentTexture(c.id)), 0.6),
        scene.add.text(-RW / 2 + 36, -ROW_H / 2 + 7, `${a.name} · ${tierName(c.tier)}`, textStyle(12, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0),
        gemRow(scene, c.tier, -RW / 2 + 41 + (tierGemCount(c.tier) - 1) * 6, 1),
        scene.add.text(-RW / 2 + 36, 12, tierAddedLine(a, c.tier), textStyle(11, PALETTE.muted, { wordWrap: { width: RW - 52 } })).setOrigin(0, 0),
      ]);
      const frame = drawTierFrame(scene, c.tier, RW, ROW_H, 12);
      if (frame) row.add(frame);
      items.push(row);
    });
    if (n === 0) {
      // Defensive: a tower always holds its first augment, so this should never show.
      items.push(scene.add.text(left, top + 80, 'Put an augment in a slot', textStyle(13, PALETTE.muted)).setOrigin(0, 0));
    }
    // This run's kills by this tower, in the gap between the augment rows and the slot row.
    this.killsText = scene.add.text(left, H / 2 - 79, `kills ${tower.kills}`, textStyle(11, PALETTE.muted)).setOrigin(0, 0);
    items.push(this.killsText);
    items.push(...this.slots(game, tower, left, w, H));
    const x = isNarrow(width) ? width / 2 : EDGE + w / 2;
    this.box = scene.add.container(x, height - HUD.bottom - 10 - H / 2, items);
  }

  /** The slot row: filled (the augment), free (a plus), the next to unlock (its price), locked. */
  private slots(game: GameScene, tower: Tower, left: number, w: number, H: number): Phaser.GameObjects.GameObject[] {
    const scene = this.scene;
    const items: Phaser.GameObjects.GameObject[] = [];
    const y = H / 2 - 16 - SLOT / 2;
    for (let i = 0; i < MAX_SLOTS; i++) {
      const x = left + SLOT / 2 + i * (SLOT + 8);
      const copy = tower.augments[i];
      if (copy) {
        items.push(makeCard(scene, x, y, SLOT, SLOT, 14), artScale(scene.add.image(x, y - 1, augmentTexture(copy.id)), 0.95));
      } else if (i < tower.slots) {
        const g = scene.add.graphics();
        g.lineStyle(2, PALETTE.faint, 1);
        g.strokeRoundedRect(x - SLOT / 2, y - SLOT / 2, SLOT, SLOT, 14);
        g.fillStyle(PALETTE.faint, 1);
        g.fillRoundedRect(x - 8, y - 1.5, 16, 3, 1.5);
        g.fillRoundedRect(x - 1.5, y - 8, 3, 16, 1.5);
        items.push(g);
      } else if (i === tower.slots) {
        const cost = slotCost(i)!;
        const button = makeButton(scene, x, y, '', () => game.building.unlockSlot(), { width: SLOT, height: SLOT, radius: 14 });
        const coin = artScale(scene.add.image(0, -8, COIN_TEXTURE), 0.8);
        const price = scene.add.text(0, 11, String(cost), textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
        button.content.add([coin, price]);
        this.unlock = { button, cost, price };
        items.push(button.container);
      } else {
        const g = scene.add.graphics();
        g.fillStyle(PALETTE.ink, 0.06);
        g.fillRoundedRect(x - SLOT / 2, y - SLOT / 2, SLOT, SLOT, 14);
        items.push(g);
      }
    }
    const hint = tower.freeSlots > 0 ? 'Tap a card to put it in' : this.unlock ? 'Unlock a slot' : 'All slots unlocked';
    const hintX = left + MAX_SLOTS * (SLOT + 8) + 4;
    items.push(scene.add.text(hintX, y, hint, textStyle(12, PALETTE.faint, { wordWrap: { width: Math.max(60, w - 36 - MAX_SLOTS * (SLOT + 8)) } })).setOrigin(0, 0.5));
    return items;
  }
}

/** Damage, range and speed, and the number of shots when more than one. */
function statsLine(tower: Tower): string {
  const s = tower.spec;
  if (!s.attacks) return 'Put an augment in a slot to give it an attack.';
  const damage = s.damage > 0 ? `Damage ${s.damage.toFixed(0)} · ` : '';
  return `${damage}Range ${s.range.toFixed(1)} · ${s.rate.toFixed(1)}/s${s.shots > 1 ? ` · ${s.shots} shots` : ''}`;
}
