---
id: T0075
title: "Hive, first slice: Swarm and Horn, the crowd makes every hit harder"
assignee: asus
size: L
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T12:59:09Z
claimed_at: 2026-10-31T13:05:03Z
finished_at: 2026-10-31T13:24:59Z
epic: E16
---

## Goal
The sixth tree (the cap) starts: a Hive playstyle that hits harder the more crowded the fight is. This slice adds the tree with its crowd mod (Swarm) and its own short-range dart (Horn), playable end to end.

## Details

**The tree** (a new file in src/content/talents/, listed in TREES):
- name `Hive`, description: "The crowd is your weapon: the more around, the harder you hit."
- look: shape hexagon, color purple.
- Talent lines, exactly:
  - id `swarm`, upgrade `swarm`, max 3 (no needs)
  - id `horn`, upgrade `horn`, max 3, needs `[["swarm", 1]]`
- The tree as the panel will draw it:
  ```
  Swarm (3)
    Horn (3, needs Swarm 1)
  ```

**Swarm** (new file in src/content/upgrades/, on-hit):
- text: "Your hits deal +2 damage per other enemy within 80 of the target (up to 3). Per rank: +1 more per neighbor."
- maxLevel 3. look: shape hexagon, color purple.
- Rank 1: +2 per neighbor; rank 2: +3 per neighbor; rank 3: +4 per neighbor. A neighbor is any other living critter (monster or player) within 80 units of the critter you hit, counted up to 3.
- It runs after every hit of every weapon: Bolt, Maw's bite, Lob's splash, Goo, Nerve's jab, Slush's puddle and the new Horn dart, on monster and player targets alike. It stacks additively with Reap, Reckless and Chill.
- What it does with each existing weapon: Bolt +per-hit bonus; Maw the bonus per bitten enemy; Lob the bonus per splash hit; Goo the bonus per hit (Gush, Chew and Scatter payoffs unchanged); Nerve the bonus on top of its missing-hp scaling; Slush the bonus per puddle strike.

**Horn** (new file in src/content/upgrades/, a weapon, plus a new projectile file in src/content/projectiles/):
- text: "Every 0.8 s, a fast dart at the nearest enemy within 240. 9 damage. Per rank: +3 damage."
- maxLevel 3. look: shape triangle, color teal.
- Fires every 0.8 s (sooner with Haste) at the nearest enemy, monster or player, within 240 units; none in range, it rests. Damage 9 / 12 / 15 per rank; half damage against players, as every weapon.
- The shot: a small teal triangle, point-first, ink outline. It flies straight at 400 u/s (no path, no step), gone on hit or after 0.6 s.
- It reads in a crowd: teal like the other player shots, a fat triangle — not the pale ice jab (thin) and not the spinning yellow bolt star (round).
- Mods that work with it: Might, Haste, Quick, Split (one more dart, fanned out, 12% weaker), Lance (the dart goes through 1 more enemy), Reap, Reckless, Chill, Swarm, and on kills Chomp, Adrenaline, Fang. What does not: Wide (it has no splash), Cling (Goo only), Mend (Nerve only), Fuse, Scatter, Gush, Chew (Goo and bubble kills only).
- Its pattern: a fast, close, single-target shot that wants to be inside the crowd where Swarm pays; with Split it is a quick fanned double.

**What a Hive player gets and what it costs:** 2 points (Swarm 1, Horn 1) buy a close-range dart that is weak alone; the same 2 points buy Haste 1 + Quick 1, or Swift 2, in the trees that kite. The payoff only exists inside a crowd: 6 points (Swarm 3, Horn 3, the same spend as Goober's Reap + Goo + Gush) makes every weapon hit harder the more enemies stand around.

## Compared with what exists

**The trees** (one row per tree; if the Body tree has been retired by build time, drop its row):

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Gunner | a tree built around a weapon you already have | the bonus scales every weapon by the crowd, not just the bolts; the weapon is a committed short-range dart |
| Body | a tree of plain stats with a bite | damage grows with the enemies around the target, not with bought stats |
| Lobber | a tree that marks the ground | hits the target itself, harder in a crowd, instead of zoning the floor |
| Goober | a tree whose weapon finds the target for you | the payoff is per hit and per neighbor, not a payoff on kills; the dart is straight and fast |
| Frenzy | a tree that trades hp for damage | the damage scales with the crowd around the target, and never asks you to stay hurt |

**Swarm, an on-hit** (one row for every on-hit and on-kill upgrade):

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Ricochet | an on-hit on your shots | bounces a bolt on to another enemy; Swarm adds damage to every weapon's hits, scaled by the crowd around the target |
| Reckless | an on-hit that multiplies your damage | doubles your hits while you are below half your hp; Swarm adds damage per enemy near the target, at any hp |
| Chill | an on-hit that changes the target | slows the target 30% for 1 s; Swarm adds flat damage that grows with the crowd |
| Reap | an on-hit that adds damage on a condition | +6 only when the target is below half its hp; Swarm +damage per other enemy within 80, on a full-hp target |
| Mend | an on-hit keyed to one weapon | heals you on a Nerve hit; Swarm adds damage on every weapon's hits |
| Cling | an on-hit keyed to one weapon | your Goo splats on its target and ticks; Swarm adds damage on every weapon's hits |
| Chomp | an on-kill | heals a fixed 5 hp (25 on a player knockout); Swarm changes how hard every hit lands before the kill |
| Adrenaline | an on-kill while below half your hp | a speed burst; Swarm adds damage on every hit, at any hp |
| Fang | an on-kill while below half your hp | extra coins; Swarm adds damage on every hit, at any hp |
| Fuse | an on-kill keyed to one weapon | a ring where your bubble kills; Swarm adds damage on every weapon's hits |
| Scatter | an on-kill keyed to one weapon | mini-Goo seekers where a Goo kills; Swarm adds damage on every weapon's hits |
| Gush | an on-kill keyed to one weapon | a slow puddle where a Goo kills; Swarm adds damage on every weapon's hits |
| Chew | an on-kill that upgrades your Gush puddle | bites whatever stands in the puddle; Swarm adds damage on every weapon's hits |

**Horn, a weapon** (one row for every weapon):

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Bolt | the default weapon, a straight shot at the nearest enemy | everyone has Bolt free and it reaches out; Horn is a committed close-range dart (needs Swarm 1) that wants to be inside the crowd where Swarm pays |
| Maw | a close-range weapon | the bite is a slow area in front of you; the dart is a fast single-target shot that flies to the nearest enemy out to 240 |
| Lob | a weapon that hits where it lands | the bubble arcs in and splashes the ground; the dart flies straight and fast and stops on one critter |
| Goo | a weapon that turns in flight to catch the nearest enemy | the Goo is a slow 110 u/s drop that turns at 260; the dart is a straight 400 u/s shot at 240 |
| Nerve | a fast short-range jab | the jab's power comes from your own missing hp (Frenzy); the dart's power comes from the crowd around its target (Hive), and it reaches 240 against the jab's 180 |
| Slush | a weapon that flies at an enemy | the blob flies past and leaves a slow puddle; the dart stops on the first critter it touches |

## Acceptance criteria
- [ ] The Talents panel has a sixth tab, a purple hexagon: Hive, "The crowd is your weapon: the more around, the harder you hit."
- [ ] The Hive tab draws Swarm (3) and Horn (3, needs Swarm 1) under it, joined by a line; a nomad's first point can buy Swarm and immediately boost the free Bolt.
- [ ] With Horn 1 the critter fires a teal triangle dart at the nearest enemy within 240 every 0.8 s: 9 damage (12 at rank 2, 15 at rank 3), half against players; the dart flies straight at 400 u/s and is gone on hit or after 0.6 s.
- [ ] With Swarm 1, every hit (any weapon, monster or player target) deals +2 damage per other enemy within 80 of the target, capped at 3 neighbors (+6 max at rank 1); the per-neighbor bonus grows +1 per rank, and the bonus stacks on top of Reap, Reckless and Chill.
- [ ] The dart reads at a glance in a crowd as a fat teal triangle, apart from the pale ice jab and the spinning yellow bolt star; with Split it fans one more dart, 12% weaker.
- [ ] Might, Haste, Quick, Split, Lance, Reap, Reckless, Chill, Chomp, Adrenaline, Fang and Swarm all work with the dart; Wide, Cling, Mend, Fuse, Scatter, Gush and Chew do not.
- [ ] Swarm's and Horn's texts fit their rows in the panel at 412x915 and 1280x720 in one or two lines.

## Design (architect, desktop)

### Files
- create `src/content/talents/hive.ts` - the Hive tree (Swarm + Horn talents)
- create `src/content/upgrades/swarm.ts` - Swarm, the crowd on-hit
- create `src/content/upgrades/horn.ts` - Horn, the dart weapon
- create `src/content/projectiles/horn.ts` - the Horn dart projectile
- edit `src/content/talents/index.ts` - import + register `hive` in `TREES`
- edit `src/content/upgrades/index.ts` - import + register `horn`, `swarm` in `UPGRADES`
- edit `src/content/projectiles/index.ts` - import + register `horn` in `PROJECTILES`

### Interfaces
No new types. Three defs, all following existing shapes:

`src/content/talents/hive.ts` (export `hive: TalentTreeDef`):
```
id: 'hive', name: 'Hive',
description: 'The crowd is your weapon: the more around, the harder you hit.',
look: { shape: 'hexagon', color: PALETTE.purple },
talents: [
  { id: 'swarm', upgrade: 'swarm', max: 3 },
  { id: 'horn',  upgrade: 'horn',  max: 3, needs: [['swarm', 1]] },
]
```

`src/content/upgrades/swarm.ts` (export `swarm: UpgradeDef`): `id 'swarm'`, `name 'Swarm'`, `description: 'Your hits deal +2 damage per other enemy within 80 of the target (up to 3). Per rank: +1 more per neighbor.'`, `maxLevel: 3`, `look: { shape: 'hexagon', color: PALETTE.purple }`, and:
```
onHit(ctx, me, level, hit) {
  if (hit.damage <= 0) return; // 0-damage touches (the goo bubble in flight) are not hits
  const per = level + 1; // rank 1: +2, rank 2: +3, rank 3: +4 per neighbor
  let neighbors = 0;
  for (const u of ctx.unitsNear(hit.target.x, hit.target.y, 80))
    if (u.alive && u !== hit.target) neighbors++;
  const bonus = per * Math.min(neighbors, 3);
  if (bonus > 0) ctx.damage(hit.target, bonus, me);
}
```

`src/content/upgrades/horn.ts` (export `horn: UpgradeDef`): `id 'horn'`, `name 'Horn'`, `description: 'Every 0.8 s, a fast dart at the nearest enemy within 240. 9 damage. Per rank: +3 damage.'`, `maxLevel: 3`, `look: { shape: 'triangle', color: PALETTE.teal }`, `cooldown: 0.8`, and:
```
fire(ctx, me, level) {
  const target = ctx.nearestEnemy(me, 240);
  if (!target) return;
  const aim = v.angleTo(me, target);
  ctx.fire(me, 'horn', { angle: aim, speed: 400, damage: 9 + 3 * (level - 1) });
}
```
(import `{ v, type UpgradeDef }` like `bolt.ts`.)

`src/content/projectiles/horn.ts` (export `horn: ProjectileDef`):
```
id: 'horn', radius: 7, life: 0.6, look: { shape: 'triangle', color: PALETTE.teal }
```
(No `path`, no `step`, no `onHit`/`onEnd` — straight flight, gone on hit or after 0.6 s. Radius 7 vs the ice jab's 5 reads as a "fat" dart.)

### Steps
1. Create `projectiles/horn.ts` exactly as above.
2. Create `upgrades/horn.ts` exactly as above.
3. Create `upgrades/swarm.ts` exactly as above (import only `type UpgradeDef` + `PALETTE`).
4. Create `talents/hive.ts` exactly as above.
5. `projectiles/index.ts`: add `import { horn } from './horn.ts';` between the `goolet` and `jab` imports; add `horn,` right after the `jab,` line in `PROJECTILES`.
6. `upgrades/index.ts`: add `import { horn } from './horn.ts';` between `hide` and `lance`; add `import { swarm } from './swarm.ts';` between `split` and `swift`; add `horn,` after the `nerve,` line (weapons group) and `swarm,` after the `reap,` line (on-hit group) in `UPGRADES`.
7. `talents/index.ts`: add `import { hive } from './hive.ts';` between `goober` and `lobber`; add `hive,` as the last line of `TREES` (after `frenzy,`).
8. Run `npm run check` and `npm run smoke`.

### Pitfalls
- Swarm must use `ctx.unitsNear` (all units, both teams), NOT `enemiesNear` — the spec counts "monster or player". Exclude only `hit.target` and require `u.alive`.
- Swarm's bonus uses `ctx.damage` (plain) so it stacks additively with Reap/Reckless/Chill and never re-triggers on-hit hooks (no recursion). Keep the `hit.damage <= 0` guard so Goo's in-flight 0-damage touch doesn't count.
- Do NOT loop/fan in Horn's `fire()`: the engine applies the `shots` stat (Split) and fans copies around the angle itself, and applies `pierce` (Lance), `damage` (Might), `cooldown` (Haste), `projectileSpeed` (Quick), and PVP `damageMul 0.5` automatically. A single `ctx.fire` is correct.
- Wide does nothing to Horn (no `area`/splash) — correct, leave it.
- Both `upgrades/horn.ts` and `projectiles/horn.ts` export `horn` — fine, different folders; register each in its own index only.

### Tests
none (content is auto-tested by engine/tests/: one-item-per-file, registration, data validity, a real-match run of Swarm's onHit and Horn's fire, talent reachability, 60-player budget).

## Result (attempt 1, asus)

Added the sixth talent tree Hive (purple hexagon tab) in `src/content/talents/hive.ts` with Swarm (3) and Horn (3, needs Swarm 1); the Swarm crowd on-hit (`src/content/upgrades/swarm.ts`) adds +2/+3/+4 per other living critter within 80 of the target (cap 3) to every weapon's hits; Horn (`src/content/upgrades/horn.ts` + `src/content/projectiles/horn.ts`) is a committed close-range dart — a fat teal triangle at 400 u/s, 9/12/15 damage, gone on hit or after 0.6 s. All registered in their three index files with one line each; `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 19.9 min

```
.../draft-arena/game/src/content/projectiles/horn.ts | 10 ++++++++++
 .../game/src/content/projectiles/index.ts            |  2 ++
 .../draft-arena/game/src/content/talents/hive.ts     | 14 ++++++++++++++
 .../draft-arena/game/src/content/talents/index.ts    |  2 ++
 .../draft-arena/game/src/content/upgrades/horn.ts    | 18 ++++++++++++++++++
 .../draft-arena/game/src/content/upgrades/index.ts   |  4 ++++
 .../draft-arena/game/src/content/upgrades/swarm.ts   | 20 ++++++++++++++++++++
 7 files changed, 70 insertions(+)
```
