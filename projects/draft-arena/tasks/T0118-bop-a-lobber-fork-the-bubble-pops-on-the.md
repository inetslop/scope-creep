---
id: T0118
title: "Bop: a Lobber fork, the bubble pops on the critter it touches"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T19:30:37Z
epic: E27
---

## Goal
Today the bubble only hits the ground, where it lands. Bop gives the Lobber a second aim: a bubble that pops on the critter it touches, a direct burst on the target instead of a splash on the floor — a kill-shot the Lobber can snipe through a crowd, and the Lobber's answer to the Flee, the critter that outruns the splash.

## Details
- **Bop is a projectile change for your bubble**, built the way Drift and Swoop rebuilt the bolt (a new projectile that keeps the bubble's arc flight and adds its behavior; the Lob's fire gives the bubble Bop when you have it).
  - **A Bop bubble that touches a critter (monster or player) pops on it:** a burst at the hit point — radius 35, 14 damage (rank 1); per rank: +5 damage, +5 radius (rank 2: 19 damage, 40; rank 3: 24 damage, 45). Players at half, as with all your hits. **No splash where it popped.**
  - **A Bop bubble that touches no critter splashes where it lands, exactly as a normal bubble does** (Wide, Fuse, Fizz and the rest apply to that splash as usual).
  - The burst scales with your damage stat (Might, Frenzy, Split's 12% cut), and the burst's strike counts as one of your hits: on-hit upgrades apply to it as to any of your hits (the ones that guard on a specific projectile simply don't fire).
  - A popped bubble dies on the first critter it touches, so pierce (Lance) does nothing for it.
  - **Kills:** a popped bubble's kill is your kill — every on-kill upgrade pays out on it (Chomp, Nest, Sting, Scavenge, Adrenaline, Fang). Fuse, Gush, Chew and Scatter are Goo/splash specific and do not fire on a pop.
  - If Fizz (T0116) has landed by build time: a popped bubble leaves no splash, and so nothing for Fizz to linger there.
- **Look:** a Bop bubble wears a **thin white band** around it in flight (a lollipop's band) so a player sees before it lands which bubbles pop and which splash; on pop, a small white burst ring (an ice ring with an ink rim, blooming to the burst radius) and teal confetti where it hit. A normal bubble is unchanged.
- **Talent line (Lobber tree, planning/modules/talents.md):** id `bop`, upgrade `bop`, max 3, needs `[["lob", 3]]` — the fork under Lob beside Wide: Wide grows the splash, Bop aims the bubble at the critter itself.
- **Text:** "Your bubble pops on the critter it touches: a burst (radius 35) for 14 damage where it hits, no splash there. Per rank: +5 damage, +5 radius. A bubble that touches nothing splashes where it lands."
- **Mods, for the bubble (the only weapon it touches):** Quick flies it faster, Haste fires it sooner, Split fans out extra bubbles and each of them pops on a critter (all 12% weaker), Wide sizes only the splash of a bubble that missed, and the damage stat scales the burst. It does nothing for any other weapon.

## Compared with what exists
Bop changes how a projectile flies (the same kind as Drift), so one row for that kind and for every similar upgrade named above. Swoop (T0112) and Fizz (T0116) are being built in the same window as this task: keep their rows even if either has not landed yet, and re-check the difference against the game if either has.

| Existing | What it shares | What Bop does that it can't (not numbers) |
| --- | --- | --- |
| Drift | rewrites how the tree's shot flies | slows your bolts along their line and lets them linger; Bop's bubble stops on the first critter it touches instead of the ground |
| Swoop | rewrites how the tree's shot flies | re-aims a bolt once at the end of its path and flies a second leg; Bop never re-aims — the bubble dies on the first critter it touches |
| Wide | sizes your splash | makes the splash where the bubble lands bigger; Bop removes the splash where the bubble pops |
| Fuse | a reaction to your bubble's kills | pops a ring where a bubble killed; Bop's kill comes from a burst on the critter, and a popped kill still fires Fuse |
| Slush | a Lobber shot that flies straight | leaves a slow puddle where it lands; Bop's burst is a one-shot on the critter it touches, with no zone |
| Fizz | makes the Lobber's ground last | lingers the splash and keeps striking it; Bop's popped bubble has no splash for Fizz to linger |
| Split | more, weaker shots for every weapon | fans out extra bubbles — with Bop, each of them pops on the critter it touches, so the fan becomes a pop-fan |

## Acceptance criteria
- [ ] A player with Bop: a bubble that touches a critter pops on it — a burst (radius 35, 14 damage at rank 1) at the hit point, no splash where it popped.
- [ ] Rank 2: 19 damage, radius 40; rank 3: 24 damage, radius 45.
- [ ] A Bop bubble that touches no critter splashes where it lands exactly as a normal bubble (Wide and Fuse apply to that splash).
- [ ] A Bop bubble wears a thin white band in flight; a player without Bop sees no banded bubbles.
- [ ] On pop: a white ice ring blooming to the burst radius and teal confetti at the hit point.
- [ ] A popped bubble's kill pays Chomp/Nest/Sting/Scavenge as your kill.
- [ ] With Split, every fanned bubble pops on the critter it touches, all 12% weaker.
- [ ] Bop is in the Lobber tab as a 3-rank fork under Lob (needs Lob 3), with the text above.

## Design (architect, inet-racing)

### Files
Create: `src/content/upgrades/bop.ts`, `src/content/projectiles/bop-bubble.ts`, `src/content/areas/bop-burst.ts`, `src/content/effects/bop-confetti.ts`
Edit (one import + one list line each, beside the named line): `src/content/upgrades/index.ts` (import after `bolt` line 4; list line after `drift,` line 78), `src/content/projectiles/index.ts` (both after the `bubble` line), `src/content/areas/index.ts` (both after the `splash` line), `src/content/effects/index.ts` (import after `bellowMouth` line 10; list line after `splashRing,` line 26), `src/content/upgrades/lob.ts`, `src/content/talents/lobber.ts`.

### Interfaces
`src/content/upgrades/bop.ts` — copy `upgrades/drift.ts` exactly, renaming drift→bop: `maxLevel: 3`, `name: 'Bop'`, `look: { shape: 'circle', color: PALETTE.ice }`, `description: "Your bubble pops on the critter it touches: a burst (radius 35) for 14 damage where it hits, no splash there. Per rank: +5 damage, +5 radius. A bubble that touches nothing splashes where it lands."`, and the same `stats: {},` comment line and `bopRank(me: Player)` (same defensive cast, `.get(bop)`).

`src/content/projectiles/bop-bubble.ts`:
```ts
import { drawCritter, type Launch, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { BUBBLE_FLIGHT, BUBBLE_SPEED } from './bubble.ts';
import { bopRank } from '../upgrades/bop.ts';

const ARC = 80; // bubble.ts keeps its own copy

function aim(s: Launch): { x: number; y: number } { return { x: s.p1, y: Math.floor(s.p2 / 8) }; }

/** Bop's bubble: same arc flight; the first critter it touches pops it into a burst instead of splashing. */
export const bopBubble: ProjectileDef = {
  id: 'bop-bubble',
  radius: 8,
  life: BUBBLE_FLIGHT,
  pierce: 0, // dies on the first critter it touches
  look: {
    shape: 'circle',
    color: PALETTE.ice,
    draw(g, e) {
      drawCritter(g, this, e, { ink: PALETTE.ink });
      g.beginPath();
      g.arc(0, 0, e.radius * 0.7, 0, Math.PI * 2);
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.white; // the lollipop band
      g.stroke();
    },
  },
  path(s, t) { // copy of bubble.ts's path, word for word
    const a = aim(s);
    const d = Math.hypot(a.x - s.x, a.y - s.y);
    const f = Math.min(1, (s.speed / BUBBLE_SPEED) * (t / BUBBLE_FLIGHT));
    return { x: s.x + Math.cos(s.angle) * d * f, y: s.y + Math.sin(s.angle) * d * f - ARC * Math.sin(Math.PI * f) };
  },
  onHit(ctx, p) {
    p.pierce = 0; // a pop always kills the bubble, even with Lance pierce
    const me = p.owner;
    if (me.type !== 'player') return;
    const rank = Math.min(3, Math.max(1, bopRank(me)));
    const radius = 30 + 5 * rank;
    ctx.area(me, 'bop-burst', { x: p.x, y: p.y, damage: 14 + 5 * (rank - 1), life: 0.2 * rank });
    ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, radius);
    ctx.effect('bop-confetti', { x: p.x, y: p.y }, undefined, radius);
  },
  onEnd(ctx, p) { // touched nothing: splash exactly like the plain bubble (Wide/Fuse/Fizz apply)
    const me = p.owner;
    if (me.type !== 'player') return;
    const level = (p.launch.p2 % 8) + 1;
    ctx.area(me, 'splash', { x: p.x, y: p.y, damage: 10 + 2 * (level - 1) });
    ctx.effect('splash-ring', { x: p.x, y: p.y }, undefined, Math.round(70 * me.stats.area));
  },
};
```
`src/content/areas/bop-burst.ts`:
```ts
import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Bop's pop: one strike for the burst radius, invisible, and no splash where it popped. */
export const bopBurst: AreaDef = {
  id: 'bop-burst',
  radius: 1, // the strike range comes from the rank; 1 unit is not seen
  life: 0.6, // firing site sets it: 0.2 * rank
  interval: 60, // pulses exactly once
  look: { shape: 'circle', color: PALETTE.ice },
  pulse(ctx, a) {
    const rank = Math.min(3, Math.max(1, Math.round(a.life / 0.2)));
    for (const u of ctx.enemiesNear(a.owner, a.x, a.y, 30 + 5 * rank)) ctx.strike(a, u);
  },
};
```
`src/content/effects/bop-confetti.ts`:
```ts
import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const COLORS = [PALETTE.teal, PALETTE.ice, PALETTE.white] as const;

/** Bop's pop: a few candy dots fly out from the hit point. */
export const bopConfetti: EffectDef = {
  id: 'bop-confetti',
  duration: 0.5,
  draw(g, fx) {
    g.save();
    g.globalAlpha = 1 - fx.t;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4 * noise(fx.seed, i);
      const d = fx.value * (0.2 + 0.8 * fx.t);
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 4 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fillStyle = COLORS[i % 3];
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
    }
    g.restore();
  },
};
```

### Steps
1. Create `upgrades/bop.ts` (per Interfaces). 2. Create `projectiles/bop-bubble.ts`. 3. Create `areas/bop-burst.ts`. 4. Create `effects/bop-confetti.ts`. 5. In `upgrades/lob.ts`: add `import { bopRank } from './bop.ts';` and change only the projectile id in its `fire` — `'bubble'` → `bopRank(me) > 0 ? 'bop-bubble' : 'bubble'` (every other option stays byte-for-byte). 6. In `talents/lobber.ts`, insert after the `wide` line: `{ id: 'bop', upgrade: 'bop', max: 3, needs: [['lob', 3]] },`. 7. Add the four registry lines exactly where Files says. Run `npm run check` and `npm run smoke`.

### Pitfalls
- The pop = first-touch death comes from `pierce: 0` + the engine killing a spent projectile **without** calling `onEnd` — that is what suppresses the splash. Do not add a lifetime-based pop, and do not set `pierce: 99` like bubble.ts.
- `onHit` runs before the engine decrements pierce, so `p.pierce = 0` there is what makes Lance's fire-time `+ stats.pierce` do nothing.
- bop-burst must NOT set `u.mem.splashAt` (only `areas/splash.ts` does) — so a pop kill does not fire Fuse, Gush, Chew or Scatter, exactly as the spec's details list it (the compared-with table's "still fires Fuse" line is wrong; trust the details). Kill credit goes to the owner via `ctx.strike(a, u)`, so Chomp/Nest/Sting/Scavenge/Adrenaline/Fang all pay.
- Wide must size only the missed splash: the burst area's def radius is 1 and the pulse uses the fixed `30 + 5 * rank`; the rank is carried in the area's `life` (0.2/0.4/0.6), which the engine does not scale (it scales only radius and damage, so the damage stat scales the burst for free).
- `path` is pure: copy bubble.ts's formula, redeclare `ARC` (not exported), never `ctx`/`Math.random`/state. Draws use only `noise(seed, i)`.
- Do not repack `p1`/`p2` (aim + Lob level already live there); read the Bop rank from `p.owner` at pop time and clamp 1..3 (a mid-flight prestige only lowers it).
- No sound: the spec asks for none and the Lobber's splash is currently silent. Do not touch `src/audio/sfx.ts`.

### Tests
None to write — `npm run check` auto-tests registration, talent reachability, each item in a real match and the 60-player budget; `npm run smoke` plays it in a browser. `bopRank` is a copy of the proven `driftRank` and needs no unit test.
