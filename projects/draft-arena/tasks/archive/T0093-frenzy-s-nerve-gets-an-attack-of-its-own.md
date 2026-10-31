---
id: T0093
title: "Frenzy's Nerve gets an attack of its own, not Gunner's straight shot"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T15:20:51Z
claimed_at: 2026-10-31T16:50:49Z
finished_at: 2026-10-31T16:59:13Z
---

## Goal
Every talent tree has its own identity, and its weapon is the heart of it. Today three trees fire the same thing: a straight dart at the nearest enemy every ~0.8 s (Gunner's Bolt, Frenzy's Nerve, Hive's Horn), and the Nerve and the Horn even look alike (a pale triangle). Frenzy is "thin and mean: the more hurt you are, the harder you hit"; its weapon should play like that.

## Details
- Redesign the Nerve (src/content/upgrades/nerve.ts, its projectile `jab`): how it reaches and hurts enemies is its own and expresses Frenzy's playstyle. Not a straight shot at the nearest enemy, and not a copy of another tree's way (Goo's homing drop, Lob's arcing splash, Maw's bite in front).
- Keep the upgrade id `nerve` and its talent line, so the tree's needs don't change. Talents built on the jab (Gore, T0079, pierce while below half hp) keep working, or the design says exactly how they change with it.
- Its look tells it apart from every other shot (shape and color), in the Critters style.
- The design carries the "Compared with what exists" table from planning/modules/upgrades.md, with a row for every weapon: Bolt, Cover, Nerve today, Horn, Goo, Scatter, Lob, Slush, Maw.

## Acceptance criteria
- [ ] The Nerve no longer fires a straight dart at the nearest enemy.
- [ ] A player of the Frenzy tree attacks in a way no other tree does, and its shot looks like no other.
- [ ] The Nerve's text says what it does and what each rank adds.

## Design (architect, desktop)

### Files
- edit `src/content/projectiles/jab.ts` - new look and flight: a small red diamond needle shard (no path, no step — default straight flight); keep id `jab`
- edit `src/content/upgrades/nerve.ts` - new `fire()`: a ring of needles bursts from the player; new description, `cooldown: 0.6`, icon `look` red diamond; drop the now-unused `v` import

No new files, no registry lines, no changes to `src/content/talents/frenzy.ts` (the `nerve` talent line and its needs stay) or to `UPGRADES`/`PROJECTILES`.

### Interfaces
No new types or signatures. `nerve.fire(ctx: Ctx, me: Player, level: number)` and the `ProjectileDef` shape are unchanged; the exact replacement code (for a weak implementer):

`src/content/projectiles/jab.ts` (whole file):
```ts
import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Frenzy's needle: a small red shard that flies straight and fast (no path, no step), gone on hit or after 0.33 s. */
export const jab: ProjectileDef = {
  id: 'jab',
  radius: 5,
  life: 0.33,
  look: { shape: 'diamond', color: PALETTE.red, scale: 1.2 },
};
```

`src/content/upgrades/nerve.ts` (whole file):
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A mean close-range ring: needles burst from the player in every direction, biting harder the more hurt you are. */
export const nerve: UpgradeDef = {
  id: 'nerve',
  name: 'Nerve',
  description:
    'Every 0.6 s, when an enemy is near, a ring of needles bursts from you, stabbing whatever is close: 4 at rank 1, 6 at rank 2, 8 at rank 3. Each needle: 5 damage, +2 per rank, +1 per 10 hp missing.',
  maxLevel: 3,
  look: { shape: 'diamond', color: PALETTE.red },
  cooldown: 0.6,
  fire(ctx, me, level) {
    if (!ctx.nearestEnemy(me, 200)) return;
    const missing = me.maxHp - me.hp;
    const needles = 2 + 2 * level; // rank 1: 4, rank 2: 6, rank 3: 8
    const damage = 5 + 2 * (level - 1) + Math.floor(missing / 10);
    const turn = me.angle + ctx.rng.next() * Math.PI * 2;
    for (let i = 0; i < needles; i++) {
      ctx.fire(me, 'jab', { angle: turn + (i * Math.PI * 2) / needles, speed: 520, damage, life: 0.33 / me.stats.projectileSpeed });
    }
  },
};
```

### Compared with what exists (weapons)
| Weapon (tree) | How it reaches | How it hurts | How the new Nerve differs |
| --- | --- | --- | --- |
| Bolt (Gunner) | straight yellow star at the nearest enemy, long flight, +1 bolt every 2nd rank | hit damage, +4/rank | aims one enemy far; Nerve stabs everything around, in all directions, close |
| Cover (Gunner) | fan of 3 bolts behind you, opposite movement, every 1.0 s | hits chasers from behind | defensive rear fan of a fixed 3; Nerve is a full 360° ring that grows with rank |
| Nerve today (Frenzy) | straight pale dart at the nearest enemy within 180, every 0.8 s | 5+2/rank, +1 per 10 hp missing | replaced; same damage formula, new reach: a needle ring |
| Horn (Hive) | fast straight teal dart at the nearest enemy within 240, every 0.8 s | 9+3/rank | Horn tracks one far target; Nerve tracks nothing |
| Goo (Goober) | big blue drop that turns in flight (step) toward the nearest enemy within 260 | 18+6/rank, marks the hit | Goo homes on one target; Nerve never homes |
| Scatter (Goober) | on a Goo kill: 4 homing goolets to the 4 nearest enemies | 4 each | kill-triggered; Nerve fires on its timer while an enemy is near |
| Lob (Lobber) | arcing bubble that splashes where it lands (path) | splash 10+2/rank | one lob at one spot; Nerve strikes the whole ring at once |
| Slush (Lobber) | straight ice blob that flies past enemies, leaves a slowing puddle where it lands | puddle pulses 4+2/rank | Slush zones a landing spot; Nerve has no zone |
| Maw (Body) | a bite zone in front, every 0.9 s, only when an enemy is within 130 | 25+6/rank in the zone | Maw bites one zone ahead; Nerve stabs all around, including behind |

No difference is numbers-only: the new Nerve is the only weapon that strikes in every direction at once, the only one whose shot count grows with its rank, and it keeps the tree signature — damage grows with the *attacker's* missing hp.

### Steps
1. Replace `src/content/projectiles/jab.ts` with the code above (id stays `jab`).
2. Replace `src/content/upgrades/nerve.ts` with the code above.
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Never give `jab` a `step()`: a burst every 0.6 s is ~13 launches/s per player; the 60-player load test fails on step projectiles. Keep the default straight flight (no `path`, no `step`) — launch-only, cheapest kind.
- Keep `life: 0.33 / me.stats.projectileSpeed` (Slush's idiom in `src/content/upgrades/slush.ts`): the engine multiplies the passed speed by the Quick stat, so without the division the needle range silently changes with Quick.
- Keep the projectile id `jab`: `src/content/upgrades/mend.ts` heals on `hit.projectile.def.id !== 'jab'`, and open task T0079 (Gore) will add its below-half-hp pierce to this same def — with the ring, each needle then passes through its first enemy. Do not rename or delete it.
- Randomness is `ctx.rng.next()` only (never `Math.random`); `fire()` runs server-only so that is fine.
- Delete the `v` import from nerve.ts or lint fails on the unused import.
- No face on the needle look (shots have no faces); use the engine's default diamond drawing — no custom `look.draw` needed, so nothing client-side to break.
- Don't touch `frenzy.ts`, the registries, or any other tree's files — the talent line `{ id: 'nerve', upgrade: 'nerve', max: 3, needs: [['frenzy', 1]] }` already exists and must stay byte-identical.

### Tests
- none (content is tested automatically by engine/tests/: both defs run in a real match, look validity, projectile purity; no pure helpers are added).

## Result (attempt 1, cachyos-x8664)

Redid Frenzy's Nerve (`src/content/upgrades/nerve.ts`) from a straight pale dart at the nearest enemy into its own mean close-range attack: every 0.6 s, when an enemy is within 200, a full 360° ring of needle shards (4/6/8 at ranks 1/2/3, randomly offset from the player's facing) bursts out at once — same damage formula as before (5 + 2/rank, +1 per 10 hp missing, so Mend and Gore built on it still key off `jab` and still pay out). Its projectile `jab` (`src/content/projectiles/jab.ts`) is now a small red diamond needle with scale 1.2, launch-only flight (no path, no step, 0.33 s life) and a look distinct from every other tree's shot. Description, icon (red diamond) and cooldown (0.6) updated in place; the `v` import dropped; `frenzy.ts`, the talent line, and both registries untouched.

- Self-review: APPROVE
- Time: 8.4 min

```
.../draft-arena/game/src/content/projectiles/jab.ts |  6 +++---
 .../draft-arena/game/src/content/upgrades/nerve.ts  | 21 +++++++++++++--------
 2 files changed, 16 insertions(+), 11 deletions(-)
```
