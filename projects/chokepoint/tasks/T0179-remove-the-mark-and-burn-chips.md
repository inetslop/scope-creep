---
id: T0179
title: "Remove the status chips over enemies: mark, burn, slow, ramp"
size: S
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T12:21:52Z
claimed_at: 2026-10-29T12:51:18Z
designer: desktop
---

## Goal
Four enemy states show twice. Each already has its original marker (in `systems/enemyMarks.ts`), and the "X shows on the enemy" tasks added a chip over the token on top:

| State | Original marker (stays) | Chip on top (goes) |
|---|---|---|
| Marked | a small ink down-chevron above the health bar | `markTick.ts` (T0099) |
| Burning | a small orange dash circling the enemy | `burnTick.ts` (T0113) |
| Slowed | a thin ice-blue frost ring | `slowTick.ts` (T0138) |
| Ramping (Sprinter) | two short speed ticks trailing behind it | `rampTick.ts` (T0104) |

Remove the four chips; the original markers stay exactly as they are.

## Details
- Delete `src/systems/enemyHooks/markTick.ts`, `burnTick.ts`, `slowTick.ts` and `rampTick.ts`, and their import and list lines in `src/systems/enemyHooks/index.ts`.
- Nothing else uses them. The core `burnTick()` damage function in `src/core/burn.ts` is something else and stays.
- The other hooks (`nameTag`, `crackTick`, and the root chip T0139 is adding, which a later task removes) are untouched.
- Every marker in `systems/enemyMarks.ts` stays exactly as it is.

## Acceptance criteria
- [ ] A marked, burning, slowed or ramping enemy shows only its original marker (chevron, circling dash, frost ring, speed ticks): no chip over the token.
- [ ] The four files are gone and no `markTick`, `slowTick`, `rampTick` or chip `burnTick` hook is left in `src/` or `tests/`.
- [ ] Enemies, their markers and the rest of the enemy hooks work as before.
