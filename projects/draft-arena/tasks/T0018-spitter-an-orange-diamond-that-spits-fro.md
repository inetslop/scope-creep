---
id: T0018
title: "Spitter: an orange diamond that spits from a distance"
assignee: cachyos-x8664
size: M
priority: 1
status: done
depends_on: []
attempts: 1
created: 2026-10-31T03:51:35Z
claimed_at: 2026-10-31T05:20:58Z
finished_at: 2026-10-31T05:32:30Z
epic: E2
---

## Goal
The crowd gains a monster that makes you move: the Spitter holds its distance and spits globs, so standing still to farm gets punished, and kiting or closing in becomes a real choice.

## Details
A new monster, **Spitter**: "Keeps its distance and spits a glob that deals 6."
- Numbers: hp 20, speed 75 u/s, radius 13, contact damage 8 per second, xp 2, weight 5, fromLevel 5 (hp grows with the player's level as for every monster).
- Behavior (its own `think`, closest example the Zippy's): it plays a distance band of 160-280 units around the nearest player.
  - Closer than 160: it moves straight away from the player.
  - Farther than 280: it moves straight to the player.
  - In the band: it holds its ground, and if it has no glob in the air and at least 1.6 s have passed since its last glob, it winds up for 0.5 s, then fires one glob at the player's position.
- The glob: a new projectile — a small orange drop (a bubble), radius 7, speed 150 u/s, damage 6, flying straight by a path computed from its launch, gone when it hits something or after 1.6 s. A glob is not a target: you dodge it, you do not shoot it. At most 2 globs in the air per Spitter; at weight 5 a level-5 crowd holds about a fifth Spitters, so a full crowd of 60 puts at most about 40 globs around one player, all cheap path shots.
- Look: an orange diamond with an ink outline, a face of 2 eyes, mood calm, mouth a small "o" (its spit hole) when idle. The look warns before it acts: during the 0.5 s wind-up (synced in a slot, as the Zippy's) its mood turns to a frown and an orange glob is visible at its mouth.
- Reads in a crowd: an orange diamond is a shape no monster has (Dot a circle, Puff a pentagon, Zippy a triangle); the glob in flight is a small orange drop — no player weapon flies like it (player shots are cool stars), and it is far smaller than a Puff on the ground.
- What counters it: a sidestep (a glob flies at 150 u/s, the player moves at 210), closing in (it backs off inside 160 and its contact is a weak 8/s), and builds that hit a line — a Lance bolt through several of them, a Maw bite in front.
- What it punishes: standing still to farm or to hold a spot (a geyser, a gem line), and a tank that leans on standing in the crowd.
- 6 players and 60: it spawns in each player's own crowd (spawning is per player), so it behaves the same in both.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | part of the crowd that closes in on a player | the Dot only hurts on touch and never gives ground; the Spitter hurts at range and backs off when you close in |
| Zippy | a telegraph before it attacks | the Zippy dashes once and then is just a body again; the Spitter repeats its shot and keeps moving to stay in its band |
| Puff | a body in the crowd you clear | the Puff never attacks on its own and pops into Dots when it dies; the Spitter fires shots and survives intact |

## Acceptance criteria
- [ ] Around level-5 players, Spitters appear in the crowd alongside Dots, Zippies and Puffs, about a fifth of spawns (weight 5 vs the Dot's 10).
- [ ] A Spitter keeps its band: the player is inside 160 and it moves away; farther than 280 and it comes to the player; in the band it holds its ground.
- [ ] In the band it winds up 0.5 s (frown, an orange glob at its mouth) and then fires one glob (6 damage, 150 u/s, gone on hit or after 1.6 s), at most every 1.6 s, with at most 2 globs in the air per Spitter.
- [ ] A glob is a small orange drop in flight, clearly apart from the player's star shots and from monsters on the ground.
- [ ] Touching a Spitter deals 8 per second to the player; it dies for 20 hp (scaled by the player's level) and drops a 2-xp gem.
- [ ] Its face is calm when idle and changes before every shot, so a sidestep during the wind-up avoids the glob.

## Design (architect, desktop)

### Files
- create `src/content/monsters/spitter.ts` — the Spitter `MonsterDef` (distance band + wind-up + spit), one item only
- create `src/content/projectiles/glob.ts` — the glob `ProjectileDef` (straight orange drop, decrements the owner's in-air count)
- edit `src/content/monsters/index.ts` — one import, one `MONSTERS` line
- edit `src/content/projectiles/index.ts` — one import, one `PROJECTILES` line

No engine changes, no `rules.ts`, no HUD/menu/status/effect. `spitter` and `glob` are unused ids (verified); orange diamond is a shape/color/face no monster has (dot red circle, puff purple pentagon 1-eye, zippy pink triangle); monster count stays 4 of the 10 cap.

### Interfaces
No new types — existing `MonsterDef` and `ProjectileDef` from `engine/api.ts` only. Exact hooks used: `think(ctx, m, dt)` (server), `path(s, t)` (pure), projectile `onHit(ctx, p, target)` / `onEnd(ctx, p)` (server), `ctx.fire(owner, 'glob', { angle, speed, damage })`. Mem keys (per-entity, no collisions): `sp` phase 0/1, `sr` wind-up seconds left, `sa` locked aim, `st` seconds since last glob, `sg` globs in air. `slots[0]` = phase (0 idle, 1 winding up).

### Steps
1. Create `src/content/projectiles/glob.ts` exactly:
```ts
import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The Spitter's spit: a small orange drop, straight at 150 u/s, gone on hit or after 1.6 s. */
export const glob: ProjectileDef = {
  id: 'glob',
  radius: 7,
  life: 1.6,
  look: { shape: 'circle', color: PALETTE.orange },
  path(s, t) {
    return { x: s.x + Math.cos(s.angle) * s.speed * t, y: s.y + Math.sin(s.angle) * s.speed * t };
  },
  onHit(_ctx, p) {
    if (p.owner.type === 'monster') p.owner.mem.sg = (p.owner.mem.sg ?? 1) - 1;
  },
  onEnd(_ctx, p) {
    if (p.owner.type === 'monster') p.owner.mem.sg = (p.owner.mem.sg ?? 1) - 1;
  },
};
```
2. Create `src/content/monsters/spitter.ts` exactly:
```ts
import { drawCritter, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The distance band it holds around the nearest player. */
const NEAR = 160;
const FAR = 280;
const WINDUP = 0.5;
const COOLDOWN = 1.6;
const GLOB_SPEED = 150;
const GLOB_DAMAGE = 6;

const IDLE: Face = { mood: 'calm', eyes: 2, mouth: 'o' };
const WIND: Face = { mood: 'angry', eyes: 2, mouth: 'frown' };

const look: Look = { shape: 'diamond', color: PALETTE.orange, face: IDLE };
/** Calm diamond with an "o" spit hole; scowling with an orange glob at its mouth while winding up. */
look.draw = (g, e) => {
  const phase = e.slots[0] ?? 0;
  drawCritter(g, look, e, { ink: PALETTE.ink, face: phase === 1 ? WIND : IDLE });
  if (phase === 1) {
    // The glob forming in the mouth (drawCritter draws the mouth at (0, r * 0.42)).
    g.fillStyle = PALETTE.orange;
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(0, e.radius * 0.42, e.radius * 0.16, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
};

/** Keeps its distance and spits a glob that deals 6. */
export const spitter: MonsterDef = {
  id: 'spitter',
  name: 'Spitter',
  description: 'Keeps its distance and spits a glob that deals 6.',
  hp: 20,
  speed: 75,
  radius: 13,
  damage: 8,
  xp: 2,
  weight: 5,
  fromLevel: 5,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    const t = m.target;
    let phase = mem.sp ?? 0; // 0 moving, 1 winding up
    if (phase === 1) {
      // Wind-up: holds its ground, facing the aim locked when it started; committed like the Zippy's.
      m.vx = 0;
      m.vy = 0;
      m.angle = mem.sa ?? 0;
      mem.sr = (mem.sr ?? WINDUP) - dt;
      if (mem.sr <= 0) {
        ctx.fire(m, 'glob', { angle: mem.sa ?? 0, speed: GLOB_SPEED, damage: GLOB_DAMAGE });
        mem.sg = (mem.sg ?? 0) + 1;
        mem.st = 0;
        phase = 0;
      }
    } else {
      mem.st = (mem.st ?? 0) + dt; // seconds since the last glob
      if (t) {
        const d = Math.hypot(t.x - m.x, t.y - m.y);
        const a = Math.atan2(t.y - m.y, t.x - m.x);
        if (d < NEAR) {
          m.vx = -Math.cos(a) * m.speed; // too close: straight away
          m.vy = -Math.sin(a) * m.speed;
          m.angle = a;
        } else if (d > FAR) {
          m.vx = Math.cos(a) * m.speed; // too far: straight in
          m.vy = Math.sin(a) * m.speed;
          m.angle = a;
        } else {
          m.vx = 0; // in the band: hold ground and, when ready, spit
          m.vy = 0;
          m.angle = a;
          if ((mem.sg ?? 0) < 2 && mem.st >= COOLDOWN) {
            phase = 1;
            mem.sr = WINDUP;
            mem.sa = a;
          }
        }
      } else {
        m.vx = 0;
        m.vy = 0;
      }
    }
    mem.sp = phase;
    m.slots[0] = phase;
  },
};
```
3. Edit `src/content/projectiles/index.ts`: add `import { glob } from './glob.ts';` after the `bubble` import; add `glob,` as the line after `bubble,` in `PROJECTILES`.
4. Edit `src/content/monsters/index.ts`: add `import { spitter } from './spitter.ts';` after the `zippy` import; add `spitter,` as the line after `zippy,` in `MONSTERS`.
5. Run `npm run check`.

### Pitfalls
- `path(s, t)` must stay pure: only `s` and `t`, no `ctx`, `Math.random`, or module state (engine/tests fails otherwise). The code above uses nothing else.
- The glob's `onHit`/`onEnd` must keep the `p.owner.type === 'monster'` guard before touching `mem` — a player-owned projectile would have no spitter mem.
- Do not cancel the wind-up when the player closes in: phase 1 runs to completion (same commitment as Zippy). Do not advance `mem.st` while winding up; it resets to 0 at the shot, so shots are 1.6 s + 0.5 s apart, which satisfies "at most every 1.6 s".
- `slots[0]` holds only whole numbers 0/1; the look reads `e.slots[0] ?? 0` so a fresh client never gets undefined.
- The in-air cap of 2 is enforced by the `mem.sg` counter (increment on fire, decrement in `onHit`/`onEnd`); with life 1.6 = cooldown 1.6 it can never exceed 2, but keep the check — it is the stated rule.
- `ctx.fire` from a monster: monsters have no stats, so `speed: 150` and `damage: 6` arrive unchanged. Do not wrap them in anything.
- Registry edits are one line plus one import each; do not reorder or reformat existing lines (other machines are editing adjacent registries).
- No `Math.random`, `Date`, `performance` anywhere in the new files (lint enforced); there is no randomness in this design.

### Tests
- none (engine/tests/ auto-checks the new monster and projectile in a real match, plus the pure path and the registries)

## Result (attempt 1, cachyos-x8664)

Added the Spitter monster (`src/content/monsters/spitter.ts`) — an orange diamond that holds a 160–280 u distance band around the nearest player, winds up 0.5 s (frown + orange glob at its mouth, synced in slot 0) and spits a glob (6 dmg, 150 u/s) every 1.6 s with at most 2 in the air; and the glob projectile (`src/content/projectiles/glob.ts`) — a small orange drop flying straight by a pure path, gone on hit or after 1.6 s. Registered each with one import and one line in their folder's `index.ts`. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 11.5 min

```
.../draft-arena/game/src/content/monsters/index.ts |  2 +
 .../game/src/content/monsters/spitter.ts           | 92 ++++++++++++++++++++++
 .../game/src/content/projectiles/glob.ts           | 19 +++++
 .../game/src/content/projectiles/index.ts          |  2 +
 4 files changed, 115 insertions(+)
```
