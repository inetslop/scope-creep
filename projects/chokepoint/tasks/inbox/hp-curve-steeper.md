---
title: "Enemy hp grows a little faster in the late waves"
size: S
priority: 2
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
