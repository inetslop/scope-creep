import { PALETTE } from '../../content/palette';
import { nameLabel } from '../fx/nameLabel';
import type { MakeEnemyHook } from './hook';

/**
 * The shield's break: the moment a Guard dies while its Titan is still on the board, the Titan
 * goes from halved to full damage - and that change is shown at the one whose state changes, not
 * at the dead Guard. One 8-chip burst in the shield's own orange (the flat disc the Guard carried,
 * art/entities.ts) at the Titan's token, and the name chip's look (systems/fx/nameLabel.ts)
 * reading "shield down" over it for ~1 s. The Guard's own kill burst is unchanged (EnemySystem).
 * A Guard that dies after its Titan, or any Guard with no Titan on the board, plays nothing;
 * at most once per run (one Guard and one Titan, both wave 20). No sound, no HUD.
 */
export const shieldDown: MakeEnemyHook = ({ enemies, fx }) => {
  let played = false; // at most once per run (one Guard and one Titan, both wave 20)
  return {
    onKill({ enemy }) {
      if (played || enemy.def.id !== 'guard') return;
      const titan = enemies.all.find((e) => e.active && e.def.id === 'titan');
      if (titan === undefined) return; // the Guard died after its Titan: no break to show
      played = true;
      fx.burst(titan.x, titan.y, PALETTE.orange, 8); // the shield's orange, where its wall now takes full
      nameLabel(fx, titan.x, titan.y, 'shield down');
    },
  };
};
