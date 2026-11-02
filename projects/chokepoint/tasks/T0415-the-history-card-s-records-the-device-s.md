---
id: T0415
title: "The history card's records: the device's best marks, at the card's foot"
size: M
priority: 2
status: todo
depends_on: [T0410]
attempts: 0
created: 2026-11-02T09:13:56Z
epic: E18
---

## Goal
The history card says the best the device has ever done, not only the last twelve runs: a muted records line at the card's foot — best combo, longest clean streak, most clean waves in one run — so the card is the whole climb's record, one tap away.

## Details
- **The records.** The profile (the card's own store, T0410's files) keeps three all-time records: best combo (the longest kill-combo chain of any run), longest clean streak (the most clean waves in a row in one run), and most clean waves in one run. Each recorded run updates each record to the max of the stored value and that run's ledger's own value. The ledger already carries two of the three (the best combo, the clean count); the longest streak is one new field: the max over the run of the ledger's existing streak counter.
- **The line.** The history card gains one muted line at its foot, under the twelve run lines, in the card's own muted style: `records · combo ×N · streak N · clean N` — N each record, "×" only on the combo. Plain muted text, no star, no count-up: the card's run lines are quiet and the records line is quieter still.
- **Empty profiles.** The line is hidden until at least one record is above 0 — an old save without the fields loads them as 0 and shows the card exactly as T0410 left it.
- **It fits.** One line in the muted 12–13 px style; with three-digit numbers in all three marks it fits the card at 412x915 and 1280x720, the card growing the one line the way the twelve run lines fit.
- The claim card's per-run "Best combo ×N" line and the profile card's lines are untouched — the records line is the only place the all-time marks live.

## Acceptance criteria
- [ ] After two runs where the second has a bigger combo, a shorter streak and more clean waves, the line shows the second run's combo, the first run's streak, and the second run's clean count — each the all-time max, not the last run's values.
- [ ] A fresh profile (no records) shows the history card exactly as before this task, and an old save without the records field loads with all three at 0 and no line.
- [ ] The line fits its card at 412x915 and 1280x720 with 99 in all three marks.
- [ ] No other screen shows an all-time combo, streak or clean count before this task (the claim's combo line stays per-run).

## Design (architect, cachyos-x8664)

### Files
All edits, no new files:
- `src/core/run.ts` — add the `bestStreak` ledger field and track it in `clearWave()`.
- `src/core/profile.ts` — add the three all-time record fields to `Profile`, the two optional run fields to `RunResult`, fold them in `recordRun()`, load them in `loadProfile()` (normal return + the catch fallback).
- `src/scenes/GameOverScene.ts` — pass the run's `bestCombo` / `bestStreak` into the `recordRun` call (the one real fold site).
- `src/scenes/HistoryScene.ts` — show the muted records line at the card's foot, growing the card by one line when any record is above 0.
- `tests/core/profile.test.ts`, `tests/core/run.test.ts` — see Tests.

### Interfaces
- `Profile` gains three all-time numbers, each defaulting to 0 until a run sets one: `bestCombo`, `bestStreak`, `mostClean` (all-time most clean waves in one run).
- `RunResult` gains two optional candidates (optional, like `mul`/`reached`, so existing call sites don't break): `bestCombo?: number`, `bestStreak?: number`. `result.clean` (already required) feeds `mostClean`.
- `RunState` gains `bestStreak = 0`; it is the max over the run of the existing `cleanStreak` counter and is not persisted in `SavedRun` (resets to 0 on resume, exactly like `bestCombo` and `cleanStreak` — so do not touch `src/core/saveRun.ts` or `src/systems/RunSave.ts`).
- `recordRun(store, result)` folds each record to `Math.max(old, candidate)`: `bestCombo` from `result.bestCombo ?? 0`, `bestStreak` from `result.bestStreak ?? 0`, `mostClean` from `result.clean`. `loadProfile` returns the three fields, defaulting to 0 for missing/broken (`Number(x) || 0`, the existing pattern).
- HistoryScene reads `p.bestCombo` / `p.bestStreak` / `p.mostClean`; the line renders only when at least one is `> 0`.

### Steps
1. `src/core/run.ts` — add `bestStreak = 0;` right after `cleanStreak = 0;` (line ~52). In `clearWave()`, immediately after `this.cleanStreak += 1;` (line ~166), add `if (this.cleanStreak > this.bestStreak) this.bestStreak = this.cleanStreak;`.
2. `src/core/profile.ts` —
   - `Profile` interface: add `bestCombo: number`, `bestStreak: number`, `mostClean: number` after `ironBestWave` (line ~21).
   - `RunResult` interface: add `bestCombo?: number`, `bestStreak?: number` (optional).
   - `recordRun()` return object: after `ironBestWave` add `bestCombo: Math.max(old.bestCombo, result.bestCombo ?? 0), bestStreak: Math.max(old.bestStreak, result.bestStreak ?? 0), mostClean: Math.max(old.mostClean, result.clean),`.
   - `loadProfile()` normal return: after `ironBestWave` add `bestCombo: Number(parsed.bestCombo) || 0, bestStreak: Number(parsed.bestStreak) || 0, mostClean: Number(parsed.mostClean) || 0,`. Add the same three `: 0` fields to the catch-block return (line ~127).
3. `src/scenes/GameOverScene.ts` — in the `recordRun(window.localStorage, { ... })` call (line ~28-30), after `clean: run.cleanWaves,` add `bestCombo: run.bestCombo,` and `bestStreak: run.bestStreak,`.
4. `src/scenes/HistoryScene.ts` — in `create()`: after `const rows = p.recent;` (line ~43) add `const hasRecords = p.bestCombo > 0 || p.bestStreak > 0 || p.mostClean > 0;` and `const recStyle = textStyle(12, PALETTE.faint);`. Change `const panelH = TOP + GAP_TL + rows.length * LINE_H + BOTTOM;` (line ~45) to add `+ (hasRecords ? LINE_H : 0)` before `+ BOTTOM`. After the for-loop (line ~66, before `this.box =`), add `if (hasRecords) parts.push(this.add.text(-W / 2 + PAD, y, `records · combo ×${p.bestCombo} · streak ${p.bestStreak} · clean ${p.mostClean}`, recStyle));`.
5. `tests/core/profile.test.ts` — add `bestCombo: 0, bestStreak: 0, mostClean: <v>` to each full-profile `toEqual` (see Tests for the exact `<v>` per line); add the two new tests.
6. `tests/core/run.test.ts` — add the `bestStreak` test (see Tests).

### Pitfalls
- The records line is the only place the all-time marks live: leave the claim card's per-run "Best combo ×N" and `RewardsScene`/`SummaryScene`'s per-run `run.bestCombo` untouched.
- Old saves load the three fields as 0 and show the card exactly as T0410 left it (no line) — `Number(x) || 0` is the guard (missing/broken → 0). Do not add negative guards: match the existing `bestWave` pattern.
- Do not persist `bestStreak` in `SavedRun`: it resets to 0 on resume just like `bestCombo`/`cleanStreak`. `mostClean` is safe because `cleanWaves` is already persisted in the save.
- The card only grows when `hasRecords`; with zero rows and no records the card is the title alone, exactly as before. The records line is one more `LINE_H` slot (a 13th line) with the same `BOTTOM` gap, so it fits at 412x915 and 1280x720 with 99 in all three marks (panelH maxes at 360 < both viewports' short edge).
- The separator is ` · ` (space, U+00B7, space) and `×` (U+00D7) appears only before the combo value; `×` must not appear before `streak` or `clean`.

### Tests
`tests/core/profile.test.ts`:
- Update the full-profile `toEqual` expectations so the object carries the three new fields (these are the only full-profile assertions; the rest check sub-fields and don't change): line 105 `empty` → all three `0`; line 110 inline → all three `0`; line 120 `first.profile` → `mostClean: 2` (clean 2), `bestCombo`/`bestStreak` `0`; line 124 `second.profile` → `mostClean: 2` (max 2,1), `bestCombo`/`bestStreak` `0`; line 132 `result.profile` → all three `0`; line 139 `short.profile` → `mostClean: 2`, `bestCombo`/`bestStreak` `0`.
- New test (the acceptance scenario — second run bigger combo, shorter streak, more clean): `recordRun(store, { waves: 5, stopped: 0, clean: 2, seed: 1, bgen: 2, bestCombo: 4, bestStreak: 3 })` then `recordRun(store, { waves: 6, stopped: 0, clean: 5, seed: 2, bgen: 2, bestCombo: 6, bestStreak: 2 })`; assert `bestCombo` `6`, `bestStreak` `3`, `mostClean` `5` (each the all-time max, not the last run's values).
- New test: a saved profile `JSON.stringify({ bestCombo: 5, bestStreak: 2, mostClean: 9 })` loads as `{ bestCombo: 5, bestStreak: 2, mostClean: 9 }`; `JSON.stringify({ bestCombo: 'x', mostClean: 'y' })` and `JSON.stringify({ bestWave: 4 })` both load as all three `0` (use `expect.objectContaining` on the `loadProfile` result).
`tests/core/run.test.ts`:
- New test "remembers the run's longest clean streak": build a run, three `startWave(); clearWave();` → `expect(run.bestStreak).toBe(3)`; then `startWave(); leak(1); clearWave(); startWave(); clearWave();` → `expect(run.bestStreak).toBe(3)` (the leak resets `cleanStreak`, the later two-wave streak does not move the max). Model it on the existing "a leak resets the clean streak at once" test (line ~176).
