---
id: T0095
title: "Music tempo test — pin the clamp at 15:00"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T08:55:16Z
claimed_at: 2026-10-27T09:41:45Z
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

## Design (architect, desktop)

### Files
- edit `tests/core/music.test.ts` - add exactly one new `it` block; no other changes, no source files touched

### Interfaces
None new. Existing: `bpmForTime(timeSec: number): number` from `src/core/music.ts` (already imported in the test file).

### Steps
1. In `tests/core/music.test.ts`, insert this block immediately after line 16 (the `});` closing the `it('caps at 120 BPM from 10:00 onward')` test), before the `it('is monotonic over the first hour')` test:

```ts
  it('clamps at 120 BPM at 15:00', () => {
    expect(bpmForTime(900)).toBe(120);
  });
```

2. Run `npm run check` — typecheck, lint, and the full vitest suite must all pass with zero changes to `src/`.

### Pitfalls
- The new test is a standalone `it` block (acceptance says "one new test"); the t = 600 s pin's `expect(bpmForTime(600)).toBe(120);` line only defines the assertion style to copy, it is not the place to insert.
- Argument is seconds: `900` (15:00), never `15`. `bpmForTime` takes `timeSec`.
- Use `.toBe(120)` (strict equality), matching the existing pins. `bpmForTime(900)` is exactly 120: `80 + 4 × 15 = 140`, clamped by `Math.min(…, 120)` — no float tolerance needed.
- Do not rename, edit, weaken or remove any of the five existing tests; do not touch `src/core/music.ts` or any other file.

### Tests
- The added `it('clamps at 120 BPM at 15:00')` in `tests/core/music.test.ts` is the entire deliverable.
