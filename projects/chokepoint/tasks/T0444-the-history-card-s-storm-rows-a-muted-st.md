---
id: T0444
title: "The history card's storm rows: a muted storm mark"
size: M
priority: 2
status: todo
depends_on: [T0403]
attempts: 0
created: 2026-11-02T20:29:42Z
epic: E18
design_attempts: 1
---

## Goal
A storm run's row on the history card says so — a muted "storm" mark in the iron mark's own language — so the climb reads in its modes, not just its waves (E18's last slice).

## Details
- **What exists:** the history card (T0410) lists the last twelve runs, most recent first — each row the run's wave, its coins, a muted "iron" mark on Iron runs, and the small yellow star on the best-wave run. Storm (T0403) is the third mode: a storm run carries it for the whole run the same way it carries Iron, and the claim card already says "Storm" for it.
- **The change:** a storm run's row wears a muted "storm" mark in the iron mark's own language — the same muted style and the same place on the row the iron mark takes (the architect reads T0410's row layout). A row never wears both marks: the storm is its own mode and is not combined with Iron (T0403), so every run is exactly one of: no mark, "iron", or "storm".
- **The record:** the run record the profile stores already carries the mode for the iron mark; the storm's mode rides that same field (T0403's mode). If the record does not yet carry the mode for storm runs, this task adds it there — nothing else on the record changes.
- **Nothing else:** no new card, no new button, no new scene; the profile card, the claim card and the menu are untouched; the card's other rows (wave, coins, the best-wave star) are byte-identical.

## Acceptance criteria
- [ ] A storm run's row on the history card shows the muted "storm" mark in the iron mark's language; a normal run's row shows no mark; an Iron run's row still shows only the "iron" mark.
- [ ] No row ever shows both marks.
- [ ] The card's layout, its wave/coins rows, the best-wave star, the profile card and the claim card are byte-identical; the card fits at 412x915 and 1280x720.
- [ ] `npm run check` and the desktop + mobile smoke pass.

## Design (architect, cachyos-x8664)

### Files
- edit `src/core/profile.ts` — the run record's mode field gains the storm value and is written for storm runs
- edit `src/scenes/GameOverScene.ts` — the one-line `recordRun` call passes the run's mode
- edit `src/scenes/HistoryScene.ts` — the row's mark branch reads the mode and wears "Storm" for storm runs
- edit `tests/core/profile.test.ts` — recordRun/loader tests for the mode

### Interfaces
```ts
// src/core/profile.ts
export interface RecentRun { wave: number; coins: number; mode?: 'iron' | 'storm'; } // was `mode?: 'iron'`
export interface RunResult { /* ...unchanged... */ mode?: RunMode; } // add `import type { RunMode } from './run'` (after the `./levels` import; T0403 extends RunMode with 'storm')
```
No signature changes: `recordRun(store, result)` keeps its shape; `result.mode` is the new optional field.

### Steps
1. `src/core/profile.ts`:
   - `RecentRun.mode` → `mode?: 'iron' | 'storm'`; its comment line becomes `/** This run's mode; its row wears the muted mark, the iron mark's own language. */`.
   - `RunResult`: insert `/** The run's mode; the history row wears its mark. */` + `mode?: RunMode;` directly under the `mul` field (line ~49).
   - `loadProfile` recent map (line 90): `mode: r.mode === 'iron' ? ('iron' as const) : r.mode === 'storm' ? ('storm' as const) : undefined` (missing/broken still loads as none).
   - `recordRun` (line 159): `recent: [{ wave: result.waves, coins, mode: result.mode === 'iron' ? ('iron' as const) : result.mode === 'storm' ? ('storm' as const) : undefined }, ...old.recent].slice(0, RECENT_CAP),`
2. `src/scenes/GameOverScene.ts` line 35: add `mode: run.mode,` to the `recordRun(...)` argument object (next to `mul:`).
3. `src/scenes/HistoryScene.ts` lines 56-61: replace the `if (r.mode === 'iron')` block with
   ```ts
   if (r.mode) {
     const mark = this.add.text(x + 8, y, r.mode === 'storm' ? 'Storm' : 'Iron', textStyle(12, PALETTE.muted, { fontStyle: 'bold' })); // the claim card's mode tag
     parts.push(mark);
     x += mark.width;
   }
   ```
   and update line 22's doc line to name the storm mark; line 56's comment `// the mark slot, its own for the storm when it lands (T0403)` → `// the mark slot`.
4. `tests/core/profile.test.ts`: one `it` in the `profile` describe asserting recordRun stores `mode: 'iron'`/`'storm'`/none and `loadProfile` reloads a saved `mode: 'storm'` row.

### Pitfalls
- Use `import type` for RunMode (verbatim module syntax).
- Plain runs get `mode: undefined` in recent rows: existing exact `toEqual` profile tests still pass (vitest toEqual ignores undefined props).
- One field, one union: a row can never wear both marks; iron rows keep `mul: 2` and the ironBestWave line untouched.
- Star slot: a storm row that is also the best wave pushes the star right by "Storm"'s width + 8 px; worst row "Wave 999 · +9999 coins" + mark + star ≈ 210 px < 300 px inner width, card W/H constants unchanged, so 412x915 and 1280x720 fit as before.
- Profile card reads only wave/coins from recent (average), untouched.

### Tests
```ts
it('the history row wears the mode: iron the iron mark, storm the storm one, a plain run none', () => {
  expect(recordRun(memory(), { waves: 3, stopped: 0, clean: 0, seed: 101, bgen: 2, mul: 2, mode: 'iron' }).profile.recent[0].mode).toBe('iron');
  expect(recordRun(memory(), { waves: 4, stopped: 0, clean: 0, seed: 102, bgen: 2, mode: 'storm' }).profile.recent[0].mode).toBe('storm');
  expect(recordRun(memory(), { waves: 5, stopped: 0, clean: 0, seed: 103, bgen: 2 }).profile.recent[0].mode).toBeUndefined();
  const saved = memory();
  saved.setItem('chokepoint:profile', JSON.stringify({ recent: [{ wave: 7, coins: 2, mode: 'storm' }] }));
  expect(loadProfile(saved).recent).toEqual([{ wave: 7, coins: 2, mode: 'storm' }]);
});
```
