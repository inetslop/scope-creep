import type Phaser from 'phaser';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';
import type { PuddleDef } from '../content/types';

/** Pool of puddle decals; the global cap on simultaneous puddles. */
const POOL = 12;

/** One pooled puddle decal. `owner` is the serial of the Wash that dropped it (never the Enemy: pooled enemies are reused). */
interface Puddle {
  img: Phaser.GameObjects.Image;
  active: boolean;
  x: number;
  y: number;
  age: number;
  owner: number;
  radius: number;
  lifeSec: number;
  fadeSec: number;
  slowMul: number;
}

/**
 * The Wash's wet patches: flat pale blue decals printed under the entities (like the
 * platemarks) that live for a moment and fade out. They slow the player only — enemies,
 * enemy shots and shards ignore them — via playerSpeedMul(), which GameScene multiplies
 * into the move speed. No physics body, no damage, not targetable.
 */
export class PuddleSystem {
  private readonly puddles: Puddle[] = [];

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < POOL; i++) {
      this.puddles.push({
        img: scene.add.image(0, 0, TEX.puddle).setOrigin(0.5).setDepth(DEPTH.floor + 1).setAlpha(0).setVisible(false),
        active: false,
        x: 0,
        y: 0,
        age: 0,
        owner: -1,
        radius: 0,
        lifeSec: 0,
        fadeSec: 0,
        slowMul: 1,
      });
    }
  }

  /** Pool size: the most puddles that can ever be on screen at once. */
  get maxPuddles(): number {
    return this.puddles.length;
  }

  /** Puddles currently on screen (the puddle-pool invariant reads this). */
  get activeCount(): number {
    let n = 0;
    for (const p of this.puddles) if (p.active) n += 1;
    return n;
  }

  /** Drips a new puddle at (x, y), owned by `ownerSerial`. Keeps the per-owner cap. */
  drop(x: number, y: number, ownerSerial: number, def: PuddleDef): void {
    let ownerCount = 0;
    let oldestOfOwner = -1;
    let oldestOfOwnerAge = -1;
    for (let i = 0; i < this.puddles.length; i++) {
      const p = this.puddles[i]!;
      if (!p.active || p.owner !== ownerSerial) continue;
      ownerCount += 1;
      if (p.age > oldestOfOwnerAge) {
        oldestOfOwnerAge = p.age;
        oldestOfOwner = i;
      }
    }
    // Per-owner cap: when this would be a fourth, the owner's oldest puddle goes first.
    if (ownerCount >= def.maxAlive) this.despawn(oldestOfOwner);
    const slot = this.findSlot();
    const p = this.puddles[slot]!;
    p.active = true;
    p.x = x;
    p.y = y;
    p.age = 0;
    p.owner = ownerSerial;
    p.radius = def.radius;
    p.lifeSec = def.lifeSec;
    p.fadeSec = def.fadeSec;
    p.slowMul = def.slowMul;
    p.img.setPosition(x, y).setAlpha(1).setVisible(true);
  }

  /** Player move-speed multiplier at (x, y): the strongest slow among puddles containing it, else 1. */
  playerSpeedMul(x: number, y: number): number {
    let mul = 1;
    for (const p of this.puddles) {
      if (!p.active) continue;
      const dx = x - p.x;
      const dy = y - p.y;
      if (dx * dx + dy * dy <= p.radius * p.radius) mul = Math.min(mul, p.slowMul);
    }
    return mul;
  }

  update(dt: number): void {
    for (let i = 0; i < this.puddles.length; i++) {
      const p = this.puddles[i]!;
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.lifeSec) this.despawn(i);
      else p.img.setAlpha(p.age > p.lifeSec - p.fadeSec ? (p.lifeSec - p.age) / p.fadeSec : 1);
    }
  }

  /** A free slot, or the globally oldest puddle if every slot is wet. */
  private findSlot(): number {
    let oldest = 0;
    let oldestAge = -1;
    for (let i = 0; i < this.puddles.length; i++) {
      const p = this.puddles[i]!;
      if (!p.active) return i;
      if (p.age > oldestAge) {
        oldestAge = p.age;
        oldest = i;
      }
    }
    return oldest;
  }

  private despawn(i: number): void {
    const p = this.puddles[i]!;
    p.active = false;
    p.img.setAlpha(0).setVisible(false);
  }
}
