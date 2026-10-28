import Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import type { EnemyDef } from '../content/types';
import type { PathLine } from '../core/path';
import { ART_SCALE, enemyTexture } from '../art/textures';

/** Seconds an enemy takes to pop up to full size when it spawns. */
const POP_SEC = 0.18;

/**
 * A pooled enemy walking the path. It stores how far along the path it is (`distance`, board
 * units); its position follows from that. spawn() resets every field; despawn() returns it to
 * the pool (never destroy() a pooled object). Enemies don't rotate: their shading is painted in.
 */
export class Enemy extends Phaser.GameObjects.Image {
  def!: EnemyDef;
  hp = 0;
  maxHp = 0;
  /** Board units walked along the path. */
  distance = 0;
  /** Board units per second. */
  speed = 0;
  /** The way it is walking (unit vector along the path); speed lines trail behind it. */
  dirX = 0;
  dirY = -1;
  /** Bumped on every spawn, so a projectile can tell its target was recycled. */
  serial = 0;
  /** Seconds since it spawned. */
  age = 0;
  /** Seconds left of the white hit flash. */
  flash = 0;
  /** Fraction of its speed it is slowed by (Frost), and for how many seconds more. */
  slowPct = 0;
  slowLeft = 0;
  /** Seconds of a full stop left (Anchor): a rooted enemy does not move at all. */
  rootLeft = 0;
  /** Fraction of extra damage it takes from everything until it dies (Mark); 0: unmarked. */
  markPct = 0;
  /** Seconds since it was marked (the chevron's pop-in); 0 until marked. */
  markAge = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, '__DEFAULT');
    this.setDepth(DEPTH.enemies);
    this.setActive(false).setVisible(false);
  }

  spawn(def: EnemyDef, hpMul: number, path: PathLine): void {
    this.def = def;
    this.maxHp = Math.max(1, Math.round(def.hp * hpMul));
    this.hp = this.maxHp;
    this.distance = 0;
    this.speed = def.speed * CELL;
    this.dirX = 0;
    this.dirY = -1;
    this.serial += 1;
    this.age = 0;
    this.flash = 0;
    this.slowPct = 0;
    this.slowLeft = 0;
    this.rootLeft = 0;
    this.markPct = 0;
    this.markAge = 0;
    this.setTexture(enemyTexture(def.id));
    this.clearTint();
    this.setScale(0);
    const p = path.pointAt(0);
    this.setPosition(p.x, p.y);
    this.setActive(true).setVisible(true);
  }

  /** Walks for `dt` seconds. Returns true when it reached the end of the path (a leak). */
  advance(dt: number, path: PathLine): boolean {
    if (this.slowLeft > 0) {
      this.slowLeft -= dt;
      if (this.slowLeft <= 0) this.slowPct = 0;
    }
    // The slow keeps counting down while rooted, so it still holds when the root wears off.
    if (this.rootLeft > 0) {
      this.rootLeft -= dt;
      if (this.rootLeft <= 0) this.rootLeft = 0;
    }
    const speed = this.rootLeft > 0 ? 0 : this.speed * (1 - this.slowPct);
    switch (this.def.behavior) {
      case 'walk':
        this.distance += speed * dt;
        break;
    }
    this.age += dt;
    if (this.markPct > 0) this.markAge += dt;
    // Pop in with a little overshoot, then a gentle bob as it walks.
    const t = Math.min(1, this.age / POP_SEC);
    const pop = t < 1 ? 1.15 * Math.sin((t * Math.PI) / 2) : 1;
    this.setScale(ART_SCALE * pop);
    const p = path.pointAt(this.distance);
    const a = path.pointAt(this.distance + 4);
    const dl = Math.hypot(a.x - p.x, a.y - p.y);
    if (dl > 0) {
      this.dirX = (a.x - p.x) / dl;
      this.dirY = (a.y - p.y) / dl;
    }
    this.setPosition(p.x, p.y - Math.abs(Math.sin(this.distance / 9)) * 2);
    if (this.flash > 0) {
      this.flash -= dt;
      if (this.flash <= 0) this.clearTint();
    }
    return this.distance >= path.length;
  }

  /** Takes damage (a marked enemy takes `markPct` more, from everything). Returns true when this killed it. */
  hit(damage: number): boolean {
    if (!this.active) return false;
    this.hp -= damage * (1 + this.markPct);
    this.flash = 0.06;
    this.setTintFill(0xffffff);
    const ramp = this.def.speedRamp;
    if (ramp && this.speed < ramp.max * CELL) this.speed = Math.min(this.speed + ramp.perHit * CELL, ramp.max * CELL);
    return this.hp <= 0;
  }

  /** Slows it by `pct` for `sec` seconds; a weaker slow doesn't replace a stronger one. */
  slow(pct: number, sec: number): void {
    if (pct < this.slowPct) return;
    this.slowPct = pct;
    this.slowLeft = Math.max(this.slowLeft, sec);
  }

  /** Roots it: fully stopped for `sec` seconds. Overlapping roots do not stack; the longest holds. */
  root(sec: number): void {
    this.rootLeft = Math.max(this.rootLeft, sec);
  }

  /** Marks it: it takes `pct` extra damage from everything until it dies. The first mark wins. */
  mark(pct: number): boolean {
    if (this.markPct > 0) return false;
    this.markPct = pct;
    this.markAge = 0;
    return true;
  }

  despawn(): void {
    this.clearTint();
    this.setActive(false).setVisible(false);
  }
}
