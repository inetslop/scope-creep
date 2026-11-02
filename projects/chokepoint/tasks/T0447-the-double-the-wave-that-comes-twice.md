---
id: T0447
title: "The double: the wave that comes twice"
assignee: desktop
size: L
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T22:27:29Z
claimed_at: 2026-11-02T22:34:33Z
epic: E22
---

## Goal
The fifth wave tag, "double": from wave 21, deep-run waves sometimes come in two fronts — a first pulse, a lull, and a faster second front — so a wave can test the whole road, not only its front, and the player reads the second front coming on the next-wave button.

## Details
- The tag: "double". From wave 21, every 8th wave that is not quiet, tight, rush, short cut or a boss wave wears the tag. The schedule rides the short cut's own shape (isShortCutWave in core/waves.ts, T0440 — the closest example): a wave wears one tag, and a boss wave's plan is never tagged.
- The split: the plan's enemies in order — the first pulse is the first half (rounded up), the second pulse the rest. The second pulse's walkers walk at 1.2× the wave's own speed (the thin road's 10% slow still applies; a Flyer crosses as it always does).
- The lull: between the pulses, exactly 6 s of simulation time with no enemy on the road (2× fast-forward scales it like everything else, T0019).
- The wave's remainder: through the lull the next-wave button keeps its usual meaning — the second pulse's count still counts as coming.
- The chip: "double" on the preview card's chip line and on the wave banner's chip, the tag chip's existing mechanism (the chip rides the plan's tags, T0422, T0080) — no change to the preview's token row.
- The teach: the first double wave's preview names it once, under the preview card, the tag-teach's shape (T0092): "the wave comes twice — the second front walks faster".
- The wave ends when the second pulse is cleared (kills or leaks), as usual; the wave bonus is the normal one for its number.
- The waves reference (the pause's waves card, T0264) lists the double — it reads core/waves.ts; if the list is not automatic, add the line there.

## Acceptance criteria
- [ ] A unit test pins the double schedule: from wave 21 every 8th non-quiet/tight/rush/short-cut/boss wave is double, no wave wears two tags, and no boss wave is double.
- [ ] In a double wave the first half spawns on schedule, the lull runs 6 s of simulation time with no enemy on the road, and the second half spawns with its walkers at 1.2× speed.
- [ ] The preview shows the wave's total count with the "double" chip; the banner wears the "double" chip.
- [ ] The first double wave's preview shows the teach line once, never again in that run.
- [ ] The next-wave button's count through the lull includes the second half.
- [ ] The waves reference card lists the double.

## Design (architect, desktop)

### Files
- edit `src/core/waves.ts` - add `isDoubleWave`, `DOUBLE_LULL_SEC`, `DOUBLE_SPEED_MUL`, `doubleSplitAt`, `doubleLull` (after `shortCutSpawnDistance`, next to the short cut's code); add `: isDoubleWave(wave) ? ['double']` to the tags chain in `planNormalWave`'s return, before the final `: []`
- edit `src/systems/WaveSystem.ts` - `start()`: wrap the chosen plan in `doubleLull` when it is a double wave; `update()`: apply `DOUBLE_SPEED_MUL` to the second front's walkers
- edit `src/core/waveTags.ts` - add the `double` row to `WAVE_TAG_ROWS` between the `rush` and `short cut` rows; add `isDoubleWave` to the import
- edit `src/ui/hud/NextWavePreview.ts` - add the `double` entry to the `TEACH` table between the `rush` and `short cut` entries
- edit `src/debug/runChecks.ts` - rewrite the `level.speed` line to allow the double speed; add a `waves.doublePlan` line after `waves.shortCutPlan`
- edit `tests/core/waveTags.test.ts` - the row list becomes `['quiet','tight','boss','rush','double','short cut']`, `first` becomes `[4, 6, 10, 11, 21, 34]`; add `expect(nextTaggedWave(0, isDoubleWave)).toBe(21);` (import `isDoubleWave`)
- create `tests/core/doubleWaves.test.ts` - pins the schedule, the tag, the lull (model on `tests/core/shortCutWaves.test.ts`)

### Interfaces
In `src/core/waves.ts`:
```ts
export function isDoubleWave(wave: number): boolean; // wave >= 21 && (wave - 21) % 8 === 0 && !quiet && !tight && !rush && !shortCut && !boss (same yields style as isShortCutWave; 53 is rush's slot, 61 the short cut's)
export const DOUBLE_LULL_SEC = 6;
export const DOUBLE_SPEED_MUL = 1.2;
export function doubleSplitAt(count: number): number; // Math.ceil(count / 2): the second front's first spawn index
export function doubleLull(plan: WavePlan): WavePlan; // same plan, same order; spawns[doubleSplitAt] gets delaySec exactly DOUBLE_LULL_SEC (replacing its gap), all other fields untouched
```
In `WaveSystem.start()`, replacing line 57:
```ts
const plan0 = this.planned ?? planWithLevel(planWave(this.run.wave, this.run.rng, ENEMIES), levelCountMul(this.run.level));
this.plan = isDoubleWave(plan0.number) ? doubleLull(plan0) : plan0;
```
In `WaveSystem.update()`: compute `const doubleAt = isDoubleWave(plan.number) ? doubleSplitAt(plan.spawns.length) : Infinity;` before the while loop; inside it, `const def = getEnemy(spawn.enemy);` and pass `speedMul * (this.next >= doubleAt && !def.flies ? DOUBLE_SPEED_MUL : 1)` as the spawn's `speedMul` argument (the 5th of `enemies.spawn`), passing `def` instead of re-looking it up.
`waveTags.ts` row: `{ tag: 'double', chip: PALETTE.yellowDeep, name: 'double', meaning: 'it comes in two fronts, the second faster', when: 'every 8th, from 21', rule: isDoubleWave }`.
`NextWavePreview` TEACH entry: `{ tag: 'double', first: 21, text: 'double — the wave comes twice, the second front walks faster' }`.

### Steps
1. `core/waves.ts`: add the five exports after `shortCutSpawnDistance`; add `isDoubleWave(wave) ? ['double']` as the last non-empty branch of the tags chain in `planNormalWave`.
2. `core/waveTags.ts`: add the row + import.
3. `systems/WaveSystem.ts`: the `start()` and `update()` changes above; extend the existing `../core/waves` import with `doubleLull, doubleSplitAt, isDoubleWave, DOUBLE_SPEED_MUL`.
4. `ui/hud/NextWavePreview.ts`: the TEACH entry. Nothing else: the preview chip, the banner chip (`WaveBanner` → `topBanner.show` → `tagChip`), the preview's total count, the waves reference card (`WavesScene` reads `WAVE_TAG_ROWS`) and the next-wave button's count through the lull (`RunFlow.enemiesLeft` = `waves.remaining` + alive, and `spawningDone` is false during the lull) are all automatic — do not touch them.
5. `debug/runChecks.ts`: rewrite line 210 to `['level.speed', (g) => { const base = levelSpeedMul(g.run.level) * waveWalkFactor(g.run.techOwned) * waveSpeedMul(g.run.wave); const double = g.waves.currentPlan?.tags.includes('double') === true; return g.enemies.all.every((e) => !e.active || e.speedMul === base || (double && e.speedMul === base * DOUBLE_SPEED_MUL)) ? null : 'an enemy walks at the wrong level, walk or wave speed factor'; }]`; add after line 213: `['waves.doublePlan', (g) => { const p = g.waves.currentPlan; if (!p || !p.tags.includes('double')) return null; return p.spawns.length >= 2 && p.spawns[doubleSplitAt(p.spawns.length)]!.delaySec === DOUBLE_LULL_SEC ? null : \`the double wave ${p.number} has no ${DOUBLE_LULL_SEC}s lull at its split\`; }];` extend the `core/waves` import with `DOUBLE_LULL_SEC, DOUBLE_SPEED_MUL, doubleSplitAt`.
6. Tests: create `tests/core/doubleWaves.test.ts` with: (a) `[19,20,21,29,37,45,52,53,60,61,69,77,85,93].map(isDoubleWave)` → `[false,false,true,true,true,true,false,false,false,false,true,true,true,true]`; (b) `planWave(w, new Rng(w), ENEMIES).tags` is `['double']` for 21,29,37,45,69,77,85,93 with `hpMul` `waveHpMul(w)`, first delay 0, all delays ≥ 0; (c) `doubleLull` on a 5-spawn plan sets exactly `DOUBLE_LULL_SEC` at index 3, keeps order and the other gaps, and `doubleLull` on 4 spawns sets it at index 2 (`doubleSplitAt` 5→3, 4→2); (d) seeded range 1..100: `plan.tags` equals the boss/quiet/tight/rush/short-cut/double chain (one tag at most) and no boss wave carries `double`. Update `tests/core/waveTags.test.ts` as listed.

### Pitfalls
- Apply `doubleLull` in `WaveSystem.start()` (after `planWithLevel`), never in `planWave`: the Crowded level's extras append to the plan, and the split/speed must ride the plan actually sent, so the lull index and the speed index stay the same.
- The lull is exactly 6 s: *replace* the split spawn's gap with `DOUBLE_LULL_SEC`, do not add to it.
- Without the `level.speed` invariant rewrite, smoke fails the moment the second front walks (its `speedMul` is base × 1.2).
- Never speed up a Flyer (`def.flies`): it crosses as it always does; the thin road's `walkMul` stays in the product, so the 10% slow still applies.
- No new rng draws anywhere (`isDoubleWave`/`doubleLull` are pure), so seeded plans of non-double waves stay byte-identical.
- The teach is re-derived, never stored: shown while the double plan previews and `run.wavesCleared < 21`; the card auto-grows one line and `fitScale()` shrinks it (longest line ≈ 400 px fits 412×915 at ~0.88 scale, like the existing teach lines).
- The lull is a delay consumed by the dt-based spawn timer, so 2× fast-forward scales it automatically; do not add a clock.

### Tests
- `tests/core/doubleWaves.test.ts` (new, as in step 6) and the two-line update to `tests/core/waveTags.test.ts`.
