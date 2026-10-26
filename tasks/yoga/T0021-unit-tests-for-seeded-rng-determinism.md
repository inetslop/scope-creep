---
id: T0021
title: Unit tests for seeded RNG determinism
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T20:02:05Z
claimed_at: 2026-10-26T20:12:55Z
---

## Goal
Lock the seeded RNG's determinism down with tests, so future features (daily seeds, reproducible runs, crit rolls) can rely on it.

## Details
- Create one new file: `tests/core/rng.test.ts`, written in the same style as the existing `tests/core/music.test.ts` (same framework, same import style). Test the RNG in `src/core/rng.ts` through its real API.
- Tests to add:
  1. Two RNG instances created with the same seed produce identical output for their first 10 draws.
  2. Two RNG instances created with different seeds produce different output within their first 10 draws.
  3. If the API exposes a float draw, one more test: its output stays within [0, 1).
- No game source files change; this task adds only the new test file.

## Acceptance criteria
- [ ] `tests/core/rng.test.ts` exists and all of its tests pass
- [ ] `npm run check` passes (typecheck, lint, and the full test suite including the new tests)
- [ ] No files under `src/` were modified

## Design (architect, desktop)

### Files
- create `tests/core/rng.test.ts` - unit tests locking down `Rng` determinism (vitest, node env, auto-discovered by `tests/**/*.test.ts` in `vitest.config.ts`)

### Interfaces
None new. Test-only task using the existing API in `src/core/rng.ts`: `new Rng(seed: number)`, `next(): number` (float in [0, 1)).

### Steps
1. Create `tests/core/rng.test.ts` with exactly this content (same style as `tests/core/music.test.ts` — vitest imports, relative import two levels up):

```ts
import { describe, expect, it } from 'vitest';
import { Rng } from '../../src/core/rng';

describe('Rng determinism', () => {
  it('same seed produces identical output for the first 10 draws', () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    const drawsA: number[] = [];
    const drawsB: number[] = [];
    for (let i = 0; i < 10; i++) {
      drawsA.push(a.next());
      drawsB.push(b.next());
    }
    expect(drawsA).toEqual(drawsB);
  });

  it('different seeds produce different output within the first 10 draws', () => {
    const a = new Rng(1234);
    const b = new Rng(4321);
    const drawsA: number[] = [];
    const drawsB: number[] = [];
    for (let i = 0; i < 10; i++) {
      drawsA.push(a.next());
      drawsB.push(b.next());
    }
    expect(drawsA).not.toEqual(drawsB);
  });

  it('next() stays within [0, 1)', () => {
    const rng = new Rng(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

2. Run `npm run check` and confirm it passes. Stop there.

### Pitfalls
- Do NOT touch `src/` or the existing `tests/core/core.test.ts` (it already has a small 3-draw `Rng` block — leave it alone; the new file is separate and additive).
- Use the exact import path `../../src/core/rng` (the file lives in `tests/core/`); a wrong relative path breaks typecheck.
- Do not use `Math.random()` anywhere in the test; only `new Rng(seed)` with fixed seeds.
- Seeds 1234 and 4321 are verified to diverge on the very first mulberry32 draw, so the `not.toEqual` assertion is deterministic, not flaky.

### Tests
- `tests/core/rng.test.ts` as above (3 tests: same-seed equality over 10 draws, different-seed divergence within 10 draws, `next()` bounds over 1000 draws).

DEP: none
