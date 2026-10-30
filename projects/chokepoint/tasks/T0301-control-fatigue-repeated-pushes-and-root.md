---
id: T0301
title: "Control fatigue: repeated pushes and roots on one enemy grow weaker"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T19:32:38Z
claimed_at: 2026-10-30T19:46:00Z
designer: desktop
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
