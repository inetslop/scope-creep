---
id: T0048
title: "Boing: a deep red heart that crouches, then leaps to where you're going"
assignee: inet-racing
size: M
priority: 1
status: done
depends_on: []
attempts: 1
created: 2026-10-31T09:20:00Z
claimed_at: 2026-10-31T10:14:03Z
finished_at: 2026-10-31T10:28:02Z
epic: E9
---

## Goal
The crowd gains a 7th monster with a move no other has: a melee critter that leaps to a *predicted* spot, so a straight-line kite no longer escapes it. (Rebuild of T0045, rejected only for missing rows in the comparison table — this one carries the full table.)

## Details
- Name: Boing. Description (one line): "Crouches, then leaps to where you're going."
- A squishy deep red heart, ink outline, angry face (2 eyes, a frown). It rests with a slow bob, watching the nearest player.
- When the nearest player is within 180 units it crouches: it squashes flat to half its height and its mouth opens to teeth for 0.6 s. This is the telegraph — the moment to answer by moving.
- Then it leaps in a straight line to where the player *will be*: the player's position plus the player's heading × 0.4 s. The leap is a stretched heart at 320 u/s, for at most 0.5 s (about 160 units), then it lands.
- It deals 14 damage per second while touching a player, in the air or on the ground.
- After each leap it sits (can't leap) for 0.9 s, then can crouch and leap again if a player is still within 180 units. When far, it shuffles toward the player at 40 u/s to close in.
- Exact numbers: hp 24, speed 40, radius 14, damage 14 (per second touching), xp 3, weight 5, fromLevel 5.
- What it punishes: a straight-line kite — running in a line at constant speed lets it land on you. What counters it: a hard direction change (jinking) during its 0.6 s crouch makes it leap past your old line; zoners can hit the crouching, telegraphed Boing before it leaps.
- Crowd count: it adds only itself (no spawns, no projectiles), so +1 to the crowd of up to 60 around each player.
- It reads at a glance: the only heart-shaped monster, in deep red (darker than the Dot/Flee red); the flat crouch and the teeth mouth are the "about to leap" warning.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | heads straight for the nearest player with touch damage | The Dot never stops, telegraphs or commits — it just walks. The Boing rests, telegraphs a crouch, then makes one fast leap at a *predicted* point and sits. |
| Puff | chases the nearest player with touch damage, the same walk as a Dot | The Puff only walks at you (slow, tanky, pops into Dots). The Boing never chases — it shuffles to close in, then telegraphs and leaps to where you are going. |
| Flee | touch damage on a player it touches | The Flee only runs away from you. The Boing closes in on you: it shuffles nearer and leaps toward your predicted position. |
| Zippy | a telegraphed wind-up, then one fast committed movement | The Zippy dashes along its own fixed lane — where it was pointing — and cannot bend. The Boing aims at the player's *future* position (position plus heading), so it lands on a moving target, not a lane, and a hard turn during its crouch sends it past you. |
| Sleeper | a stationary warning state, then closing on the nearest player with touch damage | The Sleeper wakes and then keeps chasing (continuous walking at you). The Boing does not chase — it takes one big leap to a predicted point and then sits, so it is dodged by a sharp turn, not by outspeeding it. |
| Snail | chases the nearest player like a Dot, with touch damage | The Snail never leaves the ground and never commits to one fast move — its threat is the sticky patch it lays, not a leap. The Boing is all about the leap. |
| Spitter | holds its own movement around the nearest player and attacks it | The Spitter keeps a distance band and spits a glob from range; it never closes in. The Boing is a pure melee leaper: it shuffles to close to 180 and only then acts. |

## Acceptance criteria
- [ ] A deep red heart (heart shape, 2 eyes, frown) spawns from player level 5, distinct in shape and color from every other monster.
- [ ] When a player is within 180 units it squashes flat and shows teeth for 0.6 s, then leaps in a straight line toward the player's predicted position (position + heading × 0.4 s) at 320 u/s for at most 0.5 s.
- [ ] Running in a straight line at constant speed lets a Boing land on you; a hard direction change during its 0.6 s crouch makes it leap past your old line.
- [ ] It deals 14 damage per second while touching a player, and after each leap it sits 0.9 s before it can leap again.
- [ ] It adds only itself to the crowd (no spawns, no projectiles) and drops a gem worth 3 xp when it dies.

## Design (architect, inet-racing)

### Files
- create `src/content/monsters/boing.ts` - the Boing `MonsterDef` (id `boing`): a deep red heart that shuffles, telegraphs a 0.6 s crouch, then leaps to the player's predicted position
- edit `src/content/monsters/index.ts` - add `import { boing } from './boing.ts';` after the `zippy` import, and `boing,` after `zippy,` in `MONSTERS`

### Interfaces
Full content of `src/content/monsters/boing.ts`:

```ts
import { chase, drawFace, shade, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Within 180 it crouches 0.6 s, then leaps at 320 u/s for at most 0.5 s to where the player is going, then sits 0.9 s. */
const REACH = 180;
const CROUCH = 0.6;
const LEAP_SPEED = 320;
const LEAP = 0.5;
const SIT = 0.9;
const PREDICT = 0.4;
const REST: Face = { mood: 'angry', eyes: 2, mouth: 'frown' };
const FANGS: Face = { mood: 'angry', eyes: 2, mouth: 'teeth' };

const look: Look = { shape: 'circle', color: shade(PALETTE.red, -0.45), face: REST };
/** A deep red heart (no heart in the Shape enum: the body is traced by hand; the face is drawn inside the transform so it squashes with the body). */
look.draw = (g, e) => {
  const phase = e.slots[0] ?? 0; // 0 resting, 1 crouching, 2 leaping, 3 sitting
  const r = e.radius;
  g.fillStyle = 'rgba(40, 30, 70, 0.13)';
  g.beginPath();
  g.ellipse(0, r * 0.82, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  g.fill();
  g.save();
  if (phase === 0) g.translate(0, Math.sin(e.time * 2.2 + e.seed) * r * 0.06); // a slow bob at rest
  if (phase === 1) g.scale(1.4, 0.5); // crouch: squashed to half its height
  else if (phase === 2) { const s = Math.min(0.5, e.speed / 640); g.scale(1 - s, 1 + s); } // stretched in flight
  else if (phase === 3) g.scale(1.15, 0.85); // spent after the leap
  g.beginPath();
  g.moveTo(0, r * 0.75); // the point of the heart, at the bottom
  g.bezierCurveTo(-r * 1.05, r * 0.1, -r * 0.95, -r * 0.75, -r * 0.45, -r * 0.75);
  g.bezierCurveTo(-r * 0.12, -r * 0.75, 0, -r * 0.5, 0, -r * 0.4);
  g.bezierCurveTo(0, -r * 0.5, r * 0.12, -r * 0.75, r * 0.45, -r * 0.75);
  g.bezierCurveTo(r * 0.95, -r * 0.75, r * 1.05, r * 0.1, 0, r * 0.75);
  g.closePath();
  g.fillStyle = e.flash ? '#ffffff' : look.color;
  g.fill();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2));
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  drawFace(g, phase === 1 || phase === 2 ? FANGS : REST, r, e.angle, PALETTE.ink);
  g.restore();
};

/** The only leaper: shuffles in, telegraphs a crouch, then leaps at the player's predicted spot and sits. */
export const boing: MonsterDef = {
  id: 'boing',
  name: 'Boing',
  description: "Crouches, then leaps to where you're going.",
  hp: 24,
  speed: 40,
  radius: 14,
  damage: 14,
  xp: 3,
  weight: 5,
  fromLevel: 5,
  look,
  think(_ctx, m, dt) {
    const mem = m.mem;
    let phase = mem.ph ?? 0; // 0 shuffling, 1 crouching, 2 leaping, 3 sitting
    let left = phase === 0 ? 0 : (mem.tm ?? 0) - dt;
    const t = m.target;
    if (phase === 1) { // Crouch: still, facing the locked point - the warning to move.
      m.vx = 0; m.vy = 0; m.angle = mem.ang ?? 0;
      if (left <= 0) { phase = 2; left = LEAP; }
    } else if (phase === 2) { // Leap: straight to the predicted point, no re-aiming.
      const ang = mem.ang ?? 0;
      m.vx = Math.cos(ang) * LEAP_SPEED; m.vy = Math.sin(ang) * LEAP_SPEED; m.angle = ang;
      if (left <= 0 || Math.hypot((mem.bx ?? m.x) - m.x, (mem.by ?? m.y) - m.y) <= LEAP_SPEED * dt) {
        phase = 3; left = SIT; m.vx = 0; m.vy = 0;
      }
    } else if (phase === 3) { // Sitting: spent, can't crouch yet.
      m.vx = 0; m.vy = 0;
      if (left <= 0) phase = 0;
    } else if (t && Math.hypot(t.x - m.x, t.y - m.y) <= REACH) { // In reach: lock the leap on position + heading * 0.4 s.
      const px = t.x + t.vx * PREDICT;
      const py = t.y + t.vy * PREDICT;
      phase = 1; left = CROUCH;
      mem.ang = Math.atan2(py - m.y, px - m.x);
      mem.bx = px; mem.by = py;
      m.vx = 0; m.vy = 0; m.angle = mem.ang;
    } else {
      chase(m); // shuffle in at walk speed, fanned out like a Dot
    }
    mem.ph = phase;
    mem.tm = left;
    m.slots[0] = phase;
  },
};
```

### Steps
1. Create `src/content/monsters/boing.ts` exactly as above.
2. Edit `src/content/monsters/index.ts`: add the import line after `import { zippy } ...` and the `boing,` line after `zippy,` in `MONSTERS`. Touch no other line.
3. Run `npm run check`, then `npm run smoke`; fix only what they report.

### Pitfalls
- The leap angle/point are locked at the crouch (phase 0 → 1) and never re-read: `m.target` is re-chosen by the engine twice a second, and re-aiming during the crouch or leap would kill the jinking counter.
- Draw the face *inside* the `save()`/`restore()` transform; drawn after it, the angry brows would float above the half-height crouch.
- Keep `look.shape: 'circle'` (enum-only) — the heart body is hand-traced; do not call `drawCritter` (it can't draw a heart). No palette.ts change: the deep red is `shade(PALETTE.red, -0.45)`.
- Never toggle `m.damage` (unlike sleeper): the engine applies the def's 14 dps on contact in every phase, which is exactly the spec.
- `mem` holds numbers only; guard every key with `??`; no `Math.random`/`Date` anywhere in the file.
- The landing check compares the position from before this tick's movement, so it lands at most one tick past the point; the `LEAP` timer caps the leap either way.
- Only `slots[0]` is used; no projectiles or spawns, so the 60-player crowd and bandwidth budgets are untouched (+1 monster from the pool).

### Tests
- none (no pure helpers; engine/tests covers registry, data, the draw function, and the monster in a real match).

## Result (attempt 1, inet-racing)

Added the 7th monster Boing (`src/content/monsters/boing.ts`): a deep red heart that shuffles in at 40 u/s, telegraphs a 0.6 s flat crouch with a teeth face, then leaps straight at 320 u/s for up to 0.5 s to the player's predicted position (position + heading × 0.4 s, locked at crouch so jinking beats it), and sits 0.9 s after each leap; 24 hp, 14 dps touch damage, 3 xp, spawns from level 5. Registered it in `src/content/monsters/index.ts` after zippy. All checks and smoke tests pass.

- Self-review: APPROVE
- Time: 14.0 min

```
.../draft-arena/game/src/content/monsters/boing.ts | 89 ++++++++++++++++++++++
 .../draft-arena/game/src/content/monsters/index.ts |  2 +
 2 files changed, 91 insertions(+)
```
