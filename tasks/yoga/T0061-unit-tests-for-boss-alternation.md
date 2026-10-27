---
id: T0061
title: Unit tests for boss alternation
assignee: yoga
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T02:15:10Z
---

## Goal
Lock down the boss rotation added in T0044 so The Frame and The Grid can never silently stop alternating.

## Details
- One new `describe` block appended to the existing `tests/core/boss.test.ts` (no source files change), testing the pure boss-alternation helper in `src/content/bosses/index.ts` added in T0044 (the function that picks which boss spawns for the Nth boss of the run — the architect pins the exact name and signature; call it through that pure function and assert on the returned boss id).
- First boss: boss #1 (The Frame's 5:00 spawn) returns The Frame (boss id `'frame'`), never The Grid.
- Strict alternation: boss #2 returns `'grid'`, #3 `'frame'`, #4 `'grid'`, #5 `'frame'`.
- Determinism: the same boss number always returns the same boss — the same sequence for every call, no RNG involved.
- Assert only the returned boss ids — not HP, timers, or scene behavior (those live in the boss system and are covered elsewhere).

## Acceptance criteria
- [ ] New tests exist in `tests/core/boss.test.ts`, are green, and `npm run check` passes along with all existing tests.
- [ ] The tests assert first-boss-is-frame, strict alternation through at least boss #5, and determinism.
- [ ] No source files are modified (the diff touches only `tests/core/boss.test.ts`).
- [ ] `npm run smoke` passes.

## Design (architect, yoga)

### Files
- edit `tests/core/boss.test.ts` — append exactly one new `describe` block after the existing `describe('bossForKill')` block (ends line 58); nothing else changes.
### Interfaces
- No new code. Pin the tested function: `bossForKill(kills: number): FrameBossDef | GridBossDef` from `src/core/boss.ts` (already imported at line 2 of the test file — do not change the import). Note for the developer: the task text points at `src/content/bosses/index.ts`, but that file only holds the FRAME/GRID registry; the alternation helper is `bossForKill` in `src/core/boss.ts`. Assert only `.id`.
### Steps
1. Open `tests/core/boss.test.ts`, append this block at end of file (no other edits):
```ts
describe('boss alternation: the Nth boss of the run (1-based)', () => {
  it('boss #1 (The Frame, 5:00 spawn) is always The Frame, never The Grid', () => {
    expect(bossForKill(0).id).toBe('frame');
    expect(bossForKill(0).id).not.toBe('grid');
  });

  it('strict alternation: #1..#5 = frame, grid, frame, grid, frame', () => {
    // Boss #N of the run is bossForKill(N - 1); BossSystem passes run.bossKills.
    const ids = [1, 2, 3, 4, 5].map((n) => bossForKill(n - 1).id);
    expect(ids).toEqual(['frame', 'grid', 'frame', 'grid', 'frame']);
  });

  it('deterministic: no RNG, the same boss number always returns the same boss', () => {
    const seq = () => [0, 1, 2, 3, 4].map((k) => bossForKill(k).id);
    expect(seq()).toEqual(seq());
  });
});
```
2. Run `npm run check`, then `npm run smoke`. Both must pass; the diff must touch only `tests/core/boss.test.ts`.
### Pitfalls
- Off-by-one: boss #N (1-based, per task) is `bossForKill(N - 1)`. Testing boss #1 as `bossForKill(1)` would return `'grid'` and fail — do not "fix" it.
- Do not assert HP, timers, or the whole def object — `.id` only (HP/timers live in `bossHpMultiplier`/BossTimer, covered by the existing blocks).
- Do not modify the existing `describe('bossForKill')` block or any source file; the new block's value is the `#5 = 'frame'` assertion (existing tests stop at kill 3).
### Tests
- The three `it` blocks above in `tests/core/boss.test.ts` (first-boss-is-frame, alternation through boss #5, determinism).
