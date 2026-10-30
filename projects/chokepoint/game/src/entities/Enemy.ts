import Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import type { EnemyDef } from '../content/types';
import type { PathLine } from '../core/path';
import { ART_SCALE, DISC_TEXTURE, PLATE_TEXTURE, enemyTexture } from '../art/textures';
import { ignite } from '../core/burn';
import { outOfReachLeg } from '../core/outOfReach';
import { applyRoot, tickRoot } from '../core/root';
import { controlScale, noteControl, tickControl } from '../core/control';
import { shieldMul } from '../core/shield';
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
  /** The wave's hp multiplier it took; its split children take the same. */
  hpMul = 1;
  /** The level's spawn-speed factor it took (Swift); its split children take the same. */
  speedMul = 1;
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
  /** Fraction the haste aura adds to its speed while it is inside (Haste); set by systems/HasteSystem.ts. */
  hastePct = 0;
  /** Seconds of a full stop left (Anchor): a rooted enemy does not move at all. */
  rootLeft = 0;
  /** Pushes and roots taken in the current streak (core/control.ts); each halves the next one. */
  controlCount = 0;
  /** Seconds since the last push or root; at `CONTROL_WINDOW_SEC` the streak recovers (core/control.ts). */
  controlQuietSec = 0;
  /** Board units a gust (Push) still has to slide it back along the road. */
  pushLeft = 0;
  /** Fraction of extra damage it takes from everything until it dies (Mark); 0: unmarked. */
  markPct = 0;
  /** Seconds since it was marked (the chevron's pop-in); 0 until marked. */
  markAge = 0;
  /** Its shield is up: every hit lands at half until its carrier dies (core/shield.ts, systems/enemyHooks/titanShield.ts). */
  shielded = false;
  /** Seconds since its out-of-reach beat started (the Colossus); -1 before its hp first dropped to half (core/outOfReach.ts). */
  reachClock = -1;
  /** The burn on it (Ember): the burning tower's rate and damage multiplier, and the seconds left; left 0: not ablaze. */
  burn: LiveBurn = { dps: 0, mul: 1, acc: 0, left: 0 };
  /** The tower that lit the burn: when the tick kills, its mints pay like a normal kill. */
  burnSource: Tower | undefined;
  /** Which leg of its dash cycle (Dasher) it is in: the slow crawl, the stop-and-flash, the surge. */
  dashLeg: 'crawl' | 'pause' | 'dash' = 'crawl';
  dashLeft = 0; // seconds left of the current leg
  pauseAge = 0; // seconds into 'pause' (its telegraph is the first half)
  /** The front plate (the Bulwark): a flat image that turns to face its travel; undefined without one. */
  private plate?: Phaser.GameObjects.Image;
  /** The shield disc (the Guard): a flat image that turns to face its travel; undefined without one. */
  private disc?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, '__DEFAULT');
    this.setDepth(DEPTH.enemies);
    this.setActive(false).setVisible(false);
  }

  spawn(def: EnemyDef, hpMul: number, path: PathLine, speedMul = 1, distance = 0): void {
    this.def = def;
    this.maxHp = Math.max(1, Math.round(def.hp * hpMul));
    this.hp = this.maxHp;
    this.hpMul = hpMul;
    this.speedMul = speedMul;
    this.distance = distance;
    this.speed = def.speed * CELL * speedMul;
    this.dirX = 0;
    this.dirY = -1;
    this.serial += 1;
    this.age = 0;
    this.flash = 0;
    this.slowPct = 0;
    this.slowLeft = 0;
    this.hastePct = 0;
    this.rootLeft = 0;
    this.controlCount = 0;
    this.controlQuietSec = 0;
    this.pushLeft = 0;
    this.markPct = 0;
    this.markAge = 0;
    this.shielded = false;
    this.burn.dps = 0;
    this.burn.mul = 1;
    this.burn.acc = 0;
    this.burn.left = 0;
    this.burnSource = undefined;
    this.dashLeg = 'crawl';
    this.dashLeft = this.def.dashCycle?.crawlSec ?? 0;
    this.pauseAge = 0;
    this.reachClock = -1;
    this.setTexture(enemyTexture(def.id));
    this.clearTint();
    this.setAlpha(1); // a recycled Colossus must not come up half-ghost
    this.setScale(0);
    const p = path.pointAt(distance);
    this.setPosition(p.x, p.y);
    this.setActive(true).setVisible(true);
    // Its plate (the Bulwark) rides on top: flat, so it may turn with the travel.
    if (this.def.plate !== undefined && this.plate === undefined) {
      this.plate = this.scene.add.image(0, 0, PLATE_TEXTURE);
      this.plate.setDepth(DEPTH.enemies);
    }
    this.plate?.setVisible(false); // hidden until advance() places it (no flash at the origin)
    // Its shield disc (the Guard) rides on top: flat, so it may turn with the travel.
    if (this.def.id === 'guard' && this.disc === undefined) {
      this.disc = this.scene.add.image(0, 0, DISC_TEXTURE);
      this.disc.setDepth(DEPTH.enemies);
    }
    this.disc?.setVisible(false); // hidden until advance() places it (no flash at the origin)
  }

  /** Walks for `dt` seconds. Returns true when it reached the end of the path (a leak). */
  advance(dt: number, path: PathLine): boolean {
    const cycle = this.def.dashCycle;
    const reach = this.def.outOfReach;
    const wasWhite =
      this.flash > 0 ||
      (cycle !== undefined && this.dashLeg === 'pause' && this.pauseAge < cycle.pauseSec / 2) ||
      (reach !== undefined && outOfReachLeg(reach, this.reachClock) === 'flash');
    // The out-of-reach beat: its clock starts the frame its hp first drops to the fraction, then
    // just runs — the leg (flash, phase, quiet) falls out of it (core/outOfReach.ts).
    if (this.reachClock < 0 && reach !== undefined && this.hp <= this.maxHp * reach.hpFrac) this.reachClock = 0;
    if (this.reachClock >= 0) this.reachClock += dt;
    if (this.slowLeft > 0) {
      this.slowLeft -= dt;
      if (this.slowLeft <= 0) this.slowPct = 0;
    }
    // The slow keeps counting down while rooted, so it still holds when the root wears off.
    tickRoot(this, dt);
    tickControl(this, dt); // the push/root streak recovers after CONTROL_WINDOW_SEC quiet (core/control.ts)
    // The gust slides it back along the road: a position change, never a speed change, clamped
    // at the start (no enemy slides before it) and at PUSH_RATE (the slide, not a teleport).
    if (this.pushLeft > 0) {
      const pushed = Math.min(this.pushLeft, PUSH_RATE * CELL * dt);
      this.distance = Math.max(0, this.distance - pushed);
      this.pushLeft -= pushed;
    }
    // The slow first, then the haste aura (a 40% slow + 30% haste walks at 0.6 × 1.3 of base).
    const speed = this.rootLeft > 0 ? 0 : this.speed * (1 - this.slowPct) * (1 + this.hastePct);
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
            this.distance += (c.dashCells / c.dashSec) * CELL * (1 + this.hastePct) * dt;
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
    if (this.plate !== undefined && this.def.plate !== undefined) {
      this.plate.setPosition(this.x, this.y).setScale(ART_SCALE * pop).setRotation(Math.atan2(this.dirX, -this.dirY)).setVisible(true);
    }
    if (this.disc !== undefined && this.def.id === 'guard') {
      this.disc.setPosition(this.x, this.y).setScale(ART_SCALE * pop).setRotation(Math.atan2(this.dirX, -this.dirY)).setVisible(true);
    }
    const tele = cycle !== undefined && this.dashLeg === 'pause' && this.pauseAge < cycle.pauseSec / 2;
    if (this.flash > 0) this.flash -= dt;
    const leg = reach !== undefined ? outOfReachLeg(reach, this.reachClock) : 'idle';
    const white = tele || leg === 'flash' || this.flash > 0;
    if (white !== wasWhite) {
      if (white) this.setTintFill(0xffffff);
      else this.clearTint();
    }
    this.setAlpha(leg === 'out' ? 0.5 : 1); // untargetable, not invisible: the token half-ghosts
    return this.distance >= path.length;
  }

  /** Out of reach right now (the Colossus's beat): the aim picks skip it; area, line and held damage still reach it. */
  get untargetable(): boolean {
    const reach = this.def.outOfReach;
    return reach !== undefined && outOfReachLeg(reach, this.reachClock) === 'out';
  }

  /** Takes damage (a marked enemy takes `markPct` more, from everything, and a shielded one lands
   * at half after all of it); `flash` false for a burn tick, so it doesn't blink white on every
   * tick. Returns true when this killed it. */
  hit(damage: number, flash = true): boolean {
    if (!this.active) return false;
    this.hp -= damage * (1 + this.markPct) * shieldMul(this.def, this.shielded);
    if (flash) {
      this.flash = 0.06;
      this.setTintFill(0xffffff);
    }
    const ramp = this.def.speedRamp;
    if (ramp && this.speed < ramp.max * CELL) this.speed = Math.min(this.speed + ramp.perHit * CELL, ramp.max * CELL);
    return this.hp <= 0;
  }

  /** Sets ablaze, or re-ignites: the duration refreshes and the rate keeps the hotter of the two.
   * `mul` is the burning tower's damage multiplier; the burn keeps it after the tower changes.
   * True when it was not ablaze before (that is the moment that whooshes). */
  ignite(dps: number, sec: number, mul: number): boolean {
    return ignite(this.burn, dps, sec, mul);
  }

  /** Slows it by `pct` for `sec` seconds; a weaker slow doesn't replace a stronger one. */
  slow(pct: number, sec: number): void {
    if (this.def.ignoresControl) return;
    if (pct < this.slowPct) return;
    this.slowPct = pct;
    this.slowLeft = Math.max(this.slowLeft, sec);
  }

  /** Roots it: fully stopped for `sec` seconds, unless it is rooted already; halved by the
   * push/root streak (core/control.ts). A root that would be shorter than 0.05s is skipped but
   * still counts, so an enemy hit nonstop stays fatigued. */
  root(sec: number): void {
    if (this.def.ignoresControl || this.rootLeft > 0) return;
    const s = sec * controlScale(this);
    if (s < 0.05) {
      noteControl(this);
      return;
    }
    if (applyRoot(this, s)) noteControl(this);
  }

  /** Marks it: it takes `pct` extra damage from everything until it dies. The first mark wins. */
  mark(pct: number): boolean {
    if (this.markPct > 0) return false;
    this.markPct = pct;
    this.markAge = 0;
    return true;
  }

  /** Queues a slide back along the road by `units` board units (Push), halved by the push/root
   * streak (core/control.ts); advance() consumes it. */
  pushBack(units: number): void {
    if (!this.active || this.def.ignoresControl || units <= 0) return;
    this.pushLeft += units * controlScale(this);
    noteControl(this);
  }

  despawn(): void {
    this.clearTint();
    this.plate?.setVisible(false); // a recycled slot must not show a stale plate (e.g. on a dot)
    this.disc?.setVisible(false); // a recycled slot must not show a stale disc (e.g. on a dot)
    this.setActive(false).setVisible(false);
  }
}
