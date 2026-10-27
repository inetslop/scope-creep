---
id: T0095
title: "Music tempo test — pin the clamp at 15:00"
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T08:55:16Z
---

## Goal
Close the only gap the T0092 rejection found: the tempo curve's clamp past 10:00 is not pinned, so later music work (boss music, tempo change) could let the ramp keep climbing after 10:00 without a single test failing.

## Details
- `tests/core/music.test.ts` already exists (added in T0011) and already pins 80 BPM at 0:00, the non-decreasing ramp, 120 BPM at 10:00, and both sides of the 100 BPM second-voice threshold (299 s / 300 s).
- Add exactly one new test case asserting the tempo is 120 BPM at t = 900 s (15:00) — the curve clamps at 120, it does not keep climbing. Write it the same way the existing t = 600 s pin is written in the same file.
- Do not change `src/core/music.ts`, do not rename or weaken any existing test, and do not add any other assertion.

## Acceptance criteria
- [ ] `tests/core/music.test.ts` has one new test asserting the tempo is 120 BPM at t = 900 s (15:00).
- [ ] The full test suite passes with zero changes to source files.
- [ ] No existing test was renamed, weakened or removed.
