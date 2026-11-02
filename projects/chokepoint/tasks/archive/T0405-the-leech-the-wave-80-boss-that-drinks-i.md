---
id: T0405
title: "The Leech: the wave-80 boss that drinks its escorts"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T05:03:59Z
claimed_at: 2026-11-02T13:27:39Z
finished_at: 2026-11-02T13:55:09Z
---

## Goal
The boss ladder's next step: the wave-80 boss drinks its escorts' health into itself, so the boss fight has a real focus choice — kill the escorts to keep it dry, or burst it before the drinks run out.

## Details
- The Leech, the wave-80 boss (the boss lane in core/waves.ts, the T0402/T0404 plan pattern): a big pink shape with an open maw — a circle with a wedge cut from the front (a new shape in the set, no theme), boss scale 0.5. hp 720 at wave 1 (the boss base, wave-scaled like every boss), speed 0.9, gold 20, livesCost 1, threat 400 (the boss ladder's next step — 50, 95, 150, 200, 250 → 300 → 350 → 400; if T0402 or T0404 landed at a value that makes 400 a skip, take the next step after the highest existing boss threat), spawnOnly, fromWave 80.
- The wave-80 plan: the Leech + 2 Hauler escorts, all in the boss lane — spawnOnly, the regular cap and the wave mix unchanged (the T0404 Wards pattern).
- The drink: every 5 s while a Hauler escort lives, after a 0.8 s white telegraph (the Colossus outOfReach telegraph's language), the Leech drinks from the nearest living escort: 8% of the Leech's max hp moves from the escort to the Leech (capped at the Leech's max) over ~0.6 s — a thin pink line from the maw to the escort, the escort's hp bar draining across the drink, a small green "+N" pop at the Leech when the drink lands (the streak life-pop's green, T0045). The drink is damage: if it kills the escort, it is a normal death (gold pop, chips, the combo counts).
- 8 drinks, then the maw closes: the wedge fills in and the token reads as a plain circle for the rest of its life — the full readout, no chip. If the player kills both escorts first, the maw closes at once (the dry readout).
- One-time teach: the Leech's first drink in a run shows a one-time white chip near the line: "drinks its escorts" (~1.5 s, the T0307 chip's language, once per run). The name tag (T0085) fires on the first spawn as usual.
- The boss card, the leak, the jolt, the arrival ring, the horn and the death burst all inherit the boss's own paths (the T0292/T0317 pattern) — no new HUD element.

## Compared with what exists
| Existing | What it shares | What the Leech does that it can't (not numbers) |
| --- | --- | --- |
| Dot | walk | never acts on other enemies; the Leech moves hp between living enemies |
| Block | walk | never acts on other enemies |
| Colossus | walk, boss lane | goes out of reach on a clock; it never moves hp between enemies |
| Guard | walk, boss-lane escort | is a shield for the Titan; it never moves hp |
| Titan | walk, boss lane + escort | halves its own damage while its Guard lives; it never heals from allies |
| Orb | walk, boss lane | replaces itself with Shards at half hp; the Leech moves hp while both stay alive |
| Hive | walk, boss lane | adds enemies (pops Dots); the Leech moves hp, not enemies |
| Shard | walk, split product | a piece of an Orb; it never acts on other enemies |
| Sprinter | walk | ramps its own speed when hit; the Leech's change flows between two enemies |
| Splitter | walk | replaces itself on death; the Leech acts while both stay alive |
| Hauler | walk, boss-lane escort | carries a fortune on leak; it never moves hp (the Leech drinks it) |
| Mute | walk | silences towers (tower interaction); the Leech interacts with other enemies |
| Flyer | walk (flies) | crosses the sky in a straight line; it never acts on other enemies |
| Ward | walk, boss-lane escort (T0404) | ignores tower control; the Leech is a source of damage, not control |
| Bulwark | walk | halves damage from the front; it never moves hp |
| Splinter | walk, split product | a piece of a Splitter; it never acts on other enemies |
| Mender | walk, boss lane + escorts (T0404, in the pool) | heals itself and its escorts from nothing on a clock; the Leech's heal is the escorts' hp — killing them dries it out |

## Acceptance criteria
- [ ] Wave 80's plan sends the Leech + 2 Hauler escorts in the boss lane; every other wave's plan is unchanged and the regular-enemy cap stays 10 of 10 (the Leech is spawnOnly).
- [ ] Every 5 s the Leech flashes white for 0.8 s, then drinks 8% of its max hp from the nearest living escort over ~0.6 s — the pink line, the escort's hp bar draining, the green "+N" pop at the Leech.
- [ ] After 8 drinks — or the moment both escorts die — the maw closes (the wedge fills in) and no more drinks happen.
- [ ] An escort killed by a drink dies as a normal death (gold pop, chips, the combo counts).
- [ ] The Leech's first drink in a run shows the one-time "drinks its escorts" chip; the name tag fires on the first spawn.
- [ ] The Leech leaks at 1 life with the boss's jolt scale, and the boss card, the arrival ring, the horn and the death burst read it as the run's boss.

## Design (architect, desktop)

### Files
- create `src/content/enemies/leech.ts` - the Leech boss def (id `leech`, pink `maw`, size 0.5, spawnOnly, fromWave 80, threat 400, `drinks` spec).
- create `src/core/drink.ts` - pure `drinkLeg(spec, clock)` so `Enemy.advance()` and the hook compute the same leg.
- create `src/systems/enemyHooks/leechDrink.ts` - the whole drink: white telegraph arm, per-frame drain + heal, maw close (8 drinks OR both escorts dead), green `+N` pop, one-time teach, the pink line.
- create `src/systems/fx/leechTell.ts` - the one-time white chip "drinks its escorts" (the T0307 chip language).
- create `tests/core/drink.test.ts` - unit test for `drinkLeg`.
- edit `src/content/types.ts` - add `'maw'` to `Shape`; add `EnemyDef.drinks?` spec.
- edit `src/content/enemies/index.ts` - import + register `leech` in `ENEMIES` (place after `ward`, before `bulwark`).
- edit `src/core/waves.ts` - `bossId(80)='leech'`; wave-80 plan (2 Haulers + Leech) in the boss branch.
- edit `src/entities/Enemy.ts` - `drinkReady` field (reset in `spawn()`); the white telegraph in `advance()`.
- edit `src/systems/EnemySystem.ts` - public `drain()` (the drink's damage + normal kill); `brokenLeech()` invariant.
- edit `src/art/shapes.ts` - add `maw: 0` to the `sides` Record.
- edit `src/art/paint.ts` - `shapePath` case for `'maw'` (a circle with a wedge cut from the bottom).
- edit `src/art/textures.ts` - `LEECH_CLOSED_TEXTURE = 'enemy:leech-closed'`.
- edit `src/art/entities.ts` - paint the closed (plain circle) Leech texture.
- edit `src/systems/enemyHooks/index.ts` - `ENEMY_HOOKS` += `leechDrink` (next to `titanShield`).
- edit `src/debug/runChecks.ts` - `INVARIANTS` += `enemies.leech` line.
- edit `tests/content.test.ts` - add `'leech'` to the size-0.5 list; validate the `drinks` spec.
- edit `tests/core/waves.test.ts` - wave-80 plan assertions (mirror the wave-50 block).

### Interfaces
```ts
// content/types.ts  —  Shape += | 'maw'
drinks?: { everySec: number; telegraphSec: number; drinkSec: number; maxDrinks: number; drinkPct: number; escort: string };
// core/drink.ts
export type DrinkLeg = 'idle' | 'flash' | 'drink';
export function drinkLeg(spec: NonNullable<EnemyDef['drinks']>, clock: number): DrinkLeg; // 'idle'|'flash'|'drink'
// systems/EnemySystem.ts (public, near beamTick / brokenFly)
drain(e: Enemy, amount: number): boolean;      // takes `amount` hp, no flash/mark/shield; kill pays as a normal death (source undefined). true when it killed
brokenLeech(): string | undefined;             // an active Leech with hp NaN or hp > maxHp
// systems/fx/leechTell.ts
export function leechTell(fx: FxSystem, x: number, y: number): void; // white chip "drinks its escorts", ~1.5 s
```
`leech.ts` spec: `drinks: { everySec: 5, telegraphSec: 0.8, drinkSec: 0.6, maxDrinks: 8, drinkPct: 0.08, escort: 'hauler' }`. `look: { shape: 'maw', color: 'pink', size: 0.5 }`. `hp: 720, speed: 0.9, gold: 20, livesCost: 1, threat: 400, fromWave: 80, spawnOnly: true`.

### Steps
1. **core/drink.ts**: `const t = clock % spec.everySec; const fs = spec.everySec - spec.telegraphSec - spec.drinkSec; return t < fs ? 'idle' : t < fs + spec.telegraphSec ? 'flash' : 'drink';`
2. **types.ts**: add `'maw'` to the `Shape` union (after `'wings'`); add the `drinks` field to `EnemyDef` (after `outOfReach`), with a doc comment naming `core/drink.ts` and the hook.
3. **enemies/leech.ts**: copy `titan.ts` and set the fields above; `description: 'A big pink maw that drinks the health of the Haulers beside it into itself, until its maw closes.'`
4. **enemies/index.ts**: import `leech`; add one line to `ENEMIES` after `ward`.
5. **waves.ts**: in `bossId`, add `wave === 80 ? 'leech' :` as the FIRST clause. In the `isBossWave` branch of `planWave`, after the `wave === 20` line add: `if (wave === 80) return { number: wave, spawns: [{ enemy: 'hauler', delaySec: 0 }, { enemy: 'hauler', delaySec: 1.2 }, { enemy: 'leech', delaySec: 2.4 }], hpMul: waveHpMul(wave), tags: ['boss'] };`
6. **Enemy.ts**: add `drinkReady = false;` field; `this.drinkReady = false;` in `spawn()` (next to `shielded`). In `advance()`, add to `wasWhite`: `|| (this.def.drinks !== undefined && this.drinkReady && drinkLeg(this.def.drinks, this.age) === 'flash')`; and before `const white = ...` compute `const drinkFlash = this.def.drinks !== undefined && this.drinkReady && drinkLeg(this.def.drinks, this.age) === 'flash';` and add `|| drinkFlash` to `white`. Import `drinkLeg`.
7. **EnemySystem.ts**: `drain(e, amount)`: `if (!e.active || amount <= 0) return false; e.hp -= amount; if (e.hp <= 0) { this.kill(e, undefined); return true; } return false;`. `brokenLeech()`: find an active enemy with `def.drinks !== undefined` and `!Number.isFinite(e.hp) || e.hp > e.maxHp + 1e-6`.
8. **art**: `shapes.ts` add `maw: 0` to `sides`; `paint.ts` `shapePath` add (before the final `shapePoints` line): `if (shape === 'maw') { const hw = Math.PI / 5; ctx.beginPath(); ctx.arc(x, y, radius, Math.PI / 2 + hw, Math.PI / 2 - hw); ctx.closePath(); return; }`. `textures.ts` add the constant. `entities.ts`, after the Guard disc block, paint `LEECH_CLOSED_TEXTURE` with `paintToken(ctx, 'circle', cx, cy - depth/2, r, PALETTE.pink, deepOf('pink'), { depth })` using the Leech's `r`/`depth` (like the plate/disc).
9. **leechTell.ts**: copy `haulerTold.ts`, text `'drinks its escorts'`, `delay: 1200`.
10. **leechDrink.ts**: model on `bossPhase.ts` (a per-frame Graphics kept in the hook). Closure state: `leechSerial, age, drinksDone, mawClosed, drinking, drinkTarget, drinkTotal, drinkRemaining, drinkGained, toldX, toldY, told(false), line`. In `update(dt)`: find the active `e.def.drinks !== undefined` enemy (`L`); if none, clear the line and return. On new `L.serial` reset the per-boss state (not `told`). `age += dt`. Count living escorts (`e.def.id === L.def.drinks.escort`); if none and not closed, close the maw. `canDrink = !mawClosed && drinksDone < maxDrinks && escorts.length > 0; L.drinkReady = canDrink;`. `leg = drinkLeg(spec, age); inDrink = leg === 'drink' && canDrink`. When entering the drink leg (`inDrink && !drinking`): set `drinking`, pick the nearest escort, `drinkTotal = drinkPct * L.maxHp`, `drinkRemaining = drinkTotal`, `drinkGained = 0`, set `toldX/toldY` to the maw↔escort midpoint. While in the drink: `amount = min(drinkRemaining, (drinkTotal/drinkSec) * dt)`; `before = target.hp`; `died = enemies.drain(target, amount)`; `after = target.active ? target.hp : 0`; `added = min(before - after, L.maxHp - L.hp)`; `L.hp = min(L.maxHp, L.hp + added)`; `drinkGained += added`; `drinkRemaining = died ? 0 : drinkRemaining - amount`; if `died` set `drinkTarget = undefined`; redraw the line `L→target` (Graphics `lineStyle(2, PALETTE.pink, 0.85)`, `DEPTH.fx`). When leaving the drink leg (`!inDrink && drinking`): `drinksDone += 1`; if `drinkGained > 0` `fx.popText(L.x, L.y - 20, '+' + Math.round(drinkGained), PALETTE.green)`; if `!told` `leechTell(fx, toldX, toldY)` and `told = true`; if `drinksDone >= maxDrinks` close the maw; clear the line; reset the drink fields. `closeMaw`: guard `mawClosed`, set it, `L.setTexture(LLEECH_CLOSED)`. Clear the line in `onKill`/`onLeak` when the Leech or a target dies.
11. **enemyHooks/index.ts**: import + `ENEMY_HOOKS` line for `leechDrink`.
12. **runChecks.ts**: add `['enemies.leech', (g) => g.enemies.brokenLeech()]`; update `level.bossPlan` to `const want = g.run.wave === 20 ? 2 : g.run.wave === 80 ? 3 : 1;`.
13. **tests/content.test.ts**: add `|| e.id === 'leech'` to the size-0.5 condition; add a `drinks` validation (everySec > telegraphSec + drinkSec, maxDrinks > 0, 0 < drinkPct <= 1, escort exists).
14. **tests/core/waves.test.ts**: add wave-80 assertions mirroring the wave-50 block: `bossId(80) === 'leech'`; `planWave(80, seed, ENEMIES)` equals the 3-spawn plan with `tags ['boss']` and `hpMul waveHpMul(80)` on every seed; and a loop `for wave 1..80` asserting only wave 80 sends a Leech.
15. **tests/core/drink.test.ts**: assert the leg boundaries for a `{ everySec: 5, telegraphSec: 0.8, drinkSec: 0.6, maxDrinks: 8, drinkPct: 0.08, escort: 'hauler' }` spec (idle < 3.6, flash 3.6–4.4, drink 4.4–5.0, wraps).

### Pitfalls
- **Telegraph vs drain must agree on the leg**: both `advance()` and the hook call `core/drink.ts drinkLeg(spec, age)`; never duplicate the modulo (they use the same `age`, so they stay in sync).
- **The drink's kill must be a normal death**: deal damage only through `EnemySystem.drain()` (which calls `kill(e, undefined)` → gold pop, chips, combo, sound, no mint). Do NOT call `e.hit()` in the hook (no kill/gold/combo would fire).
- **The pink line is per-frame, not `fx.track`** (track tweens once). Keep one `Graphics` in the hook (bossPhase pattern), redraw each drink frame, and `destroy()` it when the drink ends, the Leech/target dies, or a new Leech spawns — otherwise it leaks between drinks.
- **Maw-close is a one-time texture swap** guarded by `mawClosed`; a recycled pooled slot's texture is reset by `Enemy.spawn()`, so a later non-Leech never shows a stale maw.
- **`drinkReady`** is reset in `Enemy.spawn()` (a recycled slot must not keep a stale telegraph) and is read one frame stale in `advance()` (the hook sets it after advance) — imperceptible at a 0.8 s flash.
- **Frame-rate independence**: everything is `dt`-based (`age += dt`, `amount = (drinkTotal/drinkSec) * dt`); no 60 fps assumption, and the 8-drink count increments once per drink leg (the `drinking` transition flag), not per frame.
- **content test**: the Leech is size 0.5, so without adding `'leech'` to the size-0.5 list the test fails (0.5 > 0.45).
- **threat**: use 400. At build time, if a landed boss already has threat ≥ 400 (T0402/T0404), set the Leech to that boss's threat + 50 instead (the ladder's next step); the value is documentary (the Leech is spawnOnly, never drawn from the budget).

### Tests
- `tests/core/drink.test.ts` (new): the drink-cycle leg boundaries.
- `tests/content.test.ts`: the `drinks` spec validation + Leech size.
- `tests/core/waves.test.ts`: the wave-80 boss-lane plan (deterministic on every seed), `bossId(80)`, and the spawnOnly exclusion.

## Result (attempt 1, desktop)

Added the Leech, the wave-80 boss: a big pink maw (new `maw` shape — a circle with a wedge cut, plus a plain-circle closed-maw texture) that every 5 s flashes white for 0.8 s and drinks 8% of its max hp from its nearest living Hauler escort over 0.6 s (pink line, draining escort bar, green +N pop), until its 8th drink or the last escort dies, whichever closes its maw for good; a drink-kill is a normal death. New files: `content/enemies/leech.ts`, `core/drink.ts` (shared cycle leg), `systems/enemyHooks/leechDrink.ts`, `systems/fx/leechTell.ts` (one-time "drinks its escorts" chip) and `tests/core/drink.test.ts`; wave 80 now sends 2 Haulers + the Leech (boss card, horn, arrival ring, jolt and death burst all inherit via `bossId`), with the `enemies.leech` invariant and content/waves tests added. One deviation: the `level.bossPlan` invariant keeps its wave-70 case (the design's expression would have dropped it and fired on the Mender's 3-spawn wave).

- Self-review: APPROVE
- Time: 27.5 min
- Deleted tests/_leechProbe.test.ts, as the agent asked.

```
projects/chokepoint/game/src/art/entities.ts       |  10 +-
 projects/chokepoint/game/src/art/paint.ts          |   9 ++
 projects/chokepoint/game/src/art/shapes.ts         |   2 +-
 projects/chokepoint/game/src/art/textures.ts       |   2 +
 .../chokepoint/game/src/content/enemies/index.ts   |   2 +
 .../chokepoint/game/src/content/enemies/leech.ts   |  17 +++
 projects/chokepoint/game/src/content/types.ts      |  10 +-
 projects/chokepoint/game/src/core/drink.ts         |  15 +++
 projects/chokepoint/game/src/core/waves.ts         |   9 +-
 projects/chokepoint/game/src/debug/runChecks.ts    |   3 +-
 projects/chokepoint/game/src/entities/Enemy.ts     |  11 +-
 .../chokepoint/game/src/systems/EnemySystem.ts     |  16 +++
 .../game/src/systems/enemyHooks/index.ts           |   2 +
 .../game/src/systems/enemyHooks/leechDrink.ts      | 121 +++++++++++++++++++++
 .../chokepoint/game/src/systems/fx/leechTell.ts    |  26 +++++
 projects/chokepoint/game/tests/content.test.ts     |  11 +-
 projects/chokepoint/game/tests/core/drink.test.ts  |  34 ++++++
 projects/chokepoint/game/tests/core/waves.test.ts  |  17 +++
 18 files changed, 307 insertions(+), 10 deletions(-)
```
