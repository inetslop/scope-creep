---
id: T0229
title: "The wave's last kill gets its moment: a soft ring where it ends"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T20:16:15Z
claimed_at: 2026-10-29T20:51:16Z
---

## Goal
The end of every cleared wave is seen where the fight actually ended: when the last enemy of the wave is killed, a small soft ring blooms from that kill spot, so the wave's closing beat lands on the board, not only in the center text.

## Details
- Trigger: the killing hit that brings the current wave's alive enemy count to zero (a wave that is cleared, not lost).
- The ring: a soft ring in the road's white at low alpha, at ground level (the working-aura ring's placement, T0055; the Mute's ring's placement, T0219), growing from the killed enemy's radius out to ~1.5 cells over ~300 ms, then fading out. One per wave, on the final kill only.
- No ring on any non-final kill, and none when the wave is lost (a leak that ends the run goes straight to game over, no ring).
- No sound, no text, no new HUD element, and nothing left on the board after it fades — a transient flash in the existing ring language, not a mark.
- It does not replace or overlap the "Wave N cleared +gold" line (T0205): that line is at board center, the ring is at the last kill spot; they share the same beat and are seen together.

## Acceptance criteria
- [ ] Killing the last enemy of a wave shows exactly one soft white ring expanding from that kill spot over ~300 ms and fading; killing any other enemy shows no ring.
- [ ] No ring appears mid-wave or when the wave is lost to a leak.
- [ ] The ring adds no sound, no text, and no HUD element, and leaves no mark on the board after it fades; the "Wave N cleared" line is untouched.
- [ ] The effect lives in a new file driven by the existing kill/death flow; no changes to the draft, the wave text, or existing HUD elements.
- [ ] Check and smoke pass on desktop and mobile.

## Design (architect, yoga)

### Files
- create `src/systems/fx/clearRing.ts` - the ring itself: soft white ring at the kill spot, 300 ms grow + fade (model: `src/systems/fx/auraRing.ts`)
- create `src/systems/enemyHooks/waveClose.ts` - the trigger: the kill that takes the wave's alive count to zero calls `clearRing` (model: `src/systems/enemyHooks/killCoin.ts`)
- edit `src/systems/enemyHooks/index.ts` - import line next to the `killCoin` import; `waveClose,` after the `killCoin,` entry
- edit `src/scenes/GameScene.ts` - one line `this.registry.set('waves', this.waves);` next to the existing `this.enemies.towers = () => this.towers.towers;` line (~line 104)

### Interfaces
```ts
// src/systems/fx/clearRing.ts
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { FxSystem } from '../FxSystem';
import { fillRing } from '../../ui/ring';

/** The wave's last kill: the soft ring in the road's white that blooms from the kill spot (T0229). */
export function clearRing(fx: FxSystem, x: number, y: number, fromRadius: number): void {
  if (fx.full) return;
  const r = 1.5 * CELL;
  const g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, r, 3, 0, Math.PI * 2, PALETTE.road, 0.5);
  g.setScale(fromRadius / r);
  fx.track(g, 300, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });
}
```
```ts
// src/systems/enemyHooks/waveClose.ts
import { CELL } from '../../config';
import { clearRing } from '../fx/clearRing';
import type { WaveSystem } from '../WaveSystem';
import type { MakeEnemyHook } from './hook';

/** The wave's last kill blooms clearRing at the kill spot - the same beat as the cleared text (RunFlow). */
export const waveClose: MakeEnemyHook = (ctx) => ({
  onKill({ enemy }) {
    const waves = ctx.scene.registry.get('waves') as WaveSystem | undefined;
    if (!waves || !waves.spawningDone || ctx.run.over) return;
    if (ctx.enemies.aliveCount !== 1) return; // the dead enemy is still counted while onKill runs
    clearRing(ctx.fx, enemy.x, enemy.y, enemy.def.look.size * CELL);
  },
});
```

### Steps
1. Create `clearRing.ts` exactly as above.
2. Create `waveClose.ts` exactly as above.
3. In `enemyHooks/index.ts`: add `import { waveClose } from './waveClose';` next to the killCoin import, and `waveClose,` after the `killCoin,` line (keep it after `split`).
4. In `GameScene.ts`: add the registry line next to the `this.enemies.towers` line.
5. `npm run check` and `npm run smoke`; both must pass.

### Pitfalls
- Never `aliveCount === 0`: at onKill the dead enemy is still active (despawn runs after the hooks), so `=== 1` is what means "this kill took the wave to zero". The gates, in order: registry waves non-null, `waves.spawningDone` (no enemies still to come), `!ctx.run.over` (a leak that ends the run = no ring), `aliveCount === 1`.
- `waveClose` must stay after `split` in `ENEMY_HOOKS`: a splitter's death spawns live children during onKill; if waveClose ran first, the last splitter would ring while the wave continues.
- Read the registry inside `onKill`, not in the factory body: EnemySystem (and its hooks) is constructed before the GameScene line that registers `waves`.
- No state in the hook (no counters, no stored spot): one ring per wave is structural - exactly one kill can take the count to zero, and an all-leaked wave has no last kill.
- No sound, no text, no HUD, no mark: the tracked ring is destroyed by `fx.track`; do not touch RunFlow's cleared text, Sfx, or `ui/hud/`.
- Keep alpha `0.5` and thickness `3` (the "low alpha" of the spec); the ring reads on its island arc - do not thicken it or add a shadow.

### Tests
- none
