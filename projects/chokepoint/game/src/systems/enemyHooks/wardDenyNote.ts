import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/**
 * The Ward's deny gets its note: the exact moment wardDeny's ring plays — a Push gust, an
 * Anchor root or a Frost slow that takes no effect — one soft blip (Sfx.wardDeny), one per
 * ring, never per frame. Inside a Frost aura the deny lands nonstop, but the ring refreshes at
 * most once per 0.5 s (wardDeny's REFRESH_MS); the blip rides that same throttle. It reads the
 * one-frame `deny` flag (entities/Enemy.ts) without clearing it — wardDeny clears it — so its
 * line sits directly above wardDeny's in ENEMY_HOOKS (index.ts). Silent with the sound toggle
 * off (Sfx.tone is). It draws nothing: the ring stays wardDeny's.
 */
export const wardDenyNote: MakeEnemyHook = ({ enemies, scene, sfx }) => {
  const REFRESH_MS = 500; // the same one wardDeny.ts's REFRESH_MS
  const last = new Map<Enemy, number>(); // real ms the blip last played, per Ward
  return {
    update() {
      const now = scene.time.now;
      for (const e of enemies.all) {
        if (!e.active || e.def.ignoresControl !== true || !e.deny) continue;
        const t = last.get(e);
        if (t !== undefined && now - t < REFRESH_MS) continue;
        last.set(e, now);
        sfx?.wardDeny();
      }
    },
    onKill({ enemy }) { last.delete(enemy); },
    onLeak(enemy) { last.delete(enemy); },
  };
};
