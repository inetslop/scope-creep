import { bossId } from '../../core/waves';
import type { MakeEnemyHook } from './hook';

/**
 * The boss's death: the kill (not a leak, not the Orb's mid-life split, which has no kill at all)
 * of the enemy the current wave's plan declares as its boss (core/waves.ts's bossId) sets the
 * name card's flag, shown by ui/hud/BossDeathBanner.ts: its name in bold ink over a muted
 * "stopped". The 24-chip burst is the kill's own (EnemySystem.kill makes the same check); the
 * gold pop, the combo and the coin slide all play as usual. A resumed run sets nothing.
 */
export const bossDeath: MakeEnemyHook = ({ run, scene }) => ({
  onKill({ enemy }) {
    if (bossId(run.wave) !== enemy.def.id) return;
    scene.registry.set('bossDeathName', enemy.def.name);
  },
});
