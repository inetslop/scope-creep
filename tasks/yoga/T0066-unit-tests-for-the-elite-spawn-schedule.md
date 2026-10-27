---
id: T0066
title: Unit tests for the elite spawn schedule
assignee: yoga
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T03:07:33Z
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

## Design (architect, yoga)

### Files
- create `tests/content/director.test.ts` - unit tests locking the elite spawn schedule; same vitest style as `tests/content/spawn.test.ts`
### Interfaces
None. No new types or signatures; no source file changes.
### Steps
1. Create `tests/content/director.test.ts` with exactly this content:

```ts
import { describe, expect, it } from 'vitest';
import { ELITE } from '../../src/config';
import { ENEMIES } from '../../src/content/enemies';
import { SpawnDirector } from '../../src/core/director';
import { Rng } from '../../src/core/rng';

const DT = 1;

/** Drive the director one whole second at a time from t=0; record each second that yields an elite. */
function eliteTimes(seed: number, upTo: number): number[] {
  const director = new SpawnDirector(ENEMIES);
  const rng = new Rng(seed);
  const times: number[] = [];
  for (let t = 0; t <= upTo; t += DT) {
    const d = director.update(DT, t, 10, rng);
    if (d.elites.length > 0) times.push(t);
  }
  return times;
}

describe('elite spawn schedule', () => {
  it('no elite before 45s', () => {
    expect(eliteTimes(123, 44)).toEqual([]);
  });
  it('first elite at exactly 45s', () => {
    expect(eliteTimes(123, 45)).toEqual([45]);
  });
  it('exactly one elite every 45s: 45, 90, 135, 180', () => {
    expect(eliteTimes(123, 180)).toEqual([45, 90, 135, 180]);
  });
  it('no elite between the marks', () => {
    for (const t of eliteTimes(123, 180)) {
      expect(t % ELITE.intervalSec === 0, `elite at unexpected time ${t}s`).toBe(true);
    }
  });
  it('same seed gives identical elite timing', () => {
    expect(eliteTimes(987654321, 300)).toEqual(eliteTimes(987654321, 300));
  });
});
```

2. Run `npm run check`. It must pass (typecheck + lint + full suite incl. the new file).
### Pitfalls
- Import paths are `../../src/...` (file lives in `tests/content/`), exactly like `tests/content/spawn.test.ts`; do not use `../src`.
- Import `describe`/`expect`/`it` from `'vitest'` — the project has no globals (see `spawn.test.ts:6`).
- Keep `DT = 1`: the schedule is only "exactly 45 s" with 1 s steps; a coarser step would fire at the first `timeSec >= 45`, shifting the marks. Never change `DT`.
- `aliveCount: 10` is arbitrary — it only affects normal spawns, elites ignore it.
- Construct `new Rng(seed)` with a fixed number; never `Math.random()` or a default-arg `Rng` (non-deterministic).
- Do not touch `src/core/director.ts`, `src/config.ts`, or any other source file.
### Tests
- The new file itself is the unit test (pure logic in `src/core`, no source changes needed).
DEPENDED: none
