---
id: T0032
title: "Sleeper: a deep pink cushion that sleeps until you get close"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T06:30:37Z
epic: E9
---

## Goal
A 6th monster with a way to survive no other has: it sleeps. A field of sleeping monsters is safe to walk through — until you camp one, and then it wakes, and it is faster than a Dot.

## Details
The closest example is the Zippy monster (a behavior with a synced warning state). One file in src/content/monsters/, registered in its index.
- Behavior, three states: **sleeping** — it does not move and deals no touch damage while no player is within 350 units. **Waking** — a player inside 350 wakes it; its eyes open 0.5 s before it starts moving (that is the warning, synced so every client sees it). **Awake** — it chases the nearest player at 100 u/s, faster than a Dot's 85. It falls back asleep only when no player is within 500, for 10 s (a little squash, eyes close). Between 350 and 500 it keeps whatever state it has. It adds nothing to the crowd but itself: no shots, no spawned monsters.
- Numbers: hp 20, speed 100, radius 15, damage 10 per second of touch (while awake only), xp 3, weight 5, fromLevel 4.
- Look: a rounded square (a squashed cushion), a deep pink darker than Zippy's pink, ink outline. Sleeping: a calm face, two closed eyes (small arcs), a small o mouth. Waking and awake: two open eyes, angry mood, frown mouth.
- What it punishes: standing still — a geyser hold or a gem spot set in a sleeping field is a trap for a build that camps (Chill, Fuse). What counters it: a hit from a distance (a bubble, a bolt) pops it before it wakes.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | a warm critter that chases and drops a gem | Dot is awake and moving all the time; the Sleeper is dormant and safe to cross, and only becomes a chaser after a wake-up you can see coming |
| Puff | a slow critter from the early levels | Puff's own death changes the crowd (it splits into Dots); the Sleeper's state changes with how close you are, and it can sleep again |
| Zippy | a face that warns before it acts | Zippy's warning is a one-shot dash along a lane, then it keeps crawling; the Sleeper's warning is a permanent change — it stops being safe to walk through |
| Spitter | moves around a distance band around a player | Spitter holds its range and shoots from it; the Sleeper has no range at all — it is wherever you let it sleep |
| Snail | a slow warm critter you have to deal with | Snail changes the ground you walk on (sticky patches); the Sleeper changes itself |
| Flee | a critter you have to chase | Flee moves away from you at all times; the Sleeper is still until you are close, then moves toward you |

## Acceptance criteria
- [ ] A crowd of sleepers stands still with closed eyes; walking within 350 units of one opens its eyes 0.5 s before it starts moving.
- [ ] An awake Sleeper chases the nearest player at 100 u/s and deals 10 damage per second on touch; it closes its eyes and stops again only after 10 s with no player within 500.
- [ ] It spawns from player level 4 (weight 5), drops a 3 xp gem, and deals no damage at all while it sleeps.
- [ ] In a crowd of the other monsters, the Sleeper reads at a glance: a deep pink rounded square, asleep or not.

## Design (architect, desktop)

### Files
- create `src/content/monsters/sleeper.ts` - the 6th monster: `sleeper` `MonsterDef` (sleeping / waking / awake state machine in `think`, cushion look in `look.draw`)
- edit `src/content/monsters/index.ts` - add the import line and one `sleeper,` line in `MONSTERS`

### Interfaces
No new types. Uses existing `MonsterDef`, `Look`, `Face` from `engine/api.ts`, plus `chase`, `drawCritter`, `shade` (all exported). Synced state: `m.slots[0]` = 0 sleeping, 1 waking, 2 awake. Timers live in `m.mem` (`sl` state, `wt` wake timer, `at` away timer). `m.target` is the engine's nearest living player (re-chosen twice a second); `m.damage` is a live field the engine reads for touch damage.

### Steps
1. Create `src/content/monsters/sleeper.ts` with exactly this content:

```ts
import { chase, drawCritter, shade, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A player within 350 wakes it; it sleeps again only after 10 s with every player beyond 500. */
const WAKE = 350;
const SLEEP = 500;
const WINDUP = 0.5;
const AWAY = 10;

const SLEEP: Face = { mood: 'calm', eyes: 2, mouth: 'o' };
const AWAKE: Face = { mood: 'angry', eyes: 2, mouth: 'frown' };

const look: Look = { shape: 'square', color: shade(PALETTE.pink, -0.35), face: SLEEP };
/** A deep pink squashed cushion; flatter with closed eyes while asleep, snarling with open eyes once woken. */
look.draw = (g, e) => {
  const state = e.slots[0] ?? 0; // 0 sleeping, 1 waking, 2 awake
  g.save();
  g.scale(state === 0 ? 1.15 : 1.05, state === 0 ? 0.85 : 0.95); // the cushion, flatter while it sleeps
  drawCritter(g, look, e, { ink: PALETTE.ink, face: state === 0 ? SLEEP : AWAKE });
  if (state === 0) {
    // Closed eyes: paint over the open ones, then a small arc under each (drawFace puts two eyes at ±0.34r, -0.12r, radius 0.26r).
    const eyeR = e.radius * 0.26;
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = Math.max(1.5, e.radius * 0.1);
    g.lineCap = 'round';
    for (const s of [-1, 1]) {
      const ex = s * e.radius * 0.34;
      const ey = -e.radius * 0.12;
      g.fillStyle = e.flash ? '#ffffff' : look.color;
      g.beginPath();
      g.arc(ex, ey, eyeR, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(ex, ey, eyeR * 0.6, 0.25 * Math.PI, 0.75 * Math.PI);
      g.stroke();
    }
  }
  g.restore();
};

/** Sleeps where it fell; what wakes is faster than a Dot and stops being safe to walk through. */
export const sleeper: MonsterDef = {
  id: 'sleeper',
  name: 'Sleeper',
  description: 'Sleeps until you get close, then chases faster than a Dot.',
  hp: 20,
  speed: 100,
  radius: 15,
  damage: 10,
  xp: 3,
  weight: 5,
  fromLevel: 4,
  look,
  think(_ctx, m, dt) {
    const mem = m.mem;
    const t = m.target;
    const near = t ? Math.hypot(t.x - m.x, t.y - m.y) : Infinity;
    let state = mem.sl ?? 0; // 0 sleeping, 1 waking, 2 awake
    if (state === 0) {
      m.vx = 0;
      m.vy = 0;
      if (near <= WAKE) {
        state = 1;
        mem.wt = WINDUP;
      }
    } else if (state === 1) {
      m.vx = 0; // eyes open, still: the 0.5 s warning
      m.vy = 0;
      mem.wt = (mem.wt ?? WINDUP) - dt;
      if (mem.wt <= 0) state = 2;
    } else {
      chase(m);
      mem.at = near > SLEEP ? (mem.at ?? 0) + dt : 0; // seconds with every player beyond 500
      if (mem.at >= AWAY) {
        state = 0;
        mem.at = 0;
      }
    }
    mem.sl = state;
    m.slots[0] = state;
    m.damage = state === 2 ? m.def.damage : 0; // touch damage while awake only
  },
};
```

2. Edit `src/content/monsters/index.ts`: add `import { sleeper } from './sleeper.ts';` after the `zippy` import, and insert `sleeper,` as the line after `zippy,` in `MONSTERS` (next to its closest relative; do not move any other line).

### Pitfalls
- Touch damage while sleeping is controlled by setting `m.damage` to 0 every tick (the live `Monster.damage` field); do not rely on the def value only.
- `m.target` can be `undefined` (no living players) — treat it as `Infinity` as written; the sleeper then finishes waking and re-sleeps after 10 s.
- The closed-eye overdraw must keep the exact `drawFace` eye positions (±0.34r, −0.12r, radius 0.26r, with r = `e.radius` since there is no `look.scale`) and must run inside the same `g.save()/g.scale()/g.restore()` block as the `drawCritter` call.
- No `Math.random`/`Date` anywhere; no module-level mutable state; all timers in `m.mem`; `look.draw` reads only `e` and draws.
- `shade(PALETTE.pink, -0.35)` is the sanctioned way to get the deeper pink (same pattern as `areas/sticky.ts`); do not invent a hex literal for the body.
- The gem drop is automatic from `xp: 3` — do not write an `onDeath`.

### Tests
- None (every content item is tested automatically by `engine/tests/`; there are no pure helpers here).
