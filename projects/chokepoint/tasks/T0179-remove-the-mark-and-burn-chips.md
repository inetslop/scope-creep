---
id: T0179
title: "Remove the status chips over enemies: mark, burn, slow, ramp"
assignee: asus
size: S
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T12:21:52Z
claimed_at: 2026-10-29T14:44:31Z
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

## Design (architect, desktop)

### Files
- delete `src/systems/enemyHooks/markTick.ts` - the Mark chip hook
- delete `src/systems/enemyHooks/burnTick.ts` - the Burn chip hook
- delete `src/systems/enemyHooks/slowTick.ts` - the Slow chip hook
- delete `src/systems/enemyHooks/rampTick.ts` - the Ramp chip hook
- edit `src/systems/enemyHooks/index.ts` - remove the four imports and four list entries above

### Interfaces
None. No types or signatures change.

### Steps
1. Delete the four files named in ## Files.
2. In `src/systems/enemyHooks/index.ts` delete exactly these four import lines:
   - `import { burnTick } from './burnTick';`
   - `import { markTick } from './markTick';`
   - `import { rampTick } from './rampTick';`
   - `import { slowTick } from './slowTick';`
   and these four one-line entries inside `ENEMY_HOOKS`: `markTick,` `rampTick,` `burnTick,` `slowTick,`
   (One line at a time; leave every other line — `comboGold, split, nameTag, crackTick, killCoin, haulerLeak, burnLeap, muteJam, mintRing` and their imports — exactly as is.)
3. Run `npm run check`. It must pass.

### Pitfalls
- `burnTick` is also the name of the burn **damage** function in `src/core/burn.ts`, used by `src/systems/EnemySystem.ts` and `tests/core/ember.test.ts`, and there is a `src/systems/attacks/burn.ts` attack file. All of those stay. Only delete the chip hook files in `src/systems/enemyHooks/`.
- T0139 (another machine) may add a `rootTick` import and list entry to `index.ts` around this time. If a `rootTick` line is present, leave it untouched — remove only the four lines named in Step 2.
- Do not edit anything in `src/systems/enemyMarks.ts`; the original markers (chevron, circling dash, frost ring, speed ticks) must stay byte-for-byte.
- No other file imports these four hooks (verified by search), so nothing else needs changing.

### Tests
none
