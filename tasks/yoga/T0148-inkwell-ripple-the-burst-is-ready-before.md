---
id: T0148
title: Inkwell ripple — the burst is ready before you spend it
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T22:11:29Z
claimed_at: 2026-10-27T22:20:59Z
designer: yoga
---

## Goal
The moment the Inkwell meter (T0090) reaches full, it announces itself — one swell and one soft tick — so the burst is known to be ready before you spend it.

## Details
- The moment the meter's fill rises from below-full to full (one false→true edge per fill):
  - the meter swells once: its drawn width scales about the meter's center 1.0× → 1.2× over 100 ms and back to 1.0× over 100 ms (200 ms total); its position under the streak tally, its fill and the 412×915 / 1280×720 layouts are otherwise unchanged.
  - one short high tick plays: a new `Sfx.inkwellFull()` in `src/audio/Sfx.ts` in the weapon-tick idiom (T0093) — a ~60 ms triangle blip 2600→2000 Hz at about half the gain of a normal hit, mute-gated by the same gate the other Sfx use, throttled to one per 300 ms.
- The edge is detected where the meter is already drawn (the scene sees the fill fraction every frame and remembers the previous frame's full/not-full state) — no new rule in `src/core/run.ts`, no change to the inkwell math.
- One swell and one tick per fill, never per frame; a meter that stays full does nothing further; spending the meter on a burst (the 3× volley) resets the edge, so the next refill announces again.
- No change to the fill rate (10% per volley), the burst itself, the deeper burst shoot sound, the knockback, or anything T0120 (Heavy burst) owns — no new key, HUD element, scene or gameplay number.

## Acceptance criteria
- [ ] Firing until the meter first reaches full: exactly one swell (1.2× over 200 ms total) and exactly one high tick.
- [ ] Letting the meter sit full: no further swell or tick (at most one tick per 300 ms even in a glitch).
- [ ] Firing the burst, then refilling: the swell and tick play again.
- [ ] The tick obeys the same mute gate as the existing pickup pluck (silent whenever the pluck is silent, audible whenever it is audible).
- [ ] The fill rate, the burst's 3× volley, its sound and knockback are unchanged; desktop + mobile smoke runs pass.
