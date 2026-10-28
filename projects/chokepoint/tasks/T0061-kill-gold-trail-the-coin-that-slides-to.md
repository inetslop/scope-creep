---
id: T0061
title: "Kill gold trail: the coin that slides to the tally"
size: S
priority: 3
status: todo
depends_on: [T0039, T0054]
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

## Design (architect, yoga)

### Files
- create `src/systems/CoinTrail.ts` — the gold trail: one coin per kill that pays gold flies from the kill spot to the stats card's gold number over 200 ms, short arc, ease-out, fading in its last 30 ms; at most 8 in flight, beyond that a kill shows only its pop. The coins are images in the **HUD scene** (screen space), so they fly over the cards and land on the number.
- edit `src/systems/EnemySystem.ts` — the trigger, one line in `strike()` after line 116 (next to the gold `popText`).
- edit `src/scenes/GameScene.ts` — wiring only: 5 one-line additions (import, field, construct, `enemies.coins`, `coins.update(dt)`).
- edit `src/debug/runChecks.ts` — one invariant after line 39.

### Interfaces
```ts
export class CoinTrail {
  coin(x: number, y: number): void;   // board units, called from EnemySystem at the kill
  update(dt: number): void;           // called from GameScene.update
  broken(): string | undefined;       // > 8 in flight, or a coin at a non-finite position
}
```

### Steps
1. Create `CoinTrail.ts`, model the skeleton on `systems/FxSystem.ts` (same folder, same style). Constructor: `constructor(scene: Phaser.Scene, board: Board)`; store `private readonly hud: Phaser.Scene = scene.scene.get(SCENES.hud) as Phaser.Scene;` (copy the cast from `scenes/keys.ts:30`), `private queue: { x: number; y: number }[] = []`, `private coins: { img: Phaser.GameObjects.Image; sx: number; sy: number; tx: number; ty: number; t: number; dead: boolean; kill: () => void }[] = []`, `private static readonly MAX = 8;`. Imports: `import type Phaser from 'phaser'`, `import { artScale, COIN_TEXTURE } from '../art/textures'`, `import { SCENES } from '../scenes/keys'`, `import type { Board } from './Board'`.
2. `coin(x, y)`: `if (this.coins.length >= CoinTrail.MAX) return; this.queue.push({ x, y });`
3. `update(dt)`: drain with `for (const p of this.queue.splice(0)) { if (this.coins.length >= CoinTrail.MAX) break; /* then, per spot: */`
```ts
const s = this.board.toScreen(p);
const img = artScale(this.hud.add.image(s.x, s.y, COIN_TEXTURE), 10 / 28).setDepth(100);
const rec = { img, sx: s.x, sy: s.y, tx: 162, ty: 35, t: 0, dead: false, kill: () => {} };
rec.kill = (): void => { if (!rec.dead) { rec.dead = true; img.destroy(); } };
this.scene.time.delayedCall(500, rec.kill); // safety: a coin never outlives its flight
this.coins.push(rec);
```
then loop `for (let i = this.coins.length - 1; i >= 0; i--)` over a `c` record: `c.t = Math.min(1, c.t + dt / 0.2); const e = c.t * (2 - c.t);` then `c.img.x = c.sx + (c.tx - c.sx) * e; c.img.y = c.sy + (c.ty - c.sy) * e - Math.sin(Math.PI * c.t) * 24; c.img.alpha = c.t > 0.85 ? Math.max(0, (1 - c.t) / 0.15) : 1;` and `if (c.t >= 1) { c.kill(); this.coins.splice(i, 1); }`.
4. `broken()`: return `` `${this.coins.length} coins in flight` `` if `> CoinTrail.MAX`, else `` `coin at (${x}, ${y})` `` for a record whose `img.x`/`img.y` is not `Number.isFinite`, else `undefined`.
5. `EnemySystem.ts`: `import type { CoinTrail } from './CoinTrail';` after line 12; field `/** The kill-gold trail (set by GameScene): one coin per kill that pays gold. */ coins: CoinTrail | undefined = undefined;` after line 41 (next to `towers`); in `strike()` after line 116: `if (e.def.gold > 0) this.coins?.coin(e.x, e.y - 20);` (same anchor as the gold pop).
6. `GameScene.ts`: `import { CoinTrail } from '../systems/CoinTrail';` after line 12; `coins!: CoinTrail;` after line 43; `this.coins = new CoinTrail(this, this.board);` after line 64; `this.enemies.coins = this.coins;` after line 70; `this.coins.update(dt);` after line 135.
7. `runChecks.ts` after line 39: `['coins.valid', (g) => g.coins.broken()],`

### Pitfalls
- The gold number is at (162, 35) CSS px: stats card box at (EDGE + 98, 12 + 72 / 2), number at local (48, −13). Hard-code it as `tx: 162, ty: 35`; do **not** import or read `StatsCard` (it is shared with T0030/T0045/T0054).
- Cap drop happens in the drain (`break`), not just in `coin()`: one splash frame can enqueue several kills; dropped ones must never fly (never re-queue them).
- The 500 ms safety timer can fire after the 200 ms arrival destroy: the `rec.dead` flag must guard against a double `destroy()`. Timer lives on `this.scene.time` (game time), so it freezes with pause and is cleared on scene shutdown — never `hud.time`.
- One coin per kill, whatever the amount — gate on `e.def.gold > 0`, **not** on `paid` (mint bonuses never add coins, and T0054's doubled gold flies the same one coin). Never touch `popText`, the tally, its pop (T0017), or `Sfx`: the trail is in addition to the unchanged gold pop.
- Coins must be HUD-scene objects (a board-space coin is hidden under the top cards at arrival); `setDepth(100)` keeps them above HUD parts added later (T0060/T0067 top banners). Scale `10 / 28` = ~10 px of the same `COIN_TEXTURE` as the tally — no new texture, no `Math.random()`.

### Tests
none
