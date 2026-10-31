---
id: T0085
title: "Toss: a big slow melon that lobs a high-arcing blob that splashes where it lands"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: [T0071]
attempts: 1
created: 2026-10-31T14:39:38Z
claimed_at: 2026-10-31T15:43:52Z
finished_at: 2026-10-31T16:38:17Z
epic: E20
---

## Goal
The menagerie's next way to threaten: a big slow critter that holds a wide band and lobs a high-arcing blob that splashes an area where it lands — the first monster whose attack is a zone you dodge by moving during the flight, not a line you cross.

## Details
- A new monster "Toss" in src/content/monsters/ (closest examples: spitter.ts — it too holds a distance band and shoots from it; zippy.ts — it too shows a windup in its face before it acts). One new monster file plus one registry line in the monsters index, one new projectile file (closest example: the Spitter's glob, a straight monster shot) and one new area file for the splash (closest example: the bubble's splash ring — a ring that blooms out and strikes once, then is gone).
- Look: a big squishy melon — a round body with a squashed flat bottom (its own draw, as the Brood's sac has one), the biggest body in the menagerie. Color: peach (#ffc078), a light orange — if T0071 (in progress) has assigned it to an existing monster, use the one remaining bright warm palette color no other monster uses and record the final hex in the design; no two monsters share a color. Face: mood calm, 2 eyes, mouth smile at rest.
- Behavior (its think): find the nearest player and hold a 220–420 unit band around it. Inside 220: stop and back away at 40 u/s, and do not lob. Past 420: close at 55 u/s. In the band: hold position, fanned out a little so Tosses don't stack.
- The lob cycle: while a player is in the band, every 2.2 s the Toss winds up 0.6 s — the face turns angry, the mouth opens wide with teeth, and a purple blob (radius 10, the palette purple, used as it is) inflates in its mouth (synced in its slots, so every client sees the inflate) — then it lobs one plop.
- The plop projectile: a big purple drop (radius 12) that arcs high — its apex about 140 units above the middle of the flight — at 240 u/s ground speed (about 1.25 s of flight at the typical 300 u band), aimed at where the target was at launch; it does not turn and it is gone on landing. At most one plop in flight per Toss (the 2.2 s cycle is longer than the flight).
- The splash: where the plop lands, a purple ring with an ink rim blooms out to radius 60 over 0.2 s and strikes once for 12 damage — players and monsters alike — then vanishes; it leaves no ground behind. Because it hits monsters too, a Toss in a thick crowd sometimes splashes its own neighbors, and a player can use that.
- Numbers: hp 60, speed 55, radius 26, damage 16 per second while touching a player, xp 5, weight 3, fromLevel 6.
- What it punishes: the mid-range camper (a Gunner at 300 has to keep moving through every lob). What counters it: the close-in (inside 220 it stops and cannot lob — a Body with Maw or a Hive with Horn can reach it) and the wide kite (past 420 it walks at 55 and a 210 u/s player drops it).

## Acceptance criteria
- [ ] From a level 6 player up, a big round melon (radius 26, its color, calm two-eyed smile) appears in the spawn crowds; no other monster shares its color.
- [ ] It holds a 220–420 band around the nearest player: inside 220 it stops, backs away at 40 u/s and never lobs; past 420 it closes slowly; in the band it holds position.
- [ ] With a player in the band, every 2.2 s: a 0.6 s windup (angry face, wide toothy mouth, purple blob inflating in it — visible to every player) then a high arc (apex ~140 u up, ~1.25 s flight) aimed at where the target was at launch; at most one plop in flight at a time.
- [ ] Where the plop lands, a purple ink-rimmed ring blooms to radius 60 and strikes once for 12 (a player standing in it takes 12; a monster in it takes 12 or pops); the ring vanishes and leaves no ground.
- [ ] On death: its normal gem (5 xp) and a pop, like every other monster; a level 1–5 player never spawns one.
- [ ] In a 60-player match its band, lobs and splashes work per player with no extra cost, and a splash can pop its own neighbors in a thick crowd.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Spitter | holds a distance band around a player and shoots from it | the Spitter's glob is a straight point shot you can cross; the Toss's plop arcs high and splashes an area where it lands — the dodge is moving during the flight, and the splash can catch you off the line |
| Zippy | a face change before it acts (a windup) | the Zippy's windup ends in a dash of its own body; the Toss never leaves its band — its threat is a lob that flies far from its own body |
| Puff | a pop with a radius | the Puff's pop happens on its own death, centered on itself; the Toss's splash lands wherever the arc goes, far from the Toss |
| Dot | attacks a player in the crowd | the Dot's attack is contact; the Toss never touches you — it punishes from 220 out, and its splash hits whatever stands where it lands |
| Brood | a big slow body that holds position | the Brood keeps birthing Dots while you stay close; the Toss throws at you while you stay in its band — a position you can leave by moving |

## Design (architect, desktop)

### Files
- create `src/content/monsters/toss.ts` — the Toss monster (`MonsterDef`, id `toss`): band-holding think, windup slots, squashed-melon look
- create `src/content/projectiles/plop.ts` — the lobbed drop (`ProjectileDef`, id `plop`): pure parabolic `path`, `onEnd` spawns the splash
- create `src/content/areas/plop-splash.ts` — the splash ring (`AreaDef`, id `plop-splash`): one-strike purple ring with a client-drawn bloom
- edit `src/content/palette.ts` — only if step 1 says so: add `peach: '#ffc078',` right after the `orange` line
- edit `src/content/monsters/index.ts` — add `import { toss } from './toss.ts';` after the spitter import; add `toss,` after `spitter,` in `MONSTERS`
- edit `src/content/projectiles/index.ts` — add `import { plop } from './plop.ts';` after the glob import; add `plop,` after `glob,` in `PROJECTILES`
- edit `src/content/areas/index.ts` — add `import { plopSplash } from './plop-splash.ts';` after the splash import; add `plopSplash,` after `splash,` in `AREAS`

### Interfaces
No new types. Contracts: `toss` slots: `slots[0]` = 0 idle / 1 winding up, `slots[1]` = blob inflation 0..100 (integers). `plop` launch: `p1` = flight time in centiseconds (`life * 100`), `speed` = 240 ground speed, `damage` = 0 (the splash is the attack). `plopSplash` pulses exactly once (at spawn) for 12 damage via `ctx.strike`. Final color: `#ffc078` peach — unless T0071 (already done before this task runs) assigned it to a monster, then the one remaining bright-warm `PALETTE` color no monster look uses (step 1); record the chosen hex in a comment in `toss.ts`.

### Steps
1. Color: grep `#ffc078` in `src/content/`. If a monster's look uses it, pick the warm `PALETTE` entry (red/orange/purple/pink plus any warm entries T0071 added) no monster look uses and use that entry in `toss.ts`. Otherwise, if `PALETTE` has no `#ffc078` entry, add `peach: '#ffc078',` after `orange` in `palette.ts`, and use `PALETTE.peach`.
2. Create `src/content/areas/plop-splash.ts`:
```ts
import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Where a plop lands: a purple ink-rimmed ring blooms to 60 over 0.2 s, strikes once for 12 (players and monsters alike), then vanishes. */
export const plopSplash: AreaDef = {
  id: 'plop-splash',
  radius: 60,
  life: 0.2,
  interval: 0.4, // longer than life: the first pulse (at once) is the only one
  look: {
    shape: 'circle', color: PALETTE.purple,
    draw(g, e) {
      const q = Math.min(1, 1 - e.hp); // the bloom: 0 at spawn, 1 at the end (the wire hp is the life left)
      const r = e.radius * q;
      if (r <= 1) return;
      const fade = Math.min(1, e.hp * 4); // fades out over the last quarter
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.globalAlpha = 0.25 * fade;
      g.fillStyle = PALETTE.purple;
      g.fill();
      g.globalAlpha = fade;
      g.lineWidth = 5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.lineWidth = 2.5;
      g.strokeStyle = PALETTE.purple;
      g.stroke();
      g.globalAlpha = 1;
    },
  },
  pulse(ctx, a) {
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) {
      if (u === a.owner) continue;
      ctx.strike(a, u);
    }
  },
};
```
3. Create `src/content/projectiles/plop.ts`:
```ts
import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const APEX = 140; // the arc's height above the middle of the flight

/** The Toss's lobe: a big purple drop on a high arc. It hits nothing in flight; the splash where it lands is the attack. */
export const plop: ProjectileDef = {
  id: 'plop',
  radius: 12,
  life: 1.25, // the Toss sets it per lobe (distance / speed)
  pierce: 99, // it passes through everything until it lands
  look: { shape: 'circle', color: PALETTE.purple },
  path(s, t) {
    const T = s.p1 / 100 || 1; // flight time, centiseconds from the launch
    const u = Math.min(t, T);
    return {
      x: s.x + Math.cos(s.angle) * s.speed * u,
      y: s.y + Math.sin(s.angle) * s.speed * u - (4 * APEX * u * (T - u)) / (T * T),
    };
  },
  onEnd(ctx, p) {
    ctx.area(p.owner, 'plop-splash', { x: p.x, y: p.y, damage: 12 });
  },
};
```
4. Create `src/content/monsters/toss.ts` (use the color from step 1 where `PALETTE.peach` appears):
```ts
import { chase, drawCritter, drawFace, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Holds a 220-420 band; every 2.2 s it winds up 0.6 s and lobs a plop that splashes where it lands. */
const NEAR = 220;
const FAR = 420;
const BACK_SPEED = 40;
const WINDUP = 0.6;
const WAIT = 1.6; // WINDUP + WAIT = the 2.2 s cycle
const PLOP_SPEED = 240;

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'smile' };
const WIND: Face = { mood: 'angry', eyes: 2, mouth: 'teeth' };

const look: Look = { shape: 'circle', color: PALETTE.peach, face: CALM };
/** A big squashed melon, the biggest body in the menagerie; a purple blob inflates in its mouth during the windup. */
look.draw = (g, e) => {
  const wind = (e.slots[0] ?? 0) === 1;
  g.save();
  g.scale(1, 0.85); // squashed: wide and low
  drawCritter(g, look, e, { ink: PALETTE.ink });
  g.restore();
  drawFace(g, wind ? WIND : CALM, e.radius, e.angle, PALETTE.ink); // the face keeps its shape: after the squashed body
  if (wind) {
    const q = (e.slots[1] ?? 0) / 100;
    if (q > 0) {
      g.beginPath();
      g.arc(0, e.radius * 0.42, 10 * q, 0, Math.PI * 2); // the mouth sits at (0, r * 0.42)
      g.fillStyle = PALETTE.purple;
      g.fill();
      g.strokeStyle = PALETTE.ink;
      g.lineWidth = 2;
      g.stroke();
      g.beginPath();
      g.ellipse(-3 * q, e.radius * 0.42 - 3 * q, 3 * q, 1.8 * q, -0.6, 0, Math.PI * 2);
      g.fillStyle = PALETTE.white;
      g.fill();
    }
  }
};

/** The menagerie's next threat: a slow melon that lobs a splashing blob from its band. */
export const toss: MonsterDef = {
  id: 'toss',
  name: 'Toss',
  description: 'Holds its band and lobs a blob that splashes where it lands.',
  hp: 60,
  speed: 55,
  radius: 26,
  damage: 16,
  xp: 5,
  weight: 3,
  fromLevel: 6,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    let phase = mem.tp ?? 0; // 0 moving/holding, 1 winding up
    if (phase === 1) {
      // Windup: hold ground, face the locked aim; the blob inflates, then the plop goes.
      m.vx = 0;
      m.vy = 0;
      m.angle = mem.ta ?? 0;
      const left = (mem.tw ?? WINDUP) - dt;
      mem.tw = left;
      if (left <= 0) {
        const life = (mem.td ?? FAR) / PLOP_SPEED;
        ctx.fire(m, 'plop', { angle: mem.ta ?? 0, speed: PLOP_SPEED, damage: 0, life, p1: Math.round(life * 100) });
        phase = 0;
        mem.tc = 0;
        m.slots[0] = 0;
        m.slots[1] = 0;
        mem.tp = phase;
        return;
      }
      m.slots[0] = 1;
      m.slots[1] = Math.round((1 - left / WINDUP) * 100);
      mem.tp = phase;
      return;
    }
    m.slots[0] = 0;
    m.slots[1] = 0;
    mem.tc = (mem.tc ?? 0) + dt; // seconds since the last plop
    const t = m.target;
    if (!t) {
      m.vx = 0;
      m.vy = 0;
      return;
    }
    const d = Math.hypot(t.x - m.x, t.y - m.y);
    const a = Math.atan2(t.y - m.y, t.x - m.x);
    if (d < NEAR) {
      m.vx = -Math.cos(a) * BACK_SPEED; // too close: back off at 40, and it never lobs from here
      m.vy = -Math.sin(a) * BACK_SPEED;
      m.angle = a;
    } else if (d > FAR) {
      chase(m); // too far: close at its own 55 u/s, fanned in like any crowding monster
    } else {
      m.vx = 0; // in the band: hold position (fanned at its own approach angle)
      m.vy = 0;
      m.angle = a;
      if (mem.tc >= WAIT) {
        phase = 1; // start the windup, aim locked for the whole 0.6 s
        mem.tw = WINDUP;
        mem.ta = a;
        mem.td = d;
        m.slots[0] = 1;
      }
    }
    mem.tp = phase;
  },
};
```
5. Add the three registry lines exactly as in ## Files (one import, one list entry each, next to the related item).
6. Run `npm run check` and fix anything it reports.

### Pitfalls
- `plop.path` must stay pure (only `s` and `t`): no `ctx`, `owner`, `Math.random`, or state; the engine tests enforce this and run it on server and every client.
- The plop deals no flight damage: fire it with `damage: 0` and keep `pierce: 99` so it always reaches its landing point. The engine skips same-team units anyway, so a monster-fired plop could never splash-credit monsters in flight.
- The splash must use `ctx.unitsNear` (not `ctx.enemiesNear`, which for a monster owner would miss other monsters — the splash has to pop its own neighbors); skip `a.owner`.
- Keep `life` and `p1` in sync (`p1 = Math.round(life * 100)`); a mismatch only shifts the landing by a fraction of a unit.
- The windup locks aim and distance at its start (the spitter/zippy way): flight is then ≤ 420/240 ≈ 1.75 s < the 2.2 s cycle, so at most one plop is in flight. The windup is committed: it fires even if the player steps inside 220 mid-windup; only new windups are forbidden there.
- In the look's draw, draw the face after `g.restore()` (unsquashed), keep `globalAlpha` back to 1, and anchor the blob at the mouth `(0, e.radius * 0.42)`.
- The area's client animation comes from `e.hp` (life left, 1→0), never `e.time` (client clocks differ); `interval` > `life` is what makes the pulse fire exactly once.
- Do not edit `engine/`, do not add dependencies, do not touch any file listed here for other reasons.

### Tests
none (engine/tests auto-checks registration, pure paths, draws, each monster/projectile/area in a real match, and the 60-player budget).

## Result (attempt 1, cachyos-x8664)

Added the Toss monster — a big slow peach melon (new `peach` palette color #ffc078, calm two-eyed smile) that holds a 220–420 band and, every 2.2 s, winds up 0.6 s (angry toothy face, purple blob inflating in its mouth, synced in slots) then lobs a zero-damage purple plop on a high arc (apex 140, 240 u/s). Where it lands, a one-strike purple ink-rimmed splash ring (`plop-splash`) blooms to radius 60 and hits everything in it for 12 — players and monsters alike, so a splash can pop its own neighbors. Files: new `src/content/monsters/toss.ts`, `src/content/projectiles/plop.ts`, `src/content/areas/plop-splash.ts`, one line in `palette.ts`, and one registry line each in the monsters/projectiles/areas indexes. `npm run check` and `npm run smoke` both pass.

- Self-review: NO VERDICT
- Time: 54.4 min

```
.../draft-arena/game/src/content/areas/index.ts    |   2 +
 .../game/src/content/areas/plop-splash.ts          |  38 +++++++
 .../draft-arena/game/src/content/monsters/index.ts |   2 +
 .../draft-arena/game/src/content/monsters/toss.ts  | 114 +++++++++++++++++++++
 projects/draft-arena/game/src/content/palette.ts   |   1 +
 .../game/src/content/projectiles/index.ts          |   2 +
 .../game/src/content/projectiles/plop.ts           |  24 +++++
 7 files changed, 183 insertions(+)
```
