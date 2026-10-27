---
id: T0075
title: Unit tests for the Still Life bubble
assignee: yoga
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-27T04:43:07Z
claimed_at: 2026-10-27T07:10:56Z
finished_at: 2026-10-27T07:19:35Z
---

## Goal
Lock the Still Life active's (T0050) timing rules with a unit test: 5 s duration, 12 s cooldown. Same pattern as the Understudy decoy tests (T0071) and the Eraser-removal tests (T0068).

## Details
- Add one new test file `tests/core/stillLife.test.ts`, next to the existing Understudy decoy test (T0071, the test for `src/core/understudy.ts` in `tests/core/`) — copy its structure: same vitest style, same construction of the pure module, no new dependencies. No source files change.
- The module under test is the pure Still Life timing in `src/core/stillLife.ts` (the slow bubble added in T0050).
- The rules to lock:
  - a fresh run can start the bubble immediately — no cooldown at the start of a run;
  - once started, the bubble lasts exactly 5 s: active just before 5 s (e.g. at 4.9 s), gone just after (e.g. at 5.1 s);
  - a start request during the 12 s cooldown is rejected (e.g. one 6 s into the cooldown), and one after the cooldown has fully elapsed (at/after 12 s) succeeds;
  - a start while the bubble is already active does nothing — the cooldown is longer than the duration, so this is the same rejection path; assert it rather than special-casing it.

## Acceptance criteria
- [ ] The new `tests/core/stillLife.test.ts` asserts all four cases above: fresh run can start immediately, bubble active just before 5 s and gone just after, restart rejected during the 12 s cooldown and succeeding once it is over, and a start during the active window is a no-op.
- [ ] `npm run check` passes (typecheck, lint, and the full test suite including the new test).
- [ ] No game source file is modified.

## Design (architect, yoga)

### Files
- edit `tests/core/stillLife.test.ts` — file already exists (committed in T0050); task's "new file" is stale. Two insertions only; no other edits, no second file.
- no source files touched; `src/core/stillLife.ts` stays as is.
### Interfaces
- none. Test uses the existing API only: `new StillLife()`, `s.ready`, `s.active`, `s.trigger(): boolean`, `s.update(dt: number): boolean`.
### Steps
1. In the test titled `'ends after 5 s of updates, and the cooldown outlives the bubble'`, insert immediately after the line `for (let i = 0; i < 49; i++) expect(s.update(0.1)).toBe(false);`:
   `    expect(s.active).toBe(true); // still up at 4.9 s`
2. Insert this test immediately before the line `  it('exposes the tuning constants', () => {` (keep one blank line before it, matching the file):
   ```
     it('ignores a trigger while the bubble is already active', () => {
       const s = new StillLife();
       expect(s.trigger()).toBe(true);
       for (let i = 0; i < 20; i++) s.update(0.1); // 2.0 s in: active and on cooldown
       expect(s.active).toBe(true);
       expect(s.trigger()).toBe(false); // same rejection path as the pure cooldown
       for (let i = 0; i < 31; i++) s.update(0.1); // 5.1 s total
       expect(s.active).toBe(false); // the 5 s clock was not restarted
     });
   ```
3. Run `npm run check`; typecheck, lint and the full suite must pass.
### Pitfalls
- Don't delete/rewrite the pre-existing tests: `'is not re-triggerable at 11.9 s, ready at 12.1 s'` already locks cooldown-reject/succeed, and `'exposes the tuning constants'` must stay or the 4 constant imports go unused → lint failure.
- Never assert exact 5.0/12.0 boundaries: 0.1 is inexact in binary; the file intentionally steps to 5.01 s / 12.1 s to dodge 1e-15 rounding. The new lines keep the same pattern (4.9 s via 49 ticks, 5.1 s via 20+31 ticks). Don't add `update(5.0)` or inspect `lifeLeft`/`cooldownLeft` directly (private).
- Match file style exactly: 2-space indent in `describe`, 4 in `it`, single quotes, semicolons — lint enforces.
### Tests
- `tests/core/stillLife.test.ts` (extended in place): fresh run can start immediately (existing: `trigger()` true at t=0 + `ready` true), active at 4.9 s and gone by 5.01 s (existing end + new line), 12 s cooldown rejects at 11.9 s and succeeds at 12.1 s (existing), trigger during the active window is a no-op and does not restart the 5 s clock (new test).

## Result (attempt 1, yoga)

Locked the Still Life bubble's timing rules in tests/core/stillLife.test.ts with two insertions: an assertion that the bubble is still up at 4.9 s inside the existing 5 s lifecycle test, and a new test proving a trigger during the active window is rejected (same path as the cooldown) and does not restart the 5 s clock. The existing tests already covered fresh-run readiness, the 5.01 s end, and the 11.9 s/12.1 s cooldown reject/succeed. Typecheck, lint, all 254 unit tests, and the desktop+mobile smoke run all pass; no source files were modified.

- Self-review: APPROVE
- Time: 8.7 min

```
game/tests/core/stillLife.test.ts | 11 +++++++++++
 1 file changed, 11 insertions(+)
```
