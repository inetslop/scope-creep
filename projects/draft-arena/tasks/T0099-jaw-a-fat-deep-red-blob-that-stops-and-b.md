---
id: T0099
title: "Jaw: a fat deep-red blob that stops and bites a locked cone in front of it"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T16:34:41Z
epic: E20
---

## Goal
The crowd learns a way to threaten no monster has: a monster you cannot face. It stops and bites the ground in front of it, so a player dodges by strafing, not by kiting. This is the menagerie's last slot, back to 10 types.

## Details
- Look: a fat round blob (a squashed circle), radius 26, ink outline, and its face is its mouth: a big round mouth on the front of the body with two small eyes and angry brows above it. Color: a deep red clearly deeper than the Dot's red — a palette color no other monster uses (today's monsters use #ff6b6b Dot, #ffa8a8 Flee, #ffa94d Spitter, #f783ac Zippy, #da77f2 Sleeper, #a78bfa Puff, #845ef7 Brood, plus whatever the Toss and the Twin take; pick the reddest unused step, #fa5252 if it is in the palette). The giant mouth is the tell: in a crowd, a big deep-red round blob whose face is a mouth reads as a Jaw, not a Dot or a Spitter.
- Text (its description): "Stops, opens its giant mouth, then bites everything in front."
- Idle: the mouth is a closed teeth grin; it shuffles toward the nearest player.
- The bite: when a player is within 90 and at least 1.5 s since its last bite, it stops for 0.6 s — the mouth opens wide (a dark opening with 4 white tooth bumps) and the body squashes slightly, the way the Zippy squashes before its dash — with its facing locked for the whole wind-up (the Zippy's fixed-lane rule). Then it bites: a 100° cone, radius 85 from its centre, in its locked facing, one strike, 10 damage (a field, like the Maw's bite; monsters and players alike). The bite lands with a short red ring with an ink rim blooming to radius 85 across the cone over 0.3 s. The mouth closes and it resumes chasing; the next bite is possible 1.5 s after that bite.
- Numbers: hp 50, speed 55 u/s, radius 26, touch damage 6 per second, xp 5, weight 3, fromLevel 4. It spawns and fires nothing (it adds only itself to the crowd — 0 extra critters or shots).
- The wind-up syncs in one of its 4 slots (0 idle, 1 winding up), the way the Zippy syncs its wind-up, so every client sees the open mouth at the same moment.
- What it punishes: standing still in a crowd (a Hive life standing in the swarm, a geyser hold, a stop to grab a gem) and front-on kiting — it reaches 90 and bites while you stand. What counters it: strafing during the 0.6 s wind-up (the cone is locked, so a sidestep puts you outside the 100° wedge), ranged builds (a Lobber bubble, a Goober's Goo, a Gunner's Bolt) that never let it close to 90, and killing it (50 hp, xp 5, its gem). Behind it is safe until it turns back.

## Acceptance criteria
- [ ] A Jaw shuffles toward the nearest player; within 90 of one it stops, holds its open mouth 0.6 s, and bites a 100° cone in front of it for 10 damage, at most once per 1.5 s.
- [ ] A player who strafes out of the locked cone during the 0.6 s wind-up is not hit; whatever stands in the cone when it lands is, monsters and players alike.
- [ ] In a crowd of the other monsters a player tells the Jaw apart at a glance: a fat deep-red round blob whose face is a giant mouth, and the mouth opens before every bite.
- [ ] It spawns from level 4 at its weight (rarer than the Dot), drops the normal gem, and pops into confetti like the others.
- [ ] `npm run check` and `npm run smoke` (desktop and mobile) pass.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | heads straight for the nearest player | pure touch damage while it touches you; the Jaw stops and bites a locked cone in front — an attack you dodge by strafing, not by running |
| Zippy | stops, changes its look, then commits to a direction locked when the wind-up starts | the Zippy's committed direction is a dash — a path you cross; the Jaw's is a stationary cone bite — a wedge of ground you leave, and the Zippy keeps moving while the Jaw stays still |
| Sleeper | its look changes before it acts | the Sleeper's change is a state flip from still sleep to chase and it has no attack; the Jaw's change telegraphs a bite in a locked direction |
| Brood | a big slow body you have to deal with up close | the Brood answers your closeness by birthing Dots (a crowd multiplier); the Jaw answers it by biting you (a direct attack) |
| Puff | a big slow body in a crowd | the Puff answers being killed by popping into three Dots; the Jaw answers being approached by biting, and nothing happens when it dies |

## Design (architect, desktop)

- `ctx.area` sets the area's `angle: 0` (not the owner's facing), so the locked facing must ride in the owner's `mem` and be read in the area's `pulse` via `a.owner.mem.ja`.
- "Monsters and players alike" requires `ctx.unitsNear` (all units), not `enemiesNear` (players only); monster-as-damager is safe because `creditFor` only returns a player and `damage` only sets `lastHitBy` for a player.
- Default death (`resolveDeaths:785-786`) already plays the death effect and drops a gem worth `def.xp`, so no `onDeath` is needed.
- `#fa5252` is not in `PALETTE` (only `#ff6b6b`/`#ffa8a8`), so a one-line `crimson` addition is required (colors must come from `PALETTE`; no `shade()` on a body).
- The stub context accepts any canvas call, but the real browser (smoke) must support the API — existing content uses `rect`/`arc`/`ellipse`, never `roundRect`.
- Tick order: `updateMonsters` (think) runs before `updateAreas`, so the bite pulse lands the same tick.

DESIGN:
### Files
- create `src/content/monsters/jaw.ts` — the Jaw monster (`id: 'jaw'`, export `jaw`): a fat deep-red blob that shuffles, stops, opens its mouth, and bites a locked cone.
- create `src/content/areas/jaw-bite.ts` — the bite field (`id: 'jaw-bite'`, export `jawBite`): one strike, 100° cone in the locked facing, 10 dmg, monsters and players alike, red blooming wedge.
- edit `src/content/monsters/index.ts` — add `import { jaw } from './jaw.ts';` after the zippy import; add `jaw,` after `zippy,` in `MONSTERS`.
- edit `src/content/areas/index.ts` — add `import { jawBite } from './jaw-bite.ts';` after the bite import; add `jawBite,` after `bite,` in `AREAS`.
- edit `src/content/palette.ts` — add `crimson: '#fa5252',` directly under `red: '#ff6b6b',`.

### Interfaces
```ts
// jaw.ts (all numbers live on the def — NO rules.ts change)
const jaw: MonsterDef = {
  id: 'jaw', name: 'Jaw',
  description: 'Stops, opens its giant mouth, then bites everything in front.',
  hp: 50, speed: 55, radius: 26, damage: 6, xp: 5, weight: 3, fromLevel: 4,
  look, think,
};
// slots: [0]=phase (0 shuffling/grin, 1 winding up/open mouth), [1]=crouch*100 (0..100)
// mem:  ja=locked facing (rad*100), jp=phase, jt=wind-up countdown, jc=bite cooldown, jk=crouch 0..1
// jaw-bite.ts
const jawBite: AreaDef = { id: 'jaw-bite', radius: 85, life: 0.3, interval: 0.4, look, pulse }; // interval>life => exactly one strike
// private helper in jaw.ts
function drawJawFace(g: CanvasRenderingContext2D, r: number, open: number, ink: string): void { ... }
```

### Steps
1. `palette.ts`: add `crimson: '#fa5252',` under `red`.
2. `jaw-bite.ts`:
```ts
import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
const CONE = (100 * Math.PI) / 180;
export const jawBite: AreaDef = {
  id: 'jaw-bite', radius: 85, life: 0.3, interval: 0.4,
  look: {
    shape: 'circle', color: PALETTE.crimson,
    draw(g, e) {
      const fade = e.hp;                       // 1 at birth -> 0 at death
      const r = e.radius * (0.3 + 0.7 * (1 - fade)); // blooms out to full radius
      g.save(); g.rotate((e.slots[0] ?? 0) / 100);   // wedge opens along the locked facing (+x)
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, -CONE / 2, CONE / 2); g.closePath();
      g.globalAlpha = 0.55 * fade; g.fillStyle = PALETTE.crimson; g.fill();
      g.globalAlpha = 0.9 * fade; g.strokeStyle = PALETTE.ink; g.lineWidth = 3; g.lineJoin = 'round'; g.stroke();
      g.restore();
    },
  },
  pulse(ctx, a) {
    if (!a.owner.alive) return;
    const aim = (a.owner.mem.ja ?? 0) / 100;   // facing locked at wind-up start (ctx.area resets angle)
    a.slots[0] = Math.round(aim * 100);
    const half = CONE / 2;
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) {   // all units: monsters AND players
      if (u.id === a.owner.id || !u.alive) continue;       // never the Jaw itself
      let diff = Math.atan2(u.y - a.y, u.x - a.x) - aim;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) <= half) ctx.strike(a, u);
    }
  },
};
```
3. `jaw.ts` — body look (a squashed circle, longer toward the mouth, crouching in the wind-up) and the mouth-face:
```ts
import { chase, drawCritter, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
const REACH = 90, WINDUP = 0.6, COOLDOWN = 1.5;
function drawJawFace(g, r, open, ink) {
  const ex = r * 0.12, ey = r * 0.44, er = r * 0.11;
  for (const s of [-1, 1]) {                                   // two small eyes + angry brows
    const y = s * ey;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, y, er, 0, Math.PI * 2); g.fill();
    g.fillStyle = ink; g.beginPath(); g.arc(ex + er * 0.35, y, er * 0.5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = ink; g.lineWidth = Math.max(1.5, r * 0.09); g.lineCap = 'round';
    g.beginPath(); g.moveTo(ex - er * 0.7, s * (ey + er * 0.7)); g.lineTo(ex + er * 0.7, s * (ey + er * 0.4)); g.stroke();
  }
  const mx = r * 0.24;                                         // the giant mouth, on the front (+x)
  if (open === 1) {                                            // open: dark gape + four white tooth bumps
    g.fillStyle = ink; g.beginPath(); g.ellipse(mx, 0, r * 0.24, r * 0.28, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff';
    const teeth: [number, number][] = [[mx - r*0.11, -r*0.22],[mx + r*0.11, -r*0.22],[mx - r*0.11, r*0.22],[mx + r*0.11, r*0.22]];
    for (const [tx, ty] of teeth) { g.beginPath(); g.arc(tx, ty, r * 0.06, 0, Math.PI * 2); g.fill(); }
  } else {                                                     // closed: a white teeth grin
    g.fillStyle = '#fff'; g.strokeStyle = ink; g.lineWidth = Math.max(1.5, r * 0.07);
    g.beginPath(); g.rect(mx - r * 0.22, -r * 0.15, r * 0.44, r * 0.3); g.fill(); g.stroke();
    g.beginPath();
    for (let i = 1; i < 4; i++) { const x = mx - r * 0.22 + r * 0.11 * i; g.moveTo(x, -r * 0.15); g.lineTo(x, r * 0.15); }
    g.stroke();
  }
}
const look: Look = {
  shape: 'circle', color: PALETTE.crimson, face: false,
  draw(g, e) {
    const phase = e.slots[0] ?? 0, k = (e.slots[1] ?? 0) / 100;
    g.save(); g.rotate(e.angle); g.scale(1.08 + 0.12 * k, 0.92 - 0.12 * k); g.rotate(-e.angle);
    drawCritter(g, look, e, { ink: PALETTE.ink });             // no face here
    g.restore();
    g.save(); g.rotate(e.angle); drawJawFace(g, e.radius, phase, PALETTE.ink); g.restore(); // face unsquashed
  },
};
```
4. `jaw.ts` — the `think` state machine (add to the `jaw` def after `look`):
```ts
think(ctx, m, dt) {
  const mem = m.mem;
  let phase = mem.jp ?? 0;                 // 0 shuffling, 1 winding up
  let left = (mem.jt ?? 0) - dt;           // wind-up countdown
  let cd = (mem.jc ?? 0) - dt;             // bite cooldown
  const t = m.target;
  if (phase === 1) {                       // wind-up: stopped, mouth open, facing locked
    m.vx = 0; m.vy = 0; m.angle = mem.ja ?? 0;
    if (left <= 0) { ctx.area(m, 'jaw-bite', { damage: 10 }); phase = 0; cd = COOLDOWN; }
  } else if (t && cd <= 0 && Math.hypot(t.x - m.x, t.y - m.y) <= REACH) {
    phase = 1; left = WINDUP; mem.ja = Math.atan2(t.y - m.y, t.x - m.x); m.vx = 0; m.vy = 0; m.angle = mem.ja;
  } else chase(m);                          // shuffles at the nearest player
  const want = phase === 1 ? 1 : 0;         // the crouch eases toward the wind-up (dt-based)
  mem.jk = Math.max(0, Math.min(1, (mem.jk ?? 0) + (want - (mem.jk ?? 0)) * Math.min(1, dt / 0.06)));
  mem.jp = phase; mem.jt = left; mem.jc = cd;
  m.slots[0] = phase; m.slots[1] = Math.round(mem.jk * 100);
}
```
5. Register in the two `index.ts` files (one line each, next to zippy / bite).

### Pitfalls
- "Monsters and players alike" needs `ctx.unitsNear` (all units), NOT `enemiesNear` (players only). Exclude the owner (`u.id === a.owner.id`) or the Jaw bites itself.
- `ctx.area` sets the area's `angle: 0`, so the locked facing must ride in `m.mem.ja` and be read in the pulse via `a.owner.mem.ja` — do NOT read `a.owner.angle` (the resumed `chase(m)` overwrites it the same tick).
- Normalize the cone angle diff to `[-π, π]` before comparing to `±50°`; otherwise units behind/around the sides mis-trigger.
- `#fa5252` is not in `PALETTE`; add it (`crimson`) — never `shade()` on a creature's body.
- Use `rect`/`arc`/`ellipse` (established here), not `roundRect`; keep the face inside the body so there is one outline.
- This is the 10th (last) monster slot: 7 now + Toss + Twin + Jaw = the cap; keep `weight: 3` (rarer than Dot's 10). No `onDeath` needed (engine drops the gem and confetti by default).
- `mem.jk` must be clamped 0..1 and eased with `dt` (not per-frame) so the squash is frame-rate independent; `slots` stay whole numbers.

### Tests
none — every content item (the monster and the area) is exercised automatically by `engine/tests/`.
