---
id: T0448
title: "The clumps: the wave that walks in clumps"
assignee: inet-racing
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T22:27:29Z
claimed_at: 2026-11-02T23:26:13Z
finished_at: 2026-11-03T00:01:01Z
epic: E22
---

## Goal
The sixth wave tag, "clumps": deep-run waves sometimes walk in clumps of 2–3 with gaps between, and the gaps break the kill chain — a wave that tests the builds that live off the chain (the Feast's glow, the combo gold).

## Details
- The tag: "clumps". From wave 26, every 11th wave that is not quiet, tight, rush, short cut, double or a boss wave wears the tag. The schedule rides the short cut's own shape (isShortCutWave in core/waves.ts, T0440 — the closest example): a wave wears one tag, and a boss wave's plan is never tagged.
- The clumps: the plan's enemies in order, grouped 2, 3, 2, 3, … (the last clump takes whatever is left, 1–3). The spawn interval inside a clump is the wave's normal one; between clumps, a 4 s gap (simulation time, 2× fast-forward scales it).
- A 4 s gap always breaks the kill chain: the chain's window is 1.5 s + 0.4 s per Feast (T0031, T0235), so even a run with five Feasts (3.5 s) breaks.
- The chip: "clumps" on the preview card's chip line and on the wave banner's chip, the tag chip's existing mechanism (T0422, T0080) — no change to the preview's token row.
- The teach: the first clumps wave's preview names it once, under the preview card, the tag-teach's shape (T0092): "the wave comes in clumps — the gaps break the chain".
- The preview shows the total count; the wave ends and pays the normal bonus.
- The waves reference (the pause's waves card, T0264) lists the clumps — it reads core/waves.ts; if the list is not automatic, add the line there.

## Acceptance criteria
- [ ] A unit test pins the clumps schedule: from wave 26 every 11th non-quiet/tight/rush/short-cut/double/boss wave is clumps, no wave wears two tags, and no boss wave is clumps.
- [ ] In a clumps wave the enemies spawn in clumps of 2–3 (2, 3, 2, 3, …) with a 4 s gap between clumps and the wave's normal interval inside a clump.
- [ ] The preview shows the total count with the "clumps" chip; the banner wears the chip; the first clumps wave's teach line shows once, never again in that run.
- [ ] The waves reference card lists the clumps.

## Design (architect, inet-racing)

### Files
- edit `src/core/waves.ts` — the schedule, the gap constant and the plan shaping (after `doubleLull`, before `planWave`), plus the tag chain at line 275
- edit `src/core/waveTags.ts` — one row for the reference/preview/banner
- edit `src/systems/WaveSystem.ts` — apply `clumpsGap` where `doubleLull` is applied
- edit `src/ui/hud/NextWavePreview.ts` — the one-time teach line
- edit `src/debug/runChecks.ts` — one invariant, next to `waves.doublePlan`
- edit `tests/core/doubleWaves.test.ts`, `tests/core/shortCutWaves.test.ts` — their seeded-range tests replicate the tag chain and would fail at waves 26/59/92
- edit `tests/core/waveTags.test.ts` — the row-order and `first` assertions
- create `tests/core/clumpsWaves.test.ts` — schedule, collisions, gap shape, seeded range (model: `tests/core/doubleWaves.test.ts`)

### Interfaces
```ts
// src/core/waves.ts (insert after the doubleLull block, before planWave's doc comment)
/** Every 11th wave from wave 26 is clumps (26, 59, 103, ... — 37 is the double wave's slot, 48 and 92 quiet
 *  waves, 70 the boss wave's and 81 a rush wave): the wave's enemies walk in clumps of 2 and 3, the gap
 *  between the clumps breaking the kill chain. It yields to a quiet, tight, rush, short cut, double or
 *  boss wave, which keeps its own tag. */
export function isClumpsWave(wave: number): boolean {
  return wave >= 26 && (wave - 26) % 11 === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isRushWave(wave) && !isShortCutWave(wave) && !isDoubleWave(wave) && !isBossWave(wave);
}

/** The gap between a clumps wave's clumps: exactly this much simulation time with no enemy on the road. */
export const CLUMPS_GAP_SEC = 4;

/** A clumps wave's clump-boundary indices, where the 2, 3, 2, 3, ... clumps end (clumpBoundaries(10) is [2, 5, 7]). */
export function clumpBoundaries(count: number): number[] {
  const at: number[] = [];
  for (let i = 0, k = 0; i < count; k += 1) {
    i += Math.min(k % 2 === 0 ? 2 : 3, count - i);
    if (i < count) at.push(i);
  }
  return at;
}

/** A clumps wave's plan: the same enemies in the same order, grouped 2, 3, 2, 3, ... (the last clump takes
 *  whatever is left, 1–3). Every gap where a clump ends is replaced by CLUMPS_GAP_SEC (not added to), the
 *  wave's normal interval holding inside a clump; the gap is simulation time, so 2× fast-forward scales it.
 *  The 4 s gap always breaks the chain: the chain's window is 1.5 s + 0.4 s per Feast (core/feast.ts). */
export function clumpsGap(plan: WavePlan): WavePlan {
  const at = new Set(clumpBoundaries(plan.spawns.length));
  return { ...plan, spawns: plan.spawns.map((s, i) => (at.has(i) ? { ...s, delaySec: CLUMPS_GAP_SEC } : s)) };
}
```
Tag chain (waves.ts:275), clumps last — `isClumpsWave` excludes every other tag, so a wave wears at most one:
```ts
tags: isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : isRushWave(wave) ? ['rush'] : isShortCutWave(wave) ? ['short cut'] : isDoubleWave(wave) ? ['double'] : isClumpsWave(wave) ? ['clumps'] : []
```
`WaveTagRow` and `Teach` shapes are unchanged; the new entries are data (below). No new types anywhere else.

### Steps
1. **waves.ts** — add the four exports above after the `doubleLull` block (line 171); extend the tag chain at line 275 exactly as above. Do not touch the boss branch of `planWave` — a boss plan never gets the tag.
2. **waveTags.ts** — import `isClumpsWave` next to the others (line 2); insert the row between the `double` and `short cut` rows (in run-meets order, 26 is between 21 and 34):
```ts
  { tag: 'clumps', chip: PALETTE.greenDeep, name: 'clumps', meaning: 'they come in clumps, the gaps break the chain', when: 'every 11th, from 26', rule: isClumpsWave },
```
   This single line feeds the preview chip (`tagChip`), the banner chip (TopBanner reads `plan.tags`) and the pause waves card (WavesScene maps `WAVE_TAG_ROWS` — it is automatic, nothing to do in the scene). `greenDeep` is the first `*Deep` not used by a chip; avoid `redDeep` (the leak warning color).
3. **WaveSystem.ts** — import `clumpsGap` and `isClumpsWave` in the line-7 import (keep alphabetical: `DOUBLE_SPEED_MUL, clumpsGap, doubleLull, doubleSplitAt, isClumpsWave, isDoubleWave, ...`); change line 60 to:
```ts
    this.plan = isDoubleWave(plan0.number) ? doubleLull(plan0) : isClumpsWave(plan0.number) ? clumpsGap(plan0) : plan0;
```
   The gap lands in `delaySec` like `DOUBLE_LULL_SEC`, so the existing spawn loop (line 92) and the dt-based timer handle it; no change to `update()`, EnemySystem, RunFlow or GameScene. Applying after `planWithLevel` (like the double) groups the plan actually sent, extras included.
4. **NextWavePreview.ts** — insert into the `TEACH` table between the `double` and `short cut` entries (first clumps wave is 26; the gate `run.wavesCleared < t.first` then shows it once, on the build before wave 26):
```ts
  { tag: 'clumps', first: 26, text: 'clumps — the wave comes in clumps, the gaps break the chain' },
```
   Use the em dash `—` like the other entries. The card already sizes itself from its lines and scales down (`fitScale`) at 412x915 — no layout change.
5. **runChecks.ts** — extend the line-13 waves import with `CLUMPS_GAP_SEC` and `clumpBoundaries`; add after the `waves.doublePlan` entry (line 214):
```ts
  ['waves.clumpsPlan', (g) => { const p = g.waves.currentPlan; if (!p || !p.tags.includes('clumps')) return null; return clumpBoundaries(p.spawns.length).every((i) => p.spawns[i]!.delaySec === CLUMPS_GAP_SEC) ? null : `the clumps wave ${p.number} plan lost its ${CLUMPS_GAP_SEC}s gaps between its clumps`; }],
```
6. **Tests** — see below. Run `npm run check`.

### Pitfalls
- The seeded-range tests in `doubleWaves.test.ts:59` and `shortCutWaves.test.ts:40` re-implement the tag chain and will fail at waves 26/59/92 unless extended — extend both with `: isClumpsWave(wave) ? ['clumps'] : []` (and the import).
- `isClumpsWave` must exclude **double** as well (37 is both slots); forgetting it gives wave 37 two claims and the banner/teach go wrong while the plan says `double`.
- `clumpsGap` replaces the boundary gap (like `doubleLull`), never adds 4 s to the normal interval.
- The preview shows `nextPlan` (un-shaped plan) — that is fine: clumps change only gaps, and the preview shows counts, which stay the total.
- Wave 26 is also a Mute wave (11, 14, 17, ≡ 2 mod 3): the Mute is prepended with `delaySec 0` and walks in as the first of clump one — keep it, it is "the plan's enemies in order".
- T0403 (storm) also edits waves.ts/WaveSystem.ts — do not restructure those lines, insert only, so the merge is a few lines.

### Tests
- `tests/core/clumpsWaves.test.ts` (new, model `doubleWaves.test.ts`): `isClumpsWave` on `[24,25,26,36,37,47,48,58,59,69,70,80,81,91,92,102,103]` → `[false,false,true,false,false,false,false,true,false,false,false,false,false,false,false,true,true]`; collisions keep their own tag (`planWave(37)` `['double']`, `48` `['quiet']`, `70` `['boss']`, `81` `['rush']`, `92` `['quiet']`); `planWave(26)` wears `['clumps']`, starts at 0, non-negative gaps; `clumpsGap` on a ten-spawn dot plan → delays `[0,1,4,1,1,4,1,4,1,1]`, seven → `[0,1,4,1,1,4,1]`, four → `[0,1,4,1]`, three → unchanged, order kept; `clumpBoundaries(10)` `[2,5,7]`; `CLUMPS_GAP_SEC === 4`; seeded range 1–100 with the full seven-branch chain, one tag at most, no boss wave clumps, every clumps plan's boundary gaps are `CLUMPS_GAP_SEC`.
- Edit `waveTags.test.ts`: order `['quiet','tight','boss','rush','double','clumps','short cut']`, `first = [4,6,10,11,21,26,34]`, and `expect(nextTaggedWave(0, isClumpsWave)).toBe(26)` / `nextTaggedWave(26, isClumpsWave)` `59` (37 is the double's slot).

## Result (attempt 1, inet-racing)

Added the sixth wave tag "clumps": from wave 26 every 11th non-quiet/tight/rush/short-cut/double/boss wave (26, 59, 103, …) walks in clumps of 2 and 3 with a 4 s simulation-time gap between clumps (`isClumpsWave`, `CLUMPS_GAP_SEC`, `clumpBoundaries`, `clumpsGap` in `core/waves.ts`, applied in `WaveSystem.start()` after the level's extras, like the double's lull), a `greenDeep` chip row in `core/waveTags.ts` feeding the preview chip, banner and pause waves reference, a one-time teach line in `NextWavePreview.ts`, a `waves.clumpsPlan` invariant, and new/updated unit tests. Two places in the task's test notes contradicted the design's own `isClumpsWave` formula and `clumpBoundaries` implementation (the pinned array marked waves 58 and 102, and "three spawns → unchanged"); I followed the formula/implementation, which yields clumps at 26/59/103 and splits a three-spawn wave 2+1 with a gap — all other design details were followed as written.

- Self-review: APPROVE
- Time: 34.8 min

```
projects/chokepoint/game/src/core/waveTags.ts      |  3 +-
 projects/chokepoint/game/src/core/waves.ts         | 36 ++++++++++-
 projects/chokepoint/game/src/debug/runChecks.ts    |  3 +-
 projects/chokepoint/game/src/systems/WaveSystem.ts |  6 +-
 .../chokepoint/game/src/ui/hud/NextWavePreview.ts  |  1 +
 .../chokepoint/game/tests/core/clumpsWaves.test.ts | 75 ++++++++++++++++++++++
 .../chokepoint/game/tests/core/doubleWaves.test.ts |  3 +-
 .../game/tests/core/shortCutWaves.test.ts          |  4 +-
 .../chokepoint/game/tests/core/waveTags.test.ts    | 10 +--
 9 files changed, 128 insertions(+), 13 deletions(-)
```
