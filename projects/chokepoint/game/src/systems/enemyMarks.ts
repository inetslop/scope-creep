import type Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import type { Enemy } from '../entities/Enemy';
import { fillRing } from '../ui/ring';

/** Draws one kind of mark on an enemy (in board units, around e.x, e.y). */
type Mark = (g: Phaser.GameObjects.Graphics, e: Enemy) => void;

/** What shows on enemies, one per line, drawn in this order every frame. */
const MARKS: readonly Mark[] = [
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
