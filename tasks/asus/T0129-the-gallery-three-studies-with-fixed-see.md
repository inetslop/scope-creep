---
id: T0129
title: The Gallery — three studies with fixed seeds
assignee: asus
size: L
priority: 2
status: todo
depends_on: [T0116, T0124]
attempts: 0
created: 2026-10-27T17:13:57Z
---

## Goal
The menu gains three curated fixed-seed studies — Study in Red, No Level-Ups, Double Shards — each a full run under one stated rule with its own fixed seed and its own persisted best. The player gets something to compare runs against and a way to replay the page under a constraint, without a normal run changing in any way.

## Details
- The menu, below the start button (and the Redactor toggle once T0124 lands), shows three study cards in the Bauhaus style — flat card, 2 u ink frame, the study name in small caps, and a small persisted-best line under it: "BEST 12,340" or a faint "UNPLAYED" while empty. Layout: 412×915 — the three cards stack as a column, each ~64 u tall, with the start button above them; 1280×720 — the three cards sit in a row, each ~180×64 u. A card is activated the same way the start button is (pointer/touch) — no new key, nothing new for the pause-screen controls card to list.
- The three studies. A study run differs from a normal run only in the stated rule; the boss rotation, the hazards (Crop T0045, Gutter T0099, Tide T0127 once it lands), elites, the Underdrawing (T0100), marginalia, the Inkwell and the score all work as in a normal run:
  1. **Study in Red** — the spawn director only ever picks red and orange silhouettes: Wedge, Sentry, Splitter. Splinter and The Frame's wedge minion follow their parents as they always do. Elites are those silhouettes only. Bosses are unchanged.
  2. **No Level-Ups** — the level bar is not drawn, no card ever appears, and shards grant no XP. Kills are worth 2× score and the kill feed (T0106) reads +2 / +10 / +100. A pending Warm Start (T0114) is neither applied nor consumed — it stays armed for the next normal run.
  3. **Double Shards** — every shard is worth 2× XP. The study multiplier applies before the Gilt ×3 (T0112) — a gilt shard in this study is worth 6× base — and before any Redactor halving (T0124), which still applies last.
- Each study uses one fixed seed: three different small positive integers, stored as named constants. A study run is identical every time, enemy placement and shard drops included — with the same studio state (a Warm Start armed or not), since the Warm Start pick draws with the seeded run RNG (T0114).
- At a study run's start, a small-caps note prints the study's name for 2 s in the nameplate idiom (T0064): "STUDY IN RED" / "NO LEVEL-UPS" / "DOUBLE SHARDS".
- Persistence: each study keeps its own best score under its own key (the bestScore pattern, `src/core/bestScore.ts`), separate from the normal-run best and from the other studies. The game-over screen shows the study's best under the score in a study; the verdict stamp (T0128) still works on survival time.

## Acceptance criteria
- [ ] The menu shows the three study cards (name + best or "UNPLAYED") in the Bauhaus style at 412×915 (a column) and 1280×720 (a row); activating a card starts that study; the plain start button still starts a normal run; no new key or input of any kind.
- [ ] Two runs of the same study with the same studio state are identical in enemy placement, elites and shard drops (fixed seed), and the three studies use different seeds from each other.
- [ ] Study in Red: only Wedge, Sentry and Splitter (plus Splinter and the Frame's wedge minion) ever spawn; elites are those silhouettes; bosses, hazards and the score are otherwise unchanged.
- [ ] No Level-Ups: the level bar is absent, no card ever appears, shards grant no XP, the kill feed reads +2/+10/+100, and a run that started with an armed Warm Start ends with it still armed.
- [ ] Double Shards: a normal shard is worth 2× XP and a gilt shard 6×, so level-ups come roughly twice as fast as in a normal run on the same seed.
- [ ] Each study's best persists separately (from the normal-run best and from the other studies') across sessions, and the game-over screen shows the correct best for the mode just played.
- [ ] A normal run is untouched: spawn order, economy, level-ups, hazards and the normal-run best are identical to before this change.

## Design (architect, desktop)

### Files
- create `src/content/studies.ts` — `StudyId`/`StudyDef`, three named seed constants, `STUDIES` registry + `getStudy()` (data only, no Phaser)
- create `src/core/study.ts` — pure rules: `studyShardXp()`, `studyKillScore()`
- edit `src/core/bestScore.ts` — key the best per mode (normal run keeps the legacy key)
- edit `src/core/run.ts` — `study` field + optional 2nd constructor param
- edit `src/systems/ScoreFeed.ts` — `showKill()` takes the points to print
- edit `src/systems/CombatSystem.ts`, `src/systems/BossSystem.ts` — kill score + feed via `studyKillScore`
- edit `src/systems/SpawnSystem.ts` — director built on the study's pool
- edit `src/systems/PickupSystem.ts` — study XP; no gilt roll in No Level-Ups
- edit `src/scenes/GameScene.ts` — start data, study seed, warm-start gate, note sequencing, level-up gate, keyed best, `RunSummary.study`, invariant
- edit `src/scenes/HudScene.ts` — study nameplate in `create()`; hide XP bar + `LV` in No Level-Ups
- edit `src/scenes/GameOverScene.ts` — "Try again" replays the same study
- edit `src/scenes/MenuScene.ts` — real START button + three study cards (pointer/touch only), remove global tap-to-start
- edit `tests/content.test.ts` — `studies` block
- create `tests/core/study.test.ts`

### Interfaces
```ts
// src/content/studies.ts
export type StudyId = 'study-in-red' | 'no-level-ups' | 'double-shards';
export interface StudyDef {
  id: StudyId;
  name: string;          // all caps, printed on the nameplate
  seed: number;          // fixed; run is identical every time for the same studio state
  color: Color;          // menu card's hard-shadow accent (PALETTE.red / blue / yellow)
  spawnPool?: readonly string[]; // director picks only these ids (elites included)
  shardXpMul?: number;   // base shard XP x mul, applied before gilt
  noLevelUps?: boolean;  // no bar, no cards, no shard XP
  scoreMul?: number;     // kill score x mul, every class
}
export const STUDY_IN_RED_SEED = 7; export const NO_LEVEL_UPS_SEED = 11; export const DOUBLE_SHARDS_SEED = 13;
export const STUDIES: readonly StudyDef[];
// [study-in-red, 'STUDY IN RED', pool ['wedge','sentry','splitter'], color PALETTE.red]
// [no-level-ups, 'NO LEVEL-UPS', noLevelUps: true, scoreMul: 2, color PALETTE.blue]
// [double-shards, 'DOUBLE SHARDS', shardXpMul: 2, color PALETTE.yellow]
export function getStudy(id: string): StudyDef; // throws on unknown, like getBoss

// src/core/study.ts
export function studyShardXp(study: StudyDef | null, value: number, gilt: boolean): number; // shardXp(value, gilt) * (noLevelUps ? 0 : shardXpMul ?? 1)
export function studyKillScore(study: StudyDef | null, cls: 'enemy' | 'elite' | 'boss'): number; // SCORE_POINTS[cls] * (scoreMul ?? 1)

// src/core/bestScore.ts
export function bestScoreKey(mode: StudyId | null): string; // null -> 'scope-creep.best-score', else 'scope-creep.best-score.<id>'
export function loadBestScore(mode: StudyId | null = null): number;
export function saveBestScore(mode: StudyId | null, score: number): void; // signature CHANGES — update both call sites

// RunState (src/core/run.ts):  readonly study: StudyDef | null;   constructor(seed: number, study: StudyDef | null = null)
// GameScene: export interface GameStartData { study: StudyId; }  create(data?: GameStartData)   RunSummary: + study: StudyId | null
// ScoreFeed: showKill(x: number, y: number, cls: KillClass, points: number): void
```

### Steps
1. Write `studies.ts` and `study.ts` exactly as above (content must pass the content test: kebab ids, all-caps names, PALETTE colors, pool ids that exist in `ENEMY_BY_ID`).
2. `bestScore.ts`: keep `BEST_SCORE_KEY` and both bodies, route storage through `bestScoreKey(mode)`.
3. `run.ts`: `study` field right after `seed`; param at the END of the constructor; `this.study = study` right after `this.rng = new Rng(seed)`.
4. `ScoreFeed.showKill`: add `points`, `t.setText(\`+${points}\`)`, drop the `SCORE_POINTS` import. In `CombatSystem.killEnemy` and `BossSystem.killBoss` compute `const points = studyKillScore(this.run.study, cls)` once and use it for both `addScore` and `feed.showKill` (drop their `SCORE_POINTS` imports).
5. `SpawnSystem`: field `private readonly director: SpawnDirector;` assigned in the constructor: `new SpawnDirector(run.study?.spawnPool ? run.study.spawnPool.map((id) => getEnemy(id)) : ENEMIES)`. Split children and the Frame's minion call `spawn()` directly — unaffected, as required.
6. `PickupSystem`: `const gilt = this.run.study?.noLevelUps ? false : rollGilt(this.run.rng);` and replace both `shardXp(...)` calls with `studyShardXp(this.run.study, ...)`.
7. `GameScene`: create(data?): `const study = data?.study ? getStudy(data.study) : null;` `this.run = new RunState(study ? study.seed : flags.seed ?? Math.floor(Math.random() * 2 ** 31), study);` (study seed always wins over `?seed`); `this.storedBest = loadBestScore(study?.id ?? null);`. Warm-start block gated on `!study?.noLevelUps` (neither applied nor consumed → flag stays armed). update() first tick: if `warmStartName` is set and `this.run.study` exists, `this.time.delayedCall(2000, () => { this.events.emit(GAME_EVENTS.warmStart, ...); this.warmStartName = ''; })` (study plate owns the first 2 s); normal runs emit at first tick exactly as today. update(): `else if (run.pendingLevelUps > 0 && !this.run.study?.noLevelUps) this.openLevelUp();`. endRun(): `saveBestScore(this.run.study?.id ?? null, score)`; add `study: this.run.study?.id ?? null` to the summary; keep `saveWarmStart(true)` at 8:00 (a study may arm the next normal run). registerInvariants(): add `'study-rules'` — study run: `run.seed === study.seed`; noLevelUps: `level === 1 && xp === 0 && pendingLevelUps === 0`; spawnPool: every active enemy id ∈ pool ∪ `{'splinter','frame-wedge'}`.
8. `HudScene`: create(), after `gameEvents.on(GAME_EVENTS.warmStart, ...)`: if `getRun(this).study`, set the plate exactly like `onNameplate` (setText name, age 0, active, `bossPlatePos`, alpha 1, visible). update(): wrap the XP-bar `drawBar` + `LV` `levelText` lines in `if (!run.study?.noLevelUps) { ... }`.
9. `GameOverScene`: `private study: StudyId | null = null;` set from `summary.study`; `private startRun(): void { this.scene.start(SCENES.game, this.study === null ? undefined : { study: this.study }); }`; use for Try-again and the smoke auto-restart. `onResize` restart keeps passing the full summary.
10. `MenuScene`: replace `input.once('pointerup', start)` and the pulsing prompt with `makeButton(this, width / 2, buttonY, 'START', start, { width: 240, height: 56 })`; keep ENTER/SPACE/gamepad on start. Add `private addStudyCard(x, y, w, h, study: StudyDef)`: graphics 3 u offset shadow in `study.color` + `paperLight` fill + 2 u ink frame; name `textStyle(15, PALETTE.ink, { fontStyle: 'bold' })` at y −9; best line at y +14 `textStyle(13, ...)`: `BEST ${best.toLocaleString('en-US')}` in `inkSoft`, or `UNPLAYED` in `gray` when `loadBestScore(study.id)` is 0; container `.setSize(w, h).setInteractive({ useHandCursor: true })` with `pointerup → this.scene.start(SCENES.game, { study: study.id })`. Layout: `buttonY = height * (portrait ? 0.36 : 0.42)`; `cardsTop` = 12 u below T0124's Redactor toggle if it now sits between button and cards, else `buttonY + 28 + 16`; cardH 64; portrait: cards `width − 64` wide, centers `(w/2, cardsTop + 32 + i * 72)`; landscape: 180 wide, centers `(w/2 + (i − 1) * 196, cardsTop + 32)`. Warm-start note to `height * (portrait ? 0.73 : 0.74)`, hint to `height * (portrait ? 0.79 : 0.80)`. Move the center blue circle decoration from 0.44h to 0.27h in portrait (at 0.44h it would peek through the card gaps).
11. Tests, then `npm run check` and `npm run smoke`.

### Pitfalls
- The normal run must stay byte-identical: `studyShardXp(null)` = old `shardXp`, `studyKillScore(null)` = `SCORE_POINTS`, `bestScoreKey(null)` = legacy key, GameOver passes `undefined` data. If smoke fails, this is what broke.
- No Level-Ups: skip the gilt *roll* itself (a rolled gilt shard would pop a "+0" GiltPop); `xp` stays exactly 0; the `openLevelUp` gate is belt-and-braces (nothing else feeds `pendingLevelUps`).
- Warm-start note: exactly one emission per run — the 2 s `delayedCall` in a study, first-tick in a normal run; a shutdown before firing clears the timer harmlessly.
- `showKill` and `saveBestScore` signature changes: every call site is updated in this same change (two `showKill` callers; `loadBestScore` in GameScene+MenuScene, `saveBestScore` in GameScene).
- Menu: no global tap-to-start may remain (it would swallow card taps); cards 64 u and button 56 u satisfy the 44 u touch minimum; no new key — cards are pointer/touch only, nothing for the pause controls card.
- `run.ts` is also touched by T0116 (lands first): keep the hunk local (field next to `seed`, param at the end) so it merges clean.
- Don't touch the director's dt/budget logic to chase determinism: a study is identical per dt stream; the fixed seed + fixed rules are what the criterion checks.

### Tests
- `tests/core/study.test.ts`: `studyShardXp` (null = value / 3× gilt; double-shards 2× / 6×; no-level-ups 0); `studyKillScore` (null = 1/5/50; no-level-ups = 2/10/100); `bestScoreKey(null)` is the legacy key and save/load keeps null and each study id separate (Node 24 in-memory localStorage, `localStorage.clear()` between tests); a director driven 1200 s on the `[wedge, sentry, splitter]` pool with `Rng(7)` never emits another id and produces all three silhouettes plus elites.
- `tests/content.test.ts`: new `studies` block — exactly the three ids, kebab-case, non-empty all-caps names, three distinct small positive integer seeds (< 1000), colors in PALETTE, pool ids in `ENEMY_BY_ID`, `noLevelUps` and `shardXpMul` mutually exclusive, `getStudy('nope')` throws.
