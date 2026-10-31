---
id: T0123
title: "Reach: a Goober fork under Goo 2, a thin ice needle at the farthest enemy within 400"
assignee: asus
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T20:44:19Z
claimed_at: 2026-10-31T21:04:30Z
finished_at: 2026-10-31T21:33:47Z
epic: E28
---

## Goal
The Goober gets the enemy it can never catch: with the fork, the Goo grows a long arm — a thin ice needle that flies straight at the farthest enemy within 400 — so a Toss holding 400, a Spitter past the Goo's 260, and the dash a 110 u/s Goo never catches are no longer out of reach. First slice of E28.

## Details
- A new weapon `reach` in the Goober tree, a fork under Goo 2, alongside Cling.
- Text (shown on the talent's row): "Every 4.0 s, a thin ice needle at the farthest enemy within 400. 24 damage. Rank 2: two needles at the two farthest, 20 each."
- Talent line: id reach, upgrade reach, max 2, needs `[["goo", 2]]`. No points commitment, no prestige gate.
- How it aims: every 4.0 s, if any enemy (monster or player) is within 400, it fires at the **farthest** one — the opposite of every other weapon, which takes the nearest. Rank 2 fires a second needle at the next-farthest. With no enemy within 400, nothing fires.
- How its shot flies and looks: a new projectile `needle` — a thin elongated drop, a slim teardrop about 14 units long pointed along its flight, ice with an ink outline and a small white glint. Straight, 500 u/s, gone on hit or after 0.8 s. It never turns and never homes: a `path` shot computed at launch (cheap); at rank 2 at most 2 needles per player are alive at once.
- It hits like a normal shot: 24 damage at rank 1 (20 each at rank 2), players at half damage (12/10) like every other weapon — the needle is the Goober's pvp poke, a far first hit on a player before the Goo can close.
- The Goo is unchanged: still the slow homing drop at the nearest within 260. Reach is its long arm, not a second Goo.
- Which mods apply to it, as with any shot: Haste (8% sooner per rank), Quick (15% faster flight per rank), Might (+12% damage per rank), Split (a fanned extra needle at the same farthest target, 12% weaker, as usual), Lance (goes through 1 more enemy per rank). On-hit and on-kill effects run on its hits and kills like on any shot — Reap, Chill, Reckless, Swarm, Leech, and on a kill Chomp, Fang, Adrenaline, Nest, Scavenge and Sting. Guarded to another weapon, they do not touch it: Cling (Goo hits only), Gore and Mend (Nerve jabs only), Drift and Ricochet (bolts only), Fizz and Fuse (the bubble), and Scatter, Gush and Chew fire only when the Goo itself kills — a needle kill lays no puddle and pops nothing.
- look: shape triangle, color #99e9f2.

## Compared with what exists
One row for every weapon:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a straight shot at an enemy | fires a fast stream at the nearest; the needle goes alone, on a slow cadence, at the farthest within 400 — the target that holds its distance |
| Cover | a self-firing shot | a fan of 3 behind you at whatever chases (defensive, prestige-gated, bolts); the needle is a single front line at the farthest, no gate |
| Maw | a self-firing attack | bites everything in front within 85; the needle reaches 400 without touching anything |
| Bellow | a self-firing strike | a ring around you within 80, prestige-gated; the needle is a far single target, no gate |
| Lob | a projectile at the nearest | an arcing bubble that splashes where it lands (a ground zone); the needle is a straight contact hit with no zone, out to 400 |
| Goo | a drop from the same tree | homes at 110 u/s to the nearest within 260 and never reaches a Toss at 400 or a dashing Zippy; the needle flies straight at 500 u/s at the farthest within 400 |
| Nerve | a needle-shaped shot | a close 360° ring of jabs that scales with your missing hp; the needle is a single far-target shot with no ring and no hurt scaling |
| Horn | darts at enemies | darts at every enemy within 150+ (up to 4+, a crowd of close targets); the needle is a single shot at the farthest, out to 400 |
| Slush | flies straight at an enemy | flies past everything and hurts only with its landing puddle, out to 240; the needle hurts on contact, out to 400 |

The tree as the panel will draw it (Goober after this task):
```
Reap (3)
  Goo (3, needs Reap 1)
    Gush (3, needs Goo 1)
      Snare (3, needs Gush 1, points 3, prestige 1)
      Chew (3, needs Gush 3)
    Cling (3, needs Goo 2)
    Reach (2, needs Goo 2)
    Scatter (1, needs Goo 3)
```
What a Goober gets, and what it costs: a point at Goo 2, where it could buy Cling (the splat that rides) instead. Reach instead makes the far enemy reachable — a Toss or Spitter can no longer hold its band for free, and a needle at a player is a first hit the Goo never lands, so the Goober can start the fights it was always too slow for.

## Acceptance criteria
- [ ] The Talents panel's Goober tab shows Reach under Goo, beside Cling, with its text and 2 ranks; it takes a point once Goo 2 is bought.
- [ ] Every 4.0 s, if an enemy is within 400, a thin ice needle flies straight at the farthest one (24 damage) at 500 u/s, gone on hit or after 0.8 s; at rank 2 two needles fly at the two farthest, 20 damage each; with no enemy within 400 nothing fires.
- [ ] A Toss holding 400 and a Spitter past 260 take the needle where the Goo never lands, and a needle at a player deals half damage like every other shot.
- [ ] Haste shortens the needle's cadence, Quick speeds its flight, Might scales its damage, Split fans a third needle at the same farthest (all 12% weaker), and the Goo, the Gush puddle and the Scatter pop are unchanged — a needle kill lays no puddle and pops nothing.
- [ ] The game is working and playable otherwise.

## Design (architect, desktop)

### Files
- create `src/content/projectiles/needle.ts` - the needle projectile (straight ice teardrop, radius 6, life 0.8 s, no path and no step: straight default, launch-computed like `bolt`/`jab`)
- create `src/content/upgrades/reach.ts` - the Reach weapon (cooldown 4, fires needle at farthest within 400)
- edit `src/content/projectiles/index.ts` - one import + one list line for `needle`
- edit `src/content/upgrades/index.ts` - one import + one list line for `reach`
- edit `src/content/talents/goober.ts` - one talent line for `reach`

### Interfaces
No new types. Exact code for the two new files:

`src/content/projectiles/needle.ts`:
```ts
import { type Look, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const look: Look = { shape: 'triangle', color: PALETTE.ice };
look.draw = (g, e) => {
  const a = e.angle, u = e.radius / 6; // sized for radius 6
  const px = (x: number, y: number) => ({ x: x * u * Math.cos(a) - y * u * Math.sin(a), y: x * u * Math.sin(a) + y * u * Math.cos(a) });
  g.fillStyle = 'rgba(40, 30, 70, 0.13)'; // soft shadow, as drawCritter draws it
  g.beginPath();
  g.ellipse(0, 4.9 * u, 5.4 * u, 1.8 * u, 0, 0, Math.PI * 2);
  g.fill();
  // slim teardrop, ~14 long: point ahead at (7, 0), rounded back to (-6.5, 0), half-width 3.5
  const tip = px(7, 0);
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(tip.x, tip.y);
  const c1 = px(1.5, -3.4), t1 = px(0, -3.5);
  g.quadraticCurveTo(c1.x, c1.y, t1.x, t1.y);
  const c2 = px(-6.5, -3.5), b = px(-6.5, 0);
  g.quadraticCurveTo(c2.x, c2.y, b.x, b.y);
  const c3 = px(-6.5, 3.5), t2 = px(0, 3.5);
  g.quadraticCurveTo(c3.x, c3.y, t2.x, t2.y);
  const c4 = px(1.5, 3.4);
  g.quadraticCurveTo(c4.x, c4.y, tip.x, tip.y);
  g.closePath();
  g.fillStyle = e.flash ? '#ffffff' : PALETTE.ice;
  g.fill();
  g.lineWidth = Math.max(1.5, Math.min(3, e.radius * 0.2));
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  const gl = px(-3, -1.2); // small white glint near the back
  g.fillStyle = 'rgba(255, 255, 255, 0.75)';
  g.beginPath();
  g.ellipse(gl.x, gl.y, 1.4 * u, 0.8 * u, a - 0.6, 0, Math.PI * 2);
  g.fill();
};

/** Reach's needle: a slim ice drop that flies straight at the farthest enemy; gone on hit or after 0.8 s. */
export const needle: ProjectileDef = {
  id: 'needle',
  radius: 6,
  life: 0.8,
  look,
};
```

`src/content/upgrades/reach.ts`:
```ts
import { v, type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Goober fork: the Goo's long arm — a thin ice needle at the farthest enemy within 400. */
export const reach: UpgradeDef = {
  id: 'reach',
  name: 'Reach',
  description:
    'Every 4.0 s, a thin ice needle at the farthest enemy within 400. 24 damage. Rank 2: two needles at the two farthest, 20 each.',
  maxLevel: 2,
  look: { shape: 'triangle', color: PALETTE.ice },
  cooldown: 4,
  fire(ctx, me, level) {
    const foes = ctx.enemiesNear(me, me.x, me.y, 400)
      .map((u) => ({ u, d: (u.x - me.x) ** 2 + (u.y - me.y) ** 2 }))
      .sort((a, b) => b.d - a.d); // farthest first, the opposite of every other weapon
    const n = Math.min(level, foes.length); // rank 1: one needle, rank 2: two (or fewer)
    for (let i = 0; i < n; i++) {
      const t = foes[i]!.u;
      ctx.fire(me, 'needle', { angle: v.angleTo(me, t), speed: 500, damage: level === 1 ? 24 : 20 });
    }
  },
};
```

### Steps
1. Create `src/content/projectiles/needle.ts` and `src/content/upgrades/reach.ts` exactly as above.
2. `src/content/projectiles/index.ts`: add `import { needle } from './needle.ts';` after the `goolet` import (line 8); add `needle,` after `goolet,` in the list (line 25).
3. `src/content/upgrades/index.ts`: add `import { reach } from './reach.ts';` after `import { reap } from './reap.ts';` (line 33, keeps imports alphabetical); add `reach,` after `goo,` in the `UPGRADES` list (line 54, beside its family).
4. `src/content/talents/goober.ts`: add one line after the `cling` line (line 16): `    { id: 'reach', upgrade: 'reach', max: 2, needs: [['goo', 2]] },`
5. Run `npm run check`, then `npm run smoke`. Do not touch any other file.

### Pitfalls
- The needle must have **no `onHit`**: `gush`/`chew`/`scatter` fire only when `victim.mem.gooAt` is fresh, and only the Goo's own `onHit` sets it. Do not copy `goo.ts`'s `onHit` into the needle, or a needle kill would lay puddles and pop.
- Keep the projectile id `needle`: `cling`/`gore`/`mend`/`drift`/`ricochet`/`fizz`/`fuse` all guard on their own projectile ids, so they skip it automatically. Unguarded mods (Reap, Chill, Reckless, Swarm, Leech; Chomp, Fang, Adrenaline, Nest, Scavenge, Sting) run on it for free.
- Haste/Quick/Might/Lance/Split need no code: they are player stats (`cooldown`, `projectileSpeed`, `damage`, `pierce`, `shots`) the engine applies to every `ctx.fire` and its fan; pvp half damage comes from `rules.pvp.damageMul`.
- Do not add `path` or `step`: neither = straight flight computed from the launch (the `bolt`/`jab` idiom) — cheapest and never homes. 500 u/s × 0.8 s = 400 = exactly the target range; don't change either number.
- `look.draw` is client-only: no `ctx`, no `Math.random`, no module state; everything derives from `g`/`e`. One closed path, one ink stroke (never a second outline crossing the body).
- `PALETTE.ice` is exactly `#99e9f2` — do not invent a new color.

### Tests
none (content is tested automatically by `engine/tests/`; no pure helpers of our own).
Panel note: the only new text is the Reach row in the Goober tab (name "Reach", 2 ranks, the description verbatim, ~100 chars, wraps in the row like every other talent row; tab's fullest state: 8 talents, 21 ranks). No HUD element is added or restyled.

## Result (attempt 1, asus)

Added the Goober's Reach weapon — a new `needle` projectile (thin ice teardrop, `src/content/projectiles/needle.ts`) and the `reach` upgrade (`src/content/upgrades/reach.ts`) that fires every 4.0 s at the farthest enemy within 400 (24 damage; rank 2: two needles at the two farthest, 20 each). Registered both in their index files and added the one-line talent under Goo 2 beside Cling in `src/content/talents/goober.ts`. The Goo, puddles and pops are unchanged: the needle carries no `onHit`, so Gush/Chew/Scatter never trigger on it. Check and smoke both pass.

- Self-review: APPROVE
- Time: 29.3 min

```
.../game/src/content/projectiles/index.ts          |  2 +
 .../game/src/content/projectiles/needle.ts         | 44 ++++++++++++++++++++++
 .../draft-arena/game/src/content/talents/goober.ts |  1 +
 .../draft-arena/game/src/content/upgrades/index.ts |  2 +
 .../draft-arena/game/src/content/upgrades/reach.ts | 23 +++++++++++
 5 files changed, 72 insertions(+)
```
