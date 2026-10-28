import type Phaser from 'phaser';
import { CELL } from '../config';
import { deepOf, PALETTE } from '../content/palette';
import type { Enemy } from '../entities/Enemy';
import { fillRing } from '../ui/ring';

/** Draws one kind of mark on an enemy (in board units, around e.x, e.y). */
type Mark = (g: Phaser.GameObjects.Graphics, e: Enemy) => void;

/** What shows on enemies, one per line, drawn in this order every frame. */
const MARKS: readonly Mark[] = [
  // Rooted: a flat light-blue ground ring for the duration of its stop.
  (g, e) => {
    if (e.rootLeft > 0) fillRing(g, e.x, e.y + 2, e.def.look.size * 64 + 12, 3.5, 0, Math.PI * 2, PALETTE.ice, 0.95);
  },
  // Slowed: a thin ice-blue frost ring.
  (g, e) => {
    if (e.slowPct > 0) fillRing(g, e.x, e.y + 2, e.def.look.size * 64 + 7, 2.5, 0, Math.PI * 2, PALETTE.ice, 0.95);
  },
  // Damaged: a small rounded health bar above it.
  (g, e) => {
    if (e.hp >= e.maxHp) return;
    const w = 30;
    const x = e.x - w / 2;
    const y = e.y - e.def.look.size * 64 - 14;
    g.fillStyle(PALETTE.ink, 0.18);
    g.fillRoundedRect(x - 1, y - 1, w + 2, 7, 3.5);
    g.fillStyle(PALETTE.green, 1);
    g.fillRoundedRect(x, y, Math.max(5, w * Math.max(0, e.hp / e.maxHp)), 5, 2.5);
  },
  // Ramping: two short speed ticks trailing behind it; they grow with every speed step and pulse at the cap.
  (g, e) => {
    const ramp = e.def.speedRamp;
    if (!ramp) return;
    const step = Math.max(0, Math.min(10, (e.speed / CELL - e.def.speed) / ramp.perHit));
    const len = 5 + step * 1.1;
    const alpha = e.speed >= ramp.max * CELL - 0.01 ? 0.65 + 0.25 * Math.sin(e.age * Math.PI * 4) : 0.9;
    const r = e.def.look.size * CELL;
    const angle = Math.atan2(-e.dirY, -e.dirX);
    for (const s of [-1, 1]) {
      g.save();
      g.translateCanvas(e.x - e.dirX * (r + 4) - e.dirY * s * 3.5, e.y - e.dirY * (r + 4) + e.dirX * s * 3.5);
      g.rotateCanvas(angle);
      g.fillStyle(deepOf(e.def.look.color), alpha);
      g.fillRoundedRect(-len, -1.5, len, 3, 1.5);
      g.restore();
    }
  },
  // Marked: a small ink down-chevron above the health bar, popping in over 0.1 s.
  (g, e) => {
    if (e.markPct <= 0) return;
    const t = Math.min(1, e.markAge / 0.1);
    const pop = t < 1 ? 1.15 * Math.sin((t * Math.PI) / 2) : 1;
    const w = 6 * pop;
    const h = 4 * pop;
    const a = 3 * pop;
    const y = e.y - e.def.look.size * 64 - 20;
    g.fillStyle(PALETTE.ink, 0.9);
    g.fillTriangle(e.x - w, y - h, e.x - a, y - h, e.x, y);
    g.fillTriangle(e.x + w, y - h, e.x + a, y - h, e.x, y);
  },
];

/**
 * Redraws the marks of every active enemy. Called at the end of every frame, in every phase,
 * after everything that can damage or kill has run (so a mark never outlives its enemy).
 */
export function drawEnemyMarks(g: Phaser.GameObjects.Graphics, enemies: readonly Enemy[]): void {
  g.clear();
  for (const e of enemies) {
    if (!e.active) continue;
    for (const mark of MARKS) mark(g, e);
  }
}
