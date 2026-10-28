---
id: T0078
title: "The ghost run: replay the board of your best run"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T22:13:10Z
claimed_at: 2026-10-28T23:27:49Z
epic: E1
---

## Goal
The profile remembers one more thing — the exact board your best wave was fought on — and the menu offers a run on that same board, so "one more run" has a target: beat your own record on the board you beat it on.

## Details
- The profile stores the seed of the run that currently holds the best wave (a new field; saved the moment a finished run sets a new best wave; absent for a player with no finished run). The seed → board mapping is already deterministic (T0056's board code is a pure function of it, unit-tested for shape, determinism and distinctness).
- The menu gains a "Ghost · Wave N" button (N = the saved best wave) below Play — the Resume button's shape, place and white card (T0042) — with one muted line under the button: "the board of your best run". The button and the line appear only when the profile has a saved seed; with none, the menu is exactly today's.
- Pressing it starts a completely new run on the board grown from the saved seed — the same road, rocks and build cells as the best run's board — with fresh towers, full lives and the normal starting gold, and a normal first draft (the Common-Bolt floor, T0048). It is a normal run in every other way: it earns coins, it lands in the last-four runs (T0018), and a wave reached on it sets the best wave as usual.
- A ghost run replays the best board, so it never changes the saved seed: the seed stays the current best run's until an ordinary run on a new board sets a new best wave, which then stores its own seed.
- The menu demo (T0049) is untouched: it keeps its fresh seed.

## Acceptance criteria
- [ ] After a run that sets a new best wave, the menu shows "Ghost · Wave N" (N the new best) with "the board of your best run" under it; a player with no finished run sees exactly today's menu.
- [ ] Pressing Ghost starts a new run — empty towers, full lives and starting gold, a normal first draft — whose board is identical to the best run's board (same road, rocks and build cells).
- [ ] A ghost run earns coins, appears in the menu's last-four runs, and a wave reached on it updates the best wave like any run.
- [ ] A ghost run that sets a new best wave keeps the saved seed (the same board); only a run on a new board stores a new seed, and the button then points to it.
- [ ] The saved seed survives a page reload: the Ghost button is still offered at the same wave, and starting a normal run afterwards behaves exactly as it does today.

## Design (architect, desktop)

### Files
- edit `src/core/profile.ts` — add `Profile.bestSeed`, add `seed` to `RunResult`, parse/validate in `loadProfile`, store rule in `recordRun`
- edit `src/scenes/GameOverScene.ts` — pass `seed: run.seed` into `recordRun` (one line)
- edit `src/scenes/GameScene.ts` — pop a `ghostSeed` registry value and use it for the run seed (two lines)
- edit `src/scenes/MenuScene.ts` — "Ghost · Wave N" button + muted caption below Play, fade-in and layout
- edit `src/debug/runChecks.ts` — one `ghost.taken` invariant line next to `resume.taken`
- edit `tests/core/profile.test.ts` — add `seed` to every `recordRun` call, `bestSeed` to full-profile `toEqual`s, new tests

### Interfaces
```ts
// src/core/profile.ts — the only shape changes
export interface Profile {
  bestWave: number;
  /** Seed of the board the best wave was fought on; null until a finished run sets one. */
  bestSeed: number | null;
  // runsPlayed, coins, lastRun, recent, sound: unchanged
}
export interface RunResult {
  waves: number;
  stopped: number;
  clean: number;
  /** This run's seed. */
  seed: number;
}
```

### Steps
1. `src/core/profile.ts`: in `loadProfile`, compute `const bestSeed = typeof parsed.bestSeed === 'number' && Number.isInteger(parsed.bestSeed) && parsed.bestSeed >= 0 && parsed.bestSeed <= 2 ** 31 ? parsed.bestSeed : null;` and add `bestSeed` to both returned objects (the `catch` fallback gets `bestSeed: null`). In `recordRun`, hoist `const newBest = result.waves > old.bestWave;` above the profile object, add field `bestSeed: newBest && result.seed !== old.bestSeed ? result.seed : old.bestSeed,` (with comment: a ghost run replays the best board, so it never moves the button), and return `{ profile, coins, newBest }` as today.
2. `src/scenes/GameOverScene.ts` line 25: `recordRun(window.localStorage, { waves: run.wavesCleared, stopped: run.kills, clean: run.cleanWaves, seed: run.seed })`.
3. `src/scenes/GameScene.ts` after line 64 add `const ghostSeed = this.registry.pop('ghostSeed') as number | undefined;` and change line 65 to `this.run = new RunState(saved ? saved.seed : (flags.seed ?? ghostSeed ?? Math.floor(Math.random() * 2 ** 31)));`. Nothing else changes: with `saved` undefined the draft opens, lives/gold start fresh, the saver is untouched.
4. `src/scenes/MenuScene.ts`, after the `resume` block (before the `hint` line):
```ts
let ghost: Button | undefined;
let ghostLine: Phaser.GameObjects.Text | undefined;
if (p.bestSeed !== null) {
  const seed = p.bestSeed;
  ghost = makeButton(this, 0, 0, `Ghost · Wave ${p.bestWave}`, () => {
    clearSavedRun(window.localStorage); // a new run abandons a saved one for nothing
    this.registry.set('ghostSeed', seed);
    this.scene.start(SCENES.game);
  }, { width: 220, height: 60, fontSize: 24, radius: 30 }); // Resume's shape, white card: no fill
  ghostLine = this.add.text(0, 0, 'the board of your best run', textStyle(14, PALETTE.muted)).setOrigin(0.5);
}
```
Replace the fade loop array with:
```ts
const fadeIn: (Phaser.GameObjects.Container | Phaser.GameObjects.Text)[] = [profileCard, how];
if (resume) fadeIn.push(resume.container);
fadeIn.push(button.container);
if (ghost && ghostLine) { fadeIn.push(ghost.container); fadeIn.push(ghostLine); }
fadeIn.push(hint);
for (const [i, obj] of fadeIn.entries()) { ...same body... }
```
In `layout()`, after `button.container.setPosition(cx, y + 290 + extra);` add `if (ghost && ghostLine) { ghost.container.setPosition(cx, y + 366 + extra); ghostLine.setPosition(cx, y + 410 + extra); }` and change the hint line to `hint.setPosition(cx, y + (ghost ? 434 : 343) + extra);`. Do not touch `extra`, the `block`/`k` math, the demo, `onKey`, or the smoke `play()` call.
5. `src/debug/runChecks.ts`: one line after `resume.taken`: `['ghost.taken', (g) => (g.registry.get('ghostSeed') ? 'a ghost seed is waiting for the game that never took it' : null)],`
6. `tests/core/profile.test.ts`: add `seed: <int>` to every `recordRun` call (distinct per run, e.g. 101, 102, …); add `bestSeed: null` to the `empty` object and to the line-23 `toEqual`; in "records the first run…" use seeds 101/102 and expect `bestSeed: 101` in both `toEqual`s; in the zero-wave test expect `bestSeed: null`. Add two tests: (a) new best stores `result.seed`; a second run with the *same* seed that sets a higher best keeps that seed (ghost replay); a run with a *new* seed that sets a higher best stores the new seed; a run below best leaves it alone; (b) a hand-written legacy profile `{ bestWave: 6, runsPlayed: 3, coins: 20 }` loads with `bestSeed: null` and a run of `waves: 7, seed: 404` stores 404. Also assert `loadProfile` rejects `bestSeed: 'x'` (→ null).

### Pitfalls
- Do not touch `src/core/bestScore.ts` (legacy, unused by scenes) or `MenuDemo` (keeps its own fresh-seed planning).
- TS narrowing: `ghost` and `ghostLine` are separate `let`s — always guard pairs as `if (ghost && ghostLine)`; never destructure.
- When `p.bestSeed` is null the menu must be byte-identical to today: no objects created, hint stays at `y + 343 + extra`, fade order unchanged.
- Seed precedence is `saved resume` > `flags.seed` > ghost > random; the `?seed=` debug flag must still win so smoke determinism is unaffected.
- `bestSeed` validation must be an integer in 0…2**31 (seeds come from `Math.floor(Math.random() * 2**31)` / `SavedRun.seed`); a corrupted profile must load with `bestSeed: null`, never throw.
- The ghost click must `clearSavedRun` like Play, or a half-finished normal run would stay "resumable" forever.
- Board identity holds for the same screen orientation (the grid dims come from the view, as for every new run); a ghost run is a normal run otherwise, so `RunSave`, coins, `recent` and best-wave all work with no extra code.

### Tests
- `tests/core/profile.test.ts` as in step 6: bestSeed stored on new best, kept on same-seed (ghost) new best, replaced by a new-seed new best, untouched below best, legacy-profile healing, broken-value rejection.
