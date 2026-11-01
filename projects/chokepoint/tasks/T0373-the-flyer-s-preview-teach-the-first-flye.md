---
id: T0373
title: "The flyer's preview teach: the first flyer preview says it doesn't walk the road"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T18:48:59Z
epic: E10
---

## Goal
The regular Flyer (T0353) joins the wave mix on wave 13 as the first enemy that doesn't walk the road, but nothing says so: the player sees a new token in the next-wave preview and learns at the first leak, and the boss's build line (T0346) comes 37 waves later. A one-time line under the next-wave preview — the wave-tag teach pattern (T0092) — teaches the read in the build before the first crossing, so the island's cover is chosen before it is needed.

## Details
- **When:** the build phase before the first wave of the run whose plan contains a Flyer (today: wave 13 — the Flyer is one on 13, 17, 21, …, fromWave 13; the wave-50 boss wave is not the first). The decision is a pure function of the next plan, like T0346's: no run state, no save field — a resumed run that enters the build before wave 13 shows the line, a resumed run at wave 14 or later never does, and the builds before waves 17, 21, … show the Flyer's token and count exactly as today, with no line.
- **What:** one muted line under the preview card, in the same style and place as the wave-tag teach line (T0092, the closest example — a tagged wave's first preview names the tag once under the preview card, in `src/ui/hud/NextWavePreview.ts` or wherever that line is drawn): "the flyer doesn't walk the road". It is up for the whole build phase and gone with the preview card when the wave starts.
- **Nothing else:** no sound, no board mark, no new card, no change to the preview's tokens or counts (T0353's token + count already show the Flyer; the line is the new information). It occupies the card for exactly one build phase of the run and never again — the T0092/T0272 one-time teach family, not a permanent mark. The line is 12 px muted ink, the tag line's own size, and fits the card's width at 412x915.

## Acceptance criteria
- [ ] The build phase before wave 13 shows one muted line under the next-wave preview card reading "the flyer doesn't walk the road", up for the whole build phase and gone when the wave starts; every other build phase (17, 21, …, and the wave-50 boss build) shows the preview exactly as today.
- [ ] A resumed run that enters the build before wave 13 shows the line; a resumed run at wave 14 or later never does; there is no new save field and no run-state flag — the line is a pure function of the next plan.
- [ ] No sound, no board mark, no new card, no change to the preview's tokens or counts; a run plays end to end from wave 1 to game over, and the desktop 1280x720 / mobile 412x915 smoke passes.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/NextWavePreview.ts` - add the one-time Flyer teach line: a new constant next to the other teach consts, and one branch in `teachLines()`

### Interfaces
No new types. `teachLines()` keeps its signature: `private teachLines(plan: WavePlan, run: RunState): string[]`. The new line reuses the existing render loop in `build()` (the `teach` lines, drawn `textStyle(14, PALETTE.muted)` at line 151) and the existing card-size math — nothing new is exported.

### Steps
1. In `NextWavePreview.ts`, next to `BANK_PAY` (line 34), add, in the same doc-comment shape as `EARLY_SEND`/`BANK_PAY`:
```ts
/** The Flyer's one-time teach: the build before its first wave names that it doesn't walk the road. Shown while the next plan carries a Flyer and `wavesCleared` is below the Flyer's `fromWave` (13), re-derived from the run, never stored. */
const FLYER_TEACH = "the flyer doesn't walk the road";
```
2. In `teachLines()`, after the `TEACH` loop (so tag lines keep their priority) and before `return []`, add exactly one branch:
```ts
if (plan.spawns.some((s) => s.enemy === 'flyer') && run.wavesCleared < getEnemy('flyer').fromWave) return [FLYER_TEACH];
```
   `getEnemy` is already imported (line 3). Update `teachLines()`'s doc comment to add the Flyer case ("…the tag on first preview; the build before the Flyer's first wave names that it doesn't walk the road").
3. Do nothing else: no new file, no registry line, no `build()`/`place()` change, no other file.

### Pitfalls
- The task text says "12 px" but the tag line it must match is `textStyle(14, PALETTE.muted)` (line 151); the spec is "the tag line's own size", so keep 14 via the existing loop — do not add a separate 12px text object or change line 151.
- No run-state flag, no save field: the decision is derived from `game.waves.nextPlan` + `run.wavesCleared` per wave, exactly like the existing teach lines. A resumed run at wavesCleared < 13 in build shows it; at ≥ 13 (waves 14, 17, 21, …) it never does — the Flyer appears only on 13, 17, 21, … and wave 50 is a boss wave whose plan holds no Flyer, so the check can't fire there.
- The Flyer branch goes after the tag loop, not before: wave 13 has no tag today, but this keeps every existing line byte-identical.
- Layout: the line is ~200px at 14px, so cardW ≈ 232px < 412 − 2·EDGE (384) and `fitScale()` stays 1; the card height formula (`LINE_H + lines·(ROW_GAP + TEACH_H) + PAD·2`) already sizes for one line (76px), and the card's `place()` stays 14px clear of the next-wave ring at 412x915 — no placement change, no overlap with the wave-1 card's two lines, which this build phase no longer shows.
- No sound, no board mark, no token/count change: the Flyer's token + count already come from `waveCounts(plan)`; this adds one line of information only.

### Tests
- none (UI teach line, no `core/` rule change).
