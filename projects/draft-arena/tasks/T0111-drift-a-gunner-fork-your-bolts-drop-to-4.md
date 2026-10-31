---
id: T0111
title: "Drift: a Gunner fork, your bolts drop to 40% speed after 120 units and linger"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T18:10:25Z
epic: E24
---

## Goal
The Gunner's straight line becomes a hazard on the ground: with the fork, a bolt flies fast for a while, then drifts slowly for the rest of its flight, so a kiting Gunner leaves a lingering line of bolts in front of the swarm — the overshoot that used to be free is a line you have to cross again. First slice of the Gunner's growth (E24).

## Details
- A new weapon-behavior mod `drift` in the Gunner tree, a fork under Bolt 2, alongside Split.
- Text (shown on the talent's row): "After 120 units, your bolts fly at 40% speed and keep going until 0.8 s after launch. Rank 2: until 1.2 s."
- Talent line: id drift, upgrade drift, max 2, needs `[["bolt", 2]]`. No points commitment, no prestige gate.
- How a drifting bolt flies and looks: full speed for its first 120 units, then 40% of that speed until 0.8 s after launch (rank 2: 1.2 s), then it pops into a small ice ring (radius 30, ink rim). The drift is tuned so the slow part is faster than the fastest chasing monster and slower than a running player (210 u/s): the line stays ahead of the swarm and behind the kiter. A bolt that hits or dies before the drift ends is unchanged; the drift extends or trims the bolt's flight to that total.
- A drifting bolt is the same yellow spinning star with 3 short ice streaks trailing behind it (a slow-motion tail) — the streaks are how a player sees, at a glance, which bolts are still live and drifting.
- With every weapon that fires bolts: Bolt (every bolt of its volleys drifts), Haste (fires sooner, so more lines, no change to the drift), Quick (the stat applies as usual: the bolt reaches the drift point sooner and drifts faster), Split (the fanned extra bolts drift too), Lance (a bolt that goes through drifts on through), Ricochet (a bolt that has bounced drifts after it has flown 120 units), Cover (the fan of bolts behind you drifts too — cover becomes a line of bolts to stand outside of).
- Not bolts, no effect: the Goo keeps turning, the bubble keeps arcing, and the Nerve's jabs, the Horn's darts, the Maw's bite and the Bellow's ring are unchanged — their motion is their own.
- Players: a drifting bolt hits a player at half damage like every other bolt (the pvp damageMul) — a line laid on the field is a hazard to whoever walks into it, player or monster.
- look: shape triangle, color #99e9f2 — a slow bolt is an ice thing.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Goo | a shot that moves differently in flight | The Goo is its own weapon: a big slow drop that keeps turning to the nearest enemy for its whole flight; Drift is your Bolt: a fast star that goes straight, slows once, and keeps going on the line it was fired on |
| Quick | changes how bolts fly | Quick makes every shot faster, all the time, with every weapon; Drift changes the Bolt's flight in two phases (fast, then slow) and only for bolts |
| Lance | a mod for bolts | Lance adds a pierce to the bolt; Drift changes the bolt's speed over its flight — a bolt can go through and linger at once |
| Split | a mod for bolts (and every weapon) | Split adds shots; Drift changes how each shot flies — a fanned drift is a drifting fan |
| Ricochet | a Bolt capstone about its flight | Ricochet reacts to a hit (a bounce on to another enemy); Drift changes the flight before any hit, and a bounced bolt drifts too |
| Haste | a mod that changes the Bolt's rate | Haste fires sooner; Drift changes what each bolt does in the air |

The tree as the panel will draw it (Gunner after this task):
```
Haste (3)
  Bolt (5, start 1, needs Haste 1)
    Split (2, needs Bolt 2)
    Drift (2, needs Bolt 2)
    Ricochet (1, needs Bolt 4)
    Cover (3, needs Bolt 2, points 3, prestige 1)
Lance (2)
```
What a Gunner gets, and what it costs: a point at Bolt 2 (Bolt 1 is free), where those points could buy Split (one more bolt, fanned). Drift instead makes every bolt a line: kite past a crowd and the slow half of each bolt stays in front of it, so the swarm that chases the line gets hit as it follows, and a kiter who cuts back across their own line gets hit by it.

## Acceptance criteria
- [ ] The Talents panel's Gunner tab shows Drift under Bolt, beside Split, with its text and 2 ranks; it takes a point once Bolt 2 is bought.
- [ ] A rank-1 Gunner's bolt flies at full speed, slows to 40% after 120 units (3 ice streaks trailing), and pops into a small ice ring (radius 30) at 0.8 s after launch; rank 2 lingers until 1.2 s. Without the talent, the bolt is unchanged.
- [ ] Every bolt source drifts the same way (Bolt's volleys, Split's fan, after a Ricochet bounce, Cover's back fan), and the Goo, the bubble, the jabs, the darts, the bite and the ring are unchanged.
- [ ] A drifting bolt hits players at half damage like a normal bolt, and the game is working and playable otherwise.

## Design (architect, desktop)

### Files
- create `src/content/upgrades/drift.ts` - Drift upgrade def + `driftRank()` helper (the single place content reads a player's held rank)
- create `src/content/projectiles/drift-bolt.ts` - the two-phase bolt: `path()` (fast 120 u, then 40%), look (yellow star + 3 ice streaks), `onEnd()` pops the ice ring
- create `tests/drift.test.ts` - unit tests for the pure flight math and `driftRank`
- edit `src/content/upgrades/bolt.ts` - fire `drift-bolt` with `life` when the player holds Drift
- edit `src/content/upgrades/cover.ts` - same; update its docstring's mod list
- edit `src/content/upgrades/ricochet.ts` - let drift-bolts bounce too, refiring with their linger life
- edit `src/content/talents/gunner.ts` - one talent line after `split`
- edit `src/content/upgrades/index.ts` - import + one line after `split`
- edit `src/content/projectiles/index.ts` - import + one line after `bolt`

### Interfaces
```ts
// drift.ts (exported; bolt.ts / cover.ts / ricochet.ts import it)
export function driftRank(me: Player): number; // 0 when unheld
```
No engine types change. Haste (`cooldown`), Quick (`projectileSpeed`), Split (`shots`), Lance (`pierce`) apply to drift-bolts automatically through the engine's stats — no code for them.

### Steps
1. Create `drift.ts`:
```ts
import type { Player, UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const drift: UpgradeDef = {
  id: 'drift',
  name: 'Drift',
  description: 'After 120 units, your bolts fly at 40% speed and keep going until 0.8 s after launch. Rank 2: until 1.2 s.',
  maxLevel: 2,
  look: { shape: 'triangle', color: PALETTE.ice },
  stats: {}, // the content test rejects an upgrade with no stats/fire/onHit/onKill; the work is in drift-bolt
};

/** Their upgrades live engine-side; this is the one place content reads them. Defensive: 0, never throws. */
export function driftRank(me: Player): number {
  const held = (me as Player & { upgrades?: ReadonlyMap<UpgradeDef, { level: number }> }).upgrades?.get(drift);
  return held ? held.level : 0;
}
```
2. Create `drift-bolt.ts`:
```ts
import { along, drawCritter, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const DRIFT_AT = 120;
const SLOW = 0.4;

export const driftBolt: ProjectileDef = {
  id: 'drift-bolt',
  radius: 6,
  life: 0.8, // every firing site overrides: 0.8 (Drift 1) or 1.2 (Drift 2) after launch
  look: {
    shape: 'star',
    color: PALETTE.yellow,
    draw(g, e) {
      drawCritter(g, this, e, { ink: PALETTE.ink });
      g.save();
      g.rotate(e.angle);
      g.strokeStyle = PALETTE.ice;
      g.lineWidth = 3;
      g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const y = (i - 1) * 4;
        g.beginPath();
        g.moveTo(-8 - i * 2, y);
        g.lineTo(-15 - i * 2, y * 1.5);
        g.stroke();
      }
      g.restore();
    },
  },
  path(s, t) {
    if (t * s.speed <= DRIFT_AT) return along(s, t);
    const d = DRIFT_AT + SLOW * s.speed * (t - DRIFT_AT / s.speed);
    return { x: s.x + Math.cos(s.angle) * d, y: s.y + Math.sin(s.angle) * d };
  },
  onEnd(ctx, p) {
    ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, 30); // small ice ring, ink rim, to radius 30
  },
};
```
3. Registries: in `upgrades/index.ts` add `import { drift } from './drift.ts';` after the `cover` import and `  drift,` right after `  split,` (line 72). In `projectiles/index.ts` add `import { driftBolt } from './drift-bolt.ts';` after the `bolt` import and `  driftBolt,` right after `  bolt,`.
4. `talents/gunner.ts`: insert after the `split` line: `    { id: 'drift', upgrade: 'drift', max: 2, needs: [['bolt', 2]] },`
5. `bolt.ts`: add `import { driftRank } from './drift.ts';` and replace the loop in `fire` with:
```ts
    const rank = driftRank(me);
    const life = rank >= 2 ? 1.2 : rank === 1 ? 0.8 : undefined;
    for (let i = 0; i < count; i++) {
      ctx.fire(me, rank ? 'drift-bolt' : 'bolt', { angle: aim + (i - (count - 1) / 2) * 0.18, speed: 560, damage: 8 + 4 * (level - 1), life });
    }
```
6. `cover.ts`: same import; in `fire` replace `const damage = ...` through the loop with:
```ts
    const damage = 9 + 3 * (level - 1);
    const rank = driftRank(me);
    const life = rank >= 2 ? 1.2 : rank === 1 ? 0.8 : 0.6;
    for (let i = -1; i <= 1; i++) {
      ctx.fire(me, rank ? 'drift-bolt' : 'bolt', { angle: back + i * half, speed: 160, damage, life });
    }
```
and change its docstring's second sentence to: `They are Bolt's bolts: Haste, Quick, Split and Lance reach them through the player's stats; Drift and Ricochet code their own flight, so they are coded here.`
7. `ricochet.ts`: add the import; change the guard to `if (!shot || (shot.def.id !== 'bolt' && shot.def.id !== 'drift-bolt') || shot.launch.p1 === 1) return;` and the refire to:
```ts
    const drifting = shot.def.id === 'drift-bolt';
    ctx.fire(me, shot.def.id, {
      x: hit.x, y: hit.y,
      angle: Math.atan2(next.y - hit.y, next.x - hit.x),
      speed: 620,
      damage: 9,
      p1: 1,
      life: drifting ? (driftRank(me) >= 2 ? 1.2 : 0.8) : undefined,
    });
```
8. Create `tests/drift.test.ts`: with `const launch: Launch = { x: 0, y: 0, angle: 0, speed: 560, seed: 1, p1: 0, p2: 0 }` and `at = (t) => driftBolt.path!(launch, t, { x: 0, y: 0 })`, assert (a) for t up to `120/560`, `at(t).x` equals `560*t`; (b) for t in `{120/560 + 0.05, 0.8, 1.2}`, `Math.hypot(p.x, p.y)` equals `120 + 0.4*560*(t - 120/560)` and `p.y === 0`; (c) `driftRank({ upgrades: new Map([[drift, { level: 2, timer: 0 }]]) } as unknown as Player)` is 2 and `driftRank({} as Player)` is 0.

### Pitfalls
- `stats: {}` in `drift.ts` is required: the content test fails an upgrade with none of fire/stats/onHit/onKill. An empty object is a no-op in the engine.
- `path()` is pure: only `s` and `t`. The engine's test calls it with speed 400, p1=250, p2=60 — the math must stay finite and rank-free (rank lives in `life`, set by each fire site).
- Keep the rank cast inside `driftRank` only (one file, defensive `?.` → 0). No `any` (lint), and `fire`/`onHit` are server-only, so it never runs on a client.
- Never set `p1` for drift: ricochet uses `p1 === 1` as its "already bounced" marker. Drift uses no launch channel at all.
- Pass `life` at every drift fire site (bolt, cover, ricochet bounce) — a missed site leaves the def default 0.8 and rank 2 lingers too short.
- Cover bolts fly 160 u/s, so they reach 120 units at 0.75 s: at rank 1 the drift phase is ~0.05 s. That is the spec ("trim or extend the flight to that total") — do not give cover a longer life.
- `onEnd` fires only when life runs out, not when pierce runs out: a Lance bolt that went through does not pop — correct per spec.
- Streaks draw runs on every client every frame: no `Math.random`/`Date` (lint), no state, `e.angle` only.
- Don't touch `goo`, `bubble`, `jab`, `horn`, `glob`, `goolet`, `slush-blob` or their weapons — their motion is their own.
- Run `npm run check` last; a throwing hook disables the item for the match and fails the tests.

### Tests
- `tests/drift.test.ts` as above (pure flight + `driftRank`). Everything else (registry, data, path purity, looks, talent reachability, every upgrade in a match) is covered automatically by `engine/tests/`.
