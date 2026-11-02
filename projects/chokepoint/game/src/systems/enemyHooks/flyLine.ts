import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/** How long the boss Flyer's first line telegraphs at its wave's start, and how long the fade after. */
const TELEGRAPH_SEC = 3;
const FADE_SEC = 0.3;

/**
 * The boss Flyer's flight line (systems/fx-free, bossPhase's per-frame Graphics pattern: one
 * scene child at ground level, no HUD, no mark left on the board). At the wave's start, a thin
 * red line in the Flyer's own color shows its first line, spawn to exit, for 3 s at 50% alpha —
 * a telegraph in the enemy's own language — and fades over 0.3 s, gone before the crossing
 * matters; the Flyer's heading keeps the route readable after. `previewSec` (0.8 s) before the
 * bank, the two new segments (its position to the seeded edge bank point, then to the exit)
 * take the line's place; the turn lands with one quiet falling note (Sfx.bankNote, the
 * Colossus's out-of-reach note's shape) and the line is done — the heading carries the new
 * route. One line at a time: the boss wave sends exactly one Flyer.
 */
export const flyLine: MakeEnemyHook = ({ fx, enemies, sfx }) => {
  let g: Phaser.GameObjects.Graphics | undefined;
  /** The Flyer(s) whose bank note has played (a pooled slot's serial is new per run; the set is per run). */
  const noted = new WeakSet<Enemy>();
  const drop = (): void => {
    g?.destroy();
    g = undefined;
  };
  const draw = (pts: { x: number; y: number }[], alpha: number): void => {
    if (!g) g = fx.scene.add.graphics().setDepth(DEPTH.preview);
    g.clear();
    g.lineStyle(2, PALETTE.red, alpha);
    for (let i = 1; i < pts.length; i++) g.lineBetween(pts[i - 1]!.x, pts[i - 1]!.y, pts[i]!.x, pts[i]!.y);
  };
  return {
    update() {
      const e = enemies.all.find((x) => x.active && x.def.behavior === 'fly');
      if (!e) { drop(); return; }
      const bank = e.def.bank!;
      if (e.bankClock >= bank.previewSec) {
        // The bank has landed this frame (or earlier without a note): the line is done, once.
        if (!noted.has(e)) { noted.add(e); sfx?.bankNote(); }
        drop();
        return;
      }
      const route = e.flyRoute!;
      if (e.bankClock >= 0) {
        // The preview of the bank: the two new segments, from where it is now.
        draw([{ x: e.x, y: e.y }, route.bank, route.exit], 0.5);
      } else if (e.age < TELEGRAPH_SEC + FADE_SEC) {
        const alpha = e.age < TELEGRAPH_SEC ? 0.5 : 0.5 * (1 - (e.age - TELEGRAPH_SEC) / FADE_SEC);
        draw([route.spawn, route.exit], alpha);
      } else {
        drop(); // the telegraph faded: no mark left on the board
      }
    },
    onKill({ enemy }) { if (enemy.def.behavior === 'fly') drop(); },
    onLeak(enemy) { if (enemy.def.behavior === 'fly') drop(); },
  };
};
