---
id: T0020
title: "Flee: a red teardrop that runs from the nearest player"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T04:17:26Z
epic: E2
---

## Goal
A monster that runs from you: a chase across the field that punishes builds that stand still, and rewards the ones that move.

## Details
- Look: a small red teardrop, pointed in the direction it runs, with a scared face (2 eyes, o mouth). It reads at a glance: the red critter with wide eyes that is always running away.
- Numbers: hp 10, radius 11, damage 8 per second while touching a player, xp 2 (a normal gem on death), weight 5, fromLevel 3. Speed: 80 u/s while it wanders, 160 u/s while it panics.
- Behavior (its own `think`):
  - Nearest player more than 300 away: it wanders — a short hop in a random direction, re-picked every 1.2 s, at 80 u/s. Face: calm scare, half-lidded eyes, small o mouth.
  - Nearest player within 300: it panics — the face changes first (eyes go wide, the body jitters a little), then it runs directly away from the player at 160 u/s, wobbling ±25° around the escape direction, re-picked every 0.3 s, so a crowd does not run in a single line. The escape line is open, so a player always sees where it is going.
- It spawns nothing and fires nothing. A Flee more than 1100 from everyone relocates ahead of a player like the rest of the monsters: it comes back to be chased.
- What it punishes and rewards: a build that camps in a crowd (a Maw farmer, a pure-splash Lobber) cannot touch a Flee that keeps running — its 2 xp only come to players who chase. It rewards Swift, fast Bolts, and the Split fan, the wide spray that hits a wobbler.
- With 6 players and with 60: weight 5 is about one Flee in every six monsters from level 3 up, whatever the player count; with 60 players the relocations keep fleers near someone.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | a small warm critter in a player's crowd | runs away from the nearest player instead of closing in: the player chases it across the field, it never comes to the player |
| Puff | spawns from level 3 and drops a gem worth more than a Dot's | wanders and flees with a face that warns before it moves; it pops into nothing when it dies |
| Zippy | makes a player move around a monster crowd | a sustained wobbly sprint in an open line a player can follow, not a one-shot dash along a fixed lane; it never stops to wind up |

## Acceptance criteria
- [ ] From a level 3 player's field up, a Flee appears about once every six monsters, as a small red teardrop with a scared face.
- [ ] Left alone more than 300 from every player it wanders at 80 u/s; when a player comes within 300 its eyes go wide and it runs directly away at 160 u/s with a visible wobble.
- [ ] A plain player (210 u/s) can catch it; on contact it deals 8 hp/s; on death it pops into confetti and drops its 2 xp gem.
- [ ] A Flee more than 1100 from every player relocates ahead of a player again.
- [ ] It adds only itself to the crowd: it spawns no monsters and fires no shots.

## Design (architect, cachyos-x8664)

### Files
- create `src/content/monsters/flee.ts` — the Flee monster: a red teardrop that notices then sprints away from the nearest player.
- edit `src/content/monsters/index.ts` — add the `flee` import and one line to `MONSTERS` (after `puff`).

### Interfaces
New file exports one item (`flee`), mirroring `zippy.ts`'s pattern (a `const look` with `look.draw` set via the arrow form, referencing the `look` const, not `this`):

```ts
import { drawCritter, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Wanders in short hops; within 300 of a player it notices, then sprints directly away. */
const WANDER_SPEED = 80;
const PANIC_SPEED = 160;
const PANIC = 300;
const REALIZE = 0.18;
const WANDER_EVERY = 1.2;
const PANIC_EVERY = 0.3;
const WOBBLE = 25 * Math.PI / 180;

const CALM: Face = { mood: 'calm', eyes: 2, mouth: 'o' };
const PANIC_F: Face = { mood: 'scared', eyes: 2, mouth: 'o' };

const look: Look = { shape: 'circle', color: PALETTE.red, face: CALM };
look.draw = (g, e) => {
  const scared = e.slots[0] === 1;
  g.save();
  if (scared) {
    const j = e.radius * 0.15;
    g.translate(Math.sin(e.time * 24 + e.seed * 3.1) * j, Math.cos(e.time * 31 + e.seed) * j);
  }
  drawCritter(g, look, e, { ink: PALETTE.ink, face: scared ? PANIC_F : CALM });
  g.save();
  g.rotate(e.angle);
  g.beginPath();
  g.moveTo(0.6 * e.radius, -0.55 * e.radius);
  g.lineTo(1.7 * e.radius, 0);
  g.lineTo(0.6 * e.radius, 0.55 * e.radius);
  g.closePath();
  g.fillStyle = look.color;
  g.fill();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1.5, Math.min(3, e.radius * 0.2));
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  g.restore();
  g.restore();
};

export const flee: MonsterDef = {
  id: 'flee',
  name: 'Flee',
  description: 'Notices you, then sprints straight away from you.',
  hp: 10,
  speed: WANDER_SPEED,
  radius: 11,
  damage: 8,
  xp: 2,
  weight: 5,
  fromLevel: 3,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    const t = m.target;
    const d = t ? Math.hypot(t.x - m.x, t.y - m.y) : Number.POSITIVE_INFINITY;
    let state = mem.fs ?? 0; // 0 wander, 1 noticing, 2 panicking
    let left = (mem.ft ?? 0) - dt;
    if (state === 1) {
      if (!t) { state = 0; left = 0; }
      else if (left <= 0) { state = 2; left = 0; }
    } else if (t && d <= PANIC && state === 0) {
      state = 1; // notice: the scared face before it bolts
      mem.fa = ctx.rng.range(0, Math.PI * 2);
      left = REALIZE;
    } else if (state === 2 && (!t || d > PANIC)) {
      state = 0; // the player is gone: calm wander again
      left = 0;
    }
    if (state !== 1 && left <= 0) {
      const base = state === 2 && t ? Math.atan2(m.y - t.y, m.x - t.x) : ctx.rng.range(0, Math.PI * 2);
      mem.fa = base + (state === 2 ? ctx.rng.range(-1, 1) * WOBBLE : 0);
      left = state === 2 ? PANIC_EVERY : WANDER_EVERY;
    }
    const a = mem.fa ?? 0;
    m.vx = Math.cos(a) * (state === 2 ? PANIC_SPEED : WANDER_SPEED);
    m.vy = Math.sin(a) * (state === 2 ? PANIC_SPEED : WANDER_SPEED);
    m.angle = a;
    mem.fs = state;
    mem.ft = left;
    m.slots[0] = state === 0 ? 0 : 1; // calm vs scared
  },
  onDeath(ctx, m) {
    ctx.effect('pop', { x: m.x, y: m.y }, undefined, m.radius);
  },
};
```

`index.ts` edit (two one-line additions, keep the fromLevel ordering dot→puff→flee→zippy→snail):
- import: `import { flee } from './flee.ts';` between the `dot` and `puff` imports.
- registry: `flee,` between `puff,` and `zippy,` in `MONSTERS`.

### Steps
1. Create `src/content/monsters/flee.ts` exactly as in Interfaces.
2. Add the one import line and one registry line to `src/content/monsters/index.ts`.
3. Run `npm run check`.

### Pitfalls
- `this` is NOT the look: `drawCritter(g, look, ...)` and `g.fillStyle = look.color` reference the `look` const (arrow form), never `this`/`this.color` (zippy's pattern).
- Only import `drawCritter, Face, Look, MonsterDef` — do NOT import `chase` (unused → lint failure).
- `ctx.rng` is the `Rng` object: call `ctx.rng.range(min, max)` (and `.next()`), never `ctx.rng()`, never `Math.random` (lint).
- The "face first, then it runs" ordering is a REALIZE state (`REALIZE`): a player entering range sets `state=1` (scared face via `slots[0]=1`, drifting at wander speed) for 0.18 s before `state=2` bolts at 160. Skip the wind-up and the Flee runs with the face — it "acts without its look warning first."
- `slots[0]` is the only client state: 0 = calm, 1 = scared (both REALIZE and PANIC set it 1). The REALIZE/PANIC distinction stays server-only in `mem` (`fs`/`fa`/`ft`); do not send an extra slot.
- `m.angle` is set to `a` every tick (the facing the teardrop tip points along). The tip stays within ~1.7·radius of centre.
- No projectile, no `ctx.fire`, no `ctx.spawnMonster`. The 2-xp gem is dropped automatically by the engine from `def.xp` (`match.ts:751`); `onDeath` only plays the `pop` confetti. Relocation/removal is engine-automated.
- Frame-rate independent: all state transitions use the `left` countdown minus `dt` each tick (REALIZE 0.18 s, re-pick 1.2 s wander / 0.3 s panic); the ±25° escape wobble is re-sampled every 0.3 s so a crowd scatters, never one line.
- The wander direction is a fresh random `ctx.rng.range(0, 2π)` every 1.2 s; the panic direction is `atan2` directly away plus the ±25° wobble.
- The `pop` effect's 4th arg is its radius: pass `m.radius`.

### Tests
none (every content item is exercised automatically by `engine/tests/`, including each monster in a real match and the 60-player budget; there is no pure helper to unit-test).
