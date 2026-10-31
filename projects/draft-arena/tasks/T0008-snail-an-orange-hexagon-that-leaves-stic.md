---
id: T0008
title: "Snail: an orange hexagon that leaves sticky patches behind"
assignee: desktop-4070
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T02:37:00Z
claimed_at: 2026-10-31T04:13:06Z
epic: E2
---

## Goal
A monster that changes the field it walks on: it leaves sticky patches that slow whatever crosses them — player or monster. A crowd turns the floor into a maze: you run clean, or you stand in the muck and farm the Dots that crawl into it.

## Details
- New monster file `src/content/monsters/snail.ts` (closest example for the data shape: `src/content/monsters/puff.ts`; for a `think` run on the server every tick, private state in its `mem`, what the player must see in its synced slots and look, see planning/modules/monsters.md — Zippy, T0005 in the pool, is the other new think).
- Numbers: hp 60, speed 30 (a Dot is 85, a Puff 50, a player 210), radius 18, damage 10 per second while touching (it is the terrain, not the attacker), xp 5, weight 3 (Dot 10, Puff 4, Zippy 6 — the Snail is a minority), fromLevel 5.
- Behavior: crawls toward the nearest player, fanned out, like a Dot. Every 1.5 s of movement it sinks and lays a sticky patch where it is: a new area file `src/content/areas/sticky.ts`, a field of radius 45 lasting 6 s. While inside, anything moves at 60% of its speed — a player (210 → 126) and a Dot (85 → 51) alike; the slow fades 0.5 s after leaving the patch. A crawling Snail leaves a trail: about four overlapping patches in 6 s, a road behind it. If a hit slow (Chill, T0004) and a patch slow are both on the same critter, the stronger one is in effect — they do not multiply.
- It spawns nothing and fires nothing: the patch is a field, not a monster, so the per-player crowd cap of 60 still holds.
- Look: shape hexagon (a Dot is a circle, a Puff a pentagon, a Zippy a triangle), color orange, face: mood calm, 2 eyes, mouth smile — a sleepy crawler. Before it acts it sinks (squashes flat), its mouth closes to o, and a dark orange patch (radius 45, a small snail-print ring) fades in under it over 0.3 s — the floor itself is the warning. On the mint field a patch reads at a glance: an orange stain with an ink outline.
- What counters it: it barely chases (30 u/s) — walk away; kill it before its trail grows (60 hp, a few bolts); walk a clean line. What it punishes: a player who camps a spot (a gem pile, a held position) — the Snails that reach while you stand lay patches under your feet; and in a busy field, trails narrow the routes. The counterplay it invites: stand in your own muck — a mired Dot wave is 40% slower, and a slowed crowd is xp to eat (a Body build with Chill and Chomp turns a Snail's trail into a farm).
- With 6 and with 60: from player level 5 each player's crowd carries a Snail or two (weight 3 of 23); at 60 players the field-wide monster cap still bounds the total, and patches expire 6 s after being laid, so the floor clears itself when the Snails die or move on.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | closes on the nearest player | A Dot is the threat — it bites you; a Snail barely chases, and its threat is the trail it leaves, which slows players and monsters alike and outlives its walk |
| Puff | a warm critter in the crowd | A Puff's threat is what it does on death (pops into three Dots); a Snail's threat is what it does while alive (6-second patches that rewrite the floor it crosses) |
| Zippy (T0005, in the pool) | a monster with its own way to move | A Zippy moves the player — a telegraphed dash intercepts a straight-line kite; a Snail changes the field the player already moves on — patches that slow everything, player or monster, that crosses them |

## Acceptance criteria
- [ ] From player level 5 a small share of the crowd (weight 3 of 23) is a chunky orange hexagon with a smile; below level 5, none.
- [ ] A Snail crawls at 30 u/s; every 1.5 s of movement it sinks, its mouth closes to o, and a dark orange patch (radius 45) fades in under it over 0.3 s; each patch lasts 6 s, then fades.
- [ ] A player inside a patch moves at 60% speed (126 u/s instead of 210) and a Dot inside crawls at 51 u/s instead of 85; the slow fades within 0.5 s of leaving the patch.
- [ ] A Snail's death drops its gem (worth 5 xp) and adds nothing to the crowd; the per-player cap of 60 still holds.
- [ ] A Snail touching a player does 10 per second like any monster; Dot and Puff (and Zippy once T0005 builds) are unchanged; the game starts and plays normally.

## Design (architect, cachyos-x8664)

### Files
- create `src/content/statuses/mired.ts` — the `mired` status (`speedMul: 0.6`): the only way to slow a critter (no direct-slow API); slows players AND monsters alike.
- create `src/content/areas/sticky.ts` — the `sticky` patch (radius 45, life 6, interval 0.1, `follow: false`): its `pulse` mires units in it (`ctx.unitsNear` + `ctx.addStatus('mired', 0.5)`) and sets `a.slots[0]` (0..100) from `a.age` for the fade-in; a dark-orange `look.draw` (ink rim + a dashed snail-print ring at 0.45r) that fades in via `e.slots[0]` and out via `e.hp`.
- create `src/content/monsters/snail.ts` — the Snail (orange hexagon, calm/2 eyes/smile): `think` = `chase` + a 1.5s timer laying `ctx.area(m,'sticky',{x,y})` and a 0.3s sink (squash + mouth→'o') driven by `m.slots[0]`; a `look.draw` that squashes + mouth 'o' while sinking.
- edit `src/content/monsters/index.ts` — add `snail` to `MONSTERS` (one import + one line, appended after zippy).
- edit `src/content/areas/index.ts` — add `sticky` to `AREAS` (one import + one line; registry is currently empty).
- edit `src/content/statuses/index.ts` — add `mired` to `STATUSES` (one import + one line; registry is currently empty).

### Interfaces
mired.ts:
```ts
import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
export const mired: StatusDef = { id: 'mired', name: 'Mired', color: PALETTE.orange, speedMul: 0.6 };
```
sticky.ts:
```ts
import type { AreaDef } from '../../../engine/api.ts';
import { shade } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
export const sticky: AreaDef = {
  id: 'sticky', radius: 45, life: 6, interval: 0.1, follow: false,
  look: {
    shape: 'circle', color: shade(PALETTE.orange, -0.3),
    draw(g, e) {
      const a = (e.slots[0] ?? 100) / 100 * Math.min(1, e.hp * 5); // fade in, then out
      if (a <= 0) return;
      g.save(); g.globalAlpha = a;
      g.fillStyle = shade(PALETTE.orange, -0.3);
      g.beginPath(); g.arc(0, 0, e.radius, 0, Math.PI * 2); g.fill();
      g.lineWidth = 3; g.lineCap = 'round'; g.strokeStyle = PALETTE.ink; g.stroke();
      g.beginPath(); g.arc(0, 0, e.radius * 0.45, 0, Math.PI * 2);
      g.setLineDash([4, 6]); g.lineWidth = 1.5; g.stroke();
      g.restore();
    },
  },
  pulse(ctx, a) {
    a.slots[0] = Math.min(100, Math.round((a.age / 0.3) * 100));
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) ctx.addStatus(u, 'mired', 0.5);
  },
};
```
snail.ts:
```ts
import { chase, drawCritter, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
const SINK = 0.3; const LAY = 1.5;
const SLEEPY: Face = { mood: 'calm', eyes: 2, mouth: 'smile' };
const SETTLING: Face = { mood: 'calm', eyes: 2, mouth: 'o' };
const look: Look = { shape: 'hexagon', color: PALETTE.orange, face: SLEEPY };
look.draw = (g, e) => {
  const sink = e.slots[0] ?? 0;
  g.save();
  if (sink > 0) g.scale(1.3, 0.6);
  drawCritter(g, look, e, { ink: PALETTE.ink, face: sink > 0 ? SETTLING : SLEEPY });
  g.restore();
};
export const snail: MonsterDef = {
  id: 'snail', name: 'Snail',
  description: 'Leaves sticky patches behind; the muck slows whatever crosses it.',
  hp: 60, speed: 30, radius: 18, damage: 10, xp: 5, weight: 3, fromLevel: 5,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    chase(m);
    const since = (mem.snT ?? 0) + dt;
    let sink = (mem.snS ?? 0) - dt;
    if (since >= LAY) { mem.snT = since - LAY; sink = SINK; ctx.area(m, 'sticky', { x: m.x, y: m.y }); }
    else mem.snT = since;
    mem.snS = Math.max(0, sink);
    m.slots[0] = Math.round(Math.max(0, Math.min(1, sink / SINK)) * 100);
  },
};
```

### Steps
1. Create `src/content/statuses/mired.ts` (the status, as above).
2. Create `src/content/areas/sticky.ts` (the area, as above).
3. Create `src/content/monsters/snail.ts` (the monster, as above).
4. Add `snail` to `MONSTERS` in `src/content/monsters/index.ts` (one import + one line, appended after zippy).
5. Add `sticky` to `AREAS` in `src/content/areas/index.ts` (one import + one line; registry currently empty).
6. Add `mired` to `STATUSES` in `src/content/statuses/index.ts` (one import + one line; registry currently empty).
7. Run `npm run check` (typecheck + lint + tests); fix any errors.
8. Run `npm run smoke` (build + play in a browser); fix any errors.

### Pitfalls
- 'Do not multiply with Chill' is not how the engine behaves: `speedMul` MULTIPLIES status speedMuls (`match.ts:380`). A critter with BOTH the patch slow (0.6) and T0004's Chill slow is slowed multiplicatively, not 'the stronger one.' The acceptance (60% = 210→126 / 85→51; fade 0.5s) holds for the single-slow case; flag the multiply to the product owner.
- The fade-IN is driven by `a.slots[0]` set in the `pulse` (the `DrawView` has no age of its own); the pulse runs every 0.1s, so the fade-in is a little stepped — keep it cheap.
- `interval` (0.1s) must be < the status duration (0.5s) or the slow flickers on/off between pulses. The 0.5s status duration is what makes the slow fade within 0.5s of leaving.
- Sink + patch-laying are timers in `m.mem` (`snS` = 0.3s sink, `snT` = 1.5s between patches); server-only (never sent). The sink is driven by `m.slots[0]` (read in `look.draw`).
- `mired` is a SEPARATE status from any other slow (e.g. T0004's Chill); they multiply (see above).

### Tests
none
