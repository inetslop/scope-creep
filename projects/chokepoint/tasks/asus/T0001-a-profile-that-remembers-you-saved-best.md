---
id: T0001
title: "A profile that remembers you: saved best wave, run stats, coins"
assignee: asus
size: L
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T01:07:07Z
claimed_at: 2026-10-28T01:12:41Z
epic: E1
---

## Goal
Runs end with numbers worth keeping: the device remembers your best wave, how many runs you have played, and a new currency (coins) earned from every run. This is the foundation every later E1 slice displays.

## Details
- A profile object persisted on the device (localStorage or equivalent; survives closing the browser): `bestWave`, `runsPlayed`, `coins`, `lastRun` (wave + coins earned, or none yet). Starts empty: 0 / 0 / 0 / none.
- During a run, the run ledger tracks: waves held, enemies stopped, gold earned, and clean waves (a wave that ends without any leak).
- At game over, update the profile: `bestWave` = max(old, waves held); `runsPlayed` +1; coins earned = waves held + floor(enemies stopped / 10) + clean waves; add to `coins`; set `lastRun`.
- The game-over card gains four lines under the existing score line, in this order:
  - "Waves held 12"
  - "Stopped 148"
  - "Clean 5"
  - "+24 coins" — in yellow (gold), the only colored line
  Lines show even when the value is 0. The score line stays exactly as it is today.
- The menu's best-run line becomes "Best: wave N" (the profile's best wave). The score is no longer shown on the menu.
- Layout: the new lines fit the existing game-over card at 412x915 and 1280x720 (shrink line spacing, not the card).

## Acceptance criteria
- [ ] Play a run, quit, play another: the menu shows the higher best wave and the runs count incremented.
- [ ] A run of 12 waves with 148 stopped and 5 clean waves shows "+31 coins" on the game-over card (12 + 14 + 5).
- [ ] Close and reopen the browser: the menu still shows the best wave and runs played (nothing reset).
- [ ] The four new game-over lines are fully visible inside the white card at 412x915 and 1280x720.
- [ ] A run that stops 0 enemies and holds 0 waves adds 0 coins and still updates runs played.

## Design (architect, desktop)

### Files
- create `src/core/profile.ts` - device profile: type, load/save (localStorage via injected store), coin rule, `recordRun` (replaces `core/bestScore.ts`)
- delete `src/core/bestScore.ts` - superseded; only two importers (both edited below)
- create `tests/core/profile.test.ts` - profile unit tests
- delete `tests/core/bestScore.test.ts` - replaced
- edit `src/core/run.ts` - run ledger: 3 new fields + one line in `addKill()`, `leak()`, `startWave()`, `clearWave()`
- edit `src/scenes/GameOverScene.ts` - call `recordRun` once in `create()`, four new lines, new y-positions
- edit `src/scenes/MenuScene.ts` - best line from profile (best wave + runs), no score
- edit `src/debug/runChecks.ts` - one invariant line after `run.lives`
- edit `tests/core/run.test.ts` - ledger test

### Interfaces
```ts
// src/core/profile.ts (pure; KeyValueStore moves here from bestScore.ts)
export interface Profile {
  bestWave: number;
  runsPlayed: number;
  coins: number;
  lastRun: { wave: number; coins: number } | null;
}
export interface RunResult { waves: number; stopped: number; clean: number }
export interface RecordResult { profile: Profile; coins: number; newBest: boolean }
export const PROFILE_KEY: string; // 'chokepoint:profile'
export function loadProfile(store: KeyValueStore | undefined): Profile;
export function coinsForRun(result: RunResult): number; // waves + floor(stopped / 10) + clean
export function recordRun(store: KeyValueStore | undefined, result: RunResult): RecordResult;
```
`recordRun`: load old, `coins = coinsForRun(result)`, new profile = `{ bestWave: max(old, result.waves), runsPlayed: old + 1, coins: old + coins, lastRun: { wave: result.waves, coins } }`, save in try/catch (same silent-fail comment as bestScore had), `newBest = result.waves > old.bestWave`. `loadProfile` sanitizes every field with `Number(x) || 0` and `lastRun` only if it is an object with two non-negative numbers, else `null` (mirror `loadBest`'s try/catch).

RunState (`core/run.ts`), after `kills = 0;`:
```ts
goldEarned = 0;        // gold earned this run: kill gold + wave bonuses
cleanWaves = 0;        // waves that ended without a leak
private leaksThisWave = 0;
```
`addKill()`: `this.goldEarned += paid;` · `leak()`: `this.leaksThisWave += 1;` (after the lives decrement) · `startWave()`: `this.leaksThisWave = 0;` · `clearWave()`: `this.goldEarned += bonus;` + `if (this.leaksThisWave === 0) this.cleanWaves += 1;` + reset `leaksThisWave = 0`.

### Steps
1. Write `src/core/profile.ts`, delete `src/core/bestScore.ts` and its test, write `tests/core/profile.test.ts`.
2. Add the ledger to `RunState`; add the ledger test in `tests/core/run.test.ts`.
3. `GameOverScene.create()`: replace `result`/`isBest`/`best` with `const result = recordRun(window.localStorage, { waves: run.wavesCleared, stopped: run.kills, clean: run.cleanWaves });` ("waves held" is `run.wavesCleared`, NOT `run.wave`). Add four centered texts `setOrigin(0.5)`: `Waves held ${run.wavesCleared}`, `Stopped ${run.kills}`, `Clean ${run.cleanWaves}` in `textStyle(15, PALETTE.muted)`, then `+${result.coins} coins` in `textStyle(15, PALETTE.goldText, { fontStyle: 'bold' })`. bestText becomes `result.newBest ? 'New best!' : \`Best: wave ${result.profile.bestWave}\`` (score gone from profile). New y-positions (card stays 360x380; order in the container: panel, title, waveText, score, the four new, bestText, both buttons): title -144, waveText -96, score -66 (text unchanged), the four lines -37/-20/-3/14, bestText 41, again button 88, menu button 152.
4. `MenuScene`: `const p = loadProfile(window.localStorage);`; bestText = join of `p.bestWave > 0 ? \`Best: wave ${p.bestWave}\` : ''` and `p.runsPlayed > 0 ? \`${p.runsPlayed} runs\` : ''` with `' · '` (empty string when both 0), same style.
5. Add invariant: `['run.ledger', (g) => (Number.isInteger(g.run.goldEarned) && g.run.goldEarned >= 0 && g.run.cleanWaves >= 0 && g.run.cleanWaves <= g.run.wavesCleared ? null : 'ledger')],` after the `run.lives` line.

### Pitfalls
- `recordRun` must run exactly once, in `GameOverScene.create()` — never in GameScene/RunFlow (it would fire every frame or on restarts).
- `waves held` = `run.wavesCleared` (waves fully held). `run.wave` is the wave reached; using it breaks the coins rule and the "holds 0 waves" acceptance case.
- Use `PALETTE.goldText` (0x9c6c00) for the coins line, not `PALETTE.yellow` — too pale on the white card; goldText is the established gold-number color.
- The old `chokepoint:best` key is orphaned: no migration, it's dev-stage data.
- `leak()` early-returns when `phase === 'over'` — the counter only matters before that; `clearWave()` is only reached alive (RunFlow checks `run.over` first), so no off-by-one.
- `cleanWaves <= wavesCleared` always holds — that's the invariant, cheap to check.
- Don't add Sfx (coin chime is T0009), don't touch Draft/hand.

### Tests
- `tests/core/profile.test.ts`: `coinsForRun({ waves: 12, stopped: 148, clean: 5 }) === 31`; `{0,0,0} → 0`; floor edge (stopped 19 → +1, 20 → +2); empty load from `undefined` and from broken JSON; `recordRun` flow — first run sets best/coins/lastRun and `newBest` true, second lower run keeps best and `newBest` false, zero-wave run increments `runsPlayed` with 0 coins; coins accumulate across runs.
- `tests/core/run.test.ts`: clean wave increments `cleanWaves` and `goldEarned` (kill gold + `RunState.waveBonus`); a wave with one `leak()` is not clean; wave 2 bonus still counted in `goldEarned`.
