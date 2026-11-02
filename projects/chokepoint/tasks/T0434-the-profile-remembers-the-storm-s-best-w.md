---
id: T0434
title: "The profile remembers the storm's best wave"
size: S
priority: 2
status: todo
depends_on: [T0403]
attempts: 0
created: 2026-11-02T16:14:55Z
epic: E17
---

## Goal
The menu's profile card says how far a storm has carried the player, in the Iron line's own language — the third mode reads on the card that already reads the first two.

## Details
- The profile (src/core/profile.ts) stores the best wave reached in a Storm run, next to the Iron's own field (the T0249 pattern): updated only by a finished Storm run whose wave beats the stored value (the first such run sets it); normal and Iron runs and ghost replays never move it, and the saved best wave is untouched.
- The profile card shows a muted "Storm wave N" line under the "Iron wave N" line, N the stored storm best wave, wearing the muted star (the record star's muted copy, T0249's own star, the Iron line's own size and baseline). The line appears under exactly the visibility rule the Iron line wears, applied to Storm runs.
- The card grows one line; the menu's fit sum keeps every option on screen at 412x915 and 1280x720 (the T0222 rule) with all three lines — best, Iron, storm — shown at once.
- Nothing else changes: the claim card (T0403's "Storm" line), the pause's mode word (T0413) and the history (E18's storm rows, its own slice) keep their own reads — the profile line is the best wave reached in a storm, shown nowhere else on the menu (nothing shown twice).

## Acceptance criteria
- [ ] After a finished Storm run meeting the Iron line's own visibility rule, the profile card shows a muted "Storm wave N" line with the muted star under the Iron line; N is the best Storm wave.
- [ ] A later Storm run to a higher wave moves the line; a lower one leaves it; a normal or Iron run never moves it.
- [ ] With no qualifying Storm run, the card is byte-identical to today.
- [ ] The menu column still fits at 412x915 and 1280x720 with the best, Iron and storm lines all shown.

## Design (architect, yoga)

### Files
- edit `src/core/profile.ts` - add `stormBestWave: number` to `Profile`; add `mode?: 'storm'` to `RunResult`; set `stormBestWave` in `recordRun`; load it in `loadProfile` (both the main return and the catch fallback).
- edit `src/scenes/menu/ProfileCard.ts` - add a muted "Storm wave N" line under the Iron line, with the muted star; grow the card height by the new line.
- edit `src/scenes/GameOverScene.ts` - pass `mode: run.mode === 'storm' ? 'storm' : undefined` to `recordRun`.
- edit `tests/core/profile.test.ts` - add `stormBestWave: 0` to the profile shapes in the existing tests; add a test for the storm record.

### Interfaces
```ts
// Add to RunResult (src/core/profile.ts), after `held?: number;`:
/** This run's mode when it is a Storm run; undefined for normal and Iron runs. */
mode?: 'storm';

// Add to Profile (src/core/profile.ts), after `ironBestWave`:
/** The best wave reached in a Storm run; 0 until a Storm run sets one. */
stormBestWave: number;
```

### Steps
1. `profile.ts` → `Profile`: add `stormBestWave: number;` after `ironBestWave`, with the doc comment.
2. `profile.ts` → `RunResult`: add `mode?: 'storm';` after `held?: number;`, with the doc comment.
3. `profile.ts` → `recordRun`: add `stormBestWave: result.mode === 'storm' ? Math.max(old.stormBestWave, result.waves) : old.stormBestWave,` after the `ironBestWave` line, with the comment `// Only a finished Storm run moves the storm record.`.
4. `profile.ts` → `loadProfile` main return: add `stormBestWave: Number(parsed.stormBestWave) || 0,` after the `ironBestWave` line.
5. `profile.ts` → `loadProfile` catch fallback: add `stormBestWave: 0` after `ironBestWave: 0`.
6. `GameOverScene.ts`: add `mode: run.mode === 'storm' ? 'storm' : undefined` to the `recordRun` call.
7. `ProfileCard.ts`: after the Iron line setup, add:
   `const storm = profile.stormBestWave >= 1 ? scene.add.text(0, 0, `Storm wave ${profile.stormBestWave}`, textStyle(17, PALETTE.muted)).setOrigin(0.5) : null;`
   `const stormStar = storm ? artScale(scene.add.image(0, 0, STAR_MUTED_TEXTURE)) : null;`
   `if (storm && stormStar) stormStar.setX(storm.width / 2 + 13);`
   `const hStorm = storm ? storm.height : 0;`
8. `ProfileCard.ts`: change `gaps` to `2 + (iron ? 1 : 0) + (storm ? 1 : 0)`; change `height` to `PAD * 2 + h1 + h2 + hIron + hStorm + h3 + gaps * LINE_GAP`.
9. `ProfileCard.ts`: in the placement, after the Iron block, add `if (storm && stormStar) { const cs = put(hStorm); storm.setY(cs); stormStar.setY(cs + 1); }`.
10. `ProfileCard.ts`: in `kids`, after the Iron push, add `if (storm && stormStar) kids.push(storm, stormStar);`.
11. `tests/core/profile.test.ts`: add `stormBestWave: 0,` after each `ironBestWave: 0` in the profile shapes (lines 105, 110, 120, 124, 132, 139).
12. `tests/core/profile.test.ts`: add a new test:
   `it('stores the best wave reached in a Storm run, next to the Iron', () => {`
   `const store = memory();`
   `expect(recordRun(store, { waves: 12, stopped: 0, clean: 0, seed: 301, bgen: 2, mode: 'storm' }).profile.stormBestWave).toBe(12);`
   `expect(recordRun(store, { waves: 15, stopped: 0, clean: 0, seed: 302, bgen: 2, mode: 'storm' }).profile.stormBestWave).toBe(15);`
   `expect(recordRun(store, { waves: 8, stopped: 0, clean: 0, seed: 303, bgen: 2, mode: 'storm' }).profile.stormBestWave).toBe(15);`
   `expect(recordRun(store, { waves: 20, stopped: 0, clean: 0, seed: 304, bgen: 2 }).profile.stormBestWave).toBe(15);`
   `expect(recordRun(store, { waves: 22, stopped: 0, clean: 0, seed: 305, bgen: 2, mul: 2 }).profile.stormBestWave).toBe(15);`
   `});`

### Pitfalls
- The `mode` field must be `?: 'storm'` (optional). Normal and Iron runs pass `mode: undefined`; the storm check is `result.mode === 'storm'`.
- `stormBestWave` must be loaded in BOTH the main return and the catch fallback of `loadProfile`; forgetting the fallback is a type error.
- The card's height grows by exactly one line (`hStorm + LINE_GAP`); the menu's fit sum uses `card.height * cardScale`, so it is automatic. Never place the new line at a hand-picked y offset — let `put` handle it.
- The `kids` order matters for depth: the storm line goes after the Iron line and before the runs line.

### Tests
- Update the existing profile-shape tests to include `stormBestWave: 0` (the `toEqual` checks are exact).
- Add the new test above: a Storm run sets the record; a higher Storm run moves it; a lower one leaves it; a normal or Iron run never moves it.
