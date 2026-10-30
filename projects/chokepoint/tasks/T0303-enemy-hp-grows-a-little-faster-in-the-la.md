---
id: T0303
title: Enemy hp grows a little faster in the late waves
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T19:48:31Z
---

## Goal
The owner wants the late waves a little harder. Enemy hp is multiplied by `1 + 0.2n + 0.004n²` (n = wave − 1, `waveHpMul` in `src/core/waves.ts`). Raise the squared term from 0.004 to 0.006: barely different early, noticeably tougher late.

| Wave | 10 | 20 | 30 | 40 | 50 |
| --- | --- | --- | --- | --- | --- |
| hp × now | 3.1 | 6.2 | 10.2 | 14.9 | 20.4 |
| hp × after | 3.3 | 7.0 | 11.8 | 17.9 | 25.2 |

## Details
- In `waveHpMul` (`src/core/waves.ts`), change `0.004 * n * n` to `0.006 * n * n`, and update its comment if it names the number.
- Nothing else changes: the 0.2 per wave, the budget, the spacing and the bosses (they use the same multiplier).
- In `tests/core/waves.test.ts`, add one check next to the existing `waveHpMul` ones: `waveHpMul(31)` is `1 + 0.2 * 30 + 0.006 * 900` (12.4).

## Acceptance criteria
- [ ] `waveHpMul(1)` is still 1, and `waveHpMul(31)` is 12.4.
- [ ] `npm run check` passes.

## Design (architect, yoga)

### Files
- edit `src/core/waves.ts` - in `waveHpMul` (line 36), change `0.004 * n * n` to `0.006 * n * n`. The doc comment (line 33) does not name the number, so it stays as is. Nothing else in the file changes.
- edit `tests/core/waves.test.ts` - add one line right after line 136 (`expect(waveHpMul(1)).toBe(1);` inside `it('gets harder every wave', ...)`):
```ts
expect(waveHpMul(31)).toBe(1 + 0.2 * 30 + 0.006 * 900); // 12.4
```

### Interfaces
No new or changed types or signatures; `waveHpMul(wave: number): number` is unchanged.

### Steps
1. In `src/core/waves.ts`, edit line 36: `return 1 + 0.2 * n + 0.004 * n * n;` becomes `return 1 + 0.2 * n + 0.006 * n * n;`.
2. In `tests/core/waves.test.ts`, add the one line above after line 136, inside the same `it` block.
3. Run `npm run check`; it must pass.

### Pitfalls
- Change only the squared coefficient: the `0.2 * n` term, the `Math.max(0, wave - 1)` clamp, `waveBudget`, `waveSpacing` and the boss waves all stay — bosses and quiet waves pick the new multiplier up automatically through `waveHpMul`, so no other edit is needed or allowed.
- The test's right-hand side must be the formula `1 + 0.2 * 30 + 0.006 * 900`, not the literal `12.4`: it is bit-identical to the function's own computation, so it pins both coefficients without float-composition risk. Do not touch the existing `expect(waveHpMul(1)).toBe(1)` line — it still passes and covers the other acceptance criterion.

### Tests
- `tests/core/waves.test.ts`: the one line above (a rule in `src/core` changed; the test guards both coefficients).
