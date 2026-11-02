---
id: T0426
title: "The Gorge: the wave-90 boss that feeds on your leaks"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T14:32:01Z
---

## Goal
The next boss in the lane, wave 90: a big shape that walks the road and grows stronger every time the player lets something through — the first wave won by not leaking, not by melting faster.

## Details
- The wave-90 plan sends 2 Splinters, the Gorge 1.2 s behind (the Leech's line). The boss lane inherits everything through the bossId and the boss tag: the preview chip, the arrival horn and ring, the BossCard, the death burst and name card, the escape horn.
- The feeding: while the Gorge lives, every enemy other than the Gorge that leaks makes the Gorge flash white and restore 15% of its max hp, with a thin red ring contracting in from 2 cells onto it (a new fx, the mend ring's shape in the Gorge's own color). At most 2 feedings (its 2 escorts). Never a revive: hp caps at max, and a killed Gorge stays dead. The Splinter's own leak still costs its life and breaks the kill combo as it does today — the feeding adds to it, never replaces it.
- The feeding is event-driven, not on a clock: nothing happens unless a leak happens, so the wave's decision is the player's — kill the fast Splinter before it crosses, or take the double sting (a life, and the Gorge 15% back).
- The first feeding teaches it once: a small white "leaks feed it" chip at the Gorge's spot (the leechTell pattern, the Leech's "drinks its escorts" line). The BossCard's hp row wears 2 muted pips, one fading per feeding used (the Mender's 4-pip line).
- Exact numbers: hp 720 (the boss norm), speed 0.9 cells/s, gold 20, livesCost 1, fromWave 90, spawnOnly, threat = the rest of the wave-90 budget after the Splinters' 1+1 (the Mender's rule).
- Look: a new silhouette — a thick rounded spiral (2.5 turns, open center), red (the warm family), size 0.5 (the boss norm). No enemy is a spiral; the red shapes in use are circle, square, diamond and hexagon.
- What counters it: early coverage of the road's start (the Splinter is faster than the Gorge and crosses in seconds) and burst on the Splinter before the Gorge matters; it punishes a focus-the-boss habit and every leak on its wave.

## Compared with what exists

| Existing | What it shares | What the Gorge does that it can't |
| --- | --- | --- |
| Dot | `walk`, the basic walker | its leak costs a life and nothing else; on the Gorge's wave the player's leaks are its food |
| Block | `walk`, slow and tough | leaks for 2 lives; the Gorge leaks for 1, and it is fed by the leaks of the others |
| Colossus | `walk`, the whole wave in one shape | survives by going out of reach on a clock; the Gorge survives by being refilled when the defense fails |
| Guard | `walk`, a spawnOnly escort | carries the Titan's shield; the Gorge's escorts (Splinters) threaten to leak, and their leaks feed it |
| Titan | `walk`, a boss that halves damage | its survival is carried by another enemy standing beside it; the Gorge's is an event — a leak anywhere |
| Orb | `walk`, splits at half hp | answers pressure by adding bodies; the Gorge answers the player's leaks by adding its own hp |
| Hive | `walk`, pops a Dot every 6 s | grows the group on a clock; the Gorge grows itself, and only on the player's mistakes |
| Shard | `walk`, a fast split piece | a fragment of a killed enemy; the Gorge is the thing the wave's budget is mostly spent on |
| Sprinter | `walk`, ramps faster when hit | survives by outrunning the damage as it takes it; the Gorge takes every hit and just gets refilled |
| Splitter | `walk`, splits into two Splinters | makes more enemies when it dies; the Gorge spends its Splinters — their leaks are what feed it |
| Hauler | `walk`, a leak costs gold | its leak pays the player 5 gold; the Gorge's leak costs a life, and the leaks it witnesses pay it 15% |
| Mute | `walk`, holds the towers within 2 cells still | interacts with the towers; the Gorge interacts with the run's leaks |
| Flyer | `walk` (flies), crosses the board in a straight line | avoids the road entirely; the Gorge walks the road and uses whatever gets past the towers on it |
| Ward | `walk`, ignores control | survives by being untouchable to slow, root and gust; the Gorge takes every hit — its hp is just refilled |
| Leech | `walk`, a boss that drinks its escorts | drinks the escorts' hp on its own clock; the Gorge drinks the leaks — the player's failures, not the escorts' health |
| Mender | `walk`, a boss that restores hp | mends itself and its Wards on a clock, 4 times; the Gorge mends only itself, only when a leak happens, at most 2 times |
| Bulwark | `walk`, a plate across its front | survives by facing the wrong way; the Gorge survives by the player letting something through |
| Splinter | `walk`, fast and small | its leak costs a life; beside the Gorge it also feeds the Gorge 15% of max hp |

## Acceptance criteria
- [ ] Wave 90 sends 2 Splinters + the Gorge 1.2 s behind; the preview chip, arrival horn and ring, BossCard, death burst and name card, and escape horn all wear it through the boss lane.
- [ ] A Splinter leak while the Gorge lives: the normal leak (a life, the combo break) plus the Gorge flashing white, the thin red ring contracting onto it, and 15% of max hp restored, capped at max; after 2 feedings a third leak feeds nothing; a killed Gorge never revives from a later leak.
- [ ] The first feeding shows "leaks feed it" once at the Gorge's spot; the BossCard wears 2 pips, one fading per feeding.
- [ ] The spiral token is a new shape in red at size 0.5; no other token, sound or HUD element changes.
- [ ] Unit tests for the wave-90 plan and the feeding rule; content validation for the new field; the runChecks invariants (the Gorge's spawnOnly slot and the hp cap, the level.bossPlan's wave-90 case); `npm run check` and the desktop + mobile smoke pass.

## Design (architect, cachyos-x8664)

### Files

The Gorge is a wave-90 boss that mirrors the wave-80 Leech plan (its two Splinters walk in, the Gorge 1.2 s behind). Its new mechanic is a `feeds` field: when any **other** enemy leaks, the live Gorge flashes white and restores a fixed fraction of its own max hp (a heal, never a revive), up to `max` times, with a thin ring in its own red contracting from `ringCells` cells, and a one-time teach on the first feed. It is `walk`, a new `spiral` silhouette at size 0.5 (the boss norm), and inherits the whole boss lane for free via `bossId(90)` + the `boss` tag.

**Create:**
- `src/content/enemies/gorge.ts` — the Gorge's `EnemyDef`, modeled on `mender.ts`:
  ```ts
  import type { EnemyDef } from '../types';
  export const gorge: EnemyDef = {
    id: 'gorge', name: 'Gorge',
    description: 'A red spiral that feeds on the leaks of the Splinters that walk in ahead of it.',
    behavior: 'walk', hp: 720, speed: 0.9, gold: 20, livesCost: 1, threat: 448, fromWave: 90, spawnOnly: true,
    feeds: { max: 2, frac: 0.15, ringCells: 2 },
    look: { shape: 'spiral', color: 'red', size: 0.5 },
  };
  ```
- `src/systems/enemyHooks/gorgeFeeds.ts` — a `MakeEnemyHook` with **`onLeak` only** (event-driven, no clock, model on `mendPack.ts`'s heal + `mendRing`):
  ```ts
  import { CELL } from '../../config';
  import { PALETTE } from '../../content/palette';
  import type { Enemy } from '../../entities/Enemy';
  import type { MakeEnemyHook } from './hook';
  import { gorgeTell } from '../fx/gorgeTell';
  import { mendRing } from '../fx/mendRing';

  export const gorgeFeeds: MakeEnemyHook = ({ enemies, fx }) => {
    let told = false; // the teach is once per run, kept in the closure
    return {
      onLeak(leaker: Enemy): void {
        if (leaker.def.id === 'gorge') return; // never self-feed
        const g = enemies.all.find((e) => e.active && e.def.feeds);
        if (g === undefined) return;
        const rule = g.def.feeds!;
        if (g.feedsUsed >= rule.max) return;
        g.feedsUsed += 1;
        g.flash = 0.06; g.setTintFill(0xffffff);
        g.hp = Math.min(g.maxHp, g.hp + g.maxHp * rule.frac); // a heal, never a revive
        mendRing(fx, g.x, g.y, rule.ringCells, g.def.look.size * CELL, PALETTE[g.def.look.color]); // its own red, the closing ring
        if (!told) { gorgeTell(fx, g.x, g.y); told = true; } // the one-time teach
      },
    };
  };
  ```
- `src/systems/fx/gorgeTell.ts` — the one-time teach chip, modeled **exactly** on `leechTell.ts` but with the text `'leaks feed it'`.

**Edit:**
- `src/content/enemies/index.ts` — `import { gorge } from './gorge';` and one `gorge,` line in the `ENEMIES` registry, next to its boss kin (`mender`, `leech`).
- `src/content/types.ts` — add `'spiral'` to the `Shape` union, and to `EnemyDef` (next to `mends`/`drinks`):
  ```ts
  /** The Gorge's feed: a leak of any other enemy flashes it white and restores `frac` of its own max hp
   *  (a heal, never a revive), up to `max`, with a thin ring in its own color contracting from
   *  `ringCells` cells; a one-time teach on the first feed (systems/enemyHooks/gorgeFeeds.ts,
   *  systems/fx/gorgeTell.ts). */
  feeds?: { max: number; frac: number; ringCells: number };
  ```
- `src/core/waves.ts` —
  1. `bossId`: add `wave === 90 ? 'gorge' :` at the front of the return (the wave-90 case, like wave 80 → leech).
  2. `planWave`, in the `isBossWave` branch (above the wave-80 Leech case, line 141):
     ```ts
     // Wave 90 is the Gorge's wave: its two Splinter escorts walk in ahead of it, its feed's line.
     if (wave === 90) return { number: wave, spawns: [{ enemy: 'splinter', delaySec: 0 }, { enemy: 'splinter', delaySec: 1.2 }, { enemy: 'gorge', delaySec: 2.4 }], hpMul: waveHpMul(wave), tags: ['boss'] };
     ```
  3. Update the two docstrings that list the boss lane (`isBossWave` line 113 and `planWave` lines 124-127): add "the Splinters and the Gorge on wave 90" before ", nothing else" / "— and nothing else".
- `src/art/paint.ts` — add `'spiral'` to the `customShape` set (line 116, like `'ring'`/`'maw'`), and a `spiral` case in `shapePath` (next to the `maw` case, lines 175-187): a thick rounded spiral (~2.5 turns, open center) traced as a closed fillable band (outer edge + inner edge). No rotation — the Gorge is `walk`, so `paintToken`'s side face + top give it the standing chunky-token look.
- `src/entities/Enemy.ts` — add a `feedsUsed = 0` instance field (next to `drinkReady`, with a comment: "How many feeds it has taken (the Gorge); set by systems/enemyHooks/gorgeFeeds.ts, read by the BossCard's pips") and reset `this.feedsUsed = 0` in `spawn()` (next to `this.drinkReady = false`, line 152).
- `src/systems/enemyHooks/index.ts` — `import { gorgeFeeds } from './gorgeFeeds';` and one `gorgeFeeds,` line in `ENEMY_HOOKS`, next to its kin (`mendPack`, `leechDrink`).
- `src/ui/hud/BossCard.ts` — `build()`: change `if (boss.def.mends !== undefined)` to `if (boss.def.mends !== undefined || boss.def.feeds !== undefined)`. `refresh()`: after the mends block (lines 93-102), add:
  ```ts
  const feeds = boss.def.feeds;
  if (pips !== undefined && feeds !== undefined) {
    pips.clear();
    for (let i = 0; i < feeds.max; i++) {
      pips.fillStyle(PALETTE.muted, i < feeds.max - boss.feedsUsed ? 0.9 : 0.18);
      pips.fillCircle((i - (feeds.max - 1) / 2) * 10, 0, 3); // one pip per feed remaining
    }
  }
  ```
- `tests/content.test.ts` — line 27: add `|| e.id === 'gorge'` to the size-0.5 exception list.
- `tests/core/waves.test.ts` — a wave-90 test mirroring the wave-80 Leech tests: `bossId(90) === 'gorge'`; for seeds `[1, 7, 42]`, `planWave(90, new Rng(seed), ENEMIES)` returns `spawns [{splinter,0},{splinter,1.2},{gorge,2.4}]` with `tags ['boss']` and `hpMul === waveHpMul(90)`; and "no wave but 90 sends a Gorge" (`for wave 1..90`, the count of `s.enemy === 'gorge'` in the plan is `wave === 90 ? 1 : 0`).
- `src/debug/runChecks.ts` — add two invariants next to `enemies.menderSlot` (line 103), and update `level.bossPlan` (line 186):
  ```ts
  ['enemies.gorgeSlot', (g) => (g.run.wave === 90 || !g.enemies.all.some((e) => e.active && e.def.id === 'gorge') ? null : 'a Gorge alive off its wave 90')],
  ['enemies.gorgeFeed', (g) => (g.enemies.all.every((e) => !e.active || !e.def.feeds || (e.feedsUsed >= 0 && e.feedsUsed <= e.def.feeds.max)) ? null : 'a Gorge fed past its feed count')],
  ```
  and in `level.bossPlan`, change `g.run.wave === 70 || g.run.wave === 80` to `g.run.wave === 70 || g.run.wave === 80 || g.run.wave === 90` (wave 90 sends 3 spawns, not 1).

### Interfaces

- `EnemyDef.feeds` (optional, `content/types.ts`): `{ max: number; frac: number; ringCells: number }`. `max` = feed cap, `frac` = fraction of its own max hp restored per feed (a heal, capped at `maxHp`, never a revive), `ringCells` = the radius the closing ring contracts from.
- `Enemy.feedsUsed` (a live field on `entities/Enemy.ts`): the feed count, set by the `gorgeFeeds` hook, read live by the BossCard's pips. Reset in `spawn()`.
- `gorgeFeeds: MakeEnemyHook` — `onLeak(leaker: Enemy)` only; no `update`. Finds the live Gorge (`enemies.all.find(e => e.active && e.def.feeds)`), heals it, fires the ring + the one-time teach.
- `gorgeTell(fx, x, y)` — the one-time teach chip (same look and life as `leechTell`), text "leaks feed it".
- The new `spiral` shape is a custom painted shape (`art/paint.ts` `customShape` + `shapePath`), handled by `paintToken` generically (side face + top) — no per-shape texture registry, no `Enemy.advance()` case (`walk` is existing).

### Steps

1. Add `'spiral'` to the `Shape` union (`content/types.ts`) and the `feeds?` field on `EnemyDef`.
2. Create `content/enemies/gorge.ts` (`EnemyDef`, `spawnOnly`, `threat 448`, `fromWave 90`, `feeds`, `look` spiral/red/0.5) and register it in `content/enemies/index.ts` (import + one `gorge` line, next to `mender`/`leech`).
3. Add the wave-90 plan to `core/waves.ts`: the `bossId(90) → 'gorge'` case, the wave-90 `planWave` branch (`[{splinter,0},{splinter,1.2},{gorge,2.4}]`, `tags ['boss']`), and the two boss-lane docstrings.
4. Paint the spiral in `art/paint.ts`: add `'spiral'` to `customShape` and its `shapePath` case (a ~2.5-turn open-center band, like `maw`).
5. Add `feedsUsed` to `entities/Enemy.ts` (field + `spawn()` reset).
6. Create `systems/enemyHooks/gorgeFeeds.ts` (the `onLeak` feed: find the live Gorge, `feedsUsed += 1`, the `mendPack` flash-heal, the `mendRing` in its red, the one-time `gorgeTell`) and `systems/fx/gorgeTell.ts` (the chip). Register `gorgeFeeds` in `systems/enemyHooks/index.ts` (import + one line, next to `mendPack`/`leechDrink`).
7. Wire the pips in `ui/hud/BossCard.ts`: the `build()` condition (mends **or** feeds) and the `refresh()` feeds branch (pips dim as `boss.feedsUsed` grows).
8. Add the two smoke invariants + the `level.bossPlan` wave-90 fix in `debug/runChecks.ts`.
9. Add the tests: `tests/content.test.ts` (size-0.5 exception) and `tests/core/waves.test.ts` (the wave-90 plan + the "only wave 90 sends a Gorge" guard).

### Pitfalls

- **`threat 448`, not 450.** The boss threat = wave budget − the escorts' threats, the Mender's rule: wave-90 budget 450 − two Splinters (each `threat 1`) = **448** (mirrors the Mender's 348 = 350 − 2 Wards). Do not copy the Leech's full-budget 400.
- **`level.bossPlan` must be updated.** The `want` for wave 90 is **3** (the Gorge + 2 Splinters), not 1 — otherwise the invariant fails on the wave-90 smoke test. Without the edit, wave 90 would read as the generic 1-spawn boss and the check would report `sends 3, not 1`.
- **Never a self-feed, never a revive.** `onLeak` must skip when `leaker.def.id === 'gorge'` (a leaked Gorge is a failure, not a feed), and the heal only targets a **live** Gorge (`enemies.all.find(e => e.active && e.def.feeds)`): a dead Gorge is never found, so the cap-at-`maxHp` heal can never overfill or revive. The existing `enemies.hpCap` invariant covers `hp <= maxHp`; the new `enemies.gorgeFeed` invariant covers `feedsUsed ∈ [0, max]`.
- **Event-driven, no clock.** The feed fires on `onLeak` (a leak of another enemy), not on the Gorge's own clock — unlike the Mender's clock-driven `mends` and the Leech's `drinkLeg`. So `gorgeFeeds` has no `update`, no `drinkLeg`, and the `told`/`feedsUsed` state lives in the hook's closure (a new run makes a new hook) and on `Enemy.feedsUsed` (read live by the pips), never module-level.
- **The pips are mends-style, but count the feeds directly.** `count = feeds.max`, `used = boss.feedsUsed` (no `mendsDue` clock): a pip is lit while `i < feeds.max - boss.feedsUsed` (0.9 alpha), dim otherwise (0.18). The `build()`/`refresh()` branches must both handle **feeds** as well as mends (a boss has one or the other, never both, so `pips.clear()` + the feeds block is safe).
- **`size 0.5` needs the content-test exception.** The Gorge is the boss scale (0.5), like the Mender/Leech — add `|| e.id === 'gorge'` to the `content.test.ts` size-0.5 list, or the auto content test fails.
- **The spiral is a custom shape, not a polygon.** Add `'spiral'` to `customShape` (so `paintToken` routes it to `shapePath`, not `shapePoints`) and a `shapePath` case. Do **not** add it to `shapes.ts`'s `sides` record (that path is for polygons). `walk` is an existing behavior — no new `EnemyBehavior` or `Enemy.advance()` case.
- **`spawnOnly` keeps the Gorge out of normal mixes.** It only appears in the hand-crafted wave-90 plan (the two Splinters + the Gorge), never drawn from the budget — same as the Mender's Wards and the Leech's Haulers. The `no wave but 90 sends a Gorge` test guards this.
- **One concern per file.** Everything reacts to a leak is the `gorgeFeeds` hook (+ its fx); do not touch `EnemySystem`, `GameScene`, or `FxSystem` for it. The Gorge's own token/texture is painted generically by `paintToken` — no new texture registry entry.

### Tests

- `npm run check` (typecheck + lint + unit tests): `tests/content.test.ts` (the Gorge is valid content — unique kebab id, `threat 448 > 0`, `fromWave 90 >= 1`, color in `BRIGHTS`, `size 0.5` via the new exception) and `tests/core/waves.test.ts` (`bossId(90) === 'gorge'`; the wave-90 plan is stable across seeds `[1,7,42]` and equals `[{splinter,0},{splinter,1.2},{gorge,2.4}]` with `tags ['boss']` and `hpMul === waveHpMul(90)`; no wave but 90 sends a Gorge).
- `npm run smoke` (builds the game and plays it in a real browser): the wave-90 boss lane — preview chip, arrival horn+ring, BossCard (token, name, live hp bar, and the feed pips that dim as the two Splinters leak and the Gorge feeds), the death burst+name card, and the escape horn — plus the new `enemies.gorgeSlot` / `enemies.gorgeFeed` invariants and the updated `level.bossPlan`.
