---
id: T0070
title: Gentler squash for the Zippy and the Sleeper
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T12:51:01Z
claimed_at: 2026-10-31T15:06:05Z
---

## Goal
The squash-and-stretch looks wrong on some monsters. The Zippy flattens to 60% in one frame, its triangle sheared sideways when its lane is diagonal, its face squashed with it; the Sleeper's cushion squashes its eyes. Keep the idea, make it look like a soft critter.

## Details
- At most 20%: scales between 0.8 and 1.2 (today the Zippy uses 1.3 x 0.6).
- Along the creature's own axis, not the screen's: the Zippy squashes along its lane (rotate to the lane, scale, rotate back), so its triangle stays a triangle at any angle.
- Eased: into the squash and back out over 0.15 s, never in one frame. The client only sees slots: put the time since the phase began in a slot (hundredths of a second) and ease from it.
- The face keeps its shape: draw the body squashed with drawCritter() and no face, then restore and draw the face with drawFace(), moved down by the height the body lost so it stays inside. The Sleeper's closed eyes move with its face.
- Check every monster's look while it moves fast (the Zippy's dash) and while it changes phase.
- The engine's own small wobble while moving is not part of this.

## Acceptance criteria
- [ ] No monster's look scales below 0.8 or above 1.2 in any direction.
- [ ] The Zippy's wind-up flattens along its lane at any angle, eases in and out, and its face isn't squashed.
- [ ] The Sleeper's sleeping cushion eases in and out, and its eyes aren't squashed.

## Design (architect, desktop)

### Files
- edit `src/content/monsters/zippy.ts` - eased, lane-aligned squash; face drawn unsquashed; `think` writes phase age into `slots[1]`
- edit `src/content/monsters/sleeper.ts` - eased cushion; face and closed eyes drawn unsquashed; `think` writes state age into `slots[1]`
- edit `src/content/monsters/snail.ts` - clamp crouch squash to 1.2×0.8; draw the face outside the squash (T0073 may delete this file first: then skip)
- edit `src/content/monsters/boing.ts` - clamp crouch to 1.2×0.8 and flight stretch to 0.8/1.2; draw the face outside the squash (same T0073 caveat)
- edit `src/content/monsters/brood.ts` - scales already in range; only move the face out of the squash
- create `tests/squash.test.ts` - unit tests for the two exported pure curves

### Interfaces
```ts
// zippy.ts (new exports; same shape in sleeper.ts)
export const squashEase: (t: number) => number;                    // smoothstep 0->1 over 0.15 s
export const zippySquash: (phase: number, t: number) => number;    // 0..1 squash amount
// sleeper.ts
export const sleeperCushion: (state: number, t: number) => [number, number]; // [sx, sy]
```
`slots[1]` on both monsters = seconds since the current phase/state began, ×100 (ints). `SLOT_COUNT` is 4, so nothing new goes over the wire (the slot array is fixed size).

### Steps
1. `zippy.ts`: add `drawFace` to the api import. Add:
```ts
export const squashEase = (t: number) => { const c = Math.min(1, Math.max(0, t / 0.15)); return c * c * (3 - 2 * c); };
export const zippySquash = (phase: number, t: number) => {
  const k = squashEase(t);
  if (phase === 1) return k;        // wind-up: ease into the crouch
  if (phase === 2) return 1 - k;    // dash: spring back over the first 0.15 s
  if (phase === 3) return 0.5 * k;  // tired: a softer crouch
  return 0.5 * (1 - k);             // crawl: ease out of the tired crouch
};
```
2. `zippy.ts` `think`: just before `mem.zp = phase;` add
```ts
    if (phase !== (mem.zp ?? 0)) mem.zs = 0; // new phase: the clock starts at 0
    else mem.zs = (mem.zs ?? 0) + dt;
```
and after `m.slots[0] = phase;` add `m.slots[1] = Math.round((mem.zs ?? 0) * 100);`
3. `zippy.ts` `look.draw`: replace the body with (keep the existing lane-line block at the end, untouched):
```ts
  const phase = e.slots[0] ?? 0;
  const k = zippySquash(phase, (e.slots[1] ?? 0) / 100);
  if (k > 0) { // crouch along its own lane: rotate, scale, rotate back - the triangle stays a triangle
    g.save();
    g.rotate(e.angle);
    g.scale(1 + 0.2 * k, 1 - 0.2 * k); // at most 1.2 x 0.8
    g.rotate(-e.angle);
    drawCritter(g, look, e, { ink: PALETTE.ink }); // no face: it keeps its shape
    g.restore();
  } else {
    drawCritter(g, look, e, { ink: PALETTE.ink });
  }
  // Face: unsquashed, nudged by the height the body lost so it stays inside.
  const extentY = Math.hypot((1 + 0.2 * k) * Math.sin(e.angle), (1 - 0.2 * k) * Math.cos(e.angle)) * e.radius;
  g.save();
  g.translate(0, (extentY - e.radius) * 0.15);
  drawFace(g, phase === 1 || phase === 2 ? ANGRY : CALM, e.radius, e.angle, PALETTE.ink);
  g.restore();
  if (phase === 1) { /* existing lane-line code, unchanged */ }
```
4. `sleeper.ts`: add `drawFace` to the import. Add the same `squashEase` plus:
```ts
export const sleeperCushion = (state: number, t: number): [number, number] => {
  const awake = state === 0 ? 1 - squashEase(t) : squashEase(t);
  return [1.15 - 0.1 * awake, 0.85 + 0.1 * awake]; // flat asleep, up awake, eased
};
```
5. `sleeper.ts` `think`: just before `mem.sl = state;` add `if (state !== (mem.sl ?? 0)) mem.ste = 0; else mem.ste = (mem.ste ?? 0) + dt;` and after `m.slots[0] = state;` add `m.slots[1] = Math.round((mem.ste ?? 0) * 100);`
6. `sleeper.ts` `look.draw`: replace with:
```ts
  const state = e.slots[0] ?? 0;
  const [sx, sy] = sleeperCushion(state, (e.slots[1] ?? 0) / 100);
  g.save();
  g.scale(sx, sy);
  drawCritter(g, look, e, { ink: PALETTE.ink }); // no face: it keeps its shape
  g.restore();
  g.save(); // face rides with the cushion's height, drawn unsquashed
  g.translate(0, (sy - 1) * e.radius * 0.15);
  drawFace(g, state === 0 ? CALM : ANGRY, e.radius, e.angle, PALETTE.ink);
  if (state === 0) { /* existing closed-eyes block, unchanged: it lands on drawFace's eyes */ }
  g.restore();
```
7. `snail.ts`: import `drawFace`; `g.scale(1.3, 0.6)` → `g.scale(1.2, 0.8)`; `drawCritter(g, look, e, { ink: PALETTE.ink });` (drop the `face` option); after `g.restore();` add `drawFace(g, sink > 0 ? SETTLING : SLEEPY, e.radius, e.angle, PALETTE.ink);`
8. `boing.ts`: `g.scale(1.4, 0.5)` → `g.scale(1.2, 0.8)`; `Math.min(0.5, e.speed / 640)` → `Math.min(0.2, e.speed / 640)`; move the `drawFace(...)` call from inside the transform to just after `g.restore();`; fix the comment on line 15.
9. `brood.ts`: import `drawFace`; `drawCritter(g, look, e, { ink: PALETTE.ink });` (drop `face`); after `g.restore();` add `drawFace(g, ph === 0 ? CALM : TEETH, e.radius, e.angle, PALETTE.ink);`
10. Create `tests/squash.test.ts` (vitest): over `phase 0..3` and `state 0..2` with `t` from 0 to 2 step 0.01, assert `1 ± 0.2·zippySquash` and both `sleeperCushion` values stay in [0.8, 1.2]; assert `zippySquash(1,0)=0`, `zippySquash(1,0.02)>0` (not one-frame), `zippySquash(1,0.15)≈1`, `zippySquash(2,0)=1`, `zippySquash(2,0.15)≈0` (phase continuity 2→3→0: 0, 0→0.5); assert `sleeperCushion(0,5)≈[1.15,0.85]`, `sleeperCushion(1,0)≈[1.15,0.85]`, `sleeperCushion(1,0.15)≈[1.05,0.95]`, `sleeperCushion(0,0)≈[1.05,0.95]` (use `toBeCloseTo`, not `toEqual`, for floats).
11. Run `npm run check` and `npm run smoke`; watch the Zippy dash and the Sleeper wake in the smoke run.

### Pitfalls
- `slots` are whole numbers: always `Math.round(… * 100)` on write, `/ 100` on read; never store the fraction raw.
- The phase-age slot must reset on the SAME tick as the phase change (compare before assigning `mem.zp`/`mem.sl`), or the ease restarts one tick late and the squash jumps.
- `draw()` is client-only: read `e.slots` and `e.angle`, never `mem`; no `Math.random` (lint). The ease is a pure function of the slot.
- The engine's own wobble in `drawCritter` (±~9% at 420 u/s) multiplies on top and is explicitly out of scope — don't try to compensate or clamp it; the content transform alone must stay 0.8–1.2.
- Don't move the lane line into a transform, and don't drop `face` from the `Look` object (`look: { …, face: CALM }`) — only from the `drawCritter` call.
- T0073 (in design) will delete `snail.ts`/`boing.ts`: if they are gone when you start, skip steps 7–8; the criteria hold for the remaining monsters. T0071 also edits `sleeper.ts` (color line only) — don't touch the `color:` line.
- The face nudge is ≤ ~0.05r (a sub-pixel to 3px shift); its job is continuity, not magnitude — don't enlarge it.

### Tests
- `tests/squash.test.ts` as in step 10 (the two exported curves are pure and a future retune could silently break the 0.8–1.2 / 0.15 s rule). Everything else is covered by `engine/tests` (draw smoke, match run) and the smoke test.
