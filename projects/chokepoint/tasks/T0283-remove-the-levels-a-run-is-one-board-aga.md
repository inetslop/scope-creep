---
id: T0283
title: "Remove the levels: a run is one board again"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T10:50:50Z
claimed_at: 2026-10-30T11:14:58Z
designer: desktop
---

## Goal
The level rule (T0260) and its wave-card line (T0262) aren't fun: the board re-growing empty every 10 waves throws away the build the player spent the run on. Remove both, and go back to a run being one board that lasts until the player loses. This is urgent: clean it out before more work builds on it.

## Details
- **Revert T0260's level rule** (commit `9604bff`):
  - `src/core/level.ts` and `tests/core/level.test.ts`;
  - the level-clear flow in `RunFlow`, `GameScene`, `Board`, `Building` and `TowerSystem` (no re-grow, no tower wipe);
  - `src/ui/hud/LevelClearBanner.ts`;
  - the per-level road length multiplier in `core/map.ts`;
  - the level handling in `ExitWarning`, `HudScene` and `debug/runChecks.ts`.

  Use `git show 9604bff` as the map, but revert by hand: later commits have touched some of these files.
- **No wave-30 win:** a run is endless again and ends only when the lives run out, as before T0260.
  - The game-over card loses "Made it" and the "level N · wave W" line, and shows the final wave as it did before.
  - The wave-30 boss (T0266, the Orb) and the wave-10 and wave-20 bosses (E5) stay. They're wave rules, not level rules.
- **Revert T0262's line** (commit `32508a0`): the wave card's muted "level N · w/10" line goes. The "held · N" chip stays where it was.
- **Saves:** `saveRun`/`RunSave` stop writing the level. A save written while levels existed must still load: ignore its level field and resume on the current board as a normal run. Keep a test for that.
- **Keep what wasn't about levels:** the choke guarantee (T0217) and its test `tests/core/chokeGuarantee.test.ts` stay if they pass without the level code. Adapt them rather than deleting them.
- **Other references:**
  - The waves reference (T0264) mentions the level rule; remove any level wording there.
  - `grep -rni "level" src tests` afterwards. Only unrelated uses should remain, such as the menu demo's "at your level" (T0049) and the chain level.

## Acceptance criteria
- [ ] A run stays on one board from wave 1 until it is lost, past wave 30, with no level-clear banner, no board re-grow and no tower wipe.
- [ ] The game-over card and wave card show no level text, and no "Made it" win exists.
- [ ] The bosses at waves 10, 20 and 30 still come.
- [ ] A run saved with a level field resumes as a normal run, covered by a unit test.
- [ ] `npm run check` passes. Desktop 1280x720 and mobile 412x915 smoke pass, including a run played past wave 10 on the same board.
