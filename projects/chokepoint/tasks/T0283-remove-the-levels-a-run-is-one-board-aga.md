---
id: T0283
title: "Remove the levels: a run is one board again"
size: M
priority: 1
assignee: tobias
status: in-progress
depends_on: []
attempts: 0
created: 2026-10-30T10:50:50Z
claimed_at: 2026-10-30T11:59:49Z
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

## Design (architect, desktop)

### Files
- delete `src/core/level.ts` — the whole level rule (T0260)
- delete `src/ui/hud/LevelClearBanner.ts` — the level-clear banner
- delete `tests/core/level.test.ts`
- edit `src/core/run.ts` — drop the `won` phase and the `level` field
- edit `src/core/saveRun.ts` — drop `level` from `SavedRun` and its validation
- edit `src/core/map.ts` — drop the level-3 (lengthMul ≥ 1.5) road branch
- edit `src/systems/RunFlow.ts` — drop the level-clear and wave-30-win branches
- edit `src/systems/RunSave.ts` — stop writing/reading `level`; clear on `over` only
- edit `src/systems/Board.ts` — drop `setMap()`; edit `src/systems/Building.ts` — drop `clearForNewBoard()`; edit `src/systems/TowerSystem.ts` — drop `clearTowers()`
- edit `src/scenes/GameScene.ts` — drop `regrowBoard()`, level seeding/multipliers and the never-read `mapLengthMul`
- edit `src/scenes/HudScene.ts` — drop the `LevelClearBanner` line (import line 9, parts line 51)
- edit `src/scenes/GameOverScene.ts` — drop the "Made it" win text
- edit `src/ui/hud/WaveCard.ts` — drop the "level N · w/10" line (T0262), keep the "held · N" chip
- edit `src/debug/runChecks.ts` — drop the `run.level` invariant (line 21) and its import (line 5)
- edit `tests/core/saveRun.test.ts`, `tests/systems/runFlow.test.ts`, `tests/core/chokeGuarantee.test.ts`, `tests/core/map.test.ts` — see Steps

### Interfaces
```ts
// core/run.ts
export type RunPhase = 'build' | 'wave' | 'draft' | 'over'; // was 'build' | 'wave' | 'draft' | 'over' | 'won'
// RunState: delete the `level = 1;` field; the `over` getter body becomes `return this.phase === 'over';`
// core/saveRun.ts — SavedRun: delete the `level: number;` field and its doc line; loadSavedRun: delete the
//   `if (p.level !== undefined && !inInt(p.level, 1, 3)) return undefined;` line AND the `level: ...` line in
//   the returned object. A stray `level` key in an old save's JSON must simply be ignored, not rejected.
```
No new files or functions. Everything below is deletion plus small comment fixes; update each doc comment that mentions levels ("re-grows", "level N") to the one-board wording.

### Steps
1. Delete the three files.
2. `src/core/run.ts`: doc line 11 (`won    wave 30 cleared...`), `RunPhase`, `level` field, `over` getter. `wavesCleared` stays as is.
3. `src/core/saveRun.ts` per Interfaces; fix the `lengthMul` doc (delete "; level N multiplies it by 1.25^(N-1)").
4. `src/core/map.ts` line 52: `const run = lengthMul > 1 ? rng.int(1, 2) : rng.int(2, 3);` and shorten the line-50-51 comment to "The long road (lengthMul > 1) takes runs of 1-2 cells, so it turns more often and is ~25% longer."
5. `src/systems/RunFlow.ts`: delete import line 5, the `pendingLevelClear` field, in `clearWave()` delete the `if (isRunWin(...))` block (lines 150-155) and the `if (isLevelClear(...))` block (156-163) so `popText` is followed directly by the existing `if (clean) {...} else { this.openDraft(); }`, and delete `winRun()`.
6. `src/systems/RunSave.ts`: line 27 `else if (phase === 'over') clearSavedRun(this.store);`; `persist`: delete `level: run.level,` and fix the `lengthMul` comment; `restore`: delete `run.level = saved.level;`.
7. `src/systems/Board.ts`: delete `setMap()` (lines 48-60), comment on `boardImage` becomes "The painted board (painted once per run)." `src/systems/Building.ts`: delete `clearForNewBoard()` (137-144). `src/systems/TowerSystem.ts`: delete `clearTowers()` (96-100).
8. `src/scenes/GameScene.ts`: delete the `core/level` import (line 4) and the `Rng` import (line 7, then unused), the `mapLengthMul` field and its two assignments; replace lines 107-120 with:
```ts
    // The board's tech nodes wind new runs' roads one turn further and lengthen them; a resumed
    // run keeps its saved board (its own bends and length), and a ghost run replays the best board
    // as generated (0 bends, length 1).
    this.baseLengthMul = saved ? saved.lengthMul : ghost === undefined ? boardLengthMul(loadProfile(window.localStorage).purchased) : 1;
    this.mapBends = saved ? saved.bends : ghost === undefined ? boardBends(loadProfile(window.localStorage).purchased) : 0;
    const view = viewSize(this);
    const portrait = saved ? saved.rows > saved.cols : view.height > view.width;
    // The board draws from the run's own rng (the draft offers continue its stream), so a resumed
    // run regenerates the exact same board.
    const map = generateMap(this.run.rng, portrait ? GRID.short : GRID.long, portrait ? GRID.long : GRID.short, ROCKS, this.mapBends, this.baseLengthMul, this.run.bgen);
```
   and delete `regrowBoard()` (196-210). `ExitWarning`/`LeakCost` imports stay (create/update still use them). **No change to `ExitWarning` itself** — T0260 only re-created it inside `regrowBoard`.
9. `src/scenes/HudScene.ts`: delete the two `LevelClearBanner` lines.
10. `src/scenes/GameOverScene.ts`: delete the `levelOfWave` import and `const won = ...`; title: `this.add.text(0, -178, 'Overrun', titleStyle(44, PALETTE.red)).setOrigin(0.5)`; waveText: `this.add.text(0, -130, `Held until wave ${run.wave}`, titleStyle(22)).setOrigin(0.5)`.
11. `src/ui/hud/WaveCard.ts`: delete the `line`/`shownLine` fields, the `lineWave`/`line` lines in `update()` (call `this.wear(lost, teach)` when `lost` or `teach` changes), and in `wear` set `this.h = H_NUM + (hasTag ? GAP + CHIP + (teach ? GAP + LINE * 2 : 0) : 0)`, chip y `-this.h / 2 + H_NUM + GAP + CHIP / 2`, teach y `-this.h / 2 + H_NUM + GAP + CHIP + GAP + LINE` (drop the `+ LINE` offsets the removed row had); drop `hasLine` and the `if (hasLine)` block. Keep the `LINE` const. Rewrite the class doc to describe only the wave number and the held chip.
12. `src/debug/runChecks.ts`: delete line 5 import and line 21.
13. `tests/core/saveRun.test.ts`: delete `level: 1,` from `sample()`; replace the two level tests (119-136) with one:
```ts
  it('a save written while levels existed still loads: the level field is ignored', () => {
    const store = memory();
    const withLevel = { ...sample({ wave: 14 }) } as Record<string, unknown>;
    withLevel.level = 2; // the field old saves wrote before the level rule was removed
    store.setItem(SAVED_RUN_KEY, JSON.stringify(withLevel));
    expect(loadSavedRun(store)).toEqual(sample({ wave: 14 }));
  });
```
14. `tests/systems/runFlow.test.ts`: delete `regrowBoard` from the fake scene, the `hook` import (only the win test used it), and the whole `describe('RunFlow.clearWave, the level clears and the win', ...)` block; replace it with two tests using `fakeClearFlow`: (a) wave 5 + `run.leak(1)` → `clearWave()` goes straight to draft (`calls` contains `launch:${SCENES.draft}`, no `cleanLines`); (b) clean wave 10 → phase `draft` immediately, `cleanLines` called, no launch yet, `fireBeat()` then `launch:${SCENES.draft}` — proving wave 10 is now an ordinary wave.
15. `tests/core/chokeGuarantee.test.ts`: loop `for (const mul of [1, 1.25])` and reword the header ("across the road-length targets the run uses: plain and the owned long road"); `tests/core/map.test.ts`: delete the `it('winds the longest road (1.5625, level 3)...')` test (231-247).
16. Verify: `npm run check`; `grep -rni "level" src tests` — only unrelated hits may remain (`module-level` in CLAUDE.md, `scene-level` in TechScene, `logLevel` in package.json, the muteJam comment). The waves reference (`src/core/waveTags.ts`, `src/scenes/WavesScene.ts`) has **no** level wording at design time — confirm with that grep, edit only if the grep finds some. Then `npm run smoke`.

### Pitfalls
- Old saves: removing the `p.level` check is what lets level-era saves load — do not replace it with a stricter check, and don't map `saved.level` anywhere.
- Removed methods (`setMap`, `clearTowers`, `clearForNewBoard`, `regrowBoard`, `winRun`, `pendingLevelClear`) have exactly one caller each (`regrowBoard` / `RunFlow.clearWave`); after the edits nothing may still import `core/level` — lint fails on the leftover imports (`Rng` in GameScene, `LEVELS`/`MAX_WAVE` in runChecks, `hook` in runFlow.test).
- Wave 30 still sends the Orb: `core/waves.ts`, the `enemies.orb` invariant and `WAVE_TAG_ROWS` are untouched — do not cap `run.wave` anywhere.
- WaveCard: recompute the chip/teach y from `H_NUM` (relative to the wave number), never a new hand-picked offset; the card shrinks, so `place()` is unchanged.
- Board resumes: a level-era save resumes on the board regenerated from the run seed; its towers are placed unconditionally exactly as before T0260 — do not add validation.

### Tests
- `tests/core/saveRun.test.ts`: the new "level field is ignored" round-trip (required by the task).
- `tests/systems/runFlow.test.ts`: the two replacement clearWave tests (wave 10 ordinary, clean-wave beat).
- `tests/core/chokeGuarantee.test.ts` and `tests/core/map.test.ts` adapted per Steps 15; `tests/core/level.test.ts` deleted.

## Claimed (by hand, 2026-10-30)

Taken out of the pool: Tobias is doing this by hand, since the file locks kept every machine off it. Do not claim it.
