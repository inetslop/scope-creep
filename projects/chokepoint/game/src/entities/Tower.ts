import Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { towerColor, towerSpec, type TowerSpec } from '../core/augments';
import type { TargetMode } from '../core/targeting';
import type { AugmentCopy } from '../content/types';
import type { Cell } from '../core/map';
import { BEAM_ORB_LIFT, barrelTexture, beamDiscTexture, orbTexture } from '../art/barrels';
import { ART_SCALE, artScale, TOWER_BASE, TOWER_BODY, barrelMarkTexture, towerTexture } from '../art/textures';
import { MARKED_DMG_MUL } from '../core/markedCell';
import type { Board } from '../systems/Board';
import { barrelCount, barrelLook, drawDecorations, drawFeastPlate, drawHasteRing, pipColor } from './towerLook';

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
  /** The cell it stands on; systems/Building.ts' move slides it to a new one. */
  cell: Cell;
  readonly base: Phaser.GameObjects.Image;
  /** The barrels, side by side; the container turns to aim. */
  readonly gun: Phaser.GameObjects.Container;
  private readonly deco: Phaser.GameObjects.Graphics;
  private readonly pips: Phaser.GameObjects.Graphics;
  private readonly jamDot: Phaser.GameObjects.Graphics;
  private readonly idleDot: Phaser.GameObjects.Graphics;
  private readonly modeTick: Phaser.GameObjects.Graphics; // the plinth's muted tick while not First (T0368)
  private poppingSlot = -1; // slot mid pop-in; drawPips skips it until its tween lands
  private pipPop: Phaser.GameObjects.Graphics | undefined;
  /** Augment copies (id + tier) in its slots, in the order they were put in. */
  readonly augments: AugmentCopy[] = [];
  /** Unlocked slots (augments.length of them are filled). */
  slots = 1;
  spec: TowerSpec = towerSpec([]);
  /** Seconds until it may attack again. */
  cooldown = 0;
  /** Seconds since its last attack (systems/towerIdle.ts resets it); its quiet dot shows at 4. */
  idleSec = 0;
  /** Attack speed from Rally (set by systems/RallySystem.ts; 1 when not buffed). */
  rallyRateMul = 1;
  /** Attack-speed fraction the haste auras add on top of rallyRateMul, additive (set by systems/HasteSystem.ts). */
  hasteRatePct = 0;
  /** 1.25 when the tower stands on the board's marked cell (it deals +25%); systems/Board.ts onMarked(). */
  cellMul = 1;
  /** Held by a Mute: no attacks; systems/enemyHooks/muteJam.ts. */
  jammed = false;
  /** A beam line held on an enemy this frame (systems/BeamSystem.ts); its quiet dot stays off. */
  beamHolding = false;
  /** Its quiet dot shown: the dot bookkeeping runs every frame (systems/towerIdle.ts). */
  idleOn = false;
  /** Enemies this tower killed with its own damage this run (the panel's "kills N" line). */
  kills = 0;
  /** Damage this tower dealt with its own damage this run, as it landed (the summary's "dmg N" line). */
  damageDealt = 0;
  /** How it picks its main target when several are in range (the tower panel's mode chip). */
  targetMode: TargetMode = 'first';
  /** Where the barrels point, in radians (0 = up, clockwise). */
  aim = 0;
  /** Length of the barrels in board units, and their side offsets (for the muzzles). */
  private barrelLength = 0;
  private barrelOffsets: number[] = [];
  /** The orb's white centre disc, on a beam tower: it pulses while the beam is on. */
  private disc: Phaser.GameObjects.Image | undefined;
  private beamOn = false;
  /** The first augment's mark on its barrel face (the Patterns toggle): hidden unless the toggle is on. */
  private barrelMark?: Phaser.GameObjects.Image;
  /** The flat red base ring while a haste aura radiates; its own graphics so it can take an alpha (undefined until it has Haste). */
  hasteRing: Phaser.GameObjects.Graphics | undefined;
  /** The yellow open plate at the base of a Feast-first tower (entities/towerLook.ts): lit while the kill chain lives, dim while it is broken (systems/FeastGlow.ts). Undefined without a Feast first. */
  private feastPlate: Phaser.GameObjects.Graphics | undefined;
  /** The last lit state applied to the plate; a fresh plate draws at full alpha, so it starts lit. */
  private feastPlateLit = true;

  constructor(scene: Phaser.Scene, x: number, y: number, cell: Cell) {
    super(scene, x, y - BODY_LIFT, towerTexture(undefined));
    this.cell = cell;
    this.base = artScale(scene.add.image(x, y, TOWER_BASE)).setDepth(DEPTH.towers);
    this.deco = scene.add.graphics().setDepth(DEPTH.towers + 1).setPosition(x, y - BODY_LIFT);
    this.gun = scene.add.container(x, y - BODY_LIFT).setDepth(DEPTH.towers + 1);
    this.pips = scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(x, y);
    this.jamDot = scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(x, y);
    this.jamDot.fillStyle(PALETTE.muted, 1);
    this.jamDot.fillCircle(0, -32, 3); // above the body, same float as the rally chevron
    this.jamDot.setVisible(false);
    this.idleDot = scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(x, y);
    this.idleDot.fillStyle(PALETTE.muted, 1);
    this.idleDot.fillCircle(0, -32, 3);
    this.idleDot.setVisible(false);
    this.modeTick = scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(x, y);
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

  /** The board point of slot `index`'s pip on the plinth. */
  slotPoint(index: number): { x: number; y: number } {
    return { x: this.pips.x + this.pipX(index), y: this.pips.y + 22 };
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
    this.refreshHasteRing(spec);
    this.refreshFeastPlate(spec);
    this.drawPips();
    this.setModeTick();
  }

  /**
   * The yellow open plate, one tick per Feast copy: only a Feast FIRST tower wears it (a Feast
   * added elsewhere shows nothing — the buff is board-wide). Redrawn on every refresh so a copy
   * added later grows its tick.
   */
  private refreshFeastPlate(spec: TowerSpec): void {
    if (spec.firstId === 'feast') {
      if (this.feastPlate === undefined) this.feastPlate = this.scene.add.graphics().setDepth(DEPTH.towers + 1).setPosition(this.x, this.y);
      drawFeastPlate(this.feastPlate, spec);
    } else if (this.feastPlate !== undefined) {
      this.feastPlate.destroy();
      this.feastPlate = undefined;
      this.feastPlateLit = true; // a future plate starts at its full alpha, like a fresh one
    }
  }

  /** Lit (full opacity) while the run's kill chain lives, dim (half) while it is broken; no-op with no plate or on no change. */
  setFeastPlateLit(lit: boolean): void {
    if (this.feastPlate === undefined || this.feastPlateLit === lit) return;
    this.feastPlateLit = lit;
    this.feastPlate.setAlpha(lit ? 1 : 0.5);
  }

  /** The flat red base ring, one tick per Haste copy; created once at the plinth's center. */
  private refreshHasteRing(spec: TowerSpec): void {
    if (this.hasteRing === undefined) {
      this.hasteRing = this.scene.add.graphics().setDepth(DEPTH.towers).setPosition(this.base.x, this.base.y);
      this.hasteRing.setAlpha(0.4);
    }
    drawHasteRing(this.hasteRing, spec);
  }

  /** The barrels side by side, looking the way the spec says. */
  private buildGun(spec: TowerSpec, color: ReturnType<typeof towerColor>): void {
    this.gun.removeAll(true);
    if (this.disc) { this.scene.tweens.killTweensOf(this.disc); this.disc = undefined; }
    this.beamOn = false;
    this.barrelMark = undefined;
    this.barrelOffsets = [];
    const count = barrelCount(spec);
    if (count === 0) {
      this.barrelLength = 0;
      return;
    }
    if (spec.kind === 'beam') { // never fires: a post with an orb on top, the line leaves the orb's centre
      this.gun.add(artScale(this.scene.add.image(0, 0, orbTexture(this.scene, color, spec.beamAdds))));
      this.disc = artScale(this.scene.add.image(0, -BEAM_ORB_LIFT, beamDiscTexture(this.scene)));
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
    if (spec.firstId) {
      this.barrelMark = artScale(this.scene.add.image(0, -this.barrelLength / 2, barrelMarkTexture(spec.firstId))).setVisible(false);
      this.gun.add(this.barrelMark);
    }
    this.gun.setRotation(this.aim);
  }

  private pipX(i: number): number {
    const gap = 10;
    return -((this.slots - 1) * gap) / 2 + i * gap;
  }

  /** The plinth's muted tick: off First (T0368), drawn from `targetMode` each frame. */
  setModeTick(): void {
    const g = this.modeTick;
    g.clear();
    if (this.targetMode === 'first') return;
    g.fillStyle(PALETTE.muted, 1);
    g.fillRoundedRect(-3.5, -21.7, 7, 2.4, 1.2); // plinth's top edge, centred: clears the pip row (y + 22) and the Frost ring (r 20.4 ± 1.5 at y - 4)
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
    if (this.disc) return { x: this.x, y: this.y - BEAM_ORB_LIFT };
    const offset = this.barrelOffsets.length ? this.barrelOffsets[i % this.barrelOffsets.length]! : 0;
    const along = this.aim - Math.PI / 2;
    const side = this.aim;
    return {
      x: this.x + Math.cos(along) * this.barrelLength + Math.cos(side) * offset,
      y: this.y + Math.sin(along) * this.barrelLength + Math.sin(side) * offset,
    };
  }

  /** Shot n's sideways aim: perpendicular to the aim, the same offset as its muzzle. */
  aimOffset(n: number): { x: number; y: number } {
    const offset = this.barrelOffsets.length ? this.barrelOffsets[n % this.barrelOffsets.length]! : 0;
    return { x: Math.cos(this.aim) * offset, y: Math.sin(this.aim) * offset };
  }

  /** The orb's centre disc pulses while a beam is on, and stays still when it is off. */
  setBeamOn(on: boolean): void {
    if (!this.disc || this.beamOn === on) return;
    this.beamOn = on;
    if (on) this.scene.tweens.add({ targets: this.disc, scale: ART_SCALE * 1.15, duration: 400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    else { this.scene.tweens.killTweensOf(this.disc); this.disc.setScale(ART_SCALE); }
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

  /** Sold: the whole token rises and fades out in the drop-in's bounce tempo, then it is gone. */
  sellAway(): void {
    const parts: Phaser.GameObjects.GameObject[] = [this, this.base, this.gun, this.deco, this.pips, this.jamDot, this.idleDot, this.modeTick];
    if (this.hasteRing) parts.push(this.hasteRing);
    if (this.feastPlate) parts.push(this.feastPlate);
    this.scene.tweens.add({ targets: parts, y: '-=12', alpha: 0, duration: 200, ease: 'Back.easeOut', onComplete: () => this.destroy() });
  }

  /**
   * The move (systems/Building.ts): the token slides to `cell` over ~300 ms (ease-out) and lands in
   * the drop-in bounce. The cell and the marked cell's buff follow it — the augments, kills, damage
   * tally and targeting mode are untouched (no rebuild, no re-draw).
   */
  moveTo(cell: Cell, board: Board): void {
    const parts: Phaser.GameObjects.GameObject[] = [this, this.base, this.gun, this.deco, this.pips, this.jamDot, this.idleDot, this.modeTick];
    if (this.hasteRing) parts.push(this.hasteRing);
    if (this.feastPlate) parts.push(this.feastPlate);
    this.scene.tweens.killTweensOf(parts); // a move started before the last one landed: one slide at a time
    // A drop-in or landing bounce still mid-flight when the kill lands leaves a part short of its full scale: snap it back.
    this.setScale(ART_SCALE);
    this.base.setScale(ART_SCALE);
    this.gun.setScale(1);
    const from = board.centerOf(this.cell);
    const to = board.centerOf(cell);
    this.cell = cell;
    this.cellMul = board.onMarked(cell) ? MARKED_DMG_MUL : 1; // the marked cell's buff follows the tower (core/markedCell.ts)
    this.scene.tweens.add({
      targets: parts,
      x: `+=${to.x - from.x}`,
      y: `+=${to.y - from.y}`,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // The drop-in bounce, re-triggered at the new cell (the constructor's own tempo).
        for (const part of [this.base, this, this.gun] as Phaser.GameObjects.Components.Transform[]) {
          const full = part.scaleX;
          part.setScale(full * 0.4);
          this.scene.tweens.add({ targets: part, scale: full, duration: 260, ease: 'Back.easeOut' });
        }
      },
    });
  }

  /** Dimmed to ~50% while it waits to be moved (systems/Building.ts); restored on commit or cancel. */
  setDim(on: boolean): void {
    const a = on ? 0.5 : 1;
    for (const p of [this, this.base, this.gun, this.deco, this.pips] as Phaser.GameObjects.Components.Alpha[]) p.setAlpha(a);
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

  /** A Mute holds this tower still: dimmed, one gray dot over the barrels. The pips are untouched. */
  setJammed(on: boolean): void {
    if (this.jammed === on) return;
    this.jammed = on;
    this.setAlpha(on ? 0.5 : 1);
    this.gun.setAlpha(on ? 0.5 : 1);
    this.base.setAlpha(on ? 0.5 : 1);
    this.jamDot.setVisible(on);
  }

  /**
   * The quiet dot: it fades in over its idle seconds (systems/towerIdle.ts) and clears the
   * moment the tower next has an attack event. It rides the token, like the Mute's jam dot.
   */
  setIdleDot(on: boolean): void {
    if (this.idleOn === on) return;
    this.idleOn = on;
    this.scene.tweens.killTweensOf(this.idleDot);
    if (on) {
      this.idleDot.setAlpha(0).setVisible(true);
      this.scene.tweens.add({ targets: this.idleDot, alpha: 1, duration: 200 });
    } else {
      this.scene.tweens.add({ targets: this.idleDot, alpha: 0, duration: 150, onComplete: () => this.idleDot.setVisible(false) });
    }
  }

  /** The first augment's barrel mark: visible only while the Patterns toggle is on. */
  preUpdate(): void {
    this.barrelMark?.setVisible(this.scene.registry.get('patterns') === true);
  }

  destroy(fromScene?: boolean): void {
    if (this.pipPop) { this.scene.tweens.killTweensOf(this.pipPop); this.pipPop.destroy(); this.pipPop = undefined; }
    if (this.disc) { this.scene.tweens.killTweensOf(this.disc); this.disc = undefined; }
    this.base.destroy();
    this.gun.destroy();
    this.deco.destroy();
    this.pips.destroy();
    this.modeTick.destroy();
    this.jamDot.destroy();
    if (this.hasteRing) this.hasteRing.destroy();
    if (this.feastPlate) this.feastPlate.destroy();
    this.scene.tweens.killTweensOf(this.idleDot);
    this.idleDot.destroy();
    super.destroy(fromScene);
  }
}
