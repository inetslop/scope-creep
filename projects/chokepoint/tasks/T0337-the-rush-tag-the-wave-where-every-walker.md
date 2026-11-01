---
id: T0337
title: "The rush tag: the wave where every walker comes faster"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T03:39:37Z
---

## Goal
The wave rhythm (quiet, tight, boss) gains its third tag: a rush wave where every walker moves 1.5× faster — a speed spike between the quiet breather and the tight press, read in the preview and answered with slows and roots, so the late waves (the Hive's and the Flyer's peaks) alternate against a rhythm instead of a flat climb.

## Details
- **The rule:** from wave 11, every 7th wave that is not already quiet, tight or boss carries the "rush" tag — waves 11, 18, 25 and 39 first (32 is quiet, 46 tight, 60 the boss — each collision keeps its own tag, the tight tag's yield-to-quiet rule). The tag's data lives with the other tags in core/waves.ts (the tag table the waves reference reads, T0264).
- **The effect:** the rush wave's plan is otherwise unchanged — same count, hp, mix and intervals — except its walkers move at 1.5× their normal speed: the wave's speed factor, stacked with the level Swift's ×1.15 when it is on (a Swift run's rush wave walks at 1.675×). The factor is the walk speed: the Dasher's dash keeps its 3-cell distance (the flash is 1.5× faster), the Sprinter's ramp rides the faster base, and a Frost slow or an Anchor root holds a rush walker exactly as usual (the control multiplies the already-faster speed).
- **Compared with the rhythm:** quiet thins the wave and pays double gold (a breather); tight halves the spawn intervals (a density press); rush keeps the whole wave and speeds the walkers — the exposure time per enemy, not the count or the gap, is what changes; it is the wave-level shape of the Sprinter's ramp and the Dasher's surge (per-enemy speed) as a wave.
- **On screen (the tag's own language, no new HUD):** the rush wave's preview shows the tag's chip and one muted teach line under the card — "rush — the walkers move 1.5× faster" (the quiet and tight tags' line, T0092); the wave banner wears the chip — "Wave 11 · rush" (T0080's pattern); the waves reference (T0264) grows its row from the tag table (chip, meaning, next one) with no change to that file.
- No new HUD element, input, sound or mark on the board; the 2× fast-forward, the level augments and the tight tag all compose with it (2× on a rush wave is the player's own call).

## Acceptance criteria
- [ ] Waves 11, 18, 25 and 39 carry the "rush" tag and their walkers spawn at 1.5× speed; a colliding wave (32 quiet, 46 tight, 60 boss) keeps its own tag; every other wave's plan is byte-identical, including the 10, 20, 30, 40 and 50 boss plans.
- [ ] The rush wave's count, hp, mix and intervals equal its untagged plan; the factor stacks with level Swift (1.675×); the Dasher's dash distance stays 3 cells, the Sprinter's cap rides the faster base, and a rooted or slowed rush walker is held as usual (unit tests).
- [ ] The wave 10 build phase's preview shows the "rush" chip and the teach line under the card; the wave banner reads "Wave 11 · rush"; the waves reference lists the new row (chip, meaning, next one) read from the tag table.
- [ ] No new HUD element, input, sound or board mark; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.

## Design (architect, desktop)

### Files
- edit `src/core/waves.ts` — add `isRushWave()` + `waveSpeedMul()` (after `tightHalve`, before `isBossWave`); add the rush branch to the `tags` ternary at the end of `planNormalWave` (line 203)
- edit `src/core/waveTags.ts` — one new row in `WAVE_TAG_ROWS` (after the boss row, in encounter order) + new `tagChip()` helper; import `isRushWave`
- edit `src/entities/Enemy.ts` — new pooled field `waveSpeedMul`, one `spawn()` parameter, one division in the Dasher's pause leg
- edit `src/systems/EnemySystem.ts` — `spawn()` gains the `waveSpeedMul` parameter and passes it through (2 lines)
- edit `src/systems/WaveSystem.ts` — `update()` computes the wave's speed factor once and passes it to `spawn()`; import `waveSpeedMul`
- edit `src/systems/enemyHooks/split.ts` — child inherits the parent's `waveSpeedMul` (1 line)
- edit `src/systems/enemyHooks/midSplit.ts` — same (2 lines)
- edit `src/ui/hud/NextWavePreview.ts` — one `TEACH` line; chip fill via `tagChip()` (replaces the ternary)
- edit `src/ui/hud/topBanner.ts` — chip fill via `tagChip()` (replaces the ternary)
- edit `src/debug/runChecks.ts` — `level.speed` invariant multiplies by the wave's factor; import `waveSpeedMul`
- edit `tests/core/waveTags.test.ts` — the row-list assertion gains `'rush'` and `first` gains `11` (existing test breaks otherwise)
- create `tests/core/rushWaves.test.ts` — the new rule's unit tests
- `src/scenes/WavesScene.ts` is NOT touched: the reference row grows from the table, as the task requires

### Interfaces
```ts
// src/core/waves.ts (no other changes)
export function isRushWave(wave: number): boolean; // wave >= 11 && (wave-11) % 7 === 0 && !isQuietWave && !isTightWave && !isBossWave
export function waveSpeedMul(wave: number): number; // 1.5 on a rush wave, 1 otherwise

// src/core/waveTags.ts
export function tagChip(tag: string): number; // WAVE_TAG_ROWS row's chip, ?? PALETTE.faint
// WAVE_TAG_ROWS row, after the boss row:
{ tag: 'rush', chip: PALETTE.orangeDeep, name: 'rush', meaning: 'the walkers move 1.5× faster', when: 'every 7th, from 11', rule: isRushWave },

// src/entities/Enemy.ts
waveSpeedMul = 1; // field; reset in spawn() like speedMul
spawn(def: EnemyDef, hpMul: number, path: PathLine, speedMul = 1, waveSpeedMul = 1, distance = 0): void;
// src/systems/EnemySystem.ts
spawn(def: EnemyDef, hpMul: number, speedMul = 1, waveSpeedMul = 1, distance = 0): Enemy;
// src/core/waves.ts line 203 becomes:
tags: isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : isRushWave(wave) ? ['rush'] : []
```

### Steps
1. `core/waves.ts`: add the two functions (comments: rush yields to quiet/tight/boss; factor multiplies Swift — 1.15 × 1.5 = 1.725); extend the tags ternary on line 203. Nothing else in `planWave` changes, so every non-rush plan stays byte-identical (no extra rng draws, no spawn transforms).
2. `core/waveTags.ts`: import `isRushWave`; add the row; add `tagChip()` after the table.
3. `entities/Enemy.ts`: add the field with comment `/** The wave's speed factor it took (the rush wave: 1.5); its split children take the same. */` after `speedMul` (line 32); `this.waveSpeedMul = waveSpeedMul;` in `spawn()` after the `speedMul` reset (line 93); in `advance()`'s dash case change line 184 to `this.dashLeft = c.pauseSec / this.waveSpeedMul;`. Do NOT touch the crawl duration, the dash leg's `(c.dashCells / c.dashSec) * CELL` speed, `slow()`/`root()` or the ramp cap in `hit()` — they already ride `this.speed`, which carries the factor.
4. `systems/EnemySystem.ts`: add the parameter to `spawn()` and pass it at line 98: `enemy.spawn(def, hpMul, this.board.path, speedMul, waveSpeedMul, distance);`.
5. `systems/WaveSystem.ts`: in `update()`, after `if (!plan) return;` add `const waveMul = waveSpeedMul(plan.number); const speedMul = levelSpeedMul(this.run.level) * waveMul;` and change the spawn call to `this.enemies.spawn(getEnemy(spawn.enemy), plan.hpMul * this.run.levelHpMul, speedMul, waveMul);`.
6. `split.ts` line 10: `enemies.spawn(child, enemy.hpMul, enemy.speedMul, enemy.waveSpeedMul, d);`. `midSplit.ts` line 20: capture `wm = e.waveSpeedMul` in the existing destructuring line; line 22: `enemies.spawn(child, half / child.hp, sm, wm, dd);`.
7. `NextWavePreview.ts`: import `tagChip`; add to `TEACH` after the boss line: `{ tag: 'rush', first: 11, text: 'rush: the walkers move 1.5× faster' },`; line 119 becomes `chip.fillStyle(tagChip(tag), 1);`. No layout code changes — the card already sizes itself from the teach line and scales to fit.
8. `topBanner.ts`: import `tagChip`; line 67 becomes `g.fillStyle(tagChip(tag), 1);` (banner reads `currentPlan.tags`, so "Wave 11 · rush" needs nothing else).
9. `debug/runChecks.ts` line 109: `['level.speed', (g) => (g.enemies.all.every((e) => !e.active || e.speedMul === levelSpeedMul(g.run.level) * waveSpeedMul(g.run.wave)) ? null : 'an enemy walks at the wrong level or wave speed factor')],`; line 10 becomes `import { bossId, waveSpeedMul } from '../core/waves';`.
10. `tests/core/waveTags.test.ts`: line 19 → `['quiet', 'tight', 'boss', 'rush']`; line 20 → `const first = [4, 6, 10, 11];`; adjust the `it` wording "the three tags" → "the tags".
11. Create `tests/core/rushWaves.test.ts` (model on `tightWaves.test.ts`): `isRushWave` table `[5,10,11,17,18,24,25,32,39,46,53,60].map(isRushWave)` → `[false,false,true,false,true,false,true,false,true,false,true,false]`; `waveSpeedMul(11)===1.5`, `waveSpeedMul(12)===1`; `levelSpeedMul(['swift']) * waveSpeedMul(11)` `toBeCloseTo(1.725)`; for `[11,18,25,39]`: `planWave(w, new Rng(w), ENEMIES).tags` `toEqual(['rush'])`, `spawns.length > 0`, first `delaySec === 0`, all delays ≥ 0; collisions: 32 → `['quiet']`, 46 → `['tight']`, 60 → `['boss']`.
12. `npm run check`, then `npm run smoke` (desktop 1280×720 + mobile 412×915).

### Pitfalls
- The task's "1.675×" is a misprint: 1.15 × 1.5 = **1.725**, and stacking in this codebase is always the product (`levelSpeedMul`). Never hard-code 1.675; the test asserts the product.
- The `level.speed` invariant (step 9) MUST change in the same commit, or smoke fails on every rush wave. Compute the product in the identical expression in WaveSystem and the invariant so `===` holds on floats.
- Pooling: `waveSpeedMul` must be reset in `spawn()` or a recycled Dasher keeps a shortened wind-up from a previous rush wave.
- Split/midSplit children must inherit the parent's factor (steps 6) — they are walkers of the rush wave, and the invariant fires otherwise.
- Do not scale the Dasher's surge speed or the Sprinter's `ramp.max * CELL` cap with the factor: only `this.speed` (walk) and the wind-up duration (`pauseSec`) change. That is what keeps the dash at 3 cells, the Sprinter's cap on the faster base, and Frost/Anchor holding rush walkers exactly as a slowed or rooted fraction of `this.speed` (no code there changes).
- `WavesScene` and `WaveBanner` stay untouched; they read the table/plan. Chip colors live only in `WAVE_TAG_ROWS` after this change — don't leave a third ternary anywhere.

### Tests
- `tests/core/rushWaves.test.ts` as specified in step 11 (new core rule: predicate, factor, Swift stacking, tag, collisions, plan shape).
- Update existing `tests/core/waveTags.test.ts` (step 10). Dasher/Sprinter/slow composition is carried by the unchanged `Enemy` math plus the smoke's `level.speed` invariant.
