---
id: T0403
title: "The storm: the third mode off the menu"
size: L
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T04:17:18Z
epic: E17
---

## Goal
A third card on the menu, Storm: a run that plays faster and pays richer — every wave rushes and every wave pays double the wave bonus gold. Tempo is the price, in-run gold is the pay; the choice is a mode's, not a few gold's.

## Details
- **The menu card.** Under the Iron card, in the Iron card's language: a white card with the bold name "Storm" and a muted sub-line "every wave rushes · 2× wave gold". Included in the menu's fit-sum like the Iron card, so the column still fits at 412x915 and 1280x720 without scrolling. Tapping it starts a storm run through the same flow Play and Iron use. The storm is its own mode: it is not combined with Iron.
- **The run remembers.** A storm run carries the mode for the whole run the same way it carries Iron; a saved and resumed storm run is still a storm run.
- **The wave rules (storm runs only):**
  - No quiet waves: the every-4th breather does not happen — no halving, no "quiet" tag or chip, no quiet teach line, no ×2 quiet kill gold.
  - Every non-boss wave is a rush wave: all its walkers move at the rush factor (1.5×, the rush tag's own value, T0337), and the wave banner and the preview wear the rush chip exactly as a normal-play rush wave does. The one-time rush teach line under the preview shows on the run's first build phase — wave 1 is the run's first rush wave, so its teach moment is wave 1 (not the normal-play first rush wave) — and never again that run.
  - Tight waves keep their tight tag and bunched spawns; a tight storm wave wears both chips (tight, rush) on the banner and the preview.
  - Boss waves (every 10th) keep the boss's own pace: no rush chip, the boss lane unchanged — but the wave bonus still doubles.
  - The wave-clear gold bonus is doubled (×2) for every wave in the run.
  - Everything else is untouched: bank interest, the early-send gold, rerolls, lives, the last stand, the clean streak, level augments.
- **The claim.** The claim card shows a "Storm" line where an Iron run shows "Iron" — same place, same style.
- **Normal and Iron runs are byte-identical** — the storm rules apply only while the mode is on.

## Acceptance criteria
- [ ] The menu shows a white "Storm" card under the Iron card with the sub-line "every wave rushes · 2× wave gold"; the menu column still fits at 412x915 and 1280x720 without scrolling.
- [ ] A storm run's wave 1 banner wears the rush chip, and the preview's one-time rush teach line shows in the first build phase and never again that run.
- [ ] No wave in a storm run is quiet: wave 4 is full size, with no quiet chip, no quiet teach line and normal kill gold (no ×2 quiet).
- [ ] Every non-boss wave's walkers move at 1.5× in a storm run; a boss wave shows no rush chip.
- [ ] A cleared wave in a storm run pays 2× the normal wave bonus gold, on every wave including boss waves.
- [ ] The claim card shows a "Storm" line where an Iron run shows "Iron".
- [ ] A normal run and an Iron run are byte-identical: same waves, same bonus, same UI.

## Design (architect, desktop)

### Files
- create `tests/core/storm.test.ts` - unit tests for the storm wave rules, doubled bonus, and last stand
- edit `src/core/run.ts` - `RunMode` gains `'storm'`; `clearWave()` doubles the bonus in storm
- edit `src/core/waves.ts` - `isQuietWave`, `quietGoldMul`, `waveSpeedMul`, `planWave` take an optional `RunMode`; storm plans are never quiet and always rush
- edit `src/core/lastStand.ts` - off only in Iron, so Storm keeps it
- edit `src/core/saveRun.ts` - `loadSavedRun` accepts and round-trips `mode: 'storm'`
- edit `src/systems/WaveSystem.ts` - pass `run.mode` into `planWave` and `waveSpeedMul`
- edit `src/systems/EnemySystem.ts` - pass `run.mode` into `quietGoldMul` (kill gold line 246)
- edit `src/ui/hud/StatsCard.ts` - pass `run.mode` into `isQuietWave` (line 79)
- edit `src/ui/hud/NextWavePreview.ts` - wear every tag chip (tight storm waves show tight + rush); the rush teach rides the first build phase in storm
- edit `src/scenes/MenuScene.ts` - the Storm card under Iron, in the fit-sum and fade-in; flag cleanup
- edit `src/scenes/GameScene.ts` - pop the `stormMode` flag and set `run.mode`
- edit `src/scenes/PickScene.ts` - `back()` clears the `stormMode` flag
- edit `src/scenes/RewardsScene.ts` - the claim card's mode tag says "Storm"
- edit `src/debug/runChecks.ts` - `level.speed` uses the mode; new `storm.quiet` invariant
- edit `tests/core/saveRun.test.ts` - storm save round-trip (next to the Iron test)

### Interfaces
```ts
// core/run.ts
export type RunMode = 'play' | 'iron' | 'storm';
// in RunState.clearWave():
const bonus = (this.mode === 'storm' ? 2 : 1) * RunState.waveBonus(this.wave); // static waveBonus unchanged

// core/waves.ts (import type { RunMode } from './run' — type-only, no cycle; run.ts does not import waves.ts)
export function isQuietWave(wave: number, mode: RunMode = 'play'): boolean; // body gains: mode !== 'storm' &&
export function quietGoldMul(wave: number, mode: RunMode = 'play'): number; // isQuietWave(wave, mode) ? 2 : 1
export function waveSpeedMul(wave: number, mode: RunMode = 'play'): number; // isRushWave(wave) || (mode === 'storm' && !isBossWave(wave)) ? 1.5 : 1
export function planWave(wave: number, rng: Rng, enemies: readonly EnemyDef[], mode: RunMode = 'play'): WavePlan;
// planNormalWave gains mode and, at its exit (line 219), instead of the current ternary:
//   tags: mode === 'storm' ? (isTightWave(wave) ? ['tight', 'rush'] : ['rush'])
//         : isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : isRushWave(wave) ? ['rush'] : []
// and line 210 becomes: if (isQuietWave(wave, mode)) finalSpawns = quietHalve(finalSpawns);
// core/lastStand.ts: return run.mode !== 'iron' && run.lives === 1;
// core/saveRun.ts line 124 gains && p.mode !== 'storm'; line 155: mode: p.mode === 'iron' ? 'iron' : p.mode === 'storm' ? 'storm' : 'play'
```

### Steps
1. `src/core/waves.ts`: add the type import; extend the four signatures exactly as above; update their doc comments ("never, in a storm run"; "1.5 on a rush wave or on every non-boss storm wave"). Keep the default-argument branch byte-identical to today's expressions.
2. `src/core/run.ts`: widen `RunMode`, update the two comments (type line 15 and field line 31), change the `clearWave()` bonus line. `systems/RunSave.ts` already saves/restores `run.mode` generically — no change there.
3. `src/core/lastStand.ts`, `src/core/saveRun.ts`: the one-line changes above.
4. Callers: `WaveSystem.ts:49,57` `planWave(..., this.run.mode)`, `WaveSystem.ts:82` `waveSpeedMul(plan.number, this.run.mode)`; `EnemySystem.ts:246` `quietGoldMul(this.run.wave, this.run.mode)`; `StatsCard.ts:79` `isQuietWave(game.run.wave, game.run.mode)`; `runChecks.ts:164` `waveSpeedMul(g.run.wave, g.run.mode)`. `MenuDemo` and all tests keep the default (they test play rules).
5. `src/scenes/GameScene.ts`: after line 97 add `const storm = this.registry.pop('stormMode') === true;`; change the `if (!saved)` mode block to: `if (iron) { this.run.mode = 'iron'; this.run.lives = 1; } // the "Life +1" nodes don't apply; gold still does (line above)` / `else { this.run.lives += tech.life; this.techLife = tech.life; if (storm) this.run.mode = 'storm'; } // the Storm keeps the run's lives; the "Life +1" nodes still apply`. Iron wins if both flags ever were set.
6. `src/scenes/MenuScene.ts`: after the Iron block (line 93) build the card, copying the Iron pattern: `makeButton(this, 0, 0, '', () => { clearSavedRun(window.localStorage); this.registry.remove('ironMode'); this.registry.set('stormMode', true); this.scene.start(SCENES.pick); }, { width: 260, height: IRON_H, radius: 30 })` (no `fill` = white card; 260 wide so the 32-char sub-line clears the card's edges), `storm.label.setVisible(false)`, then `storm.content.add([this.add.text(0, -10, 'Storm', titleStyle(24)).setOrigin(0.5), this.add.text(0, 16, 'every wave rushes · 2× wave gold', textStyle(14, PALETTE.muted)).setOrigin(0.5)])`. Add `this.registry.remove('stormMode');` to the `play()` closure and to the Iron button's callback (mutual exclusion); `fadeIn.push(storm.container);` after the Iron push; fit-sum line 179 becomes `below += BUTTON_H + GAP + IRON_H + GAP + IRON_H + GAP + BUTTON_H + CAPTION_GAP + techLine.height + GAP + BUTTON_H;`; in `layout()` after the Iron placement add `storm.container.setScale(s); storm.container.setPosition(cx, put(IRON_H)); gap(GAP);`.
7. `src/scenes/PickScene.ts` `back()`: add `this.registry.remove('stormMode');` after the ironMode removal. `src/scenes/RewardsScene.ts` lines 227-232: `if (run.mode !== 'play') {` with the text `run.mode === 'iron' ? 'Iron' : 'Storm'` (keep the field name `ironTag` — no rename; "Storm" measures ~10 px wider, the tag is placed from its own measured width, nothing else moves).
8. `src/ui/hud/NextWavePreview.ts`: in `build()`, replace the single `plan.tags[0]` chip block with `for (const tag of plan.tags) { ...same chip code...; countsPieces.push(scene.add.container(cursor + chipW / 2, 0, [chip, label])); cursor += chipW + GROUP_GAP; }` (first chip lands at the same spot as today; the banner in `topBanner.ts` already loops all tags, so a tight storm wave shows both chips everywhere). In `teachLines()`: the `wavesCleared === 0` branch becomes `const lines = [EARLY_SEND, BANK_PAY]; if (plan.tags.includes('rush')) lines.push(TEACH.find((t) => t.tag === 'rush')!.text); return lines;` (storm wave 1 is the run's first rush wave — its teach is the first build phase; normal wave 1 has no rush tag, so nothing changes there), and in the TEACH loop use `const first = run.mode === 'storm' && t.tag === 'rush' ? 1 : t.first;` so it never shows again (re-derived from the run, never stored).
9. `src/debug/runChecks.ts`: after the `level.bossPlan` line add `['storm.quiet', (g) => (g.run.mode !== 'storm' || (!g.waves.currentPlan?.tags.includes('quiet') && !g.waves.nextPlan?.tags.includes('quiet')) ? null : `a storm wave wears the quiet tag on wave ${g.run.wave}`)],`.
10. Tests: `tests/core/storm.test.ts` (new) — `planWave(4, new Rng(7), ENEMIES, 'storm')` has tags `['rush']` and strictly more spawns than the same-seed `'play'` wave 4 (halved); storm tags for waves 1/6/10 are `['rush']`/`['tight','rush']`/`['boss']`; `waveSpeedMul` 1.5 on storm waves 1,4,7,11,14 and 1 on 10,20,30; `isQuietWave(4, 'storm')` false, `quietGoldMul(4, 'storm')` 1, defaults unchanged (`isQuietWave(4)` true, `waveSpeedMul(11, 'iron')` 1.5, iron wave 4 tags `['quiet']`); a fresh `RunState` with `mode = 'storm'` pays `2 * RunState.waveBonus(1)` from `startWave(); clearWave();` while play and iron pay `RunState.waveBonus(1)`; `isLastStand` is true for a storm run at one life. In `tests/core/saveRun.test.ts`, next to the Iron round-trip test: `saveRun(store, sample({ mode: 'storm' })); expect(loadSavedRun(store)).toEqual(sample({ mode: 'storm' }));`.

### Pitfalls
- Byte-identity: every storm branch must key off `mode === 'storm'`; the `'play'`/`'iron'` paths keep today's exact expressions (same plans, same `planWave` rng draws, same UI). Never make storm an `else` that Iron falls into.
- `isQuietWave` is called with the default mode inside `isRushWave` and by `waveTags.ts` reference rows — leave those as play rules; only pass `run.mode` at the four run-facing call sites.
- The preview previously wore exactly one chip (`plan.tags[0]`); the loop must not change the first chip's x (it sits at `cursor + chipW/2` with `cursor = 0`), or normal runs shift.
- The rush teach must not re-show on wave 2's build in storm: without the `first = 1` adjustment, `wavesCleared (1) < 11` would teach it again.
- Registry flags outlive scenes: the storm button, Play, and `PickScene.back()` must each clear the other mode's flag, or a cancelled Storm pick would start a later Ghost/Play run in storm (mirror the Iron "flag waiting for the game that never took it" trap; `GameScene` pops both unconditionally).
- Coins are not part of the pay: every `run.mode === 'iron' ? 2 : 1` coin multiplier (StatsCard, PauseScene, CoinsScene, RewardsScene, GameOverScene) stays iron-only — storm doubles in-run wave-bonus gold only. Storm keeps normal lives, so the `tech.life` bonus and the last stand apply.
- No pooling/cleanup concerns: no new persistent objects; the menu card dies with the scene, the RewardsScene tag is reset to `undefined` each create.

### Tests
- `tests/core/storm.test.ts` (new) and the storm round-trip in `tests/core/saveRun.test.ts`, as specified in step 10.
