---
id: T0042
title: "Cling: a Goo that splats on its target and rides it"
assignee: desktop-4070
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T08:05:11Z
claimed_at: 2026-10-31T09:05:03Z
finished_at: 2026-10-31T10:05:05Z
epic: E12
---

## Goal
The Goober tree gets its 5th talent: a Goo that hits doesn't just pop — it splats on its target and keeps biting while it rides it, so a Goober build marks one target and melts it while it runs. Under Goo the tree forks: sticky (Cling), zone (Gush) or scatter (the capstone).

## Details
- New upgrade `cling` in src/content/upgrades/cling.ts (an on-hit upgrade, like Reap's file), registered in the upgrades index with the other Goober upgrades.
- Text (shown on the talent): "When your Goo hits, it splats on its target and clings for 2 s, dealing 5 damage every 0.5 s. Per rank: +5 damage per tick."
- maxLevel 3. Tick damage per rank: 5, 10, 15 per 0.5 s; the cling lasts 2 s (4 ticks) at every rank.
- What it does with every weapon: with Bolt, Maw and Lob, nothing — only the Goo's drop splats (the tree's own weapon is the point, like Gush and Scatter only fire on a Goo kill). With the Goo: on hit, the drop splats.
- One splat per target; a new Goo hit on the same target refreshes the 2 s, it never stacks.
- The cling ticks are hits: Reap's bonus applies to them.
- Against a player the ticks deal half damage, like the player's other weapons.
- Look: a small blue drop with an ink rim that sits on the target's back and squishes once per tick; it rides a moving target all the way (a fleeing Flee takes the ticks while it runs). Cool blue, so it reads as a player's mark, and smaller than the Goo in flight so it is told apart at a glance from the shot and from a monster's orange glob.
- Alive at once: at most one splat per target, at most 3 per player (the Goo fires every 1.6 s and a splat lasts 2 s; Haste 3 allows the third). Each is a mark on the target, not a projectile.
- Talent line in src/content/talents/goober.ts: id `cling`, upgrade `cling`, max 3, needs [["goo", 2]], the new line after the `gush` line. The tree as the panel draws it:
  ```
  Reap (3)
    Goo (3, needs Reap 1)
      Gush (3, needs Goo 1)
      Cling (3, needs Goo 2)
      Scatter (1, needs Goo 3)
  ```
- What a Goober gets and what it costs: 6 points in the tree (Reap 1, Goo 2, Cling 3) — the same points could finish Gush 3 (slow puddles) or Scatter (the capstone). Cling is the single-target direction of the fork: one marked critter takes 20/40/60 extra damage per Goo hit while it lives.

## Acceptance criteria
- [ ] The Goober tab in the talents panel shows a new Cling row under Goo with the text above; before Goo is at rank 2 the row says what it still needs.
- [ ] Cling 3 costs 3 points and only unlocks at Goo 2; the panel draws it under Goo, next to Gush and Scatter.
- [ ] A Goo hit leaves a blue splat on the target that squishes once every 0.5 s and deals 5/10/15 damage per tick by rank, for 2 s; a new Goo hit on the same target refreshes it.
- [ ] The splat rides a moving target: a Flee that sprints away takes the ticks all the way; against a player the ticks deal half damage.
- [ ] A tick on a target below half hp gets Reap's bonus; Bolt, Maw and Lob hits leave no splat; Scatter's mini-Goo leave no splat.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit effect that reacts to a weapon's hit | sends the shot bouncing on to a second enemy once; Cling keeps hitting the same target for seconds while it rides it |
| Chill | an on-hit status that sits on the target | slows the target's movement for a few seconds; Cling deals damage on a timer and the splat rides the target, so it bites a fleeing Flee all the way |
| Reap | an on-hit damage bonus on the target | adds to each hit once; Cling creates new hits that keep coming while the target is alive |
| Chomp | an on-kill reaction | fires only on a kill; Cling fires on every Goo hit, kill or not |
| Fuse | an on-kill that pops the kill into something | needs a kill and makes one ring on the ground; Cling needs a hit and sticks to the target itself |
| Scatter | an on-kill on a Goo | needs a kill and spawns new shots at other enemies; Cling needs a hit and adds damage to the one it already caught |
| Gush | an on-kill on a Goo that marks the ground | leaves a puddle where the kill happened; Cling marks the target itself, wherever it runs |

## Design (architect, desktop)

### Files
- create `src/content/statuses/cling.ts` — status `cling`: the 2 s mark on the splatted target (blue ring + timer ledger). No tick, no speedMul.
- create `src/content/areas/splat.ts` — area `splat`: the blue drop that rides the marked target; its 0.5 s pulse is the bite (`ctx.strike`).
- create `src/content/upgrades/cling.ts` — upgrade `cling`: on-hit, casts mark + splat only when a Goo drop hits.
- edit `src/content/statuses/index.ts` — import `cling`, add `cling,` to `STATUSES` after `gooSlow,`.
- edit `src/content/areas/index.ts` — import `splat`, add `splat,` to `AREAS` after `puddle,`.
- edit `src/content/upgrades/index.ts` — import `cling` (after the `chill` import), add `cling,` to `UPGRADES` after `gush,`.
- edit `src/content/talents/goober.ts` — add one line after the `gush` line (below).

### Interfaces (exact file contents)
`src/content/statuses/cling.ts`:
```ts
import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A Cling splat is riding this critter: the 2 s mark it keeps biting. Refreshed by each new Goo hit. */
export const cling: StatusDef = { id: 'cling', name: 'Cling', color: PALETTE.blue };
```
`src/content/upgrades/cling.ts`:
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Goober fork: a Goo that hits doesn't pop — it splats on its mark and keeps biting while it runs. */
export const cling: UpgradeDef = {
  id: 'cling',
  name: 'Cling',
  description:
    'When your Goo hits, it splats on its target and clings for 2 s, dealing 5 damage every 0.5 s. Per rank: +5 damage per tick.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.blue },
  onHit(ctx, me, level, hit) {
    if (!hit.projectile || hit.projectile.def.id !== 'goo') return; // only the Goo's drop splats (goolet, Bolt, Maw, Lob: nothing)
    const t = hit.target;
    if (t.hp <= 0) return; // kills resolve after onHit: a finishing Goo leaves no splat on the corpse
    const fresh = ctx.statusOf(t, 'cling') <= 0;
    ctx.addStatus(t, 'cling', 2);
    t.mem.clingUntil = Math.round(ctx.time * 100) + 200; // mark's deadline, refreshed by every hit
    if (fresh) {
      t.mem.clingBorn = Math.round(ctx.time * 100); // epoch of this splat
      ctx.area(me, 'splat', { x: t.x, y: t.y, damage: 5 * level });
    }
  },
};
```
`src/content/areas/splat.ts`:
```ts
import type { AreaDef, Unit } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A Cling splat: a blue drop on its mark's back that bites every 0.5 s until the mark fades. */
export const splat: AreaDef = {
  id: 'splat', radius: 10, life: 2, interval: 0.5, follow: false,
  look: {
    shape: 'circle', color: PALETTE.blue,
    draw(g, e) {
      const r = e.radius;
      const tr = e.slots[0] > 0 ? e.slots[0] : 12; // the mark's radius, set by the pulse
      const q = 1 - (e.time % 0.5) / 0.5; // 1 just after a bite, 0 just before the next
      const fade = Math.min(1, e.hp * 5); // dries out as it wears off
      if (fade <= 0) return;
      g.save();
      g.globalAlpha = fade;
      g.rotate(e.angle); // the mark's facing; its back is -x
      g.translate(-(tr + r * 0.6), 0); // sit on the back, just past the body edge
      g.scale(1 + 0.3 * q, 1 - 0.25 * q); // squish once per tick
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.fillStyle = PALETTE.blue;
      g.fill();
      g.lineWidth = 2;
      g.lineJoin = 'round';
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.beginPath();
      g.ellipse(-r * 0.3, -r * 0.35, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); // candy shine
      g.fillStyle = PALETTE.white;
      g.fill();
      g.restore();
    },
  },
  pulse(ctx, a) {
    // The mark is the only unit wearing 'cling'. Fastest unit (Swift-3 player) runs 135 in 0.5 s,
    // so 170 reach always finds it; nearest wins when two marks crowd.
    let t: Unit | undefined;
    let best = 170 * 170;
    for (const u of ctx.unitsNear(a.x, a.y, 170)) {
      if (ctx.statusOf(u, 'cling') <= 0) continue;
      const d = (u.x - a.x) ** 2 + (u.y - a.y) ** 2;
      if (d < best) { best = d; t = u; }
    }
    if (!t) { a.life = a.age; return; }
    const born = t.mem.clingBorn ?? -1;
    if (a.mem.born === undefined) a.mem.born = born; // first pulse
    if (born !== a.mem.born || Math.round(ctx.time * 100) >= (t.mem.clingUntil ?? -1)) {
      a.life = a.age; // the mark faded, or was re-cast by a newer splat: dry up
      return;
    }
    a.x = t.x; a.y = t.y; a.angle = t.angle; // ride it wherever it runs
    a.slots[0] = Math.round(t.radius);
    a.life = a.age + 0.55; // one more pulse (0.5 s); the gate above ends it after
    ctx.strike(a, t); // the bite: credited to the Goober, half vs players, and a hit (Reap applies)
  },
};
```
`src/content/talents/goober.ts`, after the `gush` line:
```ts
    { id: 'cling', upgrade: 'cling', max: 3, needs: [['goo', 2]] },
```

### Steps
1. Create the three new files exactly as above.
2. Add the three registry lines (import + list line, each next to the goober cluster).
3. Add the talent line to `goober.ts` after `gush`.
4. `npm run check` — fixes, if any, must stay in the new files' logic.
5. `npm run smoke`.

### Pitfalls
- Why an area pulse, not a status tick or a step projectile: a status `tick` can only `ctx.damage` (no on-hit hooks, so Reap would never apply); a step projectile sitting on its target is killed by the engine's own collision loop (pierce) the moment it overlaps a crowd-mate. Areas have no collision; the pulse strikes exactly the mark. Do not "simplify" the bite to `ctx.damage`.
- Do not gate the bite on the status alone: the status is spliced after areas in the tick, so a pulse at t=2.0 would see it and land a 5th tick. The `clingUntil` deadline gives exactly 4 ticks per 2 s window; the `born` epoch stops a dried-up splat from adopting a re-cast mark (one splat per target, ever).
- `a.life = a.age + 0.55`: the death check is `age >= life` and the next pulse is exactly 0.5 s out, so any extension ≤ 0.5 kills the splat after one bite.
- Keep the 170 reach: a Swift-3 player runs 135 units between pulses; a smaller search loses the mark mid-sprint.
- Areas render under units by design — the drop peeks out from the mark's back; don't move it to draw on top.
- Squish comes from `e.time` (client clock, 0.5 s period, phase not server-synced — fine). Never `Math.random`/`Date` in `src/content/`.
- Bandwidth: every area is sent every tick, so the 60-player load test will feel 1–3 extra splats per Goober bot. If it fails on bytes, report it — the mechanic needs a synced rider.

### Tests
none — engine/tests cover it: one-item-per-file + registries, the upgrade in a real match, the talent reachable (Goo 2 exists, ranks 3 ≤ maxLevel 3), panel data, and the 60-player budget.

Panel fullest state (no HUD file changes): Goober tab shows 5 rows — Reap (3 pips) at left; under Goo (3 pips, under Reap) in order: Gush (3), Cling (3), Scatter (1). Cling's description is 116 chars; Goo's (~170) stays the longest wrapping line, so the existing card layout (right column at 1280x720, above the Talents button at 412x915) holds. Before Goo rank 2, the Cling row shows the panel's standard "Needs Goo 2".

## Result (attempt 1, desktop-4070)

Added the Goober tree's Cling talent as three new files — a marker status `cling`, the on-hit upgrade `cling` that splats only a direct Goo hit (5/10/15 damage per tick by rank for a fixed 2 s), and the riding area `splat`, a small blue ink-rimmed drop that squishes once per tick on the mark's back and follows it even when fleeing — each registered in its folder, with the talent line placed under Goo gated on Goo 2. Splat bites go through `ctx.strike`, so they deal half damage vs players and trigger Reap, while a born-epoch and deadline gate guarantee at most one splat per target that dries up on refresh. `npm run check` (typecheck, lint, 83 tests) and both desktop/mobile `npm run smoke` runs pass; the final `git diff` review was permission-blocked in this session, so verification was done by re-reading the written files.

- Self-review: APPROVE
- Time: 60.0 min

```
.../draft-arena/game/src/content/areas/index.ts    |  2 +
 .../draft-arena/game/src/content/areas/splat.ts    | 57 ++++++++++++++++++++++
 .../draft-arena/game/src/content/statuses/cling.ts |  5 ++
 .../draft-arena/game/src/content/statuses/index.ts |  2 +
 .../draft-arena/game/src/content/talents/goober.ts |  1 +
 .../draft-arena/game/src/content/upgrades/cling.ts | 24 +++++++++
 .../draft-arena/game/src/content/upgrades/index.ts |  2 +
 7 files changed, 93 insertions(+)
```

## Merge (attempt 1, desktop-4070)

- Conflicts in: projects/draft-arena/game/src/content/areas/index.ts, projects/draft-arena/game/src/content/statuses/index.ts, projects/draft-arena/game/src/content/upgrades/index.ts
- Auto-resolved 4 spot(s) where both sides only added lines (clean: projects/draft-arena/game/src/content/areas/index.ts, projects/draft-arena/game/src/content/statuses/index.ts, projects/draft-arena/game/src/content/upgrades/index.ts).
- Resolved without the conflict agent.
