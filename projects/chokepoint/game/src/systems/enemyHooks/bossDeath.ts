import { bossId } from '../../core/waves';
import type { MakeEnemyHook } from './hook';

/**
 * The boss's death: the kill (not a leak, not the Orb's mid-life split, which has no kill at all)
 * of the enemy the current wave's plan declares as its boss (core/waves.ts's bossId) sets the
 * name card's flag, shown by ui/hud/BossDeathBanner.ts: its name in bold ink over a muted
 * "stopped". The 24-chip burst is the kill's own (EnemySystem.kill makes the same check); the
 * gold pop, the combo and the coin slide all play as usual. A resumed run sets nothing.
 * Its horn (Sfx.bossDown, T0302) answers the death: the Colossus's and the Titan's kill, and
 * the Orb's split (midSplit's ring beat, where the Orb is gone with no kill) — the split's
 * moment: the frame it goes from alive at its split line to gone, not once per window frame.
 */
export const bossDeath: MakeEnemyHook = ({ run, scene, enemies, sfx }) => {
  let lastAlive = false;
  let lastAtLine = false;
  let leaked = false;
  return {
    onKill({ enemy }) {
      if (bossId(run.wave) !== enemy.def.id) return;
      scene.registry.set('bossDeathName', enemy.def.name);
      sfx?.bossDown();
    },
    onLeak(enemy) {
      if (bossId(run.wave) === enemy.def.id) leaked = true;
    },
    update() {
      const boss = bossId(run.wave);
      if (boss === undefined) {
        lastAlive = false;
        lastAtLine = false;
        leaked = false;
        return;
      }
      let alive = false;
      let atLine = false;
      for (const e of enemies.all) {
        if (!e.active || e.def.id !== boss) continue;
        alive = true;
        // At the split line (at or below `hpFrac` of its max; a corpse counts: the window can end at hp 0).
        if (e.def.splitsAt !== undefined && e.hp <= e.maxHp * e.def.splitsAt.hpFrac) atLine = true;
      }
      if (!alive && lastAlive && lastAtLine && !leaked) sfx?.bossDown();
      lastAlive = alive;
      lastAtLine = atLine;
      leaked = false;
    },
  };
};
