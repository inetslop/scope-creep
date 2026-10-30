---
id: T0241
title: "Iron: the mode that plays a run at one life for double coins"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T00:29:56Z
epic: E6
---

## Goal
A second start option off the menu — "Iron": the same run at 1 life that pays 2× coins, so the risk is chosen before wave 1 and the payout says it was the mode.

## Details
- The menu: directly under the Play button, in the menu's own column, a white card — bold "Iron" over a muted line "1 life · 2× coins". The menu's other options keep their places (Ghost, Tech, …) and the whole menu shows every option without scrolling at 412x915 and 1280x720 (the cards scale to fit, as the codex's do); the new card replaces nothing.
- Start: an Iron run starts with exactly 1 life. The tech tree's "Life +1" nodes do not apply to it (the start stays 1); the gold nodes apply normally. Board, waves, augments, gold and lives otherwise behave as in a normal run.
- Coins: an Iron run's coin payout is 2× the normal formula — the one pure formula (T0001) with the tech nodes' terms applied first (e.g. Clean ×2), then doubled. The live "+N coins" tally (the stats card), the pause "worth +N" line and the claim card's recipe line all read the doubled payout from that same formula, so the recipe terms always sum to the payout shown.
- The last stand (T0054) is off for Iron: no double kill gold at 1 life, no "Last stand" banner or sting, and the lives number never turns red or pulses. The mode's risk is stated at the menu and on the claim card, not in the HUD — no new HUD element.
- The claim card: the run line wears a small muted "Iron" tag beside the wave — nothing currently says which mode a run was, so it is new, not shown twice.
- Resume and ghost: a closed Iron run is saved with its mode and resumes as Iron (its 1 life and its doubled coins intact); the Ghost option is unchanged (it still replays the normal best run). A normal Play run is byte-identical: every Iron rule is gated on the run's mode.

## Acceptance criteria
- [ ] The menu shows the "Iron" card with its "1 life · 2× coins" line under Play, and every menu option is visible without scrolling at 412x915 and 1280x720.
- [ ] Starting an Iron run: the stats card reads 1 life from the first wave (even with both "Life +1" nodes owned), kills pay normal gold, and no last-stand banner, sting or red lives number appears.
- [ ] An Iron run with the same waves, kills and clean count as a normal run pays exactly 2× the normal coins; the claim card's recipe terms are the doubled ones, sum to the payout, and the run line wears the muted "Iron" tag.
- [ ] During an Iron run the live coin tally and the pause "worth" line show the doubled numbers.
- [ ] A normal Play run is unchanged (lives, gold, coins, banners, claim card byte-identical), and a closed Iron run resumes as Iron.

## Design (architect, desktop)

### Files
- edit `src/core/run.ts` - add `RunMode` type and `RunState.mode` field (default `'play'`)
- edit `src/core/lastStand.ts` - gate `isLastStand` on `mode === 'play'` (turns off banner, sting, red lives, pulse, ×4 tag and kill-gold doubling for Iron in one place)
- edit `src/core/profile.ts` - `coinsForRun` gains a third `mul = 1` param (doubles the whole payout after `cleanPay`); `RunResult` gains optional `mul`; `recordRun` passes it through
- edit `src/core/saveRun.ts` - `SavedRun` gains required `mode: RunMode`; loader rejects an invalid value, loads older saves (no field) as `'play'`
- edit `src/systems/RunSave.ts` - `persist()` writes `mode: run.mode`, `restore()` sets `run.mode = saved.mode`
- edit `src/scenes/GameScene.ts` - pop `ironMode` registry flag; on a new Iron run set `mode='iron'` and `lives = 1`, skip `tech.life` (gold nodes still apply)
- edit `src/scenes/MenuScene.ts` - the Iron card under Play
- edit `src/scenes/PauseScene.ts` - "worth +N" line uses the doubled formula
- edit `src/ui/hud/StatsCard.ts` - live coin tally uses the doubled formula
- edit `src/scenes/GameOverScene.ts` - `recordRun` gets `mul: 2` for Iron
- edit `src/scenes/RewardsScene.ts` - claim card: doubled coin recipe terms, muted "Iron" tag beside "Waves held N"
- edit `src/debug/runChecks.ts` - two invariant lines
- edit `tests/core/lastStand.test.ts`, `tests/core/profile.test.ts`, `tests/core/saveRun.test.ts` - new cases + `sample()` gains `mode: 'play'`

### Interfaces
```ts
// core/run.ts
export type RunMode = 'play' | 'iron';
// in RunState, after `lives`:
mode: RunMode = 'play';

// core/profile.ts
export interface RunResult { waves: number; stopped: number; clean: number; seed: number; mul?: number; }
export function coinsForRun(result: RunResult, cleanPay = 1, mul = 1): number; // (waves + floor(stopped/10) + clean*cleanPay) * mul
// core/saveRun.ts, in SavedRun after `lives`:
mode: RunMode; // import type { RunMode } from './run'
```

### Steps
1. `core/run.ts`: add the `RunMode` type above the `RunState` class and the `mode: RunMode = 'play';` field right after `lives: number = START.lives;`.
2. `core/lastStand.ts`: `isLastStand` body becomes `return run.mode === 'play' && run.lives === 1;` (update its doc comment).
3. `core/profile.ts`: add `mul?: number` to `RunResult`; `coinsForRun(result, cleanPay = 1, mul = 1)` returns `(result.waves + Math.floor(result.stopped / 10) + result.clean * cleanPay) * mul`; in `recordRun` use `coinsForRun(result, cleanWavePay(old.purchased), result.mul ?? 1)`.
4. `core/saveRun.ts`: `mode: RunMode;` in `SavedRun`; after the lives check add `if (p.mode !== undefined && p.mode !== 'play' && p.mode !== 'iron') return undefined;`; in the returned object add `mode: p.mode === 'iron' ? 'iron' : 'play',` after `lives: p.lives,`.
5. `systems/RunSave.ts`: `persist()` adds `mode: run.mode,` after `lives:`; `restore()` adds `run.mode = saved.mode;` after `run.lives = saved.lives;`.
6. `GameScene.ts` create(): after the `ghostSeed` pop add `const iron = this.registry.pop('ironMode') === true;`. In the `if (!saved)` block replace `this.run.lives += tech.life; this.techLife = tech.life;` with:
```ts
if (iron) { this.run.mode = 'iron'; this.run.lives = 1; } // the "Life +1" nodes don't apply; gold still does (line above)
else { this.run.lives += tech.life; this.techLife = tech.life; }
```
7. `MenuScene.ts`: module const `const IRON_H = 68;` next to `BUTTON_H`. After `playBox` add:
```ts
const iron = makeButton(this, 0, 0, '', () => { clearSavedRun(window.localStorage); this.registry.set('ironMode', true); this.scene.start(SCENES.game); }, { width: 220, height: IRON_H, radius: 30 });
iron.label.setVisible(false);
const ironTitle = this.add.text(0, -10, 'Iron', titleStyle(24)).setOrigin(0.5);
const ironLine = this.add.text(0, 16, '1 life · 2× coins', textStyle(14, PALETTE.muted)).setOrigin(0.5);
iron.content.add([ironTitle, ironLine]);
```
Then: `fadeIn.push(iron.container);` after `fadeIn.push(playBox);`; the fit line becomes `below += BUTTON_H + GAP + IRON_H + GAP + BUTTON_H + CAPTION_GAP + techLine.height + BUTTON_H;`; in `layout()` after the playBox `put`/`gap` add `iron.container.setScale(s); iron.container.setPosition(cx, put(IRON_H)); gap(GAP);`
8. `PauseScene.ts` line 50 and `StatsCard.ts` line 63: append `, game.run.mode === 'iron' ? 2 : 1` to the `coinsForRun` call.
9. `GameOverScene.ts` line 27: add `mul: run.mode === 'iron' ? 2 : 1` to the result object.
10. `RewardsScene.ts`: private field `ironTag?: Phaser.GameObjects.Text`; after `const cleanPay = ...` add `const mul = run.mode === 'iron' ? 2 : 1;`; line 74 fallback becomes `coinsForRun({...same}, cleanPay, mul)`; the `coinRecipe` line becomes `recipe(\`waves +${this.waves * mul} · stopped +${Math.floor(this.stopped / 10) * mul} · clean +${this.clean * cleanPay * mul}\`)`; after `this.wavesText.setY(top + col.ys[1]);` add
```ts
if (run.mode === 'iron') {
  this.ironTag = this.add.text(0, 0, 'Iron', textStyle(13, PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0.5);
  this.ironTag.setY(top + col.ys[1]);
  this.ironTag.setX(this.wavesText.width / 2 + 8 + this.ironTag.width / 2);
}
```
add `if (this.ironTag) parts.push(this.ironTag);` after `parts` is made, and in `update()` after `wavesText.setText(...)` re-run the same `setX` (the number grows while counting up).
11. `runChecks.ts`: after `['ghost.taken', ...]` add `['iron.taken', (g) => (g.registry.get('ironMode') ? 'an iron flag is waiting for the game that never took it' : null)],`; after `['run.streak', ...]` add `['iron.lives', (g) => (g.run.mode !== 'iron' || (g.techLife === 0 && g.run.lives <= 2) ? null : \`iron run at ${g.run.lives} lives with techLife ${g.techLife}\`)],`.
12. `npm run check` then `npm run smoke`.

### Pitfalls
- Adding `mode` to `SavedRun` breaks the type of `sample()` in `tests/core/saveRun.test.ts` — add `mode: 'play'` there (step 13 below).
- Older saves have no `mode`: only reject when the field is present and invalid; missing must load as `'play'` (like `bends`/`lengthMul`).
- Iron lives are exactly `1` unconditionally — never `START.lives`-based, never `+= tech.life`; `techLife` must stay `0` (the `run.streak`/`waves.held` invariants build on it).
- The clean-streak "+1 life" still applies to Iron ("lives otherwise behave as in a normal run") — that is why the invariant allows up to 2.
- Doubling must happen after `cleanPay` (`clean * cleanPay * mul`), and every recipe term is doubled individually so the terms still sum to the shown payout; all values stay integers.
- The tag in RewardsScene must re-position every frame next to the growing "Waves held N" width, or it overlaps the number.
- Menu: `below` fit-sum and the `layout()` `put()` must both get the card, or 412x915 scrolls. Enter/Space stays bound to normal `play()`; ghost and iron flags are set by different buttons and never together.
- Normal runs must stay byte-identical: every change is gated on `mode === 'iron'` or an optional param defaulting to the old value.

### Tests
- `tests/core/lastStand.test.ts`: Iron run at 1 life → `isLastStand` false and `killGold(r, 4) === 4`.
- `tests/core/profile.test.ts`: `coinsForRun({waves:12, stopped:148, clean:5, seed:1}, 2, 2) === 72` (node terms first, then doubled); `recordRun` with `mul: 2` stores doubled coins.
- `tests/core/saveRun.test.ts`: `sample()` gains `mode: 'play'`; round-trip `mode: 'iron'`; a JSON save without `mode` loads as `'play'`; `broken({ mode: 'ghost' })`.
