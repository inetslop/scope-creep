import type Phaser from 'phaser';
import { HUD, MAX_SLOTS } from '../../config';
import { getAugment } from '../../content/augments';
import { cssColor, PALETTE } from '../../content/palette';
import { describeSpec } from '../../core/augments';
import { slotPrice } from '../../core/techEffects';
import { towerDps } from '../../core/towerDps';
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
const DPS_LINE = 14; // one muted line of 11px

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
    const RW = w - 36;
    // Pass 1: lay each row's added line out at (0,0) to measure it, then let the row grow to fit.
    const rows = tower.augments.map((c) => {
      const addedLine = scene.add.text(0, 0, tierAddedLine(getAugment(c.id), c.tier), textStyle(11, PALETTE.muted, { wordWrap: { width: RW - 52 } })).setOrigin(0, 0);
      return { addedLine, rowH: Math.max(ROW_H, Math.round(addedLine.height) + 52) }; // 52 = 44 px from the row's top to the added line + 8 px under its last line
    });
    const H = (ROW_H + ROW_GAP) * n + 146 + 18 + DPS_LINE + rows.reduce((s, r) => s + r.rowH - ROW_H, 0); // room for the kills line and the damage per second under it
    const top = -H / 2;
    // The card swallows taps, so tapping the panel never builds on the board under it.
    const card = makeCard(scene, 0, 0, w, H, 22).setInteractive();
    const desc = scene.add.text(left, top + 12, describeSpec(tower.spec), textStyle(13, PALETTE.muted, { wordWrap: { width: w - 36 } })).setOrigin(0, 0);
    const stats = scene.add.text(left, top + 54, statsLine(tower), textStyle(13, PALETTE.ink, { fontStyle: 'bold', wordWrap: { width: w - 36 } })).setOrigin(0, 0);
    const close = makeButton(scene, w / 2 - 26, top + 26, '×', () => game.building.closePanel(), { width: 44, height: 44, radius: 22, fontSize: 24 });
    const items: Phaser.GameObjects.GameObject[] = [card, desc, stats, close.container];
    // One row per augment, like the draft cards: the icon, "Name · Tier", the tier's gems and its added line.
    let rowY = 72 + (rows[0]?.rowH ?? 0) / 2; // first row's top where today's 64px row starts; each next top is the last row's bottom plus ROW_GAP
    tower.augments.forEach((c, i) => {
      const a = getAugment(c.id);
      const { addedLine, rowH } = rows[i];
      const row = scene.add.container(0, top + rowY);
      rowY += rowH / 2 + ROW_GAP + (rows[i + 1]?.rowH ?? 0) / 2;
      addedLine.setPosition(-RW / 2 + 36, -rowH / 2 + 44);
      row.add([
        makeCard(scene, 0, 0, RW, rowH, 12),
        artScale(scene.add.image(-RW / 2 + 17, 0, augmentTexture(c.id)), 0.6),
        scene.add.text(-RW / 2 + 36, -rowH / 2 + 7, `${a.name} · ${tierName(c.tier)}`, textStyle(12, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0),
        gemRow(scene, c.tier, -RW / 2 + 41 + (tierGemCount(c.tier) - 1) * 6, -rowH / 2 + 33),
        addedLine,
      ]);
      const frame = drawTierFrame(scene, c.tier, RW, rowH, 12);
      if (frame) row.add(frame);
      items.push(row);
    });
    if (n === 0) {
      // Defensive: a tower always holds its first augment, so this should never show.
      items.push(scene.add.text(left, top + 80, 'Put an augment in a slot', textStyle(13, PALETTE.muted)).setOrigin(0, 0));
    }
    // This run's kills by this tower, in the gap between the augment rows and the slot row.
    this.killsText = scene.add.text(left, H / 2 - 79 - DPS_LINE, `kills ${tower.kills}`, textStyle(11, PALETTE.muted)).setOrigin(0, 0);
    items.push(this.killsText);
    const dps = towerDps(tower.spec);
    const perSec = Math.floor(dps);
    if (perSec >= 1) items.push(scene.add.text(left, H / 2 - 79, `≈ ${perSec}/s`, textStyle(11, PALETTE.muted)).setOrigin(0, 0));
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
        const cost = slotPrice(i, game.run.slotDiscount)!;
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

/** Damage, range, speed, and the number of shots when more than one. */
function statsLine(tower: Tower): string {
  const s = tower.spec;
  if (!s.attacks) return 'Put an augment in a slot to give it an attack.';
  if (s.kind === 'beam') return `Range ${s.range.toFixed(1)} · ${s.beamDps.toFixed(0)}/s`; // no shots: no damage, no rate
  const damage = s.damage > 0 ? `Damage ${s.damage.toFixed(0)} · ` : '';
  return `${damage}Range ${s.range.toFixed(1)} · ${s.rate.toFixed(1)}/s${s.shots > 1 ? ` · ${s.shots} shots` : ''}`;
}
