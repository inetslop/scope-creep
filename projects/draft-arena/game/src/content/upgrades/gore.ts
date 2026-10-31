import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The Frenzy commitment to the jab: while below half hp, a Nerve jab threads 1 more enemy per rank. */
export const gore: UpgradeDef = {
  id: 'gore',
  name: 'Gore',
  description: 'After 1 prestige this life. While below half your hp, your Nerve jabs go through 1 more enemy, per rank.',
  maxLevel: 2,
  look: { shape: 'star', color: PALETTE.red },
  onHit(_ctx, me, level, hit) {
    const p = hit.projectile;
    if (!p || p.def.id !== 'jab' || p.mem.gored) return; // one arm per jab, at its first hit
    p.mem.gored = 1;
    if (me.hp < me.maxHp * 0.5) p.pierce += level; // rank 1: 2 hits, rank 2: 3
  },
};
