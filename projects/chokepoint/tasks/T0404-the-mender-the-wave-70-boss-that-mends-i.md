---
id: T0404
title: "The Mender: the wave-70 boss that mends itself and its pack"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T04:17:18Z
---

## Goal
The wave-70 boss (next in the every-10 lane): the first enemy that heals — the Mender mends itself and its escorts on a clock, so the fight is a net-damage race and the player chooses between burst, burn and separating the pack.

## Details
- **The wave (the boss lane).** Wave 70 sends exactly the Mender with two Ward escorts — the Mender carries the wave's whole budget minus the escorts (each at the Ward's own threat of 1, the lane's own arithmetic, as the Titan's 95 + Guard's 5 did, T0259): the two Wards spawn 0.4 s apart, the Mender 1.2 s behind them. The Mender is `spawnOnly`; the regular cap is untouched. The Wards walk at their own speed, so the pack walks together.
- **The Mender.** `walk`, hp 720 (wave-scaled like every boss), speed 0.9, gold 20, livesCost 1, fromWave 70, spawnOnly. Look: a solid circle in orange at the boss scale (size 0.5) — a silhouette no enemy wears (the board's circles are the small red Dot, Splitter, Ward and Splinter; the Mute is a hollow ring).
- **The mend.** The Mender has 4 mends. Its clock starts when it spawns: every 5 s while mends remain, a thin ring in its own orange contracts from 3 cells in to the token over 1.2 s (every other ring on the board grows outward — the closing one reads as taking back), then it mends: it and each living Ward escort within 3 cells restore 15% of their own max hp. The mend's moment: a small white flash on each mended token (the hit flash, turned into a heal) and the BossCard's hp bar climbing. A mend never revives: a killed Ward does not come back, and later mends heal only the living. After the fourth mend the ring never forms again — no sound, the pips say it.
- **The pips (on the card, not the board).** The BossCard's hp row wears four small pips (the tier pip's shape, muted ink) — one per mend remaining — a pip fading as each mend is used. The hp bar alone cannot show this: a mended bar looks like a fresh one. Nothing new stays on the board; the telegraph ring and the flash are the only marks and both are transient.
- **Control.** Frost slow, Anchor root and Push gusts work on the Mender (its Wards ignore control, as always). The mends land on their clock even while the Mender is rooted. A Push gust separates the Mender from its pack: an escort more than 3 cells away stops being healed.
- **The rest of the lane.** It inherits everything the boss lane already has: the boss chip on the preview and the banner, the arrival ring and horn, the BossCard, the death burst and name card, the death horn, and a 1-life leak with the boss's escape horn.

## What counters it, and what it punishes
- Counters: burst — drop the Mender before its later mends land and pay a smaller tax; DoT — the Ember burn ticks on its own clock, independent of the mends; Push — separate it from its escorts and the pack loses its heal.
- It punishes: steady slow dps (a trickle under the heal rate means the Wards walk forever), and builds with no burst or burn; a Ward that leaks costs a life and the Mender keeps mending.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Block | `walk`, slow and tough (the idea's closest) | only soaks damage; the Mender restores 15% of max hp to itself and its escorts, four times |
| Hive | `walk`, the boss lane, a pulse on a clock while it walks | the Hive's pulse adds enemies to the board; the Mender's pulse gives hp back — it grows the pack's life, not its size |
| Colossus | `walk`, the boss lane, a timed beat on a clock | the Colossus's beat denies the player's damage (out of reach); the Mender's beat gives its own side hp back while it stays fully hittable |
| Ward | `walk`, ignores control, walks as an escort | the Ward is merely immune; the Mender's Ward escorts are also kept topped up (15% of max every 5 s), so they never die to chip damage |
| Titan | `walk`, the boss lane, the escort pattern (escort first, boss behind, T0259) | the Titan's escort shields it from damage; the Mender's escorts are its heal targets — clearing them is a choice, not a step |

## Acceptance criteria
- [ ] Wave 70 sends exactly one Mender (boss lane, `spawnOnly`) with two Ward escorts behind it, and nothing else.
- [ ] The Mender reads as a new silhouette: a solid orange circle at the boss scale, distinct from the small red circles (Dot, Ward, Splitter, Splinter) and the Mute's hollow ring.
- [ ] While mends remain, every 5 s a thin orange ring contracts from 3 cells to the Mender over 1.2 s, then the Mender and each living Ward within 3 cells flash white and the BossCard's hp bar climbs 15% of max.
- [ ] The BossCard's hp row wears four muted pips; one fades per mend; after the fourth mend the ring never forms again (no sound).
- [ ] A killed Ward does not come back: mends heal only the living, and an escort more than 3 cells from the Mender (e.g. after a Push gust) stops being healed.
- [ ] Frost slow, Anchor root and Push gusts work on the Mender but not its Wards; the mends land on their clock even while the Mender is rooted.
- [ ] The Mender inherits the boss lane's moments: the boss chip on preview and banner, the arrival ring and horn, the death burst and name card, the death horn, and the 1-life leak with the boss's escape horn.
- [ ] No wave other than 70 changes: the every-10 lane below it and the regular mix are untouched.

## Design (architect, desktop)

### Files
- create `src/content/enemies/mender.ts` - the wave-70 boss def (model `content/enemies/hive.ts`)
- create `src/core/mendClock.ts` - pure mend schedule (model `core/hivePops.ts` exactly)
- create `src/systems/fx/mendRing.ts` - the closing telegraph ring (model `fx/auraRing.ts`)
- create `src/systems/enemyHooks/mendPack.ts` - the mend clock + pack heal (model `enemyHooks/hivePops.ts`)
- create `tests/core/mendClock.test.ts` - unit tests for the schedule (model `tests/core/hivePops.test.ts`)
- edit `src/content/types.ts` - add the `mends` field to `EnemyDef`, right after `pops`
- edit `src/content/enemies/index.ts` - import + one `ENEMIES` line, after `ward`
- edit `src/core/waves.ts` - `bossId` case, the wave-70 `planWave` branch, the two doc comments
- edit `src/systems/enemyHooks/index.ts` - import + one `ENEMY_HOOKS` line, after `hivePops`
- edit `src/ui/hud/BossCard.ts` - the four mend pips under the bar
- edit `src/debug/runChecks.ts` - fix `level.bossPlan`, add two invariants
- edit `tests/content.test.ts` - size-0.5 exception + `mends` validation
- edit `tests/core/waves.test.ts` - the wave-70 boss-lane tests

### Interfaces
```ts
// content/types.ts, on EnemyDef after `pops`:
/** The mend clock (the Mender): every `everySec` after its own spawn, up to `count`, it and each living escort of `escortId` within `radius` cells restore `frac` of their own max hp, telegraphed `telegraphSec` early by one thin ring closing in; never a revive, an escort past the radius missed (core/mendClock.ts, systems/enemyHooks/mendPack.ts). */
mends?: { everySec: number; count: number; radius: number; frac: number; telegraphSec: number; escortId: string };
```
`core/mendClock.ts`: `export function mendsDue(clockSec: number, rule: MendsRule): number` and `export function nextMendAt(clockSec: number, rule: MendsRule): number` (`type MendsRule = NonNullable<EnemyDef['mends']>`), bodies copied from `popsDue`/`nextPopAt` with `count` for `max`.
`systems/fx/mendRing.ts`: `export function mendRing(fx: FxSystem, x: number, y: number, fromCells: number, toRadius: number, color: number): void` — `if (fx.full) return;` then a `graphics` at `DEPTH.preview`, `fillRing(g, 0, 0, fromCells * CELL, 3, 0, Math.PI * 2, color, 0.9)`, `fx.track(g, 1200, { scale: toRadius / (fromCells * CELL), alpha: 0, ease: 'Quad.easeIn' })` (closes in; every other ring grows).
`systems/enemyHooks/mendPack.ts`: `export const mendPack: MakeEnemyHook = ({ enemies, fx }) => ...` — closure `Map<Enemy, { serial: number; clock: number; landed: number; ringed: boolean }>`; in `update(dt)`: prune inactive, skip no `def.mends`, fresh state on serial change, `m.clock += dt` (its own clock, even slowed or rooted); when `!m.ringed && at >= 0 && m.clock >= at - rule.telegraphSec` set `m.ringed` and call `mendRing(fx, e.x, e.y, rule.radius, e.def.look.size * CELL, PALETTE[e.def.look.color])`; `while (m.landed < mendsDue(m.clock, rule)) { m.landed += 1; m.ringed = false; ... }` where the heal is, on the mender and every `o.active` with `o.def.id === rule.escortId` and `Math.hypot(o.x - e.x, o.y - e.y) <= rule.radius * CELL`: `e.flash = 0.06; e.setTintFill(0xffffff); e.hp = Math.min(e.maxHp, e.hp + e.maxHp * rule.frac);` (exactly the hit flash, turned into a heal).
`mender.ts`: `{ id: 'mender', name: 'Mender', behavior: 'walk', hp: 720, speed: 0.9, gold: 20, livesCost: 1, threat: 348, fromWave: 70, spawnOnly: true, mends: { everySec: 5, count: 4, radius: 3, frac: 0.15, telegraphSec: 1.2, escortId: 'ward' }, look: { shape: 'circle', color: 'orange', size: 0.5 } }` with description 'Mends itself and its pack: every 5 s it and its living Wards within three cells flash and restore 15% of their max hp, four times.' and hive-style comments (`threat: 348, // the wave-70 budget's worth minus its two Wards (each at the Ward's own threat of 1, as the Titan's 95 + the Guard's 5 did)`).

### Steps
1. `content/types.ts`: add the `mends` field after `pops`.
2. `content/enemies/mender.ts`, then the import and the `ENEMIES` line after `ward` in `index.ts`.
3. `core/mendClock.ts` (copy `hivePops.ts`, rename).
4. `systems/fx/mendRing.ts`.
5. `systems/enemyHooks/mendPack.ts`, then its import + `mendPack,` line after `hivePops,` in `enemyHooks/index.ts`.
6. `core/waves.ts`: in `bossId`, put `wave === 70 ? 'mender' :` at the FRONT of the existing ternary (whatever case is first — T0402 may have added 60); in `planWave`, after the wave-20 branch add: `// Wave 70 is the Mender's wave: its two Ward escorts walk in ahead of it, its heal targets (core/mendClock.ts).` then `if (wave === 70) return { number: wave, spawns: [{ enemy: 'ward', delaySec: 0 }, { enemy: 'ward', delaySec: 0.4 }, { enemy: 'mender', delaySec: 1.2 }], hpMul: waveHpMul(wave), tags: ['boss'] };` (keep the `planNormalWave(wave, rng, enemies);` parity call that precedes both branches); append ", the Wards and the Mender on wave 70" to the boss list in the `isBossWave` and `planWave` doc comments.
7. `ui/hud/BossCard.ts`: add field `private pips: Phaser.GameObjects.Graphics | undefined;`; import `mendsDue` from `core/mendClock`; in `build()` replace the final `return scene.add.container(0, 0, [card, token, name, bar]);` with a `parts` array that, when `boss.def.mends !== undefined`, pushes `scene.add.graphics().setPosition(0, 20)` (under the bar) stored in `this.pips`; in `refresh()` append: clear `this.pips`, `const used = mendsDue(boss.age, rule);`, for `i in 0..rule.count` `pips.fillStyle(PALETTE.muted, i < rule.count - used ? 0.9 : 0.18).fillCircle((i - (rule.count - 1) / 2) * 10, 0, 3)`; in `fadeOut()`'s `onComplete` reset `this.pips = undefined;`; add one sentence to the class doc about the pips. Full state fits: token/name at y -7, bar at y 12, pips at y 20 (r 3) inside the 54-tall card — no new width, no notch boss and no pip boss share a card.
8. `debug/runChecks.ts`: change `level.bossPlan`'s `const want = g.run.wave === 20 ? 2 : 1;` to `const want = g.run.wave === 20 ? 2 : g.run.wave === 70 ? 3 : 1;`; after the `enemies.bossSlot` line add `['enemies.menderSlot', (g) => (g.run.wave === 70 || !g.enemies.all.some((e) => e.active && e.def.id === 'mender') ? null : 'a Mender alive off its wave 70')],` and after it `['enemies.hpCap', (g) => (g.enemies.all.every((e) => !e.active || e.hp <= e.maxHp + 1e-9) ? null : 'an enemy above its max hp')],`.
9. Tests: `tests/core/mendClock.test.ts` (rule from `getEnemy('mender').mends!`: due 0/0/1/2/3/4 at 0, 4.99, 5, 10, 15, 20; capped at 4; negative 0; next 5, 10, 20, -1 at 20); `tests/content.test.ts`: add `|| e.id === 'mender'` to the size-0.5 exception and, after the `pops` block, a `mends` block validating `everySec > 0`, `count > 0`, `radius > 0`, `0 < frac <= 1`, `telegraphSec > 0` and `< everySec`, `escortId` exists in `ENEMIES`; in `tests/core/waves.test.ts`'s boss describe add: `bossId(70)` is `'mender'` and `planWave(70).spawns[2]!.enemy === bossId(70)`; seeds `[1, 7, 42, 70]` all give `spawns` exactly `[{ ward, 0 }, { ward, 0.4 }, { mender, 1.2 }]`, tags `['boss']`, hpMul `waveHpMul(70)`; and `for (let wave = 1; wave <= 70; wave++)` no wave but 70 sends a `mender`.
10. `npm run check` and `npm run smoke`.

### Pitfalls
- The Mender takes no control-immunity: Frost/Anchor/Push already reach it and the Wards deny on their own def — do not add control code.
- The mend clock lives in the hook only; the pips derive from `mendsDue(boss.age, rule)` (same pure clock), never from the hook's closure.
- Heal clamps at `maxHp` and only touches `active` enemies; a killed or gust-separated Ward is simply not in the loop — no revive path.
- Don't touch `Enemy.ts`, `EnemySystem.ts`, `Sfx.ts` or any `art/` file: the circle-orange token, texture, preview tokens, banner chip, arrival horn/ring, death burst/name card/horn and escape horn all fall out of the def, `bossId` and the `boss` tag.
- Keep hook state in the closure keyed by `Enemy` with a `serial` check (pool reuse); `m.ringed` must reset after each landed mend so the next one telegraphs.
- The ring's 1200 ms tween is wall-clock like every fx; the Hive's telegraph has the same property at 2× — do not try to sync it.
- `BossCard` pips must render only for a boss with `def.mends`, so every other boss's card is unchanged.

### Tests
- `tests/core/mendClock.test.ts` (new, as above); the wave-70 additions in `tests/core/waves.test.ts`; the `mends` validation in `tests/content.test.ts`.
