---
id: T0054
title: Score and best score
assignee: desktop-4070
size: M
priority: 2
status: done
depends_on: [T0040]
attempts: 1
created: 2026-10-27T00:59:33Z
claimed_at: 2026-10-27T10:33:52Z
finished_at: 2026-10-27T11:21:48Z
---

## Goal
Kills now earn points, so a run has a number to chase: the score is always visible in the HUD, and the game-over screen shows this run's score next to your all-time best, which persists between runs.

## Details
- A new run stat `score`, reset to 0 at the start of every run. It is awarded in the shared kill path (the same place that drops shards and counts the kill-streak) so every kill source counts — Point, Line, Orbit, Arc, and boss kills alike.
- Points per kill:
  - a normal (non-elite) enemy kill: +1 point
  - an elite kill: +5 points
  - a boss kill (The Frame now, The Grid later): +50 points
- HUD: a small ink readout `SCORE 123` in the top-left corner (small, same style as the kill-streak tally but on the left so the two never overlap). It updates the instant a kill lands. Do not crowd the HP/XP bar.
- Game over: show two lines under the existing game-over text — `SCORE 123` for this run and `BEST 456` for the all-time best (best = the higher of this run's score and the stored best).
- Persistence: store the all-time best in `localStorage` under the key `scope-creep.best-score` so it survives a reload and future runs. On a new run, read the stored best (default 0 if absent); at game over, write back the new best if this run beat it.
- Add `score: number` (starting 0) to the debug stats in `debug/testHook.ts` so the smoke test can read it.
- No new SFX, no new art.

## Acceptance criteria
- [ ] The HUD shows `SCORE 0` at the start of a run, in the top-left, and it increments the moment any kill lands
- [ ] Killing a normal enemy adds 1 point, an elite adds 5, and The Frame adds 50 — all through the one shared kill path (kills by any weapon or the boss count)
- [ ] The game-over screen shows this run's `SCORE` and a `BEST` that is the higher of the run and the stored best
- [ ] After a run that beats the stored best, reloading the page and starting a new run shows the new best already (persisted in `localStorage` under `scope-creep.best-score`)
- [ ] `score` is present in the debug stats
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/core/bestScore.ts` - localStorage persistence for the all-time best score (`loadBestScore`/`saveBestScore`, key `scope-creep.best-score`), all failures swallowed like `Sfx.readMuted` does
- edit `src/config.ts` - add `SCORE_POINTS` tuning const (1/5/50) after the `ELITE` block
- edit `src/core/run.ts` - new `score` field + `addScore()` method on `RunState`
- edit `src/systems/CombatSystem.ts` - award score in `killEnemy()` (the shared kill path for every weapon: projectiles, Orbit and Arc all funnel into it)
- edit `src/systems/BossSystem.ts` - award score in `killBoss()` (the boss's own kill path; Frame and Grid both go through it)
- edit `src/scenes/GameScene.ts` - `RunSummary` gains `score`/`best`, read stored best at run start, write it back in `endRun()`, mirror `score` into hook stats, add a `score` invariant
- edit `src/scenes/HudScene.ts` - `SCORE n` readout top-left
- edit `src/scenes/GameOverScene.ts` - two extra lines `SCORE n` / `BEST n`
- edit `src/debug/testHook.ts` - `score` in `HookStats` + initializer
- edit `tests/core/core.test.ts` - `RunState` score test

### Interfaces
```ts
// src/core/bestScore.ts (new file)
export const BEST_SCORE_KEY: string;            // 'scope-creep.best-score'
export function loadBestScore(): number;        // stored best, 0 when absent/invalid/blocked
export function saveBestScore(score: number): void; // no-throw

// src/config.ts
export const SCORE_POINTS: { readonly enemy: number; readonly elite: number; readonly boss: number }; // { 1, 5, 50 } as const

// src/core/run.ts — class RunState
score = 0;                    // field, next to `kills = 0;`
addScore(points: number): void; // after registerKill(); `if (points > 0) this.score += points;`

// src/scenes/GameScene.ts
export interface RunSummary { timeSec: number; level: number; kills: number; bestStreak: number; score: number; best: number; seed: number; }

// src/debug/testHook.ts — add to HookStats and to the `stats` initializer (0)
score: number;
```

### Steps
1. `src/core/bestScore.ts`: `BEST_SCORE_KEY = 'scope-creep.best-score'`; `loadBestScore()` = `try { const n = Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '', 10); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; }`; `saveBestScore(score)` = `try { localStorage.setItem(BEST_SCORE_KEY, String(score)); } catch { /* blocked storage */ }`.
2. `src/config.ts` after `ELITE`: `/** Points per kill, by enemy class (normal, elite, boss). */` + `export const SCORE_POINTS = { enemy: 1, elite: 5, boss: 50 } as const;`
3. `src/core/run.ts`: add `/** Points earned this run (see SCORE_POINTS in config.ts). */\nscore = 0;` after `kills = 0;`, and after `registerKill()`: `addScore(points: number): void { if (points > 0) this.score += points; }`.
4. `src/systems/CombatSystem.ts`: import `SCORE_POINTS` from `'../config'` (extend the existing `ELITE` import). In `killEnemy()`, between `this.run.registerKill();` and `hook.stats.enemiesKilled += 1;` add `this.run.addScore(e.elite ? SCORE_POINTS.elite : SCORE_POINTS.enemy);`. Do NOT move boss kills through `killEnemy` — leave the two call sites as they are.
5. `src/systems/BossSystem.ts`: add `SCORE_POINTS` to the `'../config'` import. In `killBoss()`, between `this.run.bossKills += 1;` and `hook.stats.bossKills += 1;` add `this.run.addScore(SCORE_POINTS.boss);`.
6. `src/scenes/GameScene.ts`: import `{ loadBestScore, saveBestScore }` from `'../core/bestScore'`. Add `score: number; best: number;` to `RunSummary` (with one-line comments). Add field `private storedBest = 0;` next to `private ending = false;`. In `create()`, right after `this.registry.set('run', this.run);` add `this.storedBest = loadBestScore();`. In `endRun()`, after `hook.stats.deaths += 1;` add `const score = this.run.score;` and `if (score > this.storedBest) saveBestScore(score);`, and build the summary as `{ timeSec: this.run.timeSec, level: this.run.level, kills: this.run.kills, bestStreak: this.run.bestStreak, score, best: Math.max(score, this.storedBest), seed: this.run.seed }`. In `updateHookStats()` add `s.score = this.run.score;` after `s.maxHp = ...`. Add invariant `hook.addInvariant('score', () => (Number.isFinite(this.run.score) && this.run.score >= 0 ? null : `score ${this.run.score}`));` after the `'streak'` one, and append `'score'` to the `INVARIANTS` array.
7. `src/scenes/HudScene.ts`: field `private scoreText!: Phaser.GameObjects.Text;` after `killText`. In `create()`, after the `streakText` line: `this.scoreText = this.add.text(0, 0, 'SCORE 0', textStyle(14, PALETTE.ink)).setOrigin(0, 0.5);`. In `update()`, after the `killText.setPosition(...)` line: `this.scoreText.setPosition(PAD, PAD + 48).setText(`SCORE ${run.score}`);` (y `PAD + 48` = 60 clears the HP/XP bars which end at y≈45, the centered narrow-screen timer, and the boss bar which sits at y≥78 on phones).
8. `src/scenes/GameOverScene.ts`: append to the `lines` array: `` `SCORE ${summary.score}`, `BEST ${summary.best}` ``.
9. `src/debug/testHook.ts`: add `score: number;` to `HookStats` after `maxHp` (live-values group) and `score: 0,` after `maxHp: 0,` in the initializer.
10. `tests/core/core.test.ts`, in `describe('RunState')`: `it('starts at score 0 and only grows through addScore', ...)` — expect 0; `addScore(1); addScore(5); addScore(50)` → 56; `addScore(-5); addScore(0)` → still 56.
11. Run `npm run check` and `npm run smoke`.

### Pitfalls
- T0040 (in-progress, same machine) also edits `testHook.ts`, `CombatSystem.ts`, `BossSystem.ts`, `GameScene.ts` — that is why DEPENDS_ON: re-read all four files right before editing; line numbers above are pre-T0040.
- `score` is a `RunState` field like `kills`, NOT a `PlayerStats` stat — do not touch `core/stats.ts`; upgrades must not affect it.
- `core/` lint bans `window`/`document` but allows `localStorage`; keep it inside the two functions (never at module top level) so Node unit tests can import `bestScore.ts` safely.
- `RunSummary` is built only in `endRun()` and consumed only by `GameOverScene` (whose `onResize` restart reuses the same summary object) — adding fields is safe.
- No new scene, listener, or pooled object: nothing extra to remove on shutdown; the HUD text is driven from `update()`, not an event.
- `localStorage` may throw (private mode) — both helpers must stay wrapped in try/catch; a blocked store must degrade to "best is 0 / not remembered", not an error page.
- Score only ever grows in a run; the `addScore` guard plus the `score` invariant make that provable.

### Tests
- `tests/core/core.test.ts`: the `RunState` addScore test from step 10 (storage helpers are untestable in the node env and mirror `Sfx.readMuted`, which has no tests).

## Result (attempt 1, desktop-4070)

Both gates pass:

- **`npm run check`** — typecheck, lint, and all 164 unit tests (18 files) green
- **`npm run smoke`** — desktop (571 frames) and mobile (726 frames) both PASS in real browsers

The score system is complete:

| Piece | Where |
| --- | --- |
| Points per kill class (`enemy 1 / elite 5 / boss 50`) | `config.ts:21` → `SCORE_POINTS` |
| Monotonic `score` + `addScore()` (ignores ≤ 0) | `core/run.ts:101` |
| Kill scoring — normal/elite via CombatSystem, boss via BossSystem | `CombatSystem.ts:115`, `BossSystem.ts:318` |
| All-time best persisted across reloads, safe when storage is blocked | `core/bestScore.ts` (`scope-creep.best-score`) |
| Best loaded at run start, saved on a new record, shown in summary | `GameScene.ts` (`storedBest`, `RunSummary.score`/`.best`) |
| Live "SCORE N" under the HP/XP bars, top-left | `HudScene.ts` |
| SCORE + BEST lines on the game-over card | `GameOverScene.ts` |
| Hook stats `score`, `'score'` invariant (finite, ≥ 0), removed on shutdown | `testHook.ts`, `GameScene.registerInvariants()` |
| Unit test: awards per-class points, ignores zero/negative | `tests/core/core.test.ts` |

Everything is in the working tree (uncommitted) on `main` — say the word if you want it committed.

- Self-review: APPROVE
- Time: 47.9 min

```
game/src/config.ts               |  3 +++
 game/src/core/bestScore.ts       | 22 ++++++++++++++++++++++
 game/src/core/run.ts             |  7 +++++++
 game/src/debug/testHook.ts       |  2 ++
 game/src/scenes/GameOverScene.ts |  2 +-
 game/src/scenes/GameScene.ts     | 16 ++++++++++++++--
 game/src/scenes/HudScene.ts      |  3 +++
 game/src/systems/BossSystem.ts   |  3 ++-
 game/src/systems/CombatSystem.ts |  3 ++-
 game/tests/core/core.test.ts     | 12 ++++++++++++
 10 files changed, 68 insertions(+), 5 deletions(-)
```
