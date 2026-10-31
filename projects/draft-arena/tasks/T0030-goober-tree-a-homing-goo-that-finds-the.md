---
id: T0030
title: "Goober tree: a homing Goo that finds the nearest enemy for you"
size: L
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T05:50:41Z
epic: E8
---

## Goal
A fourth playstyle for the draft: a build whose weapon aims for you. Gunner kites with straight Bolts, Lobber zones with arcing bubbles, Body bites in front — the Goober walks into the crowd while its big blue drop turns in flight and catches whatever is nearest.

## Details
The tree (one file in src/content/talents/, listed in TREES; the closest example: the Lobber tree, T0003). Talents, in file order:
- The tree: name Goober, description "Your Goo: a drop that turns and finds the nearest enemy for you.", look: shape circle, color blue.
- Reap: max 3, no needs. On-hit. "Hits on an enemy below half its hp deal +6 damage, per rank." look: shape diamond, color blue.
- Goo: max 3, needs Reap 1. A weapon. "Every 1.6 s, lobs a big blue drop at the nearest enemy within 260; it turns in flight to catch it, or plops straight with none in range. 18 damage, 110 u/s, 2.5 s. Each rank: +6 damage." look: shape circle, color blue.
- Gush: max 3, needs Goo 1. On-kill. "When a Goo kills, a puddle marks the spot: 40 units around it, 20% slower for 1.5 s, refreshed while in it. Each rank: +10 radius." look: shape hexagon, color teal.
- Scatter: max 1, needs Goo 3. On-kill capstone. "When a Goo kills, it pops into 4 mini-Goo that home to the 4 nearest enemies: 4 damage, 200 u/s, 1 s. Mini-Goo do not pop again." look: shape pentagon, color blue.

The tree as the panel will draw it:
```
Reap (3)
  Goo (3, needs Reap 1)
    Gush (3, needs Goo 1)
    Scatter (1, needs Goo 3)
```

- The Goo (a new projectile file; the closest example: the glob — a drop; the Goo turns, so it is a step() shot sent every tick): a big blue drop, 14 radius, wobbling as it turns so it reads "chasing" at a glance — a drop, not a star, and blue, not the Bolt's yellow. It aims at the nearest enemy within 260 and turns toward it while flying; with none in range it plops straight ahead. At most 2 Goo per player alive at once (1.6 s fire, 2.5 s life), 6 with Split 2, plus at most 24 mini-Goo from Scatter; mini-Goo are small blue drops (8 radius) and never trigger Gush or Scatter.
- The Goo is a weapon, so the mods say what they do to it: Haste (fires sooner), Quick (flies faster), Might (+12% damage), Split (a fan of Goo that each home on their own, 12% weaker each) and Chill (its hits slow) apply; Lance's pierce applies because the Goo is a projectile (a Goober build that also put points in Gunner gets a piercing Goo — a fair cross-tree combine); Ricochet (a bolt bounce), Wide (the bubble's splash) and Fuse (the bubble's kill) do not.
- Reap works with every weapon: a Bolt that lands on a half-dead enemy deals +6 (finish what you wounded before the next volley); the bubble's splash strike deals +6 to anything inside below half hp; the Maw's bite deals +6 to a half-dead enemy in front; the Goo deals +6 to the half-dead target it catches. On a half-dead player it is the same +6.
- Gush's puddle is a new area (the closest example: the Snail's sticky patch) and a new status (the closest example: Mired): 20% slower, 1.5 s, refreshed while inside — distinct from the ice splash (which damages) and the sticky muck (which mires at 60%). It slows players in it too, so a kiting rival running through your puddles pays for it.
- The capstone Scatter pays out the whole build: a full Goober build's kill makes a puddle (Gush) and sends 4 seekers after the next targets (Scatter), so standing in a crowd scatters your damage.
- What it costs: the full build is 10 of the about 16 points a life gives (level 2 to 17) — a Goober player gives up the Bolt rank-5 kiting or the Chomp tanking those points would otherwise buy, and before Goo 3 the build is only a finisher mod and a slow weapon.

## Compared with what exists
Trees (one row per tree):
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gunner | a self-firing ranged weapon, cheap mod first | its weapon re-aims in flight: you walk and the Goo hunts the nearest thing (the Bolt flies straight and misses what moves) |
| Body | a payoff for standing in a crowd | the Goo is ranged and multi-target: it reaches 260 and Scatter seeks 4 targets at once (the Maw bites in front, up close; Chomp heals the killer) |
| Lobber | a slow shot with a payoff where it ends | the Goo hits the target it catches on the way, and it turns (the bubble never hits in flight and its arc is fixed) |

Upgrades (weapons, on-hit, on-kill):
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a self-firing weapon at the nearest enemy | the Goo turns in flight to catch a moving target and lands one heavy hit, not a straight volley |
| Maw | a self-firing weapon on a short cooldown | the Goo is a projectile that reaches 260 (the Maw bites only what is in front, up close) |
| Lob | a slow weapon whose shot does its thing where it ends | the Goo hits its target in flight (the bubble only where it lands) and it turns (the arc is fixed) |
| Chill | an on-hit effect on the target | Reap deals extra damage on a condition — the target below half hp — instead of a status |
| Ricochet | an on-hit that changes the shot's path | Reap changes the damage, not the path; it works on the first hit, not the bounce |
| Chomp | an on-kill that pays the killer | Gush and Scatter pay at the kill spot (a puddle, 4 seekers), not to the killer's body |
| Fuse | a kill pops into a ring where the victim died | the Gush puddle slows what walks in (the ring damages what is inside), and Scatter sends seekers after 4 other targets (a ring only hits what is in it) |

## Acceptance criteria
- [ ] The talents panel has a Goober tab: Reap, Goo, Gush and Scatter drawn as the tree above, with what is still needed written on locked talents.
- [ ] A player with Goo 1 fires a big blue drop every 1.6 s that turns toward the nearest enemy within 260 and deals 18 damage (24 at rank 2, 30 at rank 3); with no enemy in range it flies straight and vanishes after 2.5 s.
- [ ] Reap: a hit on an enemy below half its hp deals +6 damage per rank, on every weapon including player targets.
- [ ] Gush 1: a Goo kill leaves a 40-unit puddle that slows what is inside by 20% for 1.5 s (50 and 60 units at ranks 2 and 3); a player standing in it slows too.
- [ ] Scatter with Goo 3: a Goo kill pops 4 small blue drops that each chase a different nearby enemy for 1 s; mini-Goo never pop again and at most 24 are alive per player.
- [ ] Split on the Goo fans out and each Goo homes on its own; Lance makes the Goo pierce; Wide and Fuse do nothing to it.
- [ ] The Goo, mini-Goo and puddle read in a crowd at a glance — a big blue drop, small blue drops, a teal puddle — without the panel.

## Design (architect, desktop)

### Files
- create `src/content/projectiles/goo.ts` - the Goo projectile (step homing, marks `mem.gooAt` on hit)
- create `src/content/projectiles/goolet.ts` - Scatter's mini-Goo projectile (step, homes to its stored target spot)
- create `src/content/areas/puddle.ts` - Gush's teal puddle area (slows everything inside)
- create `src/content/statuses/goo-slow.ts` - the puddle's 20%-slower status
- create `src/content/upgrades/goo.ts` - the Goo weapon (fire)
- create `src/content/upgrades/reap.ts` - Reap on-hit (bonus damage below half hp)
- create `src/content/upgrades/gush.ts` - Gush on-kill (leaves a puddle)
- create `src/content/upgrades/scatter.ts` - Scatter on-kill capstone (4 mini-Goo)
- create `src/content/talents/goober.ts` - the Goober tree
- edit `src/content/upgrades/index.ts` - import + 1 line each for `goo`, `reap`, `scatter`, `gush`
- edit `src/content/projectiles/index.ts` - import + 1 line each for `goo`, `goolet`
- edit `src/content/areas/index.ts` - import + 1 line for `puddle`
- edit `src/content/statuses/index.ts` - import + 1 line for `gooSlow`
- edit `src/content/talents/index.ts` - import + 1 line for `goober`

No edit to `src/content/index.ts`, `rules.ts`, `palette.ts`, effects, or HUD/menu files (the panel is engine-rendered from the tree def).

### Interfaces
Every new file is a `Def` with id/name/look. Exact contents (import lines as given; `PALETTE` from `../palette.ts`):

`src/content/projectiles/goo.ts` — `import { drawCritter, moveForward, turnToward, type Look, type ProjectileDef } from '../../../engine/api.ts';`
```ts
const look: Look = { shape: 'circle', color: PALETTE.blue };
look.draw = (g, e) => {
  drawCritter(g, look, e, { ink: PALETTE.ink });
  const r = e.radius, back = e.angle + Math.PI; // tail behind the drop -> reads as chasing
  g.beginPath();
  g.moveTo(Math.cos(back + 0.5) * r * 0.9, Math.sin(back + 0.5) * r * 0.9);
  g.lineTo(Math.cos(back) * r * 1.7, Math.sin(back) * r * 1.7);
  g.lineTo(Math.cos(back - 0.5) * r * 0.9, Math.sin(back - 0.5) * r * 0.9);
  g.closePath();
  g.fillStyle = PALETTE.blue; g.fill();
  g.lineWidth = 2; g.lineJoin = 'round'; g.strokeStyle = PALETTE.ink; g.stroke();
};
export const goo: ProjectileDef = {
  id: 'goo', radius: 14, life: 2.5, look,
  step(ctx, p, dt) {
    const t = ctx.nearestEnemy(p, 260);
    if (t) turnToward(p, { x: t.x, y: t.y }, 5 * dt); // 5 rad/s; none in range -> straight
    moveForward(p, dt);
  },
  onHit(ctx, _p, target) { target.mem.gooAt = ctx.time; },
};
```

`src/content/projectiles/goolet.ts` — `import { moveForward, turnToward, type ProjectileDef } from '../../../engine/api.ts';`
```ts
export const goolet: ProjectileDef = {
  id: 'goolet', radius: 8, life: 1, look: { shape: 'circle', color: PALETTE.blue },
  step(ctx, p, dt) {
    const tx = p.launch.p1, ty = p.launch.p2; // its target's spot (set by Scatter)
    const t = ctx.enemiesNear(p, tx, ty, 120)[0]; // re-acquire, so it tracks the moving enemy
    turnToward(p, { x: t ? t.x : tx, y: t ? t.y : ty }, 6 * dt);
    moveForward(p, dt);
  },
};
```

`src/content/areas/puddle.ts` — `import { shade, type AreaDef } from '../../../engine/api.ts';`
```ts
export const puddle: AreaDef = {
  id: 'puddle', radius: 40, life: 3, interval: 0.25, follow: false,
  look: {
    shape: 'circle', color: shade(PALETTE.teal, -0.2),
    draw(g, e) {
      const a = (e.slots[0] ?? 100) / 100 * Math.min(1, e.hp * 4); // fade in, then out
      if (a <= 0) return;
      g.save(); g.globalAlpha = a;
      g.fillStyle = shade(PALETTE.teal, -0.2);
      g.beginPath(); g.arc(0, 0, e.radius, 0, Math.PI * 2); g.fill();
      g.lineWidth = 3; g.lineCap = 'round'; g.strokeStyle = PALETTE.ink; g.stroke();
      g.beginPath(); g.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
      g.setLineDash([4, 6]); g.lineWidth = 1.5; g.stroke();
      g.restore();
    },
  },
  pulse(ctx, a) {
    a.slots[0] = Math.min(100, Math.round((a.age / 0.3) * 100));
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) ctx.addStatus(u, 'goo-slow', 1.5);
  },
};
```

`src/content/statuses/goo-slow.ts` — `import type { StatusDef } from '../../../engine/api.ts';`
```ts
export const gooSlow: StatusDef = { id: 'goo-slow', name: 'Slosh', color: PALETTE.teal, speedMul: 0.8 };
```

`src/content/upgrades/goo.ts` — `import { v, type UpgradeDef } from '../../../engine/api.ts';` — `name:'Goo'`, `description:'Every 1.6 s, lobs a big blue drop at the nearest enemy within 260; it turns in flight to catch it, or plops straight with none in range. 18 damage, 110 u/s, 2.5 s. Each rank: +6 damage.'`, `maxLevel:3`, `look:{shape:'circle',color:PALETTE.blue}`, `cooldown:1.6`:
```ts
fire(ctx, me, level) {
  const target = ctx.nearestEnemy(me, 260);
  const aim = target ? v.angleTo(me, target) : me.input.aim;
  ctx.fire(me, 'goo', { angle: aim, speed: 110, damage: 18 + 6 * (level - 1) });
},
```

`src/content/upgrades/reap.ts` — `import type { UpgradeDef } from '../../../engine/api.ts';` — `name:'Reap'`, `description:'Hits on an enemy below half its hp deal +6 damage, per rank.'`, `maxLevel:3`, `look:{shape:'diamond',color:PALETTE.blue}`:
```ts
onHit(ctx, me, level, hit) {
  if (hit.damage <= 0) return;               // the bubble's 0-damage in-flight touch is not a hit
  const before = hit.target.hp + hit.damage; // hp before this strike
  if (before < hit.target.maxHp * 0.5) ctx.damage(hit.target, 6 * level, me);
},
```

`src/content/upgrades/gush.ts` — `import type { UpgradeDef } from '../../../engine/api.ts';` — `name:'Gush'`, `description:'When a Goo kills, a puddle marks the spot: 40 units around it, 20% slower for 1.5 s, refreshed while in it. Each rank: +10 radius.'`, `maxLevel:3`, `look:{shape:'hexagon',color:PALETTE.teal}`:
```ts
onKill(ctx, me, level, victim) {
  if (ctx.time - (victim.mem.gooAt ?? -99) > 0.4) return; // only kills a Goo just struck
  ctx.area(me, 'puddle', { x: victim.x, y: victim.y, radius: 40 + 10 * (level - 1) });
},
```

`src/content/upgrades/scatter.ts` — `import { v, type UpgradeDef } from '../../../engine/api.ts';` — `name:'Scatter'`, `description:'When a Goo kills, it pops into 4 mini-Goo that home to the 4 nearest enemies: 4 damage, 200 u/s, 1 s. Mini-Goo do not pop again.'`, `maxLevel:1`, `look:{shape:'pentagon',color:PALETTE.blue}`:
```ts
onKill(ctx, me, _level, victim) {
  if (ctx.time - (victim.mem.gooAt ?? -99) > 0.4) return;
  const sorted = ctx.enemiesNear(me, victim.x, victim.y, 260)
    .map((u) => ({ u, d: (u.x - victim.x) ** 2 + (u.y - victim.y) ** 2 }))
    .sort((a, b) => a.d - b.d);
  for (let i = 0; i < Math.min(4, sorted.length); i++) {
    const t = sorted[i]!.u;
    ctx.fire(me, 'goolet', { x: victim.x, y: victim.y, angle: v.angleTo(victim, t), speed: 200, damage: 4, p1: Math.round(t.x), p2: Math.round(t.y) });
  }
},
```

`src/content/talents/goober.ts` — `import type { TalentTreeDef } from '../../../engine/api.ts';`
```ts
export const goober: TalentTreeDef = {
  id: 'goober', name: 'Goober', description: 'Your Goo: a drop that turns and finds the nearest enemy for you.',
  look: { shape: 'circle', color: PALETTE.blue },
  talents: [
    { id: 'reap', upgrade: 'reap', max: 3 },
    { id: 'goo', upgrade: 'goo', max: 3, needs: [['reap', 1]] },
    { id: 'gush', upgrade: 'gush', max: 3, needs: [['goo', 1]] },
    { id: 'scatter', upgrade: 'scatter', max: 1, needs: [['goo', 3]] },
  ],
};
```

### Steps
1. Create the two projectiles, the status, and the area (no cross-deps).
2. Create the four upgrades and the tree.
3. Registry lines (one import + one array line each, next to the related item):
   - `upgrades/index.ts`: `goo` after `lob`; `reap` after `chill`; `scatter` after `fuse`; `gush` after `scatter`.
   - `projectiles/index.ts`: `goo`, `goolet` after `glob`.
   - `areas/index.ts`: `puddle` after `sticky`.
   - `statuses/index.ts`: `gooSlow` after `mired`.
   - `talents/index.ts`: `goober` after `lobber`.
4. `npm run check`, then `npm run smoke`.

### Pitfalls
- The kill mark MUST be set in the Goo projectile's `onHit` (`target.mem.gooAt = ctx.time`), not in `onEnd`. Engine order per tick: projectile collisions (strike → projectile `onHit`) → areas → `resolveDeaths` (fires `onKill`). So `onKill` sees the mark; `onEnd`/plain-damage marks would not. Gush and Scatter read `victim.mem.gooAt` with the same 0.4 s freshness window `fuse` uses.
- Mini-Goo (`goolet`) must have NO `onHit` and never set `gooAt`, so they can't trigger Gush/Scatter (and can't pop again). It also gets no `onKill`.
- Reap's `hit.damage <= 0` guard is required: the Lobber's bubble is a 0-damage, pierce-99 projectile that "touches" many units in flight — without the guard Reap would add +6 on every touch. Pre-hit hp is `hit.target.hp + hit.damage`.
- Reap uses `ctx.damage(t, n, me)` (plain damage, no re-triggered on-hit), so it cannot recurse, and a Reap killing blow on a Goo-marked target still fires Gush/Scatter.
- Scatter gives each mini-Goo its target's spot via `launch.p1/p2` (world coords ≤ 4000, safe); all four launch from the same kill point, so "nearest enemy from position" would make them all chase the same target — the stored spot is what keeps them distinct.
- The Goo is the game's first `step()` projectile (position sent every tick). Load test is fine: only ~1/4 of the 60 bots favor Goober (~15 → ~1.5 Goo + a few goolets each, vs 2400 monsters). Each `step` does one `nearestEnemy` (spatial-hash query). If `npm run check` ever reports the Goo as the heaviest step projectile, lower the Goo turn rate or homing range — do not convert it to `path()` (it must react to the world).
- The Goo's `pierce` default is 1; Lance's `pierce` stat and Split's `shots` stat apply automatically via `ctx.fire` (cross-tree), so no gating code is needed. Ricochet/Fuse already ignore the Goo (they gate on `def.id==='bolt'` and `mem.splashAt`).
- Colors only from `PALETTE`; the puddle uses `shade(PALETTE.teal, -0.2)` for a deeper teal that still reads as teal. No glow/gradient/blur; the tail is a flat fill + ink outline.

### Tests
none — all new items are content defs auto-tested by `engine/tests/` (one-item-per-file, valid data, reachable talents, each upgrade in a real match, 60-player budget); the smoke test exercises Goo/Gush/Scatter in live 60-bot play.
