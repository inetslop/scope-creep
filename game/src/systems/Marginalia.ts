import Phaser from 'phaser';
import { DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import type { EnemyDef } from '../content/types';
import type { Enemy } from '../entities/Enemy';
import { textStyle } from '../ui/text';

const MAX_LABELS = 16;
const LIFE = 2;
const FADE_IN = 0.2;
const FADE_OUT = 0.5;
const OFFSET = 24;
const MARGIN = 8;
const FALLBACK_NOTE = "IT'S NEW.";

interface Label { text: Phaser.GameObjects.Text; enemy: Enemy | null; serial: number; age: number; }

/** First-encounter annotations: one small ink note per enemy type per run, 2 s lifetime. Cosmetic only. */
export class Marginalia {
  private readonly scene: Phaser.Scene;
  private readonly bounds: Phaser.Geom.Rectangle;
  private readonly labels: Label[] = [];
  private readonly pool: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, bounds: Phaser.Geom.Rectangle) { this.scene = scene; this.bounds = bounds; }

  get activeCount(): number { return this.labels.length; }

  /** Shows the note for `def` above `enemy`. Call only for a first sighting this run. */
  note(enemy: Enemy, def: EnemyDef): void {
    let i = this.pool.findIndex((t) => !t.active);
    if (i === -1) {
      if (this.pool.length >= MAX_LABELS) return;
      i = this.pool.length;
      this.pool.push(this.scene.add.text(0, 0, '', textStyle(13, PALETTE.ink)).setOrigin(0.5).setDepth(DEPTH.fx));
    }
    const t = this.pool[i];
    t.setText(def.note ?? FALLBACK_NOTE);
    t.setAlpha(0).setActive(true).setVisible(true);
    const label = { text: t, enemy, serial: enemy.serial, age: 0 };
    this.labels.push(label);
    this.pinLabel(label);
  }

  /** Ages labels (fade in 200 ms, hold, fade out the last 500 ms); a label dies with its enemy. */
  update(dt: number): void {
    for (let i = this.labels.length - 1; i >= 0; i--) {
      const l = this.labels[i];
      l.age += dt;
      // A reused pooled enemy has a new serial: treat that as a death too, or the label would follow the wrong enemy.
      if (!l.enemy || !l.enemy.active || l.enemy.serial !== l.serial || l.age >= LIFE) { this.despawn(i); continue; }
      l.text.setAlpha(l.age < FADE_IN ? l.age / FADE_IN : l.age > LIFE - FADE_OUT ? (LIFE - l.age) / FADE_OUT : 1);
    }
  }

  /** Places each label ~24 units above its enemy, clamped inside the arena. Call in POST_UPDATE. */
  pin(): void { for (const l of this.labels) this.pinLabel(l); }

  private pinLabel(l: Label): void {
    if (!l.enemy || !l.enemy.active || l.enemy.serial !== l.serial) return;
    const t = l.text;
    t.setPosition(
      Phaser.Math.Clamp(l.enemy.x, this.bounds.left + t.width / 2 + MARGIN, this.bounds.right - t.width / 2 - MARGIN),
      Phaser.Math.Clamp(l.enemy.y - OFFSET, this.bounds.top + t.height / 2 + MARGIN, this.bounds.bottom - t.height / 2 - MARGIN),
    );
  }

  private despawn(i: number): void {
    const l = this.labels[i];
    l.enemy = null;
    l.text.setActive(false).setVisible(false);
    this.labels.splice(i, 1);
  }
}
