---
id: T0480
title: "The screen: the eighth tag — the wave that walks as one front"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T07:54:13Z
---

## Goal
The wave's march set (quiet, tight, rush, short cut, double, clumps, the halt) grows an eighth — the screen: a wave whose whole count walks as one front, so the front stretch of the road sees the whole wave at once and the answer is the burst build there.

## Details
- **The march.** From wave 18, every eleventh eligible wave (not quiet, not a boss wave, and a wave no other tag's cadence takes — the same exclusivity the existing tags use) is tagged **screen**: every walker's spawn falls within the first 1.5 s of wave time — the wave's normal spawn span is collapsed into that one window, and the wave walks the road as one thick front. The composition, hp, speed and gold are all unchanged: the screen changes the arrival, not the wave's contents, and the tag rides the wave number and the seed like the other tags (no new run state, no save change).
- **Who screens.** Every walker that walks the road, the Ward included — the screen is the wave's own march, not a tower's control: the Ward's immunity never applies and the root's shrug is never touched (the halt's language). On a far-gate board the wave splits across the gates as today and each gate's share bursts within the same 1.5 s window at its own gate. Flyers cross their line as they do; a Dasher that spawns in the window keeps its own crawl-dash cycle.
- **What it does to the wave.** The front stretch — the road near the spawn — sees the whole wave at once: a tower there must hit many at once or the front walks past it, and the front stretches into a stream only as the walkers' own speeds differ, so the screen's moment is the arrival, the wave's first stretch of road (the board shows it: a band of tokens crossing the white road together).
- **The answer.** The burst build at the front stretch — splash's three, spray's five pellets, the beam's line on the front's edge — and the placement that covers the front, where the tight's answer is spread and the halt's is the move. No new action, tool or rule: the burst towers and the placement already exist.
- **The chip and the teach.** The tag chip's existing row (the preview's line under the tokens, T0422; the banner's chip, T0080) gains the screen's glyph — three small dots stacked in a column (a wall of tokens), in a palette hue no other tag's chip uses (the architect picks the free hue from the board's palette). The run's first screen preview teaches once, a muted line under the preview card — "the whole wave walks as one front" — derived from the wave number the way the existing tags' teach lines are (T0092). The waves reference reads core/waves.ts, so the screen names itself with the same one-liner; the non-quiet tagged wave's one guarded buzz at the banner (T0449) and its quiet note (T0457) cover it with no change.
- **Compared with what exists.** quiet halves the size, tight packs the interval, rush speeds the walk, the short cut moves the spawn, the double splits the front, the clumps break the stream, the halt stops the front in place — none of them collapses the whole wave into a single front that crosses the road together. The screen is the first wave that arrives as one wall, and the first tag whose answer is the burst build at the front stretch.
- A wave without the screen tag is byte-identical to today: the spawn span, the walk, the preview, the banner and the reference all stand as they are.

## Acceptance criteria
- [ ] In a run past wave 18, a screen wave wears the screen's chip on the preview's line and the banner, its one-liner in the waves reference, and the mobile buzz at the banner; the first one also wears the muted teach line under the preview; no screen lands on a quiet, boss or already-tagged wave.
- [ ] On a screen wave every walker's spawn falls within the first 1.5 s of wave time (a far-gate share within the same window at its own gate), the front walks the road together as one thick band, and it stretches into a stream only as the walkers' own speeds differ.
- [ ] Unit: on the same seed, the screen wave's spawn offsets all fall within 1.5 s of wave time while the same wave without the tag keeps today's spawn span, and no other wave is changed by the tag's presence.
- [ ] The chip row wears the screen's three-dot column in a hue no other tag uses, and every line fits its card at 412x915 and 1280x720.
- [ ] At the wall's peak the board stays readable — tokens, health bars and the road draw as today — and a wave without the tag is byte-identical (npm run check green).

## Design (architect, desktop)

### Files
- create `tests/core/screenWaves.test.ts` — the screen tag's unit tests (model `tests/core/clumpsWaves.test.ts`)
- edit `src/core/waves.ts` — `isScreenWave`, `SCREEN_WINDOW_SEC`, `screenFront`; append `['screen']` to the tags ternary in `planNormalWave` (line 309)
- edit `src/core/waveTags.ts` — import `isScreenWave`; one row in `WAVE_TAG_ROWS` after the `'short cut'` row (line 27)
- edit `src/systems/WaveSystem.ts` — import the two new names; line 63 ternary gains the screen branch; line 70 tag-note list gains `'screen'` (and its comment's "five" becomes "six")
- edit `src/ui/hud/NextWavePreview.ts` — one `TEACH` entry; the chip gains the screen's glyph
- edit `src/ui/hud/topBanner.ts` — the chip gains the screen's glyph
- edit `src/scenes/WavesScene.ts` — the reference chip gains the screen's glyph (chip width math already carries it)
- edit `src/debug/runChecks.ts` — import `SCREEN_WINDOW_SEC`; one invariant after `waves.clumpsPlan` (line 226)
- edit `tests/core/clumpsWaves.test.ts`, `tests/core/doubleWaves.test.ts`, `tests/core/shortCutWaves.test.ts` — each has a `want` tags-chain (the `isClumpsWave(wave) ? ['clumps'] : []` line): append `: isScreenWave(wave) ? ['screen']` before the `[]` and add `isScreenWave` to the waves import
- edit `tests/core/waveTags.test.ts` — the row list gains `'screen'`, `first` gains `51`, "seven" → "eight", one `nextTaggedWave` line

### Interfaces
Exact additions to `src/core/waves.ts`, placed after `clumpsGap` (line 205), before `planWave`:
```ts
/**
 * Every 11th wave from wave 18 is the screen (51, 73, 139, ... — 18 is the rush wave's slot, 29 the
 * double wave's and 40 the boss wave's, 62 tight, 84 quiet, 95 the rush wave's, 106 the short
 * cut's and 117 the double's): the whole wave walks in as one front, every spawn within the
 * wave's first 1.5 s. It yields to a quiet, tight, rush, short cut, double, clumps or boss wave,
 * which keeps its own tag.
 */
export function isScreenWave(wave: number): boolean {
  return wave >= 18 && (wave - 18) % 11 === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isRushWave(wave) && !isShortCutWave(wave) && !isDoubleWave(wave) && !isClumpsWave(wave) && !isBossWave(wave);
}

/** The window a screen wave's whole spawn span collapses into: every spawn lands within the wave's first this many seconds. */
export const SCREEN_WINDOW_SEC = 1.5;

/**
 * A screen wave's plan: the same enemies in the same order, but the wave's whole spawn span rescaled
 * so its last spawn lands at SCREEN_WINDOW_SEC — the wave walks the road as one thick front and only
 * stretches into a stream as its walkers' own speeds differ. Off (a one-spawn plan, span 0) it
 * returns the plan unchanged.
 */
export function screenFront(plan: WavePlan): WavePlan {
  let t = 0;
  for (const s of plan.spawns) t += s.delaySec;
  if (t <= 0) return plan;
  const k = SCREEN_WINDOW_SEC / t;
  return { ...plan, spawns: plan.spawns.map((s, i) => ({ enemy: s.enemy, delaySec: i === 0 ? 0 : s.delaySec * k })) };
}
```
Line 309's ternary becomes `... : isClumpsWave(wave) ? ['clumps'] : isScreenWave(wave) ? ['screen'] : []`.

The chip's glyph (identical shape in all three chip sites, drawn on the chip's own `Graphics` so it dies with the chip): `const glyph = tag === 'screen' ? 7 : 0;` then `chipW = Math.ceil(label.width) + 14 + glyph;`, after `fillRoundedRect` add `if (glyph) for (const dy of [-4, 0, 4]) { chipBg.fillStyle(PALETTE.card, 1); chipBg.fillCircle(-chipW / 2 + 7.5, dy, 1.5); }` and `label.x = glyph / 2;` (in `topBanner.ts` the graphics var is `g`, in `WavesScene.ts` it is `chip` and the tag is `row.tag`).

### Steps
1. `src/core/waves.ts`: add the block above; extend the line 309 tags ternary. If `isHaltWave` already exists in this file (T0476 landed first), also add `!isHaltWave(wave)` to the yield chain.
2. `src/core/waveTags.ts`: add `isScreenWave` to the line 2 import; after the `'short cut'` row add `{ tag: 'screen', chip: PALETTE.pinkDeep, name: 'screen', meaning: 'the whole wave walks as one front', when: 'every 11th, from 18', rule: isScreenWave },` (pinkDeep is the free hue: chips already wear blueDeep, muted, purpleDeep, orangeDeep, yellowDeep, greenDeep, tealDeep; red is the leak warning, ice would blur with quiet's blue).
3. `src/systems/WaveSystem.ts`: line 8 import gains `isScreenWave` and `screenFront`; line 63 becomes `this.plan = isDoubleWave(plan0.number) ? doubleLull(plan0) : isClumpsWave(plan0.number) ? clumpsGap(plan0) : isScreenWave(plan0.number) ? screenFront(plan0) : plan0;`; line 70's list gains `'screen'` and its line 69 comment says "The six march tags". The T0449 buzz (line 68) needs no change — screen is not quiet.
4. `src/debug/runChecks.ts`: line 15 import gains `SCREEN_WINDOW_SEC`; after `waves.clumpsPlan` add `['waves.screenPlan', (g) => { const p = g.waves.currentPlan; if (!p || !p.tags.includes('screen')) return null; let t = 0; for (const s of p.spawns) t += s.delaySec; return t <= SCREEN_WINDOW_SEC + 1e-6 ? null : \`the screen wave ${p.number} plan still spans past its ${SCREEN_WINDOW_SEC}s front\`; }],`.
5. `src/ui/hud/NextWavePreview.ts`: in `TEACH`, after the `'short cut'` entry add `{ tag: 'screen', first: 51, text: 'screen — the whole wave walks as one front' },` (51 is the first wave `isScreenWave` tags); in `build()`'s chip block apply the glyph shape above.
6. `src/ui/hud/topBanner.ts` and `src/scenes/WavesScene.ts`: apply the same glyph shape in their chip blocks.
7. Tests: create `tests/core/screenWaves.test.ts` with, mirroring `clumpsWaves.test.ts`: a predicate vector `expect([17, 18, 28, 29, 39, 40, 50, 51, 61, 62, 72, 73, 83, 84, 94, 95, 105, 106, 116, 117].map(isScreenWave)).toEqual([false, false, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false, false, false, false])`; a "wears the screen tag, starts at once, non-negative gaps" test over waves 51 and 73 (tags `['screen']`, `hpMul` = `waveHpMul`, first delay 0); a collision test asserting `planWave` tags at 18 `['rush']`, 29 `['double']`, 40 `['boss']`, 62 `['tight']`, 84 `['quiet']`, 95 `['rush']`, 106 `['short cut']`, 117 `['double']`; a `screenFront` test on a 10-dot plan of 1 s gaps (span 9 s → every delay exactly `1 / 6`, order kept, cumulative sum `toBeCloseTo(1.5, 9)` and every prefix `<= 1.5 + 1e-9`, a 1-spawn plan returned unchanged); a seeded-range test over waves 1–100 that the tags equal the full chain `... : isClumpsWave(wave) ? ['clumps'] : isScreenWave(wave) ? ['screen'] : []`, at most one tag, and every screen plan's span after `screenFront` is `<= 1.5 + 1e-9`. Then the four small updates from the Files list. Use double-quoted `it` strings where the name contains an apostrophe.
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- T0476 (halt) is still designing: it does not exist in the code yet, so the design does not use it — but if it lands first, follow step 1's condition; if it lands after and its cadence hits a `18 + 11k` wave, that task must yield (screen is the eighth tag and yields to the seventh).
- The transform is applied only in `WaveSystem.start()` after `planWithLevel`, exactly like double/clumps — never in `planNext()` (the preview shows counts only) and never in `MenuDemo` (the demo plays plans untransformed today).
- Screen draws no new rng: seeded plans of all other waves stay byte-identical; only the line 309 ternary changes `planWave`.
- Float: compare cumulative spans with an epsilon, never `===`; keep the first spawn's delay exactly 0.
- The glyph must live inside the chip and widen `chipW` — the card/row width math (`cardW`, `w`, `chipW` + wordWrap) picks it up for free at 412x915 and 1280x720; a glyph beside the chip would under-measure.
- Chip fill is `PALETTE.pinkDeep` (the row's `chip`), never red; the three dots are `PALETTE.card` white.
- Dashes, Ward, Mute, Bulwark, the far-gate lane split and 2× fast-forward all keep working unchanged: the tag only rescales `delaySec`s; per-enemy movement and the per-index lane hash are untouched.

### Tests
- `tests/core/screenWaves.test.ts` (new, as listed in step 7) pins the cadence/yields, the 1.5 s window, order preservation and every wave 1–100's tags, so a later change to the chain or the transform is caught.
- Updated: the three tag-chain tests (clumps/double/shortCut) and `waveTags.test.ts` (row list, firsts, `nextTaggedWave(0, isScreenWave)` = 51, `nextTaggedWave(51, isScreenWave)` = 73).
