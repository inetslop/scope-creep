---
id: T0063
title: Unit tests for the crop schedule
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T02:46:28Z
claimed_at: 2026-10-27T03:15:58Z
---

## Goal
Lock down the pure crop schedule from T0045 so the late-run arena shrink can never silently start early, shrink too far, or run backwards.

## Details
- One new test file `tests/core/crop.test.ts` (no source files change), testing the pure shrink schedule in `src/core/crop.ts` added in T0045 — the function that returns the arena safe-area scale for a given run time (the architect pins the exact name and signature; call it with times in seconds).
- Before 12:00 there is no shrink: at 719 s the scale is exactly 1.0.
- At 12:00 (720 s) the shrink has just begun: 1.0.
- Midpoint 14:30 (870 s): 0.85.
- At 17:00 (1020 s) the floor is reached: 0.7.
- After 17:00 the scale stays clamped at 0.7 — at 1021 s and at 3600 s it is still exactly 0.7, never below.
- The schedule never increases between 12:00 and 17:00 (spot-check a few times, e.g. 720 ≥ 810 ≥ 900 ≥ 1020).
- Assert only the returned scale values — not burn damage, visuals, or scene behavior (those live in the crop system and are covered by the smoke test).

## Acceptance criteria
- [ ] New tests exist in `tests/core/crop.test.ts`, are green, and `npm run check` passes along with all existing tests.
- [ ] The tests assert no shrink before 12:00, 1.0 at 12:00, 0.85 at 14:30, 0.7 at 17:00, clamping after 17:00, and a non-increasing schedule through the window.
- [ ] No source files are modified (the diff touches only `tests/core/crop.test.ts`).
- [ ] `npm run smoke` passes.

## Design (architect, yoga)

### Files
- edit `tests/core/crop.test.ts` — the file already exists from T0045; replace its whole content (shown below). No source files change.
### Interfaces
No new interfaces. Use what T0045 exported from `src/core/crop.ts`:
```ts
export function cropSafeFraction(timeSec: number): number; // time in seconds
export const CROP: { startSec: 720; endSec: 1020; endFraction: 0.7; burnPerSec: 5 };
```
### Steps
1. Overwrite `tests/core/crop.test.ts` with exactly this:
```ts
import { describe, expect, it } from 'vitest';
import { CROP, cropSafeFraction } from '../../src/core/crop';

describe('crop', () => {
  it('exposes the schedule constants', () => {
    expect(CROP).toEqual({ startSec: 720, endSec: 1020, endFraction: 0.7, burnPerSec: 5 });
  });

  it('keeps the whole arena safe before 12:00', () => {
    expect(cropSafeFraction(0)).toBe(1);
    expect(cropSafeFraction(719)).toBe(1);
  });

  it('is still 1.0 at 12:00 — the shrink has just begun', () => {
    expect(cropSafeFraction(720)).toBe(1);
  });

  it('reaches 0.85 at the 14:30 midpoint', () => {
    expect(cropSafeFraction(870)).toBeCloseTo(0.85);
  });

  it('never increases between 12:00 and 17:00', () => {
    const a = cropSafeFraction(720);
    const b = cropSafeFraction(810);
    const c = cropSafeFraction(900);
    const d = cropSafeFraction(1020);
    expect(a).toBeGreaterThanOrEqual(b);
    expect(b).toBeGreaterThanOrEqual(c);
    expect(c).toBeGreaterThanOrEqual(d);
  });

  it('clamps at 0.7 from 17:00 onward', () => {
    expect(cropSafeFraction(1020)).toBe(0.7);
    expect(cropSafeFraction(1021)).toBe(0.7);
    expect(cropSafeFraction(3600)).toBe(0.7);
  });
});
```
2. Run `npm run check`, then `npm run smoke`. Both must pass.
### Pitfalls
- The file is an EDIT, not a create — it exists since T0045; do not re-add imports or leave old tests in a merge. The final diff must touch only `tests/core/crop.test.ts`.
- 720/1020/1021/3600/719 return the function's exact literals, so `toBe` is right; only the 870 midpoint is computed, so keep `toBeCloseTo(0.85)` there (do not use `toBe(0.85)` — float).
- Assert only the returned scale. Do not import or test `CropSystem`, burn damage, crop marks, or any scene.
### Tests
- `tests/core/crop.test.ts` as above: no shrink before 12:00, 1.0 at 720 s, 0.85 at 870 s, non-increasing 720 ≥ 810 ≥ 900 ≥ 1020, clamped 0.7 at 1020/1021/3600 s.
