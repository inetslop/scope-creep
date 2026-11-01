---
id: T0325
title: Rewards from wave 10; Quit run pays out and ends it; Main menu keeps it
assignee: asus
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T23:37:22Z
claimed_at: 2026-11-01T04:58:18Z
epic: E9
---

## Goal
The owner's call: a run must reach **wave 10** to pay any rewards. Quitting a run is now a real end: you get the run's rewards (from wave 10) and the run is over, no resume. To step out without ending the run, the pause card gets a new **Main menu** button that keeps it for Resume.

## Details
- **The wave-10 rule:** a run that reached wave 10 (wave 10 started; a run dying during it counts, the same reading as the wave-30 unlock) pays its coins as today. A run that ends before that pays 0 coins, in every mode (normal, Iron, ghost, any level). One constant (e.g. `REWARD_WAVE = 10` next to `LEVEL_UNLOCK_WAVE`), applied in `recordRun` (`core/profile.ts`), with unit tests.
- **What still counts before wave 10:** everything that isn't a reward: runs played, the recent runs, the best wave and the ghost board, the leaderboard post.
- **The end card before wave 10** (`scenes/GameOverScene.ts`): the coins line reads "Rewards from wave 10" (muted) instead of "+N coins", and "Claim rewards" becomes "Menu" (it goes straight to the menu). From wave 10 on it is as today.
- **The pause card** (`scenes/PauseScene.ts`):
  - "worth +N coins" reads "rewards from wave 10" before wave 10.
  - **Quit run** ends the run: a first tap turns the button into "End the run?" (a second tap within 3 s confirms; it turns back after), because the run can't be resumed after it. Confirmed, the saved run is cleared and the run ends as if it were lost: the end card opens, titled "Run ended" (ink, not the red "Overrun"), with the same numbers, the claim (from wave 10) and the leaderboard post.
  - **Main menu** (new, under Resume): goes to the menu without ending the run, which is what Quit did before. The run stays saved, and the menu's Resume button continues it (from the last build or wave start, as today).
- One way to end a run on purpose, in one place (a `RunFlow` method next to `endRun`), so the wave-30 card (a later task) can call it too.

## Acceptance criteria
- [ ] Unit tests: a run that reached wave 9 records 0 coins; wave 10 records its coins as before; runs played, the best wave and the recent runs still update before wave 10.
- [ ] The end card before wave 10 shows "Rewards from wave 10" and a "Menu" button.
- [ ] Quit run needs a second tap; confirmed, it opens the end card titled "Run ended", and the menu then has no Resume.
- [ ] Main menu returns to the menu, and Resume there continues the run.
- [ ] Works with mouse, keys and touch at 1280×720 and 412×915.

## Design (architect, inet-racing)

### Files
- `src/core/levels.ts` — add `REWARD_WAVE` const next to `LEVEL_UNLOCK_WAVE` (line 4).
- `src/core/profile.ts` — import `REWARD_WAVE`; gate `coins` in `recordRun`.
- `src/systems/RunFlow.ts` — import `clearSavedRun`; new public `endRunIntentionally()` next to `endRun`.
- `src/scenes/PauseScene.ts` — import `REWARD_WAVE`; worth-line text; quit becomes two-tap confirm; new "Main menu" button (old quit's job).
- `src/scenes/GameOverScene.ts` — pop `runEnded` flag; "Run ended" title; "Rewards from wave 10" line; claim button → "Menu".
- `src/debug/runChecks.ts` — one invariant line next to `iron.taken` (line 27).
- `tests/core/profile.test.ts` — 4 fixed cases, 1 new case. `tests/core/levels.test.ts` — 1 import name, 1 assertion.

### Interfaces
```ts
// core/levels.ts, after line 4
/** The wave a run reaches to earn coins at all: the wave has started (a run dying during it counts), the same reading as the level unlock. */
export const REWARD_WAVE = 10;

// core/profile.ts, in recordRun, replacing line 125
const pays = (result.reached ?? result.waves) >= REWARD_WAVE;
const coins = pays ? coinsForRun(result, cleanWavePay(old.purchased), result.mul ?? 1, result.levelMul ?? 1) : 0;

// systems/RunFlow.ts, public, placed directly above the private endRun()
endRunIntentionally(): void {
  this.run.phase = 'over';
  clearSavedRun(window.localStorage);
  this.scene.registry.set('runEnded', true);
  this.endRun(); // the private one: towerKills flag, hud stop, GameOverScene start
}
```
`run.wave` (last wave started) is what `recordRun` reads as `reached`, so a quit during wave 10 pays and before it doesn't. `result.coins > 0` in GameOverScene is a safe paid/unpaid test: any paying run is ≥ 9 coins.

### Steps
1. **levels.ts**: add the const (exact text above).
2. **profile.ts**: extend line 4 to `import { REWARD_WAVE, levelSlotsAfter } from './levels';`; apply the two-line gate. Nothing else changes — runs played, best wave, recent, ghost seed, level slots all keep counting.
3. **RunFlow.ts**: add `import { clearSavedRun } from '../core/saveRun';` with the other `../core` imports; add the method above `endRun()`.
4. **GameOverScene.ts**: after line 28 add `const intentional = this.registry.pop('runEnded') === true;`. Line 40: `const title = this.add.text(0, -178, intentional ? 'Run ended' : 'Overrun', titleStyle(44, intentional ? PALETTE.ink : PALETTE.red)).setOrigin(0.5);`. Line 50: `const coinsText = this.add.text(0, -3, result.coins > 0 ? `+${result.coins} coins` : 'Rewards from wave 10', textStyle(15, result.coins > 0 ? PALETTE.goldText : PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0.5);`. Line 59: `makeButton(this, 0, 87, result.coins > 0 ? 'Claim rewards' : 'Menu', result.coins > 0 ? claim : () => this.scene.start(SCENES.menu), { width: 240, height: 56, radius: 28, fill: PALETTE.ink })`. The `if (result.coins > 0)` chime/scale block stays as-is.
5. **PauseScene.ts**: add `import { REWARD_WAVE } from '../core/levels';`.
   - Line 71: `const worthText: Phaser.GameObjects.Text | undefined = game.run.wave > 0 ? this.add.text(0, 0, game.run.wave >= REWARD_WAVE ? `worth +${coins} coins` : 'rewards from wave 10', lineStyle).setOrigin(0.5) : undefined;`
   - Replace the `quit` closure (lines 46–53) with two closures. The old body becomes `toMenu` (Main menu keeps the run): `const toMenu = (): void => { if (closed || !this.scene.isActive()) return; closed = true; hook.overlay = ''; this.scene.stop(SCENES.hud); this.scene.stop(SCENES.game); this.scene.start(SCENES.menu); };` (do NOT call `game.closePause()` — the game stops, the save in storage stays, Menu's Resume continues it).
   - New confirm:
     ```ts
     let armed = false;
     const quit = (): void => {
       if (closed || !this.scene.isActive()) return;
       if (!armed) {
         armed = true;
         quitButton.label.setText('End the run?');
         this.time.delayedCall(3000, () => { if (closed) return; armed = false; quitButton.label.setText('Quit run'); });
         return;
       }
       armed = false;
       closed = true;
       hook.overlay = '';
       this.scene.stop(); // the pause card; endRunIntentionally stops the hud and starts the end card
       game.flow.endRunIntentionally();
     };
     ```
     `let armed = false;` goes next to `let closed = false;` (line 38).
   - Add `const mainMenuButton = makeButton(this, 0, 0, 'Main menu', toMenu, { width: 240, height: 52, radius: 26 });` after `resumeButton` (line 158).
   - Line 193: insert one more `GAP_S + 52` before the final `PAD` (now six 52-rows: menu, quit, sound, enemies, waves, bosses, summary — i.e. add the pair after the `56 +` group's first `GAP_S + 52`).
   - After line 216 (`resumeButton.container.setY(cy(56));`): `y += GAP_S; mainMenuButton.container.setY(cy(52));` before the quitButton line.
   - Line 230 `boxKids`: insert `mainMenuButton.container` between `resumeButton.container` and `quitButton.container`.
6. **runChecks.ts**: after line 27 add `['run.ended', (g) => (g.registry.get('runEnded') ? 'the run-ended flag was left behind for the next run' : null)],`.
7. **Tests** (below). Run `npm run check`.

### Pitfalls
- Quit-confirm must `this.scene.stop()` (the pause card) BEFORE `endRunIntentionally()`; the private `endRun` already stops the hud and starts GameOverScene, which stops the game scene via the queue — never call `game.closePause()` on this path or the board keeps ticking under the end card.
- `runEnded` must be `pop`ped in GameOverScene; a natural loss must read `undefined` and stay "Overrun" in red. The `run.ended` invariant catches a leaked flag.
- The 3 s revert is a scene-time event: it dies with the scene on shutdown, and the `if (closed) return;` guard covers resume-within-3-s.
- Do not touch `coinsForRun` (the pause's "worth" math, RewardsScene and StatsCard use it un-gated), MenuScene (Resume appears only when a save exists — it updates for free), GameScene, or anything in `ui/hud/`.
- "Main menu" stops the game scene but changes no phase: the last phase-boundary save stays in storage; towers placed after that boundary are not saved (same as closing the tab today).

### Tests
`tests/core/profile.test.ts` — fix four cases, add one:
- `'a recorded Iron run pays the doubled payout'` (line 31): add `reached: 10` to each of the three `recordRun` results; expected 16/10/5 unchanged.
- `'a recorded run pays the doubled clean term only once the claim node is owned'` (line 55): add `reached: 10` to both results; expected 8/5 unchanged.
- `'records the first run and keeps the best over later runs'` (line 74): first run `waves: 5` → `waves: 12` (coins 18), second `waves: 3` → `waves: 11` (coins 13); update the two profile equality assertions and `loadProfile(store).coins` to 18/13/31 (bestWave 12, lastRun `{ wave: 11, coins: 13 }`, recent `[{ wave: 11, coins: 13 }, { wave: 12, coins: 18 }]`).
- `'keeps the four most recent runs, newest first'` (line 162): loop array `[5, 3, 8, 2, 9]` → `[12, 11, 13, 10, 14]`; expected recent `[{ wave: 14, coins: 14 }, { wave: 10, coins: 10 }, { wave: 13, coins: 13 }, { wave: 11, coins: 11 }]`.
- New case:
```ts
it('pays coins only from wave 10 on, and still counts the run before it', () => {
  const store = memory();
  const short = recordRun(store, { waves: 8, stopped: 40, clean: 2, seed: 121, bgen: 2, reached: 9 });
  expect(short.coins).toBe(0);
  expect(short.profile).toEqual({ bestWave: 8, bestSeed: 121, bestSeedBgen: 2, ironBestWave: 0, runsPlayed: 1, coins: 0, purchased: [], lastRun: { wave: 8, coins: 0 }, recent: [{ wave: 8, coins: 0 }], sound: true, levelSlots: 0, levelOn: [] });
  const ten = recordRun(store, { waves: 9, stopped: 30, clean: 1, seed: 122, bgen: 2, reached: 10 }); // died during wave 10
  expect(ten.coins).toBe(13); // 9 + 3 + 1, as before the gate
  expect(ten.profile.coins).toBe(13);
  expect(ten.profile.recent).toEqual([{ wave: 9, coins: 13 }, { wave: 8, coins: 0 }]);
});
```
`tests/core/levels.test.ts` — add `REWARD_WAVE` to the line-6 import (after `LEVEL_UNLOCK_WAVE`) and `expect(REWARD_WAVE).toBe(10);` after line 14.
End card and pause-card behavior (two-tap quit → "Run ended" in ink, "Rewards from wave 10" muted, "Menu" button, no Resume in the menu after; Main menu → Resume continues; 1280×720 and 412×915, mouse and touch) are covered by `npm run smoke` / manual play, not unit tests.
