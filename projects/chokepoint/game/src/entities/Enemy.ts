import Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import type { EnemyDef } from '../content/types';
import type { PathLine } from '../core/path';
import { ART_SCALE, enemyTexture } from '../art/textures';
import { ignite } from '../core/burn';
import type { LiveBurn } from '../core/burn';
import type { Tower } from './Tower';

/** Seconds an enemy takes to pop up to full size when it spawns. */
const POP_SEC = 0.18;

/** Cells per second a gust (Push) slides an enemy back: 0.8 cells in ~180 ms. */
const PUSH_RATE = 4.5;

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
  /** Board units a gust (Push) still has to slide it back along the road. */
  pushLeft = 0;
  /** Fraction of extra damage it takes from everything until it dies (Mark); 0: unmarked. */
  markPct = 0;
  /** Seconds since it was marked (the chevron's pop-in); 0 until marked. */
  markAge = 0;
  /** The burn on it (Ember): its rate and the seconds left; left 0: not ablaze. */
  burn: LiveBurn = { dps: 0, left: 0 };
  /** The tower that lit the burn: when the tick kills, its mints pay like a normal kill. */
  burnSource: Tower | undefined;
  /** Which leg of its dash cycle (Dasher) it is in: the slow crawl, the stop-and-flash, the surge. */
  dashLeg: 'crawl' | 'pause' | 'dash' = 'crawl';
  dashLeft = 0; // seconds left of the current leg
  pauseAge = 0; // seconds into 'pause' (its telegraph is the first half)

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
    this.pushLeft = 0;
    this.markPct = 0;
    this.markAge = 0;
    this.burn.dps = 0;
    this.burn.left = 0;
    this.burnSource = undefined;
    this.dashLeg = 'crawl';
    this.dashLeft = this.def.dashCycle?.crawlSec ?? 0;
    this.pauseAge = 0;
    this.setTexture(enemyTexture(def.id));
    this.clearTint();
    this.setScale(0);
    const p = path.pointAt(0);
    this.setPosition(p.x, p.y);
    this.setActive(true).setVisible(true);
  }

  /** Walks for `dt` seconds. Returns true when it reached the end of the path (a leak). */
  advance(dt: number, path: PathLine): boolean {
    const cycle = this.def.dashCycle;
    const wasWhite = this.flash > 0 || (cycle !== undefined && this.dashLeg === 'pause' && this.pauseAge < cycle.pauseSec / 2);
    if (this.slowLeft > 0) {
      this.slowLeft -= dt;
      if (this.slowLeft <= 0) this.slowPct = 0;
    }
    // The slow keeps counting down while rooted, so it still holds when the root wears off.
    if (this.rootLeft > 0) {
      this.rootLeft -= dt;
      if (this.rootLeft <= 0) this.rootLeft = 0;
    }
    // The gust slides it back along the road: a position change, never a speed change, clamped
    // at the start (no enemy slides before it) and at PUSH_RATE (the slide, not a teleport).
    if (this.pushLeft > 0) {
      const pushed = Math.min(this.pushLeft, PUSH_RATE * CELL * dt);
      this.distance = Math.max(0, this.distance - pushed);
      this.pushLeft -= pushed;
    }
    const speed = this.rootLeft > 0 ? 0 : this.speed * (1 - this.slowPct);
    switch (this.def.behavior) {
      case 'walk':
        this.distance += speed * dt;
        break;
      case 'dash': {
        // Crawl, stop and flash white for the first half of the stop, then surge. Slow only affects the crawl.
        const c = this.def.dashCycle!;
        // Rooted it does not move at all, and its cycle holds with it (a rooted pause still telegraphs).
        if (this.rootLeft <= 0) {
          if (this.dashLeg === 'crawl') {
            this.distance += speed * dt;
            this.dashLeft -= dt;
            if (this.dashLeft <= 0) {
              this.dashLeg = 'pause';
              this.dashLeft = c.pauseSec;
              this.pauseAge = 0;
            }
          } else if (this.dashLeg === 'pause') {
            this.dashLeft -= dt;
            this.pauseAge += dt;
            if (this.dashLeft <= 0) {
              this.dashLeg = 'dash';
              this.dashLeft = c.dashSec;
            }
          } else {
            this.distance += (c.dashCells / c.dashSec) * CELL * dt;
            this.dashLeft -= dt;
            if (this.dashLeft <= 0) {
              this.dashLeg = 'crawl';
              this.dashLeft = c.crawlSec;
            }
          }
        }
        break;
      }
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
    const tele = cycle !== undefined && this.dashLeg === 'pause' && this.pauseAge < cycle.pauseSec / 2;
    if (this.flash > 0) this.flash -= dt;
    const white = tele || this.flash > 0;
    if (white !== wasWhite) {
      if (white) this.setTintFill(0xffffff);
      else this.clearTint();
    }
    return this.distance >= path.length;
  }

  /** Takes damage (a marked enemy takes `markPct` more, from everything); `flash` false for a
   * burn tick, so it doesn't blink white on every tick. Returns true when this killed it. */
  hit(damage: number, flash = true): boolean {
    if (!this.active) return false;
    this.hp -= damage * (1 + this.markPct);
    if (flash) {
      this.flash = 0.06;
      this.setTintFill(0xffffff);
    }
    const ramp = this.def.speedRamp;
    if (ramp && this.speed < ramp.max * CELL) this.speed = Math.min(this.speed + ramp.perHit * CELL, ramp.max * CELL);
    return this.hp <= 0;
  }

  /** Sets ablaze, or re-ignites: the duration refreshes and the rate keeps the higher of the two.
   * True when it was not ablaze before (that is the moment that whooshes). */
  ignite(dps: number, sec: number): boolean {
    return ignite(this.burn, dps, sec);
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

  /** Queues a slide back along the road by `units` board units (Push); advance() consumes it. */
  pushBack(units: number): void {
    if (!this.active || units <= 0) return;
    this.pushLeft += units;
  }

  despawn(): void {
    this.clearTint();
    this.setActive(false).setVisible(false);
  }
}
