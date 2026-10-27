---
id: T0092
title: Unit tests for the music tempo curve
assignee: yoga
size: S
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-27T08:45:39Z
claimed_at: 2026-10-27T08:45:56Z
finished_at: 2026-10-27T08:52:00Z
design_attempts: 1
---

## Goal
Lock the generative score's tempo curve in unit tests, so later music work (the boss-music and tempo-change ideas) cannot break the 80→120 BPM ramp without a test failing.

## Details
- New test file `tests/core/music.test.ts` for the pure music module `src/core/music.ts` (added in T0011: tempo ramps 80→120 BPM over 10 minutes, and a second voice enters once the tempo crosses 100 BPM).
- Follow the shape of `tests/core/crop.test.ts` (the pure-schedule test: pinned values at time points plus a monotonicity sweep across the whole window).
- Lock down:
  - the tempo is 80 BPM at t = 0 s;
  - the tempo is non-decreasing from t = 0 to t = 600 s (sweep in 10 s steps);
  - the tempo is 120 BPM at t = 600 s;
  - the tempo stays exactly 120 BPM past 600 s (assert t = 900 s — the curve clamps, it does not keep climbing);
  - the second voice (or the threshold it keys on) is off below 100 BPM and on at 100 BPM or above — find the time the tempo first reaches 100 from the curve and assert both sides of it.
- Read the actual exports of `src/core/music.ts` first and test what exists; if the second-voice decision lives in `src/audio/Music.ts` instead, assert only what the pure module exposes and say so in the commit message.
- No gameplay, audio or content change — tests only.

## Acceptance criteria
- [ ] `tests/core/music.test.ts` exists and pins 80 BPM at 0:00, a non-decreasing ramp, 120 BPM at 10:00, and exactly 120 BPM at 15:00.
- [ ] The second-voice threshold is asserted off below 100 BPM and on at 100 BPM or above.
- [ ] All tests pass in the automated gate.

## Rejected by architect (yoga)

tests/core/music.test.ts already exists (added in T0011, green on main) and pins 80 BPM at 0:00, the non-decreasing ramp, 120 BPM at 10:00, and both sides of the 100 BPM threshold (299 s / 300 s); the only gap is the t = 900 s (15:00) pin, so close T0092 or shrink it to a one-line edit adding that assertion.
