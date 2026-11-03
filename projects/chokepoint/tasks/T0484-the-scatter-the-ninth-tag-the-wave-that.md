---
id: T0484
title: "The scatter: the ninth tag — the wave that appears across the road"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-03T09:29:27Z
claimed_at: 2026-11-03T10:16:56Z
finished_at: 2026-11-03T10:29:58Z
---

## Goal
The wave's tag set grows with a ninth tag: on a scatter wave the walkers do not walk in from the gate — each one pops in at a random point across the front half of the road. The wave has no front and no order, the board lights up all at once, and the answer is spread coverage: a tower at the road's middle covers the spawn zone and the back stretch, and a misplaced choke tower is a move (E15) against the preview's chip.

## Details
- **The rule.** A wave N is a scatter wave when N >= 19, N mod 9 == 1, and it is not a boss wave (a multiple of 10), not a quiet wave (a multiple of 4) and not already tagged by another march tag. The scatter joins the tag chain the short cut joined: one march tag per wave, the scatter never replaces an earlier tag (a candidate that is quiet, boss or already tagged keeps that tag). The tag's rule is a pure function of the wave number, like the other tags.
- **The spawn.** On a scatter wave every road-walking enemy spawns at a random point 15–55% of the way along its own road from its gate (one uniform roll per enemy, from the run's rng, so two runs of the same wave scatter to different points), with the normal spawn pop-in at that point — never at the gate, never past the road's middle. Spawn timing, enemy mix, threat, kill gold, clear bonus and every other wave value are exactly what an untagged wave of the same number has: only the spawn position changes. On a two-gate board each enemy scatters along the road of the gate it would have spawned from (the short cut's "own road" rule). The Flyer ignores the scatter (it never walks the road), and the boss lane never scatters (boss waves do not take the tag).
- **Why it is not a re-tuned short cut.** The short cut shifts the whole wave 40% back the road: the wave keeps its order and its front, and the answer is covering the back stretch. The scatter gives every enemy its own position: the wave has no front, order or shape, and a single choke stops nothing — enemies pop in behind it. The answer is covering everything in the front half.
- **The read.** No new mark and no new HUD element: the pop-in at the scatter point is the read. The preview's chip row shows the "scatter" chip during the build before the wave (the tag-chip row's pattern, T0422); the run's first scatter wave shows the one-time teach chip under the preview where the preview shows, "scatter: the wave appears across the road" (the T0092 pattern); the banner wears the chip at the wave's start (T0080); the tag's note (T0457) and the haptic (T0449) cover it as they cover every tagged wave — no new sound or buzz is defined here.
- **The reference.** The waves reference names itself from the plan's entry (T0264's pattern): name "scatter", line "the wave appears across the road".

## Acceptance criteria
- [ ] The tag rule is a pure function of the wave number and unit-tested over a range of N: N >= 19 and N mod 9 == 1 and not quiet, not boss and not already march-tagged gives "scatter"; a candidate that is quiet, boss or already tagged keeps its earlier tag.
- [ ] On a scatter wave every road-walking enemy pops in at a random point 15–55% along its own road (never at the gate, never past the middle); two runs of the same wave scatter to different points (the run's rng); the Flyer and the boss lane are untouched.
- [ ] A scatter wave's spawn timing, enemy mix, threat, kill gold and clear bonus are identical to an untagged wave of the same number.
- [ ] The build phase before a scatter wave shows the "scatter" chip on the preview's chip row; the run's first scatter wave shows the one-time teach chip under the preview where the preview shows: "scatter: the wave appears across the road".
- [ ] At the wave's start the banner wears the "scatter" chip, the tag's note plays and the haptic buzzes (the existing tag rows — nothing new defined here).
- [ ] The waves reference lists the tag: "scatter — the wave appears across the road".
- [ ] The game is playable end to end; the smoke test passes on desktop and mobile.

## Design (architect, desktop)

### Files
- edit `src/core/waves.ts` - the tag rule `isScatterWave`, the spawn-point roll `scatterSpawnDistance`, and one more case in the plan's tag chain
- edit `src/core/waveTags.ts` - one row for the reference/preview/banner chip (`tagChip` reads it)
- edit `src/systems/WaveSystem.ts` - roll the scatter point per spawned walker; add 'scatter' to the tag-note list
- edit `src/ui/hud/NextWavePreview.ts` - one line in the `TEACH` table (the one-time teach chip)
- edit `src/debug/runChecks.ts` - one invariant line, next to the other wave-plan invariants
- create `tests/core/scatterWaves.test.ts` - the rule, the tag, the roll
- edit `tests/core/waveTags.test.ts` - nine rows, `nextTaggedWave` read-offs
- edit `tests/core/shortCutWaves.test.ts`, `tests/core/doubleWaves.test.ts`, `tests/core/clumpsWaves.test.ts`, `tests/core/screenWaves.test.ts` - their "seeded range" 1–100 tag sweep hardcodes the chain and would fail without the new case (one import + one line each)

### Interfaces
In `src/core/waves.ts` (after the `screenFront` block, before `planWave`; `Rng` is already imported):
```ts
/**
 * Every 9th wave from wave 19 is the scatter (19, 55, 82, 91, ... — 28 is the quiet wave's slot,
 * 37 the double wave's, 46 a tight wave, 64 a quiet wave, 73 the screen wave's, 100 the boss
 * wave's and 109 the rush wave's): the wave's road walkers pop in at their own points across the
 * front half of the road, so the wave has no front and no order and the answer is spread
 * coverage. It yields to a quiet, tight, rush, short cut, double, clumps, screen or boss wave,
 * which keeps its own tag.
 */
export function isScatterWave(wave: number): boolean {
  return wave >= 19 && (wave - 19) % 9 === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isRushWave(wave) && !isShortCutWave(wave) && !isDoubleWave(wave) && !isClumpsWave(wave) && !isScreenWave(wave) && !isBossWave(wave);
}

/**
 * The spawn distance for a scatter wave's spawn: its entrance, plus a uniform roll 15–55% down the
 * line left of the entrance, so each road walker pops in at its own point on the road it walks
 * from its own gate. One roll per walker on the run's rng, so two runs of the same wave scatter
 * to different points; a wave that is not a scatter wave rolls nothing and spawns at its entrance.
 */
export function scatterSpawnDistance(wave: number, rng: Rng, lineLength: number, entranceDistance: number): number {
  return entranceDistance + (isScatterWave(wave) ? rng.range(0.15, 0.55) : 0) * (lineLength - entranceDistance);
}
```
No other signatures change: `WavePlan`, `WaveSpawn`, `EnemySystem.spawn` all stay.

### Steps
1. `src/core/waves.ts`: add the two functions above. In `planNormalWave`'s final `return` (the tag chain), insert `isScatterWave(wave) ? ['scatter'] : ` between `? ['screen'] :` and `[]` — last, so it never replaces an earlier tag.
2. `src/core/waveTags.ts`: import `isScatterWave` (alphabetical, before `isScreenWave`), and insert this row between the `rush` and `double` rows (order of first meeting: 19 sits between 11 and 21):
   `{ tag: 'scatter', chip: PALETTE.iceDeep, name: 'scatter', meaning: 'the wave appears across the road', when: 'every 9th, from 19', rule: isScatterWave },`
   This single row feeds the preview chip, the banner chip and the WavesScene reference row (`next: wave N` via `nextTaggedWave`).
3. `src/systems/WaveSystem.ts`: (a) add `isScatterWave` (before `isScreenWave`) and `scatterSpawnDistance` (after `screenFront`) to the `core/waves` import; (b) in `update()`, replace the last two lines of the spawn loop with:
   ```ts
   const line = this.enemies.routeForLane(lane).length;
   // The scatter (core/waves.ts): every road walker pops in at its own point 15–55% down the road it walks from its own gate, one roll per enemy on the run's rng; the Flyer never rolls.
   const dist = isScatterWave(plan.number) && !def.flies ? scatterSpawnDistance(plan.number, this.run.rng, line, entrance) : shortCutSpawnDistance(plan.number, line, entrance);
   this.enemies.spawn(def, plan.hpMul * this.run.levelHpMul, speedMul * (this.next >= doubleAt && !def.flies ? DOUBLE_SPEED_MUL : 1), waveMul, this.walkMul, dist, lane);
   ```
   (c) in `start()`, add `'scatter'` after `'screen'` in the tag-note `includes` list and change its comment "six march tags" to "seven". The haptic line needs no change (`t !== 'quiet'` already covers it).
4. `src/ui/hud/NextWavePreview.ts`: insert in `TEACH` between the `rush` and `double` lines: `{ tag: 'scatter', first: 19, text: 'scatter: the wave appears across the road' },`
5. `src/debug/runChecks.ts`: after the `waves.screenPlan` line add: `['waves.scatterPlan', (g) => { const p = g.waves.currentPlan; if (!p || !p.tags.includes('scatter')) return null; return p.spawns.length > 0 && p.spawns.every((s) => s.delaySec >= 0) ? null : `the scatter wave ${p.number} plan is not a plain wave plan`; }],`
6. `tests/core/scatterWaves.test.ts` (model `shortCutWaves.test.ts`): (a) `isScatterWave` over `[18, 19, 27, 28, 36, 37, 45, 46, 54, 55, 63, 64, 72, 73, 81, 82, 90, 91, 99, 100, 108, 109]` → `[F, T, F, F, F, F, F, F, F, T, F, F, F, F, F, T, F, T, F, F, F, F]`; (b) `planWave(w, new Rng(w), ENEMIES)` for `[19, 55, 82, 91]` wears `['scatter']`, `hpMul` right, first delay 0, all delays ≥ 0; (c) collisions keep their tag: 28/64 `['quiet']`, 37 `['double']`, 46 `['tight']`, 73 `['screen']`, 100 `['boss']`, 109 `['rush']`; (d) `scatterSpawnDistance(55, new Rng(1), 100, 0)` in `[15, 55)`, repeatable with the same seed; far gate `scatterSpawnDistance(82, new Rng(2), 80, 30)` in `[37.5, 57.5)`; a non-scatter wave (34) returns exactly the entrance and leaves a twin seeded `Rng`'s stream untouched (compare `next()` before/after); (e) the 1–100 seeded-range sweep with the full chain plus `isScatterWave(wave) ? ['scatter'] : []`.
7. `tests/core/waveTags.test.ts`: import `isScatterWave`; add `expect(nextTaggedWave(0, isScatterWave)).toBe(19)` and `expect(nextTaggedWave(19, isScatterWave)).toBe(55)`; update the row test to the nine tags `['quiet','tight','boss','rush','scatter','double','clumps','short cut','screen']` with `first = [4, 6, 10, 11, 19, 21, 26, 34, 51]` (and its "eight" → "nine" wording).
8. In each of the four sweep test files, add `isScatterWave` to the `core/waves` import and insert `: isScatterWave(wave) ? ['scatter']` before `: []` in the `want` chain.
9. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The 1–55% roll is the spec's number (it appears in both the rule and the acceptance criteria); "never past the middle" is the loose half of that phrasing — implement and test `[15, 55)` exactly, do not clamp to 50.
- Roll only for `!def.flies` walkers, and only when `isScatterWave(plan.number)` — boss waves never take the tag, so the boss lane is untouched; a stray roll for a Flyer would shift the run's rng stream.
- Do not move the roll to plan time: `WaveSpawn` carries no position, and spawn-time rolling matches the Flyer's existing spawn-time rng use. Spawn timing, mix, gold and bonus stay untouched structurally — scatter has no plan-shaping step (no `quietHalve`/`doubleLull`-like function), which is exactly what `waves.scatterPlan` guards.
- Keep the new `WAVE_TAG_ROWS` and `TEACH` lines in order-of-first-meeting (between rush and double), not appended — the file's own order and the updated test both assume it.
- No new chip glyph: leave `tag === 'screen' ? 7 : 0` alone in all three places; the "scatter" chip is plain text, and the preview/banner/reference widths all compute from it.
- Preview teach line is the longest card line it can be there ("scatter: the wave appears across the road", ~41 chars at 14 px) — it is one of the measured `lines`, so `cardW`/`cardH`/`fitScale` already fit it at 412x915; do not place it at a fixed y.

### Tests
- `tests/core/scatterWaves.test.ts` as specified in step 6 (rule over a range, tag worn, collisions, roll bounds/seed/determinism/no-roll-off, 1–100 sweep).
- Edits to `waveTags.test.ts` and the four sweep tests as in steps 7–8.

## Result (attempt 1, desktop)

Added the ninth wave tag "scatter" (every 9th wave from 19, yielding to all other tags): road walkers now pop in at their own random point 15–55% down the road they walk from their own gate, so the wave has no front and the answer is spread coverage. The rule and per-enemy spawn roll live in `core/waves.ts`, the spawn in `WaveSystem.ts`; the single new row in `core/waveTags.ts` drives the preview chip, banner chip and the WavesScene reference entry, with a one-time teach chip in `NextWavePreview.ts` and a `waves.scatterPlan` invariant. New unit tests in `tests/core/scatterWaves.test.ts` plus updated sweeps in the five existing wave-tag test files; check and smoke (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 13.0 min

```
projects/chokepoint/game/src/core/waveTags.ts      |  3 +-
 projects/chokepoint/game/src/core/waves.ts         | 24 +++++++++-
 projects/chokepoint/game/src/debug/runChecks.ts    |  1 +
 projects/chokepoint/game/src/systems/WaveSystem.ts | 11 +++--
 .../chokepoint/game/src/ui/hud/NextWavePreview.ts  |  1 +
 .../chokepoint/game/tests/core/clumpsWaves.test.ts |  3 +-
 .../chokepoint/game/tests/core/doubleWaves.test.ts |  3 +-
 .../game/tests/core/scatterWaves.test.ts           | 52 ++++++++++++++++++++++
 .../chokepoint/game/tests/core/screenWaves.test.ts |  3 +-
 .../game/tests/core/shortCutWaves.test.ts          |  4 +-
 .../chokepoint/game/tests/core/waveTags.test.ts    | 10 +++--
 11 files changed, 100 insertions(+), 15 deletions(-)
```
