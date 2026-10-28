import Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { towerColor, towerSpec, type TowerSpec } from '../core/augments';
import type { AugmentCopy } from '../content/types';
import type { Cell } from '../core/map';
import { barrelTexture } from '../art/barrels';
import { ART_SCALE, artScale, TOWER_BASE, TOWER_BODY, towerTexture } from '../art/textures';
import { barrelCount, barrelLook, drawDecorations, pipColor } from './towerLook';

/** Where the body sits above the plinth's center, in board units. */
const BODY_LIFT = 4;

/**
 * A built tower on one cell. Towers have no type: they are what their augments make them
 * (`spec`, from core/augments.ts), and they look it (the rules are in entities/towerLook.ts):
 * - the body (this image) has the first augment's shape and color (grey while empty);
 * - one barrel per shot (Bolt), longer for more range (Reach), thinner for fast light shots
 *   (Rapid first), a yellow band per speed-up (Rapid added), a bulb at the tip when shots burst
 *   (Splash); the barrels turn to aim together;
 * - a frost ring around the body when its hits slow (Frost);
 * - one pip per slot on the plinth (filled: an augment in it, ring: unlocked and empty).
 * Only the barrels turn: the plinth and body have their shading painted in.
 */
export class Tower extends Phaser.GameObjects.Image {
  readonly cell: Cell;
  readonly base: Phaser.GameObjects.Image;
  /** The barrels, side by side; the container turns to aim. */
  readonly gun: Phaser.GameObjects.Container;
  private readonly deco: Phaser.GameObjects.Graphics;
  private readonly pips: Phaser.GameObjects.Graphics;
  private poppingSlot = -1; // slot mid pop-in; drawPips skips it until its tween lands
  private pipPop: Phaser.GameObjects.Graphics | undefined;
  /** Augment copies (id + tier) in its slots, in the order they were put in. */
  readonly augments: AugmentCopy[] = [];
  /** Unlocked slots (augments.length of them are filled). */
  slots = 1;
  spec: TowerSpec = towerSpec([]);
  /** Seconds until it may attack again. */
  cooldown = 0;
  /** Where the barrels point, in radians (0 = up, clockwise). */
  aim = 0;
  /** Length of the barrels in board units, and their side offsets (for the muzzles). */
  private barrelLength = 0;
  private barrelOffsets: number[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, cell: Cell) {
    super(scene, x, y - BODY_LIFT, towerTexture(undefined));
    this.cell = cell;
    this.base = artScale(scene.add.image(x, y, TOWER_BASE)).setDepth(DEPTH.towers);
    this.deco = scene.add.graphics().setDepth(DEPTH.towers + 1).setPosition(x, y - BODY_LIFT);
    this.gun = scene.add.container(x, y - BODY_LIFT).setDepth(DEPTH.towers + 1);
    this.pips = scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(x, y);
    this.setDepth(DEPTH.towers + 2);
    artScale(this);
    scene.add.existing(this);
    // Drop in: every part grows from small with a little bounce.
    for (const part of [this.base, this, this.gun] as Phaser.GameObjects.Components.Transform[]) {
      const full = part.scaleX;
      part.setScale(full * 0.4);
      scene.tweens.add({ targets: part, scale: full, duration: 260, ease: 'Back.easeOut' });
    }
    this.refresh();
  }

  get freeSlots(): number {
    return this.slots - this.augments.length;
  }

  /** Puts an augment copy into a free slot. Returns false when every slot is full. */
  addAugment(copy: AugmentCopy): boolean {
    if (this.freeSlots <= 0) return false;
    this.augments.push(copy);
    const slot = this.augments.length - 1;
    this.poppingSlot = slot; // set before refresh(), so drawPips leaves room for the pop-in
    this.refresh();
    this.popPip(slot);
    return true;
  }

  unlockSlot(): void {
    this.slots += 1;
    this.refresh();
  }

  /** Recomputes the spec and rebuilds the look after a change (entities/towerLook.ts). */
  private refresh(): void {
    const spec = towerSpec(this.augments);
    this.spec = spec;
    this.setTexture(towerTexture(spec.firstId));
    this.buildGun(spec, towerColor(this.augments));
    drawDecorations(this.deco, spec);
    this.drawPips();
  }

  /** The barrels side by side, looking the way the spec says. */
  private buildGun(spec: TowerSpec, color: ReturnType<typeof towerColor>): void {
    this.gun.removeAll(true);
    this.barrelOffsets = [];
    const count = barrelCount(spec);
    if (count === 0) {
      this.barrelLength = 0;
      return;
    }
    const look = barrelLook(spec);
    const key = barrelTexture(this.scene, color, look);
    const r = TOWER_BODY * CELL;
    this.barrelLength = r * 1.6 * look.length;
    const spacing = r * 0.6 * look.width * 1.25;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing;
      this.barrelOffsets.push(offset);
      this.gun.add(artScale(this.scene.add.image(offset, 0, key)));
    }
    this.gun.setRotation(this.aim);
  }

  private pipX(i: number): number {
    const gap = 10;
    return -((this.slots - 1) * gap) / 2 + i * gap;
  }

  private drawPips(): void {
    const g = this.pips;
    g.clear();
    for (let i = 0; i < this.slots; i++) {
      if (i === this.poppingSlot) continue; // its temp pip sits on top until the tween lands
      const x = this.pipX(i);
      const copy = this.augments[i];
      if (copy) g.fillStyle(pipColor(copy.tier), 1).fillCircle(x, 22, 4);
      else { g.lineStyle(1.5, PALETTE.faint, 1); g.strokeCircle(x, 22, 4); }
    }
  }

  /** Turns the barrels toward a board point. */
  aimAt(x: number, y: number): void {
    this.aim = Math.atan2(y - this.y, x - this.x) + Math.PI / 2;
    this.gun.setRotation(this.aim);
  }

  /** Where shot number `i` leaves: the tip of its barrel (they take turns past the last one). */
  muzzle(i = 0): { x: number; y: number } {
    const offset = this.barrelOffsets.length ? this.barrelOffsets[i % this.barrelOffsets.length]! : 0;
    const along = this.aim - Math.PI / 2;
    const side = this.aim;
    return {
      x: this.x + Math.cos(along) * this.barrelLength + Math.cos(side) * offset,
      y: this.y + Math.sin(along) * this.barrelLength + Math.sin(side) * offset,
    };
  }

  /** A quick squash when it attacks (body and barrels, not the plinth); snappier when it attacks fast. */
  kick(): void {
    const ms = Phaser.Math.Clamp(700 / Math.max(0.1, this.spec.rate), 60, 160);
    this.scene.tweens.killTweensOf([this, this.gun]);
    this.setScale(ART_SCALE * 1.12);
    this.gun.setScale(1.12);
    this.scene.tweens.add({ targets: this, scale: ART_SCALE, duration: ms, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.gun, scale: 1, duration: ms, ease: 'Quad.easeOut' });
  }

  /** The new pip grows in on the plinth with the same bounce as the tower's drop-in. */
  private popPip(slot: number): void {
    if (this.pipPop) { this.scene.tweens.killTweensOf(this.pipPop); this.pipPop.destroy(); }
    const g = this.scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(this.pips.x + this.pipX(slot), this.pips.y + 22);
    g.fillStyle(pipColor(this.augments[slot]!.tier), 1);
    g.fillCircle(0, 0, 4);
    g.setScale(0.4);
    this.pipPop = g;
    this.scene.tweens.add({ targets: g, scale: 1, duration: 260, ease: 'Back.easeOut', onComplete: () => {
      if (this.pipPop !== g) return; // superseded by a newer addAugment, or the tower is gone
      g.destroy();
      this.pipPop = undefined;
      this.poppingSlot = -1;
      this.drawPips();
    } });
  }

  destroy(fromScene?: boolean): void {
    if (this.pipPop) { this.scene.tweens.killTweensOf(this.pipPop); this.pipPop.destroy(); this.pipPop = undefined; }
    this.base.destroy();
    this.gun.destroy();
    this.deco.destroy();
    this.pips.destroy();
    super.destroy(fromScene);
  }
}
