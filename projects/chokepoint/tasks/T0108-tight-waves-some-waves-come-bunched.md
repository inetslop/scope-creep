---
id: T0108
title: "Tight waves: some waves come bunched"
assignee: cachyos-x8664
size: M
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T08:15:43Z
finished_at: 2026-10-29T08:45:02Z
---

## Goal
Wave content the multi-hit augments are made for: some waves send their enemies bunched close together, tagged "tight" in the preview, so Splash's 3-cap, Lance's pierce, Chain's leaps, Spray's needles and Beam's second target earn their keep in dedicated waves.

## Details
- Schedule: from wave 6, every 8th wave is tight — waves 6, 14, 22, 30, … (never a quiet wave: quiet is every 4th, and 6, 14, 22, … are never multiples of 4).
- A tight wave has the same count, same mix, same hp, same kill gold and same clear bonus as the normal wave of that number; only the cadence changes: the spawn interval between consecutive enemies is halved (the wave's total spawn time halves; the first spawn comes at its usual time). The 2x fast-forward scales it like everything else (one scaled clock, T0019).
- The wave plan carries a "tight" tag (the WavePlan tags field, T0071's "quiet").
- Readability: a muted "tight" chip — the same rounded chip look and slot as the quiet chip (T0071) — at the left edge of the wave preview card during the build phase before a tight wave (T0080's generic chip slot), and on the wave banner when a tight wave starts ("Wave 6 · tight", T0080's slot); untagged waves are byte-identical. The chip is muted gray (the quiet chip stays muted blue); a wave is never both.
- Teach once: one small muted line under the preview card's counts on the first tight wave's preview only — "tight: they come bunched" — the T0092 per-tag pattern: shown while the previewed wave is tagged tight and the run has held fewer than 6 waves; "taught" = 6 or more held, derived from the ledger, re-derived on resume, never shown again.
- The quiet wave (T0071), its double kill gold, and the last-stand product (×4) are untouched.

## Acceptance criteria
- [ ] Waves 6, 14, 22, … are visibly bunched: the same enemies as the normal wave of that number, spawning at half the interval; waves 1–5 and every quiet wave (4, 8, 12, …) are byte-identical to today.
- [ ] The build phase before wave 6 shows the muted-gray "tight" chip on the preview card and the teach line "tight: they come bunched" under the counts; the wave banner reads "Wave 6 · tight".
- [ ] The teach line shows on a fresh run only, on wave 6's preview; a second run — or a resumed run past wave 6 — shows the chip but never the line again.
- [ ] A tight wave's clear bonus and kill gold are exactly what the normal wave of that number pays.

## Design (architect, baby-mama)

### Files
- edit `src/core/waves.ts` — add `isTightWave()` and `tightHalve()`; `planWave` applies tight at the single exit and carries the `'tight'` tag
- edit `src/ui/hud/NextWavePreview.ts` — one line in the `TEACH` table, gray "tight" chip at the card's left edge, import `isTightWave`
- edit `src/ui/hud/topBanner.ts` — chip fill picks the tag's color (line 56)
- create `tests/core/tightWaves.test.ts` — tight schedule, `tightHalve`, and the plans as they come out of `planWave`

### Interfaces
```ts
// src/core/waves.ts (after isQuietWave, lines 61-64)
/** Every 8th wave from wave 6 is a tight bunched wave (6, 14, 22, 30, ...; never a quiet wave: none is a multiple of 4). */
export function isTightWave(wave: number): boolean {
  return wave >= 6 && (wave - 6) % 8 === 0;
}
// after quietHalve (line 88)
/**
 * A tight wave bunched: the same enemies in the same order, but every gap between consecutive
 * enemies is halved (the wave's total spawn time halves; the first spawn comes at once).
 */
export function tightHalve(spawns: WaveSpawn[]): WaveSpawn[] {
  return spawns.map((s, i) => ({ enemy: s.enemy, delaySec: i === 0 ? 0 : s.delaySec / 2 }));
}
// in planWave, right after the line `if (isQuietWave(wave)) finalSpawns = quietHalve(finalSpawns);` (line 151)
  // A tight wave bunches the plan at the single exit, so both paths above get it (it is never a quiet wave).
  if (isTightWave(wave)) finalSpawns = tightHalve(finalSpawns);
// and the return (line 154) becomes
  return { number: wave, spawns: finalSpawns, hpMul: waveHpMul(wave), tags: isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : [] };
```
No other signatures change: kill gold (`quietGoldMul`) and clear bonus (`RunState.waveBonus`) are functions of the wave number only and need no change; `WaveSystem.update` already runs on the scaled clock, so 2x fast-forward scales the bunched gaps like everything else.

### Steps
1. `src/core/waves.ts`: add `isTightWave` after `isQuietWave` and `tightHalve` after `quietHalve`; add the one `planWave` line after the quiet-halve line and extend its return's `tags` as above. Nothing else in the file moves.
2. `src/ui/hud/NextWavePreview.ts`:
   - import line 5 becomes `import { isQuietWave, isTightWave, waveCounts, type WavePlan } from '../../core/waves';`
   - add one line to `TEACH`, after the quiet line: `{ tag: 'tight', first: 6, text: 'tight: they come bunched' },`
   - in `build()`, replace `if (isQuietWave(plan.number)) {` with `if (isQuietWave(plan.number) || isTightWave(plan.number)) {` and inside it, right after the comment, add `const isQuiet = isQuietWave(plan.number);`; change the label text to `isQuiet ? 'quiet' : 'tight'` and the fill to `chip.fillStyle(isQuiet ? PALETTE.blueDeep : PALETTE.muted, 1);`. The chip keeps the exact same shape/slot (18 tall, radius 9, 11px bold `PALETTE.card` label, `+14` padding, `cursor += chipW + GROUP_GAP`). The teach line needs no code: `teachLine` already scans `TEACH` against `plan.tags` and `run.wavesCleared < t.first`, re-derived from the ledger each build phase.
3. `src/ui/hud/topBanner.ts`: line 56 becomes `g.fillStyle(tag === 'tight' ? PALETTE.muted : PALETTE.blueDeep, 1);`. The banner's "Wave 6 · tight" then falls out of the existing tag loop (WaveBanner already passes `currentPlan.tags`).
4. `tests/core/tightWaves.test.ts` (mirror `tests/core/quietWaves.test.ts`):
```ts
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../../src/content/enemies';
import { Rng } from '../../src/core/rng';
import { isTightWave, planWave, tightHalve } from '../../src/core/waves';

describe('tight wave plans', () => {
  it('isTightWave: every 8th wave from wave 6, never a quiet wave', () => {
    expect([0, 1, 4, 5, 6, 8, 12, 14, 22, 30].map(isTightWave)).toEqual([false, false, false, false, true, false, false, true, true, true]);
  });
  it('tightHalve: same enemies in order, first at once, every later gap halved', () => {
    const full = [
      { enemy: 'dot', delaySec: 0 }, { enemy: 'dart', delaySec: 1 }, { enemy: 'block', delaySec: 1 },
      { enemy: 'dot', delaySec: 2 },
    ];
    expect(tightHalve(full)).toEqual([
      { enemy: 'dot', delaySec: 0 },
      { enemy: 'dart', delaySec: 0.5 },
      { enemy: 'block', delaySec: 0.5 },
      { enemy: 'dot', delaySec: 1 },
    ]);
  });
  it('a tight wave wears the tight tag and starts at once with non-negative gaps', () => {
    for (const wave of [6, 14, 22, 30]) {
      const plan = planWave(wave, new Rng(wave), ENEMIES);
      expect(plan.tags).toEqual(['tight']);
      expect(plan.spawns.length).toBeGreaterThan(0);
      expect(plan.spawns[0]!.delaySec).toBe(0);
      for (const s of plan.spawns) expect(s.delaySec).toBeGreaterThanOrEqual(0);
    }
  });
});
```
Run `npm run check`.

### Pitfalls
- The bunched transform must stay post-hoc (after all `planWave` rng draws, like the quiet halve) — any earlier change would shift the seeded picks and waves 6/14/22 would stop sending "the same enemies as the normal wave of that number".
- Byte-identical: apply `tightHalve` only under `isTightWave`; the tag of a non-tight wave must stay `[]` (no empty-tag drift), so waves 1–5 and every quiet wave plan unchanged.
- One chip, never both: quiet = every 4th, tight = 6 mod 8, so the if/else is exhaustive but keep it an if/else — a single `cursor +=` advances once, keeping the counts row and card width where the quiet chip already sits.
- Teach line is derived, never stored: `run.wavesCleared < 6` covers a fresh run at wave 6's preview (5 held) and stays hidden after the wave is held, on resume included; do not add a saved "taught" flag.
- The chip colors: tight = `PALETTE.muted` (0x6f8287), quiet stays `PALETTE.blueDeep`; labels stay `PALETTE.card`.
- No invariant in `runChecks.ts` (no new system; T0107 is editing it) — the "never both" rule is the if/else above plus the unit test.

### Tests
- `tests/core/tightWaves.test.ts` as above (schedule, halving, plan tags/invariants); `tests/content.test.ts` already covers the plans it sees — no other test file is touched.

## Result (attempt 1, cachyos-x8664)

Added the tight (bunched) wave: `isTightWave()`/`tightHalve()` in `src/core/waves.ts` (every 8th wave from 6, gaps halved at the single exit, `['tight']` tag in the plan), a muted-gray "tight" chip + one-time teach line in `NextWavePreview.ts`, per-tag chip color in `topBanner.ts`, and `tests/core/tightWaves.test.ts`. Kill gold and clear bonus are unchanged (functions of the wave number only). `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 29.3 min

```
projects/chokepoint/game/src/core/waves.ts         | 17 +++++++++++-
 .../chokepoint/game/src/ui/hud/NextWavePreview.ts  | 10 ++++---
 projects/chokepoint/game/src/ui/hud/topBanner.ts   |  2 +-
 .../chokepoint/game/tests/core/tightWaves.test.ts  | 31 ++++++++++++++++++++++
 4 files changed, 54 insertions(+), 6 deletions(-)
```
