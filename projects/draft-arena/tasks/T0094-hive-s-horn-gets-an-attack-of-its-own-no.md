---
id: T0094
title: "Hive's Horn gets an attack of its own, not Gunner's straight shot"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T15:20:51Z
---

## Goal
Every talent tree has its own identity, and its weapon is the heart of it. Today three trees fire the same thing: a straight dart at the nearest enemy every ~0.8 s (Gunner's Bolt, Frenzy's Nerve, Hive's Horn), and the Horn and the Nerve even look alike (a teal or pale triangle). Hive is "the crowd is your weapon: the more around, the harder you hit"; its weapon should play like that.

## Details
- Redesign the Horn (src/content/upgrades/horn.ts, its projectile `horn`): how it reaches and hurts enemies is its own and expresses Hive's playstyle (it is about crowds). Not a straight shot at the nearest enemy, and not a copy of another tree's way (Goo's homing drop, Lob's arcing splash, Maw's bite in front).
- Keep the upgrade id `horn` and its talent line, so the tree's needs don't change. Hive talents built on it keep working, or the design says exactly how they change with it.
- Its look tells it apart from every other shot (shape and color), in the Critters style.
- The design carries the "Compared with what exists" table from planning/modules/upgrades.md, with a row for every weapon: Bolt, Cover, Nerve, Horn today, Goo, Scatter, Lob, Slush, Maw.

## Acceptance criteria
- [ ] The Horn no longer fires a straight dart at the nearest enemy.
- [ ] A player of the Hive tree attacks in a way no other tree does, and its shot looks like no other.
- [ ] The Horn's text says what it does and what each rank adds.

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/horn.ts` - replace `fire()` with the crowd-sting, new `description`, `look` → purple hexagon
- edit `src/content/projectiles/horn.ts` - new `look` (purple hexagon), `radius` 6, `life` 0.5. No `path`, no `step`: straight flight

No registries, no talent lines, no other files change: id `horn` and the Hive talent line stay exactly as they are, so `nest` (needs horn 2) and `sting` (needs horn 3) keep working untouched.

### Interfaces
No new types. Both defs keep their ids; only data and the server hook change:
- `horn: UpgradeDef` — `cooldown: 0.8`, `maxLevel: 3`, `look: { shape: 'hexagon', color: PALETTE.purple }`, `fire(ctx, me, level)`.
- `horn: ProjectileDef` — `{ id: 'horn', radius: 6, life: 0.5, look: { shape: 'hexagon', color: PALETTE.purple } }` (engine draws the look in Critters style; no custom `draw`).

The new attack: **one dart at every enemy around you** — the crowd is the target. Each volley, `ctx.enemiesNear(me, me.x, me.y, range)` is sorted by distance and the nearest `4 + (level-1)` enemies each get their own straight dart: 7/9/11 damage (× damage stat), range 150/175/200, speed 460. Per rank: +2 damage, +25 range, +1 more dart. `Swarm` still adds its per-neighbor bonus on every dart — the two stack without copying each other (Swarm = harder per hit, Horn = more targets).

### Steps
1. Overwrite `src/content/upgrades/horn.ts` with:
```ts
import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Hive weapon: the crowd is the target - a dart at every enemy around you, nearest first, up to a cap. */
export const horn: UpgradeDef = {
  id: 'horn',
  name: 'Horn',
  description:
    'Every 0.8 s, a purple hex dart at every enemy within 150 (nearest first, up to 4). 7 damage each. Per rank: +2 damage, +25 range, +1 more dart.',
  maxLevel: 3,
  look: { shape: 'hexagon', color: PALETTE.purple },
  cooldown: 0.8,
  fire(ctx, me, level) {
    const targets = ctx.enemiesNear(me, me.x, me.y, 150 + 25 * (level - 1)).sort(
      (a, b) => (a.x - me.x) ** 2 + (a.y - me.y) ** 2 - ((b.x - me.x) ** 2 + (b.y - me.y) ** 2),
    );
    for (let i = 0; i < Math.min(4 + (level - 1), targets.length); i++) {
      const t = targets[i]!;
      ctx.fire(me, 'horn', { angle: v.angleTo(me, t), speed: 460, damage: 7 + 2 * (level - 1), life: 0.5 / me.stats.projectileSpeed });
    }
  },
};
```
2. Overwrite `src/content/projectiles/horn.ts` with:
```ts
import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A small purple hex dart: straight flight, gone on hit or after 0.5 s. One per enemy, from the Horn. */
export const horn: ProjectileDef = {
  id: 'horn',
  radius: 6,
  life: 0.5,
  look: { shape: 'hexagon', color: PALETTE.purple },
};
```
3. Run `npm run check` and `npm run smoke`.

### Compared with what exists
| Weapon | Tree | How it reaches | How it hurts | Rank adds |
| --- | --- | --- | --- | --- |
| Bolt | Gunner | 1–3 straight bolts fanned at the one nearest enemy (520) | 8+4/rank each | +4 dmg, +1 bolt / 2 ranks |
| Cover | Gunner | fixed 70° fan of 3 bolts straight behind the player | 9+3/rank each | +3 dmg |
| Nerve | Frenzy | one short jab (180) at nearest; grows with missing hp | 5+2/rank + 1 per 10 hp missing | +2 dmg |
| Horn today | Hive | one straight dart (240) at the nearest | 9+3/rank | +3 dmg |
| Goo | Goober | slow drop (110 u/s) turning in flight toward nearest (260) | 18+6/rank | +6 dmg |
| Scatter | Goober | not a shot: a Goo kill bursts 4 mini-Goo homing on the 4 nearest | 4 each | capstone |
| Lob | Lobber | arcing bubble lands where the enemy was, splashes there | splash 10+2/rank | +2 splash |
| Slush | Lobber | straight blob flies past enemies, leaves a slowing puddle where it lands | strike 4/6/8 by rank | +2 dmg, +0.5 s |
| Maw | Body | one bite zone 55 u in front (fires only near an enemy) | 25+6/rank to all inside | +6 dmg |
| **Horn (new)** | Hive | **a dart at each individual enemy within 150+25/rank, nearest first, up to 4+1/rank, in all directions** | 7+2/rank per dart | +2 dmg, +25 range, +1 dart |

New-dart difference is mechanic, not numbers: no other weapon selects each enemy in range and darts at them individually — Bolt/Cover fan at one point or behind, Goo homes on one, Maw is a single forward zone, Scatter bursts on a kill. Reach is 360° and per-target.

### Pitfalls
- No `path()` and no `step()`: straight flight is the cheapest kind and this fires in numbers; if a `path` were ever added it must stay pure (args only, no `ctx.rng`/`Math.random`).
- `life: 0.5 / me.stats.projectileSpeed` (like Slush) keeps the 230-unit reach fixed when the Quick stat raises speed; omitting it would stretch range.
- Don't touch `src/content/talents/hive.ts`, either `index.ts` registry, or `swarm`/`nest`/`sting` — the ids are unchanged and other tasks (T0081) edit `hive.ts`.
- `enemiesNear` already filters by team; do not add `Math.random` in `fire` (lint). Purple hexagon uses `PALETTE.purple` as-is — no `draw`, no shade.
- Empty crowd → zero darts fired (same pattern as Nerve/Maw); `angleTo` at distance 0 is safe (atan2(0,0)=0).

### Tests
none — the logic lives in a server hook and a straight projectile, both exercised automatically by `engine/tests/`; no new pure helpers in `src/`.
