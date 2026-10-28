import type Phaser from 'phaser';
import { ENEMIES } from '../../content/enemies';
import { PALETTE } from '../../content/palette';
import type { EnemyDef } from '../../content/types';
import { PathLine } from '../../core/path';
import { barrelTexture } from '../../art/barrels';
import { MENU_ROAD_POINTS, MENU_ROAD_SIZE, paintMenuRoad } from '../../art/menu';
import { artScale, BOLT_TEXTURE, enemyTexture, TOWER_BASE, TOWER_BODY, towerTexture } from '../../art/textures';
import { FxSystem } from '../../systems/FxSystem';
import { fillRing } from '../../ui/ring';

/** A demo enemy walking the menu road. Positions are in road units (MENU_ROAD_SIZE). */
interface DemoEnemy {
  img: Phaser.GameObjects.Image;
  def: EnemyDef;
  distance: number;
  hp: number;
  slowLeft: number;
}

interface DemoBolt {
  img: Phaser.GameObjects.Image;
  target: DemoEnemy;
}

/** Tunables for the little show, in road units and seconds. */
const DEMO = {
  spawnEvery: 1.3,
  walkSpeed: 22,
  bolt: { at: { x: 180, y: 104 }, range: 100, every: 0.45, speed: 380 },
  frost: { at: { x: 55, y: 48 }, range: 72, every: 1.3, slowSec: 1.4, slow: 0.45 },
  towerScale: 0.8,
  enemyScale: 0.9,
} as const;

/**
 * The menu's live picture: a road where enemies walk in, a Bolt tower that turns and shoots them
 * down (bursts, gold popups), and a Frost tower that pulses and slows them. Purely for show: none
 * of it touches a run. MenuScene creates it, lays it out and calls update() every frame.
 */
export class MenuDemo {
  private readonly scene: Phaser.Scene;
  private readonly fx: FxSystem;
  private readonly path = new PathLine(MENU_ROAD_POINTS);
  private readonly road: Phaser.GameObjects.Image;
  private readonly parts: { img: Phaser.GameObjects.Image; at: { x: number; y: number }; dy: number; size: number }[] = [];
  private readonly barrel: Phaser.GameObjects.Image;
  private readonly frostRing: Phaser.GameObjects.Graphics;
  private enemies: DemoEnemy[] = [];
  private bolts: DemoBolt[] = [];
  private spawnIn = 0.3;
  private boltIn = 0;
  private frostIn = 0.6;
  /** Screen position of the road's top-left corner, and screen pixels per road unit. */
  private origin = { x: 0, y: 0 };
  private k = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.fx = new FxSystem(scene);
    this.road = scene.add.image(0, 0, paintMenuRoad(scene)).setOrigin(0);
    this.frostRing = scene.add.graphics();
    // Draw order: road, plinths, then the frost ring and the barrel, then the bodies on top.
    const tower = (at: { x: number; y: number }, augment: string): void => {
      this.parts.push({ img: scene.add.image(0, 0, TOWER_BASE), at, dy: 0, size: DEMO.towerScale });
      this.parts.push({ img: scene.add.image(0, 0, towerTexture(augment)).setDepth(2), at, dy: -4, size: DEMO.towerScale });
    };
    tower(DEMO.frost.at, 'frost');
    tower(DEMO.bolt.at, 'bolt');
    this.barrel = scene.add.image(0, 0, barrelTexture(scene, 'teal', { length: 1, width: 1, bulb: false, bands: 0 })).setDepth(1);
    this.parts.push({ img: this.barrel, at: DEMO.bolt.at, dy: -4, size: DEMO.towerScale });
    this.frostRing.setDepth(1);
    this.road.setDepth(-1);
  }

  /** Puts the road with its top center at (cx, top), `k` screen pixels per road unit. */
  layout(cx: number, top: number, k: number): void {
    this.k = k;
    this.origin = { x: cx - (MENU_ROAD_SIZE.width / 2) * k, y: top };
    artScale(this.road, k).setPosition(this.origin.x, this.origin.y);
    for (const p of this.parts) {
      const s = this.toScreen(p.at.x, p.at.y + p.dy);
      artScale(p.img, p.size * k);
      p.img.setPosition(s.x, s.y);
    }
    const f = this.toScreen(DEMO.frost.at.x, DEMO.frost.at.y - 4);
    this.frostRing.clear();
    fillRing(this.frostRing, f.x, f.y, TOWER_BODY * 64 * 1.45 * DEMO.towerScale * k, 3 * k, 0, Math.PI * 2, PALETTE.ice, 0.95);
  }

  /** Road units to screen pixels. */
  private toScreen(x: number, y: number): { x: number; y: number } {
    return { x: this.origin.x + x * this.k, y: this.origin.y + y * this.k };
  }

  update(dt: number): void {
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnIn = DEMO.spawnEvery;
      this.spawn();
    }
    this.walk(dt);
    this.shoot(dt);
    this.pulse(dt);
    this.flyBolts(dt);
  }

  private spawn(): void {
    // The show only uses enemies that walk in alone (no splinters: they exist only as a split).
    const walkers = ENEMIES.filter((e) => !e.spawnOnly);
    const def = walkers[Math.floor(Math.random() * walkers.length)]!;
    const img = this.scene.add.image(0, 0, enemyTexture(def.id));
    artScale(img, DEMO.enemyScale * this.k);
    this.enemies.push({ img, def, distance: 0, hp: def.livesCost > 1 ? 4 : 2, slowLeft: 0 });
  }

  private walk(dt: number): void {
    for (const e of [...this.enemies]) {
      e.slowLeft = Math.max(0, e.slowLeft - dt);
      e.distance += DEMO.walkSpeed * (e.def.speed / 1.6) * (e.slowLeft > 0 ? 1 - DEMO.frost.slow : 1) * dt;
      const p = this.path.pointAt(e.distance);
      const s = this.toScreen(p.x, p.y - Math.abs(Math.sin(e.distance / 6)) * 2);
      e.img.setPosition(s.x, s.y);
      e.img.setTint(e.slowLeft > 0 ? 0xd8f2fc : 0xffffff);
      if (e.distance >= this.path.length) this.remove(e, false);
    }
  }

  private shoot(dt: number): void {
    this.boltIn -= dt;
    if (this.boltIn > 0) return;
    const at = DEMO.bolt.at;
    const target = this.furthestWithin(at, DEMO.bolt.range);
    if (!target) return;
    this.boltIn = DEMO.bolt.every;
    const p = this.path.pointAt(target.distance);
    const aim = Math.atan2(p.y - at.y, p.x - at.x) + Math.PI / 2;
    this.barrel.setRotation(aim);
    const from = this.toScreen(at.x + Math.sin(aim) * 20, at.y - 4 - Math.cos(aim) * 20);
    const img = artScale(this.scene.add.image(from.x, from.y, BOLT_TEXTURE), this.k).setTint(PALETTE.teal);
    this.bolts.push({ img, target });
  }

  private pulse(dt: number): void {
    this.frostIn -= dt;
    if (this.frostIn > 0) return;
    this.frostIn = DEMO.frost.every;
    const at = DEMO.frost.at;
    const s = this.toScreen(at.x, at.y);
    this.fx.wave(s.x, s.y, DEMO.frost.range * this.k, PALETTE.ice);
    for (const e of this.enemies) if (this.within(e, at, DEMO.frost.range)) e.slowLeft = DEMO.frost.slowSec;
  }

  private flyBolts(dt: number): void {
    for (const b of [...this.bolts]) {
      if (!this.enemies.includes(b.target)) {
        this.dropBolt(b);
        continue;
      }
      const t = b.target.img;
      const dx = t.x - b.img.x;
      const dy = t.y - b.img.y;
      const dist = Math.hypot(dx, dy);
      const step = DEMO.bolt.speed * this.k * dt;
      if (dist <= step) {
        this.dropBolt(b);
        this.hit(b.target);
      } else b.img.setPosition(b.img.x + (dx / dist) * step, b.img.y + (dy / dist) * step);
    }
  }

  private hit(e: DemoEnemy): void {
    e.hp -= 1;
    e.img.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => e.img.active && e.img.clearTint());
    if (e.hp > 0) return;
    this.fx.burst(e.img.x, e.img.y, PALETTE[e.def.look.color]);
    this.fx.popText(e.img.x, e.img.y - 16, `+${e.def.gold}`);
    this.remove(e, true);
  }

  private remove(e: DemoEnemy, killed: boolean): void {
    this.enemies = this.enemies.filter((x) => x !== e);
    if (killed) e.img.destroy();
    else this.scene.tweens.add({ targets: e.img, alpha: 0, duration: 200, onComplete: () => e.img.destroy() });
  }

  private dropBolt(b: DemoBolt): void {
    this.bolts = this.bolts.filter((x) => x !== b);
    b.img.destroy();
  }

  private within(e: DemoEnemy, at: { x: number; y: number }, range: number): boolean {
    const p = this.path.pointAt(e.distance);
    return Math.hypot(p.x - at.x, p.y - at.y) <= range;
  }

  private furthestWithin(at: { x: number; y: number }, range: number): DemoEnemy | undefined {
    return this.enemies.filter((e) => this.within(e, at, range)).sort((a, b) => b.distance - a.distance)[0];
  }
}
