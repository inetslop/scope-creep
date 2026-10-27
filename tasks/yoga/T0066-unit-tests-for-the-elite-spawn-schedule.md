---
id: T0066
title: Unit tests for the elite spawn schedule
assignee: yoga
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T03:07:33Z
claimed_at: 2026-10-27T03:10:25Z
designer: yoga
---

## Goal
Lock down the elite pacing from T0005 with a small unit test: the first elite appears at exactly 0:45 and then exactly one elite every 45 s, none in between. Same pattern as the crop-schedule and spawn-unlock tests.

## Details
- Add one new test file `tests/content/director.test.ts`, next to the existing `tests/content/spawn.test.ts` (copy its structure: same runner style, same describe/it shape, no new dependencies). The module under test is the spawn director in `src/core/director.ts`.
- The rules to lock (from T0005):
  - no elite before 45 s of run time (e.g. at 0, 30, 44 s there is no elite),
  - the first elite is at exactly 45 s,
  - after that exactly one elite every 45 s: 90, 135, 180,
  - no elite in between those marks (e.g. nothing at 46–89 s, nothing at 91 s).
- If the elite timing is exposed through a pure helper on the director (like the pure `unlocked()` helper that `tests/content/spawn.test.ts` already drives), assert against the helper directly. If the timing only emerges from driving the director forward in time, drive it with a fixed seed and fixed time steps, record which steps produce an elite, and assert the same 45-s rhythm — and that two runs with the same seed produce identical elite timing (deterministic).
- No source files change. This is tests only.

## Acceptance criteria
- [ ] The new test file asserts: no elite before 45 s, an elite at 45/90/135/180 s, and no elite in between those marks.
- [ ] `npm run check` passes (typecheck, lint, and the full test suite including the new test).
- [ ] No game source file is modified.
