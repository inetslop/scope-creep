import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/**
 * Cover: the hunted player's answer. Every 1.0 s a 70-deg fan of 3 bolts straight behind the
 * player, opposite its movement (its last movement when it stands still). They are Bolt's bolts:
 * Haste, Quick, Split, Lance, Ricochet and the on-hit/on-kill mods all reach them through the
 * player's stats, so they are never coded here.
 */
export const cover: UpgradeDef = {
  id: 'cover',
  name: 'Cover',
  description: 'Every 1.0 s, a fan of 3 bolts behind you, at whatever chases. 9 damage each. Per rank: +3 damage.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.yellow },
  cooldown: 1.0,
  fire(ctx, me, level) {
    const moving = v.len({ x: me.vx, y: me.vy }) > 20;
    const dir = moving ? Math.atan2(me.vy, me.vx) : me.mem['coverDir'] ?? me.angle;
    if (moving) me.mem['coverDir'] = dir;
    const back = dir + Math.PI;
    const half = (70 * Math.PI) / 180 / 2; // outer bolts at +/-35 deg: the fan is 70 deg wide in total
    const damage = 9 + 3 * (level - 1);
    for (let i = -1; i <= 1; i++) {
      ctx.fire(me, 'bolt', { angle: back + i * half, speed: 160, damage, life: 0.6 });
    }
  },
};
