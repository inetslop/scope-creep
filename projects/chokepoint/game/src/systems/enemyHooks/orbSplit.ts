import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import type { FxSystem } from '../FxSystem';
import type { MakeEnemyHook } from './hook';

/**
 * The Orb's live crack and its split's moment (T0347): the replacement for the crack the token
 * used to bake — one muted-ink line on the face, alpha 0.25 + 0.75 * (the hp lost, over the
 * half-hp line): faint at full hp, fully opaque at the split line, re-derived every frame. While
 * the window (midSplit's) is open the Orb flashes white through it — the tint only, its clear is
 * the split's own despawn — and where the window ends, one 12-chip burst in its own purple at
 * the split spot: no kill, no sound. The spot, color and serial ride here, because the split's
 * own spawn may recycle the Orb's slot into a live Shard. Display only: the split (midSplit),
 * the Shards' numbers and the wave plan stay as they are.
 */
export const orbSplit: MakeEnemyHook = ({ fx, enemies }) => {
  const seen = new Map<Enemy, { line: Phaser.GameObjects.Graphics; x: number; y: number; color: number; serial: number }>();
  const drop = (e: Enemy, burst: boolean) => {
    const s = seen.get(e);
    if (!s) return;
    seen.delete(e);
    s.line.destroy();
    if (burst) fx.burst(s.x, s.y, s.color, 12); // the split's moment: no kill, no sound
  };
  return {
    update() {
      for (const [e, s] of [...seen]) {
        // A tracked Orb gone without a kill or a leak: the split consumed it — its slot may be
        // a live Shard already (the serial tells), so its spot and color ride in its state.
        if (!e.active || e.serial !== s.serial) drop(e, true);
      }
      for (const e of enemies.all) {
        if (!e.active || e.def.splitsAt === undefined) { drop(e, false); continue; }
        let s = seen.get(e);
        if (!s) {
          s = makeState(fx, e);
          seen.set(e, s);
        }
        s.x = e.x;
        s.y = e.y;
        s.line.setPosition(e.x, e.y - Math.max(2, e.def.look.size * CELL * 0.18) / 2);
        s.line.setAlpha(0.25 + 0.75 * Math.min(1, (e.maxHp - e.hp) / (e.maxHp * e.def.splitsAt!.hpFrac)));
        if (e.splitClock >= 0) e.setTintFill(0xffffff); // the window's white flash; the split's despawn clears it
      }
    },
    onKill({ enemy }) { drop(enemy, false); },
    onLeak(enemy) { drop(enemy, false); },
  };
};

/** One line = one Graphics: the crack drawn once at the face-center origin, moved with setPosition. */
function makeState(fx: FxSystem, e: Enemy): { line: Phaser.GameObjects.Graphics; x: number; y: number; color: number; serial: number } {
  const r = e.def.look.size * CELL;
  const g = fx.scene.add.graphics().setDepth(DEPTH.fx);
  g.lineStyle(Math.max(1, r * 0.1), PALETTE.muted, 1); // the painted crack's width, muted ink
  g.beginPath();
  g.moveTo(0, -r * 0.55);
  g.lineTo(-r * 0.08, -r * 0.06);
  g.lineTo(r * 0.06, r * 0.12);
  g.lineTo(0, r * 0.5);
  g.strokePath();
  g.setAlpha(0.25);
  return { line: g, x: e.x, y: e.y, color: PALETTE[e.def.look.color], serial: e.serial };
}
