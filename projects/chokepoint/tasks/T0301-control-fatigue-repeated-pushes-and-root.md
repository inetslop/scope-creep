---
id: T0301
title: "Control fatigue: repeated pushes and roots on one enemy grow weaker"
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T19:32:38Z
---

## Goal
Push is stronger than Anchor today because a push has no limit. Every push adds to a queue of distance the enemy has to slide back (`Enemy.pushBack`: `pushLeft += units`), so a fast tower with Push added, or a few Push towers, can hold an enemy near the entrance for good. Roots have a limit: after one wears off, the enemy shrugs roots off for 2 s. Give both one shared rule instead: each push or root on an enemy that just took one is half as strong as the one before, and the enemy recovers after 1.5 s without any. Nothing can lock an enemy in place, and a combo of Push and Anchor wears off too.

## Details
- **A new pure module `src/core/control.ts`** (no Phaser), the shared rule for every push and root:
  - `CONTROL_WINDOW_SEC = 1.5`: seconds without a push or root after which the enemy has recovered. Shorter than a lone Push tower's pulse (every 1.8 s at Epic), so one tower alone is never weakened by its own pulses.
  - The state on an enemy: `controlCount` (pushes and roots taken in the current streak) and `controlQuietSec` (seconds since the last one).
  - `controlScale(s)`: the strength of the next push or root, `0.5 ** controlCount` (1, 0.5, 0.25, ...).
  - `noteControl(s)`: counts a push or root that took effect (count + 1, quiet back to 0).
  - `tickControl(s, dt)`: while the count is above 0, the quiet time grows by `dt`; at `CONTROL_WINDOW_SEC` the count goes back to 0.
- **Pushes** (`Enemy.pushBack`): the units are multiplied by `controlScale` before they join `pushLeft`, then `noteControl`. This covers every source: Push towers' pulses, Push added to any tower, and beams (`EnemySystem` calls `pushBack` for all of them).
- **Roots** (`Enemy.root`): a root while it is already rooted still does nothing (never refreshed or extended, as now) and does not count. Otherwise the seconds are multiplied by `controlScale`. A root that would be shorter than 0.05 s is not applied, but it still counts (an enemy hit nonstop stays fatigued). A root that takes effect counts too.
- **The 2 s root immunity goes:** remove `ROOT_IMMUNE_SEC` and `rootImmuneLeft` (`src/core/root.ts`, `src/entities/Enemy.ts`, and the `enemies.root` invariant in `src/systems/EnemySystem.ts`, which then checks `rootLeft` and the two control fields are finite and in range). `applyRoot` and `tickRoot` stay for the root's own timer.
- **The enemy's tick** calls `tickControl(this, dt)` next to `tickRoot`, and `spawn()` resets both control fields to 0 (pooled enemies).
- **Unchanged:**
  - enemies with `ignoresControl` (the Ward) ignore both, as now;
  - card lines and numbers;
  - slows, burns and marks are not control here and are untouched.
- **Comments:** update the one in `src/core/root.ts` that describes the old immunity to describe the shared fatigue in one line. Leave `src/content/augments/anchor.ts` alone: another task is changing it at the same time.

## Acceptance criteria
- [ ] Unit tests for `src/core/control.ts`: the strength halves with each push or root inside the window (1, 0.5, 0.25), and after 1.5 s without any it is back to 1.
- [ ] A test that two pushes of 1 cell in a row queue 1.5 cells, not 2; and that roots on an enemy hit nonstop (one per 0.2 s) stop it for far less than half the time over 10 s.
- [ ] A lone Push tower's pulse (every 1.8 s or slower) and a lone Anchor tower's pulse (every 2.6 s or slower) still push and root at full strength each time against a single enemy.
- [ ] `ROOT_IMMUNE_SEC` and `rootImmuneLeft` no longer exist; `npm run check` and the smoke test pass.

## Design (architect, desktop)

### Files
- create `src/core/control.ts` — the shared fatigue rule (pure, no Phaser): `CONTROL_WINDOW_SEC`, `ControlState`, `controlScale`, `noteControl`, `tickControl`
- create `tests/core/control.test.ts` — unit tests for the fatigue rule
- edit `src/core/root.ts` — remove `ROOT_IMMUNE_SEC` and `rootImmuneLeft`; `RootState` keeps only `rootLeft`; `tickRoot` just counts the root down; header comment now points at core/control.ts
- edit `src/entities/Enemy.ts` — add `controlCount`/`controlQuietSec` fields (+reset in `spawn()`), call `tickControl` next to `tickRoot`, and scale/count in `root()` and `pushBack()`
- edit `src/systems/EnemySystem.ts` — swap the `ROOT_IMMUNE_SEC` import for `CONTROL_WINDOW_SEC`; rewrite the `brokenRoot()` check
- edit `tests/core/anchor.test.ts` — it imports `ROOT_IMMUNE_SEC` and uses `rootImmuneLeft`, so the old "the root never holds for good" block must be rewritten (its numbers move to control.test.ts)

### Interfaces
```ts
// src/core/control.ts
export const CONTROL_WINDOW_SEC = 1.5;
export interface ControlState { controlCount: number; controlQuietSec: number; }
export function controlScale(s: ControlState): number;   // 0.5 ** s.controlCount
export function noteControl(s: ControlState): void;      // controlCount += 1; controlQuietSec = 0
export function tickControl(s: ControlState, dt: number): void;
// tickControl body: if (s.controlCount <= 0) return; s.controlQuietSec += dt;
//   if (s.controlQuietSec >= CONTROL_WINDOW_SEC) { s.controlCount = 0; s.controlQuietSec = 0; }
// src/core/root.ts: RootState becomes { rootLeft: number }; applyRoot checks only
//   (sec <= 0 || s.rootLeft > 0); tickRoot: if (s.rootLeft > 0) { s.rootLeft -= dt; if (s.rootLeft <= 0) s.rootLeft = 0; }
```

### Steps
1. Create `src/core/control.ts` with exactly the code above.
2. Rewrite `src/core/root.ts`: delete `ROOT_IMMUNE_SEC` and `rootImmuneLeft`; new header comment: `/** The root's own timer. Repeated pushes and roots grow weaker instead (core/control.ts): nothing holds an enemy in place. */`; `applyRoot` and `tickRoot` as in Interfaces.
3. Edit `src/entities/Enemy.ts`:
   - import: add `import { controlScale, noteControl, tickControl } from '../core/control';` (the `core/root` import stays).
   - replace the `rootImmuneLeft` field with: `controlCount = 0;` (doc: pushes and roots taken in the current streak, halved each) and `controlQuietSec = 0;` (doc: seconds since the last one; at `CONTROL_WINDOW_SEC` the streak recovers).
   - in `spawn()`: replace `this.rootImmuneLeft = 0;` with `this.controlCount = 0; this.controlQuietSec = 0;`.
   - in the tick, right after `tickRoot(this, dt);` (line 149) add `tickControl(this, dt);`.
   - `root(sec)` becomes: `if (this.def.ignoresControl || this.rootLeft > 0) return;` then `const s = sec * controlScale(this); if (s < 0.05) { noteControl(this); return; } if (applyRoot(this, s)) noteControl(this);` (a root while rooted does nothing and does not count; a sub-0.05 s root is skipped but still counts).
   - `pushBack(units)` becomes: same guard, then `this.pushLeft += units * controlScale(this); noteControl(this);`.
4. Edit `src/systems/EnemySystem.ts`: change `import { ROOT_IMMUNE_SEC } from '../core/root';` to `import { CONTROL_WINDOW_SEC } from '../core/control';`; rewrite `brokenRoot()` to flag an active enemy where `rootLeft`, `controlCount` or `controlQuietSec` is non-finite, `rootLeft` outside [0,10], `controlCount` outside [0,64], or `controlQuietSec` outside [0,CONTROL_WINDOW_SEC]; message: `` `${bad.def.id} rooted for ${bad.rootLeft}s, control ${bad.controlCount} in ${bad.controlQuietSec.toFixed(2)}s` ``.
5. Edit `tests/core/anchor.test.ts`: drop `ROOT_IMMUNE_SEC` from the `core/root` import; replace the `fresh()` state with `{ rootLeft: 0 }` and the immunity test with: a root holds for its time, is never refreshed while it holds, and once it wears off `applyRoot(s, 0.5)` succeeds again immediately (fatigue is no longer in core/root.ts). Delete the `rootedTime` helper and its three tests — their numbers move to the new test file.
6. Create `tests/core/control.test.ts` (vitest, `describe`/`it`/`expect`, like `tests/core/anchor.test.ts`): `const fresh = (): ControlState => ({ controlCount: 0, controlQuietSec: 0 });`
   - scale is 1, then 0.5 and 0.25 after two `noteControl`; after `tickControl(s, 1.49)` still 0.25, after `tickControl(s, 0.02)` back to 1.
   - two pushes of 1 cell in a row queue 1.5, not 2: `let pushLeft = 0; const push = (u: number) => { pushLeft += u * controlScale(s); noteControl(s); }; push(1); push(1);` → `toBeCloseTo(1.5)`.
   - nonstop roots: a loop over 10 s (dt 1/60, a 0.5 s root attempt every 0.2 s; skip + do not count when `rootLeft > 0`, skip but count when scaled < 0.05, else `rootLeft = scaled; noteControl(s)`; tick both timers) ends with total rooted time `toBeLessThan(1)`.
   - a lone pulse at 1.8 s and at 2.6 s cadence: over 20 s, `controlScale(s)` is `toBe(1)` before every `noteControl`.

### Pitfalls
- Pooled enemies: the two new fields must be reset in `spawn()`, or a recycled enemy comes up fatigued.
- Do NOT count a root attempt on an already-rooted enemy, and do NOT reset `controlQuietSec` for it — the streak survives the root and recovers.
- The sub-0.05 s root is skipped but still calls `noteControl`, or a nonstop-hit enemy never stays fatigued.
- Do not touch `src/content/augments/anchor.ts` or its numbers (T0300 edits them at the same time); its docstring mentioning the old immunity stays.
- Slow/burn/mark untouched — only `root()` and `pushBack()` gain the scale; `ignoresControl` (the Ward) still bails before counting.
- Lint: `src/core/control.ts` must not import Phaser; keep `tickControl` dt-based, never assume 60 fps.

### Tests
- `tests/core/control.test.ts` as specified in step 6 (halving within the window, recovery at exactly 1.5 s, the 1.5-cell push queue, the nonstop-root cap, and full-strength lone Push 1.8 s / Anchor 2.6 s pulses).
- `tests/core/anchor.test.ts` updated as in step 5 so `npm run check` typechecks.
