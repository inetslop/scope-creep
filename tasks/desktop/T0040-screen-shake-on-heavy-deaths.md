---
id: T0040
title: Screen shake on heavy deaths
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T23:09:26Z
---

## Goal
Heavy impacts should land physically: when a Block, an elite, or a boss dies, the camera jolts, so big kills feel like they hit the page (pillar 4: juice through form).

## Details
- A new camera-shake effect triggered by death events. It moves only the camera view (a random jitter of the camera offset that decays smoothly to zero, ease-out), never the world.
- Three magnitudes, by what died:
  - A Block (the heavy yellow block) dies: small shake — amplitude 4, duration 0.15 s.
  - Any elite dies: medium shake — amplitude 8, duration 0.3 s.
  - Any boss dies (The Frame now, The Grid later): large shake — amplitude 14, duration 0.5 s.
- If several heavy deaths happen in the same instant, combine them so the total amplitude never exceeds 20.
- Normal enemy deaths (Wedge, Dart, Mote, Sentry, etc., non-elite) do NOT shake.
- Add a `screenShake: boolean` flag to the stats/flags in `debug/testHook.ts` (default true) so the smoke test and the future settings page (M4) can disable shakes.
- No HUD change, no new SFX (the existing death sound is enough).

## Acceptance criteria
- [ ] Killing a Block produces a small camera jolt (~0.15 s); killing any elite a bigger one (~0.3 s); killing The Frame a large one (~0.5 s)
- [ ] The camera returns exactly to center after each shake — no permanent offset
- [ ] Killing a normal (non-elite, non-Block, non-boss) enemy produces no shake
- [ ] Setting the `screenShake` debug flag to false disables all shakes
- [ ] `npm run check` and `npm run smoke` pass
