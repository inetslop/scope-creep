---
id: T0103
title: "Bloop: a low bloop when a Toss splash blooms"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T17:06:34Z
epic: E20
---

## Goal
The Toss's arc blob lands silently; a low bloop at the splash tells every player around the spot the moment it strikes, so the dodge (moving during the ~1.25 s flight) is readable by ear, not only by eye.

## Details
- A new sound in `src/audio/sfx.ts`: `bloop(seed, age)` — a short low squeeze, a sine sweeping 160 Hz down to 70 Hz over 0.12 s, peak 0.08 (clearly lower and softer than the monster pop). Deduped once per effect seed and globally throttled to one bloop per 150 ms, with the same 6-voice cap as the pops — model it on the whump added for the Sting burst, which sits in the same file.
- Play it where the plop-splash area is drawn (`src/content/areas/plop-splash.ts`), the same way the sting-burst whump is wired into `src/content/effects/sting-burst.ts`: every client who sees a splash bloom hears it once, at the bloom (the 0.2 s the ring spreads out to radius 60).
- The plop-splash is used only by the Toss, so no other monster or weapon is affected. No new content file beyond the sound function.

## Acceptance criteria
- [ ] When a Toss blob's splash blooms on screen, a low bloop plays at the bloom, once per splash, and it sits under the action (softer and lower than a monster pop).
- [ ] A crowd of splashes at once (a Toss crowd, a busy field) never stacks: at most one bloop per 150 ms and at most six at once.
- [ ] The sound obeys the existing gates — nothing before the first gesture, silent when the match is not shown — and works on desktop and mobile.

## Design (architect, yoga)

### Files
- edit `src/audio/sfx.ts` - add module var `lastBloop` and the exported `bloom`... no: `bloop(seed, age)`, modeled on `whump` (line 116).
- edit `src/content/areas/plop-splash.ts` - import `bloop` and call it at the top of `look.draw`.
### Interfaces
```ts
// src/audio/sfx.ts
let lastBloop = 0; // performance.now() of the last bloop  (beside lastWhump, line 15)
export function bloop(seed: number, age: number): void
// 160 -> 70 Hz over 0.12 s, peak 0.08; gates exactly like whump: !ctx, age > 0.25,
// now - lastHud > 1000, seed dedupe in `heard` (700 ms, 96-entry sweep),
// now - lastBloop < 150 -> return, lastBloop = now, active >= 6, then active += 1; blip(160, 0.08, 0.12, 70).
```
### Steps
1. In `sfx.ts`: add `let lastBloop = 0; // performance.now() of the last bloop` after the `lastWhump` line (15). After `whump` (line 130) add `bloop` with a doc comment: "One low bloop when a Toss blob's splash blooms... peak 0.08 — lower and softer than the pop... called from the plop-splash area's draw() on every client: once per splash (its seed), one bloop per 150 ms, under the same 6-voice cap." Body: copy `whump`'s body exactly (lines 117-128) swapping `lastWhump`→`lastBloop`, the `200`→`150`, and the last line to `blip(160, 0.08, 0.12, 70); // 160 -> 70 Hz over 0.12 s, peak 0.08`.
2. In `plop-splash.ts`: add `import { bloop } from '../../audio/sfx.ts';` after the PALETTE import; as the first line of `draw(g, e)` (line 12) add `bloop(e.seed, (1 - e.hp) * 0.2); // the 0.2 s bloom` — before the `if (r <= 1) return;` so it fires even on the tiny first frame.
### Pitfalls
- Do not use `performance`/`Math.random` in the area file; all clock work stays inside `bloop` in sfx.ts (client-only file, already allowed).
- `e.hp` is life left, so `(1 - e.hp) * 0.2` is the age in seconds; the 700 ms seed dedupe already outlives the 0.2 s splash, so the age guard is a belt-and-braces copy of whump's.
- `plop-splash`'s `draw` early-returns at `r <= 1`; the sound call must precede it, but stay at the top so no draw-path change is visible.
- Reuse the shared `heard`/`active` maps — the 6-voice cap and the match-on-screen/first-gesture gates come for free; never touch `arm()`, `hudNow()` or `src/hud/audio.ts`.
### Tests
- none (client sound; engine/tests already run every area's draw in a real match).
