import type { MakeEnemyHook } from './hook';

/**
 * The Titan's shield, carried by its Guard (core/shield.ts): while a Guard is alive on the board,
 * the Titan's `shielded` is up and every hit on it lands at half; the moment a Guard dies (any
 * source), the Titan takes full damage. A Guard that leaks keeps the shield up: only a death on
 * the road strips it. One Guard and one Titan per run, so one closure boolean is the whole state.
 */
export const titanShield: MakeEnemyHook = ({ enemies }) => {
  let guardKilled = false; // a leak leaves the shield up: only a death on the road strips it
  return {
    onKill(kill) {
      if (kill.enemy.def.id === 'guard') guardKilled = true;
    },
    update() {
      for (const e of enemies.all) {
        if (!e.active || e.def.shieldCarrier === undefined) continue;
        e.shielded = !guardKilled;
      }
    },
  };
};
