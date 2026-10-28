---
id: T0061
title: "Kill gold trail: the coin that slides to the tally"
size: S
priority: 3
status: todo
depends_on: [T0039]
attempts: 0
created: 2026-10-28T13:29:40Z
epic: E1
---

## Goal
The money is seen moving where it was earned: each kill's gold flies to the HUD's gold tally as one small coin, so the gold number reads as the place the kill's gold goes.

## Details
- When a kill pays its normal kill gold (including T0054's doubled amount while last stand is on), one small coin — the same coin icon as the HUD tally (T0013), ~10 px — leaves the kill spot (the same anchor as the gold pop) and flies to the gold number in the stats card over ~200 ms on a short arc, ease-out, fading in its last ~30 ms.
- One coin per kill, whatever the amount: it is a symbol of the gold, not a count of it. The kill's gold pop is unchanged — the trail is in addition to the pop, never a replacement.
- The Mint "+1" pops (T0039) never get coins; they stay pops.
- Cap: at most 8 coins in flight at once; when the cap is reached, a kill shows only its pop. Coins are destroyed on arrival (and by a 500 ms safety timeout) and die with the scene, like the Fx pops.
- The gold number's pop on growth (T0017) is unchanged — it still pops when the tally rises; a coin landing is not a separate pop trigger.
- Closest existing: the gold pop's rise and fade (the kill-gold pop) and the coin icon on the tally (T0013) — the same coin, in flight.

## Acceptance criteria
- [ ] Every kill with normal gold shows one small coin flying from the kill spot to the stats card's gold number over ~200 ms, in addition to the unchanged gold pop.
- [ ] While last stand is on (T0054) the coin still flies — one per kill, same size — and Mint "+1" pops (T0039) never get coins.
- [ ] With 8 coins already in flight, extra kills show only their pop; every coin is destroyed on arrival or timeout (no leaked objects).
- [ ] Gold totals, the tally's pop, sounds and all other HUD are unchanged; works at 412x915 and 1280x720.

## Note (by hand, 2026-10-28)

No longer waits on T0055: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Design reset (by hand, 2026-10-28)

The old design edited shared hub files that the game now has extension points for (CLAUDE.md recipes: enemy hooks in `systems/enemyHooks/`, effects in `systems/fx/`). Design it so it edits as few shared files as possible: a task that only adds its own files and registry lines can be built while other tasks run; one that edits a shared file waits until nobody else is editing it. Use an enemy hook (`onKill`, with the gold the kill paid) to start the coin, and an effect file in `systems/fx/` for the slide (a tween needs no per-frame code); no `EnemySystem` or `GameScene` edit.

## Design (architect, yoga)

### Files
- create `src/systems/fx/goldCoin.ts` - the coin slide effect (one file per new effect, per the `systems/fx/` recipe)
- create `src/systems/enemyHooks/killCoin.ts` - the enemy hook: per-run cap state, starts one coin per kill
- edit `src/systems/enemyHooks/index.ts` - one line: register `killCoin` in `ENEMY_HOOKS`
- edit `src/ui/hud/StatsCard.ts` - one line in `layout()`: publish the gold number's screen position

### Interfaces
- `src/systems/fx/goldCoin.ts`: `export function goldCoin(fx: FxSystem, from: Point, to: Point, size: number, arc: number): void` — `from`/`to` in board units (both `Point` from `core/path`), `size`/`arc` in board units.
- `src/systems/enemyHooks/killCoin.ts`: `export const killCoin: MakeEnemyHook` (as `split.ts`).
- Cross-scene handoff: `this.scene.registry.set('statsGold', { x, y })` in `StatsCard.layout()` (shared game-level registry, like `'run'`/`'sfx'`); the hook reads it as `Point | undefined`. No signature changes anywhere.

### Steps
1. Create `src/systems/fx/goldCoin.ts`:
```ts
import { artScale, COIN_TEXTURE } from '../../art/textures';
import { DEPTH } from '../../config';
import type { Point } from '../../core/path';
import type { FxSystem } from '../FxSystem';

/**
 * A kill's gold coin: the same coin icon as the gold tally (art/icons.ts), `size` board units
 * across, leaving `from` (the gold pop's anchor) for `to` (the gold number in the stats card,
 * ui/hud/StatsCard.ts) — in addition to the gold pop (FxSystem.popText), one symbol per kill.
 * Over 200 ms on a short upward arc, ease-out, fading in its last ~30 ms; destroyed on arrival,
 * with a 500 ms safety timeout.
 */
export function goldCoin(fx: FxSystem, from: Point, to: Point, size: number, arc: number): void {
  if (fx.full) return;
  // The coin texture is 28 board units wide (art/icons.ts): size board units is size / 28 of it.
  const img = artScale(fx.scene.add.image(0, 0, COIN_TEXTURE), size / 28);
  const coin = fx.scene.add.container(from.x, from.y, [img]).setDepth(DEPTH.fx);
  fx.scene.tweens.add({ targets: img, y: -arc, duration: 100, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  fx.scene.tweens.add({ targets: coin, alpha: 0, delay: 170, duration: 30, ease: 'Quad.easeIn' });
  let alive = true;
  const finish = (): void => { if (alive) { alive = false; coin.destroy(); } };
  fx.scene.time.delayedCall(500, finish);
  fx.track(coin, 200, { x: to.x, y: to.y, ease: 'Quad.easeOut' });
}
```
2. Create `src/systems/enemyHooks/killCoin.ts` (state in the closure: a new run makes a new hook):
```ts
import { goldCoin } from '../fx/goldCoin';
import type { Point } from '../../core/path';
import type { MakeEnemyHook } from './hook';

/**
 * The kill's gold trail (systems/fx/goldCoin.ts): one small coin per kill that pays gold, from
 * the kill spot (the gold pop's anchor) to the gold number in the stats card (ui/hud/StatsCard.ts,
 * shared as 'statsGold' through the scene registry). At most 8 in flight: a coin flies 200 ms,
 * so a kill that starts 8 or more launches in the last 250 ms shows only its pop.
 */
export const killCoin: MakeEnemyHook = (ctx) => {
  let launched: number[] = [];
  return {
    onKill({ enemy, paid }) {
      if (paid <= 0) return;
      const now = ctx.scene.time.now;
      launched = launched.filter((t) => now - t < 250);
      if (launched.length >= 8) return;
      launched.push(now);
      const spot = ctx.scene.registry.get('statsGold') as Point | undefined;
      if (!spot) return;
      // CSS pixels per board unit at the current zoom: the coin stays ~10 px on screen, the arc ~24 px.
      const px = ctx.board.toScreen({ x: 1, y: 0 }).x - ctx.board.toScreen({ x: 0, y: 0 }).x;
      goldCoin(ctx.fx, { x: enemy.x, y: enemy.y - 20 }, ctx.board.toBoard(spot), 10 / px, 24 / px);
    },
  };
};
```
3. `index.ts`: add `import { killCoin } from './killCoin';` next to the `split` import, and `killCoin,` in `ENEMY_HOOKS` next to `split` (the existing docstring stays).
4. `StatsCard.ts`, inside `layout()`, after the `setPosition` line:
```ts
this.scene.registry.set('statsGold', { x: this.box.x + this.gold.x, y: this.box.y + this.gold.y });
```
(plus one comment line: the gold number's screen position (CSS pixels), shared with the kill's coin.)

### Pitfalls
- No `worldX`/`getWorldCoordinate` on Phaser 3.90 game objects — the spot is box position + text position; the HUD camera is at the origin (`uiCamera`), so scene positions are CSS pixels.
- The registry is the shared game-level manager (`'run'`/`'sfx'` cross scenes the same way): the HUD writes, the game-scene hook reads.
- Everything is scene-clock and scene-child: the coin dies with the scene like the Fx pops; `finish` is guarded (`alive` flag) and Phaser `destroy()` is a no-op twice, so the 500 ms safety timeout can't double-destroy.
- `to` is converted to board space at launch (`board.toBoard`); a camera drag mid 200 ms flight is negligible, and the coin stays glued to the board.
- 2x speed (T0019) scales the scene clock — the coin, like the pops, flies at that speed. `px > 0` always (fit ≥ 0.01), no NaN.
- T0045/T0054 also edit `StatsCard.ts` and T0059 may add an enemy hook line: keep each shared-file edit to the single line specified; no `EnemySystem`/`GameScene` edit.

### Tests
none
