---
id: T0005
title: "Zippy: a pink triangle that winds up and dashes"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T02:20:47Z
claimed_at: 2026-10-31T02:51:41Z
finished_at: 2026-10-31T03:06:34Z
epic: E2
---

## Goal
A monster that does not chase — it waits, aims, and dashes a short lane. Kiting in a straight line gets intercepted, so "just stay ahead" stops being the whole game. The first monster with its own way to move: a telegraphed dash.

## Details
- New monster file `src/content/monsters/zippy.ts` (closest example for the data shape: `src/content/monsters/dot.ts`; Zippy is the first monster with a `think` — see planning/modules/monsters.md: the think runs on the server every tick, private state in its `mem`, what the player must see in its synced slots and look).
- Numbers: hp 18, speed 60 (crawl; Dot is 85, a player 210), radius 12 (Dot is 14), damage 22 per second while touching a player, xp 2, weight 6 (Dot is 10, Puff is 4), fromLevel 4. Its hp grows with the level of the player it spawned around, like every monster.
- The cycle: crawl toward the nearest player (like a Dot, fanned out a little) until within 260 units; then wind up for 0.8 s — it stops, squashes flat, points at the player, its face turns angry (mouth from smile to teeth) and a short pink line (30 units long) appears in the dash direction: the lane. Then it dashes: straight along that lane at 420 u/s for 0.4 s (168 units); the lane is fixed at the wind-up, so a player who moves sideways slips it. Then 1.5 s tired: it crawls flat, face back to a calm smile, and cannot dash. The cycle repeats. Each Zippy runs its own rhythm, so a crowd of Zippies does not dash in one wave.
- Crowd count: a Zippy spawns nothing and fires nothing; at weight 6 it is a minority of the crowd (6 of 20 weight), and the per-player crowd cap of 60 still holds.
- Look: shape triangle (Dot is a circle, Puff a pentagon), color pink, face: mood calm, 2 eyes, mouth smile — a deceptively cute crawler; the angry face and the pink lane line are the warning before it acts.
- What counters it: step out of the lane during the 0.8 s wind-up — the dash is fixed and does not track. What it punishes: a player who kites in a straight line, and a player who stands in line with a crowd — the dash plows through everything it touches, other players included (half damage to players, as usual).
- With 6 players and with 60: from player level 4 each player's crowd carries a few Zippies (weight 6 of 20); at 60 players the field-wide cap (maxMonsters) still bounds the total, and a Zippy dashing between two players still only hits the lane it aimed.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | heads for the nearest player | A Dot tracks continuously and can always be outrun in a straight line; a Zippy commits to a fixed lane for 0.4 s at twice the player's speed — a straight-line kite gets intercepted, and after the dash it is tired and cannot chase |
| Puff | a warm critter that closes on a player | A Puff's threat is what it does on death (pops into three Dots); a Zippy's threat is what it does while alive — a telegraphed dash that intercepts a kiting player |

## Acceptance criteria
- [ ] From player level 4, a share of the crowd (weight 6 of 20) is a small pink triangle with a smile; below level 4, none.
- [ ] A Zippy crawls at 60 u/s; within 260 of a player it stops for 0.8 s, squashes flat, points at it, its face turns angry and a short pink line shows the lane.
- [ ] The dash goes straight along that lane at 420 u/s for 0.4 s (168 units) and hurts everything it touches (22 per second, players at half as usual); a player who stepped out of the lane during the wind-up is safe.
- [ ] After a dash the Zippy is tired for 1.5 s (flat crawl, calm smile, no dash), then the cycle repeats on its own rhythm.
- [ ] A Zippy death adds nothing to the crowd (its gem, worth 2 xp, drops as usual); the per-player cap of 60 still holds.
- [ ] Dot and Puff are unchanged; the game starts and plays normally.

## Design (architect, desktop)

### Files
- create `src/content/monsters/zippy.ts` - the Zippy monster: data + `think` (crawl → telegraphed dash → tired) + custom `look.draw` (squash, angry face, pink lane line)
- edit `src/content/monsters/index.ts` - one import + one list line for `zippy`

### Interfaces
No new types. Slot convention for Zippy (4 synced slots, only one used): `slots[0]` = phase, `0` crawling, `1` winding up, `2` dashing, `3` tired. The lane direction is not a slot: the server sets `m.angle` to the locked lane at wind-up start and holds it, and clients read it as `DrawView.angle`. Private state lives in `m.mem`: `zp` (phase), `zt` (seconds left in phase), `za` (locked lane angle, radians).

### Steps
1. Create `src/content/monsters/zippy.ts` with exactly this content:

```ts
import { chase, drawCritter, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The rhythm: reach at 260, a 0.8 s wind-up, a 420 u/s dash for 0.4 s, then 1.5 s tired. */
const REACH = 260;
const WINDUP = 0.8;
const DASH_SPEED = 420;
const DASH = 0.4;
const TIRED = 1.5;

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'smile' };
const ANGRY: Face = { mood: 'angry', eyes: 2, mouth: 'teeth' };

const look: Look = { shape: 'triangle', color: PALETTE.pink, face: CALM };
/** A deceptively cute crawler; flat and snarling with a pink lane line while it winds up. */
look.draw = (g, e) => {
  const phase = e.slots[0] ?? 0; // 0 crawling, 1 winding up, 2 dashing, 3 tired
  g.save();
  if (phase === 1 || phase === 3) g.scale(1.3, 0.6); // squashed flat
  drawCritter(g, look, e, { ink: PALETTE.ink, face: phase === 1 || phase === 2 ? ANGRY : CALM });
  g.restore();
  if (phase === 1) {
    // The lane: a short sticker line ahead, along the dash direction (its facing).
    const x0 = Math.cos(e.angle) * e.radius * 1.4;
    const y0 = Math.sin(e.angle) * e.radius * 1.4;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(Math.cos(e.angle) * (e.radius * 1.4 + 30), Math.sin(e.angle) * (e.radius * 1.4 + 30));
    g.lineCap = 'round';
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 9;
    g.stroke();
    g.strokeStyle = PALETTE.pink;
    g.lineWidth = 5;
    g.stroke();
  }
};

/** The first monster that moves on its own: crawls, telegraphs a lane, dashes straight along it. */
export const zippy: MonsterDef = {
  id: 'zippy',
  name: 'Zippy',
  description: 'Winds up, then dashes straight along its lane.',
  hp: 18,
  speed: 60,
  radius: 12,
  damage: 22,
  xp: 2,
  weight: 6,
  fromLevel: 4,
  look,
  think(_ctx, m, dt) {
    const mem = m.mem;
    let phase = mem.zp ?? 0; // 0 crawling, 1 winding up, 2 dashing, 3 tired
    let left = phase === 0 ? 0 : (mem.zt ?? 0) - dt;
    const lane = mem.za ?? 0;
    const t = m.target;
    if (phase === 1) {
      // Wind-up: stopped, flat, facing the lane locked when the wind-up began.
      m.vx = 0;
      m.vy = 0;
      m.angle = lane;
      if (left <= 0) { phase = 2; left = DASH; }
    } else if (phase === 2) {
      // Dash: straight along the lane, no tracking - a sideways step slips it.
      m.vx = Math.cos(lane) * DASH_SPEED;
      m.vy = Math.sin(lane) * DASH_SPEED;
      m.angle = lane;
      if (left <= 0) { phase = 3; left = TIRED; m.vx = 0; m.vy = 0; }
    } else if (phase === 3) {
      // Tired: crawl back into the hunt, no dashing yet.
      chase(m);
      if (left <= 0) phase = 0;
    } else if (t && Math.hypot(t.x - m.x, t.y - m.y) <= REACH) {
      // In range: lock the lane toward the player and start the wind-up.
      phase = 1;
      left = WINDUP;
      mem.za = Math.atan2(t.y - m.y, t.x - m.x);
      m.vx = 0;
      m.vy = 0;
      m.angle = mem.za;
    } else {
      // Crawl: head for the nearest player, fanned out like a Dot.
      chase(m);
    }
    mem.zp = phase;
    mem.zt = left;
    m.slots[0] = phase;
  },
};
```

2. Edit `src/content/monsters/index.ts`: add `import { zippy } from './zippy.ts';` right after the `puff` import, and add `zippy,` right after the `puff,` line in `MONSTERS`. Nothing else changes (no rules.ts, HUD, effect, or projectile changes; contact damage, the 2-xp gem drop, hp growth per level, spawn weights and caps all come from the def and the engine).
3. Run `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- Never re-aim during wind-up/dash: the lane comes only from `mem.za`, computed once at wind-up start. Re-reading `m.target` mid-phase would make the dash track and kill the mechanic.
- Keep `think(_ctx, m, dt)` exactly: `ctx` is unused and `noUnusedParameters` (tsconfig) fails on an un-prefixed unused parameter.
- The engine never touches `m.angle` for you; set it every tick in wind-up/dash as above. Crawl phases reuse `chase(m)` (imported from engine/api.ts) for the fan-out and stand-still-when-no-target behavior.
- Dash speed is the constant 420, not `m.speed` (60); the engine still applies status slows, which is correct.
- `e.slots[0] ?? 0` and `mem.* ?? 0` guards are required: the draw test runs look.draw before any server tick. No `Math.random`/`Date` anywhere (lint), and none is needed.
- Do not draw the lane line in any phase other than 1, and do not restyle dot/puff or base files.
- "(half damage to players, as usual)" is the engine's existing damage rules (armor, pvp 0.5); `damage: 22` in the def is all the content needs - do not write your own damage code.

### Tests
none (no pure helpers in src/; engine/tests/ already checks the def, runs look.draw with slots 0 and 1, and runs 12 Zippies in a 12 s match where they enter range and dash).

## Result (attempt 1, cachyos-x8664)

Added the Zippy monster — a pink triangle that crawls at 60 u/s, then within 260 of a player stops for a 0.8 s wind-up (squashed flat, angry face, a 30-unit pink lane line) before dashing straight along that fixed lane at 420 u/s for 0.4 s, hurting everything it touches (22/s, players at half), and is tired for 1.5 s before cycling again on its own rhythm. It's the first monster with a `think` (state in `mem`, phase in `slots[0]`); Dot and Puff are unchanged. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 14.9 min

```
.../draft-arena/game/src/content/monsters/index.ts |  2 +
 .../draft-arena/game/src/content/monsters/zippy.ts | 90 ++++++++++++++++++++++
 2 files changed, 92 insertions(+)
```
