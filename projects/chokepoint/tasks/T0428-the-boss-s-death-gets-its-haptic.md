---
id: T0428
title: "The boss's death gets its haptic"
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-11-02T14:32:01Z
---

## Goal
The run's loudest kill gets the run's heaviest buzz on mobile: the moment a boss dies, the phone shakes harder than a leak does.

## Details
- On a mobile browser, the moment a boss dies (the death burst's and horn's own moment, the bossDeath hook), one vibration of 200 ms — the leak's 80 ms (T0265) is the lighter end of the run's haptics, the boss death is the heavier end. Once per boss, per run: a run that stops three bosses buzzes three times.
- Guarded exactly like T0265: no navigator.vibrate (desktop, and most mobile browsers) is a no-op. No new key, button, HUD element or toggle; the pause screen lists nothing (T0265's precedent: the haptics are felt, not shown), and the sound toggle stays out of it.

## Acceptance criteria
- [ ] A 200 ms vibration at each boss death on a mobile browser that supports it; a desktop run is byte-identical (the call is guarded).
- [ ] Exactly once per boss, per run; a run that stops two bosses buzzes twice.
- [ ] The existing place (20 ms) and leak (80 ms) patterns are untouched; no new HUD, key or toggle; `npm run check` and the desktop + mobile smoke pass.
