---
id: T0265
title: "Haptics: builds and leaks felt on mobile"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T06:24:50Z
claimed_at: 2026-10-30T06:25:25Z
designer: yoga
---

## Goal
On phones that can vibrate, the two moments the board already celebrates — a tower landing, a leak getting through — are felt as well as seen, so the run's feedback (pillars 5 and 6) reaches the hand.

## Details
- One new small module, `src/input/haptics.ts` (next to BoardGestures in `src/input/`): a single function `haptic(kind)` with `kind: 'place' | 'leak'`, each kind mapped to one `navigator.vibrate` pattern — `place: [20]` ms, `leak: [80]` ms.
- Guarded to be a total no-op where unsupported: call vibrate only if `navigator` exists and `'vibrate' in navigator`; wrap the call so any throw is swallowed. On desktop and on unsupported browsers the module does nothing, prints nothing, and the game is byte-identical.
- Exactly two call sites, one line each: (1) the one place a tower is committed to the board — the same moment T0088's build-commit tier chime plays; successful placements only, a failed placement (gold short, cell occupied) plays nothing (the existing deny sound covers it); (2) the one place a leak happens — the same place the camera jolt (T0109) and the leak's consequences fire.
- No HUD, no toggle, no pause-screen line: haptics are an output, not a control, and there is nothing to discover on screen; the sound toggle (T0035) does not gate it (a run with sound off still feels a leak).
- At 2× fast-forward (T0119/T0019's WaveSpeed) a leak vibrates once per leak, never stretched — the vibrate runs in real time, not the simulation clock.
- A small unit test for the module: the pattern table (`place` → [20], `leak` → [80]) and the guard (no navigator / no vibrate property → no throw, no call).

## Acceptance criteria
- [ ] On a device with the vibration API (e.g. a mobile browser), a successful tower placement vibrates 20 ms and a leak vibrates 80 ms; a failed placement (gold short or cell occupied) vibrates nothing.
- [ ] On desktop (no vibration API) nothing changes: no error, no console output, identical behaviour.
- [ ] At 2× fast-forward, one leak vibrates exactly once.
- [ ] The unit test passes for the pattern table and the unsupported-environment guard.
- [ ] No HUD element, button or pause-screen line was added; the sound toggle does not affect the buzz.
