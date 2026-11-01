---
id: T0388
title: "The kill trail weighs the bounty: a coin per 10 gold"
assignee: desktop
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T23:16:36Z
claimed_at: 2026-11-01T23:41:15Z
---

## Goal
The kill-gold trail (T0061) slides exactly one small coin per kill today, whatever the kill pays — a Hauler's "small fortune" (10 gold) and a boss's 20 fly the board exactly like a Dot's 4. A bigger bounty slides more coins, so what a kill pays is felt in the money that flies to the stats card.

## Details
- The trail launches extra coins for a big bounty, counted from the enemy's own bounty (its data gold, before the quiet wave's double, the last stand's double and Lean's thinning — those never add coins): a kill whose bounty is 10 or more (Hauler, Block, Ward, Bulwark, the 12-gold Shard) slides one extra coin; a kill whose bounty is 20 or more (the bosses: Colossus, Titan, Orb, Hive) slides two extra, so a boss kill's trail is a three-coin train.
- The extra coins are the trail's own coin (the HUD's ~10 px coin, T0061's look) on the trail's own arc to the gold number, each staggered ~80 ms behind the one before; a sub-10-gold kill slides exactly the one coin it does today, byte-identical.
- One new enemy-hook file in the comboBreak pattern (`src/systems/enemyHooks/comboBreak.ts`, T0207), registered in the enemy hooks' index, reacting to a kill: it triggers the extra launches through the trail's own launch (if that launch is private to the trail's owner, one small shared helper there is the only other edit).
- Visual only: the kill gold, the gold pop, the chip burst, the boss's own death moment (burst, name card, horn) and the first coin's arc and timing are all untouched; no HUD, no key, no sound.

## Acceptance criteria
- [ ] A kill of a 10-gold enemy (a Hauler, a Block, a Ward, a Bulwark, a Shard) slides exactly two coins on the trail — the existing one plus one new one, ~80 ms behind it, same arc and look; a kill under 10 gold (Dot, Sprinter, Splinter, Dasher, Flyer, Guard) slides exactly one coin, byte-identical to today.
- [ ] A boss kill (Colossus, Titan, Orb, Hive: 20 gold) slides exactly three coins; the boss's death burst, name card and horn are unchanged.
- [ ] The kill gold paid, the gold pop and its number, the chip burst, and the trail's first coin (arc, look, timing) are byte-identical to before; quiet's double, the last stand's double and Lean's thinning never change the coin count; no new HUD, key or sound.
- [ ] The game is playable menu to game over on desktop and mobile.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/bountyCoin.ts` - the hook: one extra trail coin per 10 gold of the enemy's own bounty (2 extra at 20+), staggered ~80 ms on the trail's own arc
- edit `src/systems/enemyHooks/index.ts` - one import line + one `ENEMY_HOOKS` line, both right after the `killCoin` lines (import at line 34, array entry at line 65)

### Interfaces
No types change. The hook's exact shape (copy verbatim, with a file-header comment in `killCoin.ts` style saying: the trail weighs the bounty — extra coins counted from the enemy's data gold `def.gold`, before the quiet wave's double, the last stand's double and Lean's thinning, which never add coins):

```ts
import type { Point } from '../../core/path';
import { goldCoin } from '../fx/goldCoin';
import type { MakeEnemyHook } from './hook';

export const bountyCoin: MakeEnemyHook = (ctx) => ({
  onKill({ enemy }) {
    const extra = enemy.def.gold >= 20 ? 2 : enemy.def.gold >= 10 ? 1 : 0;
    if (extra === 0) return;
    const spot = ctx.scene.registry.get('statsGold') as Point | undefined;
    if (!spot) return;
    const px = ctx.board.toScreen({ x: 1, y: 0 }).x - ctx.board.toScreen({ x: 0, y: 0 }).x; // CSS px per board unit
    const from = { x: enemy.x, y: enemy.y - 20 }; // the gold pop's anchor, as killCoin.ts
    const to = ctx.board.toBoard(spot);
    for (let i = 1; i <= extra; i++) {
      ctx.scene.time.delayedCall(80 * i, () => {
        if (ctx.fx.full) return;
        goldCoin(ctx.fx, from, to, 10 / px, 24 / px); // the trail's own coin: same look, size and arc
      });
    }
  },
});
```

### Steps
1. Create `src/systems/enemyHooks/bountyCoin.ts` exactly as above. The `80 * i` gives the first extra coin 80 ms behind the trail's base coin (which `killCoin` launches at t=0) and each later one 80 ms behind the previous.
2. In `src/systems/enemyHooks/index.ts` add `import { bountyCoin } from './bountyCoin';` directly under the `killCoin` import, and `bountyCoin,` directly after `killCoin,` in `ENEMY_HOOKS`. Nothing else.

### Pitfalls
- Do not read `enemy.x`/`enemy.y` inside the delayed callback: the enemy is returned to the pool right after `onKill` and may be re-spawned and repositioned within 80–160 ms; capture `from`, `px` and `to` at event time exactly as above, and do not recompute `to` in the callback (the extra coins share the first coin's exact geometry).
- Count only from `enemy.def.gold`, never from `KillEvent.paid` (quiet's double, last stand's double and Lean's thinning change `paid` and must not change the coin count).
- The extra coins are deliberately NOT counted by `killCoin`'s 250 ms/8-launch cap (per-hook state is never shared); they stay bounded because `goldCoin` itself returns early when `ctx.fx.full`. Do not add any cap of your own.
- Sub-10 gold returns before any launch, so `killCoin.ts` is untouched and a sub-10 kill slides byte-identically the one coin it does today; the boss's death burst, name card and horn live in other hooks and are untouched. No HUD, key, sound or text.
- Keep the `ctx.fx.full` check inside the callback (pattern of `haulerLeak.ts:21`), mirroring the established delayed-hook style.

### Tests
- none (visual-only hook; `npm run check` and `npm run smoke` must pass).
