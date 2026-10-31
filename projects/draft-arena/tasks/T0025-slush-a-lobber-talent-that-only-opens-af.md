---
id: T0025
title: "Slush: a Lobber talent that only opens after a prestige this life"
assignee: cachyos-x8664
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T05:24:06Z
claimed_at: 2026-10-31T07:30:33Z
epic: E7
---

## Goal
Prestiging is worth it within a life: after a player's first prestige this life, the Lobber tree opens a new talent, Slush — a zone weapon no first-life player can ever build, so a second life grows into a control playstyle the others never see.

## Details
- One new weapon upgrade **Slush** (its own file in src/content/upgrades/), one new ground area **the slush puddle** (its own file in src/content/areas/), one new status **slush** (slowed, its own file in src/content/statuses/), and one new talent line in the Lobber tree (src/content/talents/lobber.ts).
- Text on the talent row: "Every 1.6 s, if an enemy is within 240, throws a slush blob that lands and leaves a puddle (radius 40, 2.5 s). Anything in it is slowed 20% and struck for 4 damage every 0.5 s. Per rank: +2 strike damage, +0.5 s puddle life." maxLevel 3. Look: shape circle, color ice.
- Aims and moves like Lob: it throws at the nearest enemy within 240 world units (waits if there is none); the blob arcs like a bubble — a slightly flatter arc — and never hits in flight; where it lands it leaves the puddle. No burst splash damage: the throw's whole payload is the puddle.
- Ranks: rank 1 strikes for 4, the puddle lasts 2.5 s; rank 2 strikes for 6, 3.0 s; rank 3 strikes for 8, 3.5 s. The slow is 20% at every rank.
- The blob: a small flatter ice circle than the bubble, about 9 units wide, ink outline, a small white shine on top — a blob, not a bubble, tellable at a glance.
- The puddle: a pale ice patch on the ground, an ellipse about the puddle's radius across, a wavy ink edge and two small white shines; it fades in over 0.3 s and out over 0.3 s. It tells itself apart from a bubble's splash (a bright short field with a blooming ring — the puddle is paler, has no ring, and stays 2.5–4 s) and from a Snail's sticky patch (orange).
- The puddle acts every 0.5 s on everything standing in it, monsters and players alike: 4 damage per rank (strikes hit other players at half damage, like every other weapon hit) and the slush status — 20% slower, refreshed for 0.5 s while the critter stays in it, so the slow ends within 0.5 s of leaving, exactly like Mired.
- The talent line, in the Lobber tree file: id `slush`, upgrade slush, max 3, needs [["lob", 1]], points 2, prestige 1 — only a player with 1 or more prestiges this life can take it; a knockout resets prestiges this life, so the talent locks again after death.
- The tree as the panel will draw it:
  ```
  Quick (3)
    Lob (5, needs Quick 1)
      Wide (3, needs Lob 2)
      Fuse (1, needs Lob 4)
      Slush (3, needs Lob 1, 2 points in the tree, 1 prestige this life)
  ```
- What a Lobber player gets and what it costs: Slush 1 needs Lob 1 and 2 points already spent in the tree, so it lands around level 4 of a second life (the first point comes at level 2); ranks 2 and 3 cost 5 and 6 points in the tree, pulling points away from Wide (a bigger splash) and Fuse (the kill capstone) — a control build instead of a damage build. A first-life player never takes it: prestiging is what opens the third way to play Lobber.
- The prestige bar: right after the prestige the player is at level 1 with only the free Bolt — Slush is still locked behind Lob 1 and 2 points, so the reward opens a path the player must still earn point by point; it never hands back the power the reset took.
- Which mods apply to the Slush blob and puddle:
  - Haste: yes, it fires 8% sooner per rank, like every weapon.
  - Quick: yes, the blob flies 15% faster per rank and lands sooner.
  - Split: yes, one more blob fanned per rank, all strikes 12% weaker.
  - Might: yes, +12% to the puddle strike per rank.
  - Chill: yes, its on-hit runs on the puddle's strikes, so a chilled critter in the puddle carries the chill slow on top of the slush slow (slows multiply, like Mired and Chill already do).
  - Chomp: yes, as for every kill — a puddle strike that kills a monster heals 5 hp (25 on a player knockout).
  - Wide: no — it sizes the bubble's splash, not the puddle.
  - Lance: no — the blob never hits in flight, so pierce has nothing to pierce (as with the bubble).
  - Ricochet: no — it bounces Bolts only.
  - Fuse: no — it pops on a bubble's kills, not on the puddle's strikes.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a weapon that fires at the nearest enemy | leaves a zone on the ground that keeps striking and slowing anything that walks into it for seconds, with no line of sight; a bolt vanishes on hit |
| Maw | a weapon that acts on close enemies | reaches out to 240 and arcs over anything in between, and its effect persists after the throw; Maw is an instant bite in front |
| Lob | a Lobber throw that arcs to the ground | no burst splash: instead of one strike where it lands it leaves a lasting slow-and-damage puddle that punishes standing still and funnels players around it |
| Chill | a slow on a target | Chill is a ticking status on whatever got hit; the puddle is a place — any new target that stands in it is slowed for as long as it stays |
| Fuse | a second effect around a Lobber kill | Fuse is a one-shot ring on a bubble's kill; the puddle is the primary payload of its own throw and works whether or not it kills |
| Wide | sizes a Lobber ground effect | Wide sizes the bubble's splash; the puddle is its own area and Wide leaves it alone |

## Acceptance criteria
- [ ] A player with 1 prestige this life sees **Slush** in the Lobber tab of the talents panel: it shows "needs Lob 1" and "2 points in the tree" until met, and it can be taken; a player with 0 prestiges this life sees the prestige requirement on it and cannot take it, ever, in a first life.
- [ ] With Slush 1, the critter throws an ice blob at the nearest enemy within 240 every 1.6 s; where it lands, a pale puddle (radius 40, 2.5 s) slows whatever stands in it by 20% and strikes for 4 every 0.5 s; rank 3: strikes for 8, puddle 3.5 s.
- [ ] The puddle's strikes hit other players at half damage, and the slow applies to players too: a player standing in it moves at 80% speed.
- [ ] The blob and the puddle tell apart at a glance in a crowd: a flatter ice circle (not a bubble), a pale patch without a ring (not a splash), not orange (not a sticky patch).
- [ ] Haste, Quick, Split, Might, Chill and Chomp all work with Slush as listed; Wide, Lance, Ricochet and Fuse do not.
- [ ] Knock out a Slush player: in the new life the talent is locked on the prestige again.
- [ ] No new HUD element: Slush shows only in the existing talents panel.

## Design (architect, cachyos-x8664)

Add a prestige-gated **Slush** weapon to the Lobber tree: a short-range lobber that throws a straight-flying slush blob where it was aimed; where it lands it leaves a `slush-puddle` area that strikes and slows anything in it. The weapon is a normal `UpgradeDef` (so it can't be had without a talent) and the only thing that gates it is a `prestige: 1` talent in the existing Lobber tree — so **no HUD change** (the existing `src/hud/talentTree.ts` already renders `HudTalent.missing` — e.g. "Prestige 1" — and disables locked rows).

### Files

Create / edit, one file per item plus one line in its registry:

1. **`src/content/statuses/slushed.ts`** (NEW) — the 20% slow the puddle applies:
```ts
import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Slowed in the slush puddle: 80% speed, players and monsters alike. */
export const slushed: StatusDef = {
  id: 'slushed',
  name: 'Slush',
  color: PALETTE.ice,
  speedMul: 0.8,
};
```

2. **`src/content/projectiles/slush-blob.ts`** (NEW) — the blob: a straight `path` (no `step`), so every client computes the flight from the launch alone. `onEnd` (server only) makes the puddle where the blob landed; the rank rides on `p1`:
```ts
import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const SLUSH_FLIGHT = 1.2;
export const SLUSH_SPEED = 200;

export const slushBlob: ProjectileDef = {
  id: 'slush-blob',
  radius: 8,
  life: SLUSH_FLIGHT,
  look: { shape: 'circle', color: PALETTE.ice },
  path(s, t) {
    return { x: s.x + Math.cos(s.angle) * s.speed * t, y: s.y + Math.sin(s.angle) * s.speed * t };
  },
  onEnd(ctx, p) {
    if (p.owner.type !== 'player') return;
    const rank = p.launch.p1;
    ctx.area(p.owner, 'slush-puddle', {
      x: p.x,
      y: p.y,
      life: 2.5 + 0.5 * rank,
      damage: 4 + 2 * rank,
    });
  },
};
```

3. **`src/content/areas/slush-puddle.ts`** (NEW) — the puddle: radius 40, base life 2.5, strikes every 0.5 s and re-applies the slow:
```ts
import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const INTERVAL = 0.5;

export const slushPuddle: AreaDef = {
  id: 'slush-puddle',
  radius: 40,
  life: 2.5,
  interval: INTERVAL,
  look: { shape: 'circle', color: PALETTE.ice },
  pulse(ctx, a) {
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) {
      ctx.strike(a, u);
      ctx.addStatus(u, 'slushed', INTERVAL);
    }
  },
};
```

4. **`src/content/upgrades/slush.ts`** (NEW) — the weapon (the one thing the talent grants):
```ts
import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { SLUSH_FLIGHT, SLUSH_SPEED } from '../projectiles/slush-blob.ts';

export const slush: UpgradeDef = {
  id: 'slush',
  name: 'Slush',
  description: 'Every 1.6 s, if an enemy is within 240, throws a slush blob that lands and leaves a puddle (radius 40, 2.5 s). Anything in it is slowed 20% and struck for 4 every 0.5 s. Per rank: +2 strike damage, +0.5 s puddle life.',
  maxLevel: 3,
  look: { shape: 'circle', color: PALETTE.ice },
  cooldown: 1.6,
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 240);
    if (!target) return;
    ctx.fire(me, 'slush-blob', {
      angle: v.angleTo(me, target),
      speed: SLUSH_SPEED,
      damage: 0,
      life: SLUSH_FLIGHT / me.stats.projectileSpeed,
      p1: level - 1,
      p2: 0,
    });
  },
};
```

5. **`src/content/talents/lobber.ts`** (EDIT) — add one line after the `lob` talent:
```ts
{ id: 'slush', upgrade: 'slush', max: 3, needs: [['lob', 1]], points: 2, prestige: 1 },
```

6. **`src/content/statuses/index.ts`** (EDIT) — `import { slushed } from './slushed.ts';` and `slushed,` in `STATUSES`.
7. **`src/content/projectiles/index.ts`** (EDIT) — `import { slushBlob } from './slush-blob.ts';` and `slushBlob,` in `PROJECTILES`.
8. **`src/content/areas/index.ts`** (EDIT) — `import { slushPuddle } from './slush-puddle.ts';` and `slushPuddle,` in `AREAS`.
9. **`src/content/upgrades/index.ts`** (EDIT) — `import { slush } from './slush.ts';` and `slush,` in `UPGRADES` (weapons group, next to `lob`).

### Interfaces (from the frozen `engine/api.ts`)

- `Launch = { x, y, angle, speed, seed, p1, p2 }` — **no `life`**. So the blob's flight is a straight run along `s.angle` at `s.speed` for `t` seconds; it does not read `s.life`.
- `LaunchOptions = { x?, y?, angle, speed?, damage, pierce?, life?, p1?, p2? }` — `angle` and `damage` are **required**; `p1`/`p2` are the only two free whole numbers a launch carries. The engine scales the launch's `speed` by the owner's `projectileSpeed` and the `life` is used as-is, so passing `life: SLUSH_FLIGHT / me.stats.projectileSpeed` makes Quick land the puddle sooner.
- `path(s, t, owner)` is pure (no `ctx`, no state, no `Math.random`); `onEnd(ctx, p)` runs server-only when `life` runs out, with `p.launch` still readable (so `rank = p.launch.p1`).
- `AreaDef.pulse(ctx, a)` where the live `Area` is `{ def, owner, team, damage, age, life, x, y, angle, radius, slots, mem }` — **no `units` field and no `interval` field**. So the puddle finds its own contents with `ctx.unitsNear(a.x, a.y, a.radius)` (the `a.radius` already times the owner's `area` stat), strikes with `ctx.strike(a, u)` (deals `a.damage`), and re-applies the slow with `ctx.addStatus(u, 'slushed', INTERVAL)`.
- `AreaOptions = { x?, y?, radius?, life?, damage?, follow? }` — `radius` defaults to the def's 40 and is **times the owner's area stat** (so omit it and Wide grows the puddle; do NOT pass `40 / stats.area`); `damage` is before the owner's `damage` stat (so pass the base `4 + 2 * rank` and Might scales it).
- `Stats` has `projectileSpeed`, `area`, `damage`, `shots`; the engine applies those to every projectile/area the owner fires, so Split's `shots` fans extra blobs and Haste shortens the flight for free.
- `TalentDef = { id, upgrade, max, needs?, points?, prestige? }` — `prestige: 1` is the gate; the engine computes `HudTalent.missing` (includes `"Prestige 1"`) and `state: 'locked'`, and `src/hud/talentTree.ts` already renders `missing` and disables `state !== 'can'` rows.

### Steps

1. Create the four content files exactly as above (status, projectile, area, upgrade), copying the house style (import `PALETTE` from `../palette.ts`, ice color, one-line doc comments).
2. Add each new item to its registry with one import line and one list line (statuses, projectiles, areas, upgrades).
3. Add the single slush talent line to the Lobber tree (`src/content/talents/lobber.ts`) directly after the `lob` line it hangs from.
4. Do **not** touch `src/hud/` — verify the locked-row rendering is already there (see Tests).

### Pitfalls

- **Do not pass `radius` in `onEnd`** — the `AreaOptions.radius` is already times the owner's `area` stat, so passing `40 / stats.area` would cancel Wide; omit it and use the def's 40.
- **Do not read `a.units` or `a.interval` in the puddle's `pulse`** — the live `Area` has neither field; use `ctx.unitsNear(a.x, a.y, a.radius)` and the local `INTERVAL` const.
- **Do not read `s.life` in the blob's `path`** — `Launch` has no `life`; the flight is a straight run along `s.angle` at `s.speed` for `t` seconds.
- **Carry the rank in `p1`, not a packed target** — the aim is defined by the flight (`angle` to the target, `SLUSH_SPEED` for `SLUSH_FLIGHT / projectileSpeed` seconds), so `p1: level - 1` and `p2: 0` keep the launch clean and `onEnd` reads `p.launch.p1`.
- **Do not add a HUD element** — the acceptance criteria are met by the existing talents panel (`src/hud/talentTree.ts` renders `HudTalent.missing`, which includes "Prestige 1", and disables locked rows); a first-life player sees the prestige requirement and cannot take the talent, and a prestiged player sees "needs Lob 1 / 2 points in the tree" until met.
- **Do not touch `engine/`** — all behavior goes through `engine/api.ts`.

### Tests

- `npm run check` (typecheck + lint + content tests): the four items are each in their registry and file, the puddle's `pulse` and the blob's `path` type-check against the frozen signatures, the slush talent is reachable in the Lobber tree with its `prestige: 1` gate, and the 60-player budget passes.
- `npm run smoke` (build + play in a real browser, offline against bots): a first-life player opens Talents and sees the Slush row locked with "Prestige 1" (and cannot take it); a player with ≥1 prestige this life sees "needs Lob 1 / 2 points in the tree" until met, then can take it, and the weapon fires a straight blob that lands and leaves a puddle that strikes and slows bots.
