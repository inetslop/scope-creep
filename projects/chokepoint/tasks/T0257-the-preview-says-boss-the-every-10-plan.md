---
id: T0257
title: "The preview says boss: the every-10 plan's tag, the preview chip, the teach line and the banner chip"
size: S
priority: 2
status: todo
depends_on: [T0253]
attempts: 0
created: 2026-10-30T05:08:57Z
epic: E5
---

## Goal
The player sees the boss coming before the wave starts: every 10th wave wears a "boss" tag in the build-phase preview and on the wave banner, taught once — E5's "the wave preview (T0015) shows it coming".

## Details
- **The tag (src/core/waves.ts):** the boss plan branch (T0253's `isBossWave` early return) carries `tags: ['boss']` — today it is `tags: []`, "no tag in this slice". The tag lives on the boss branch, so it follows whatever the branch sends (T0259's wave-20 Titan wears it with no change here).
- **The preview chip (src/ui/hud/NextWavePreview.ts):** while the next wave is a boss wave, one small "boss" chip beside the token row — the "tight" chip's own look, size and position (its closest example, in the same file) in the boss's own purple, muted the same way the other tag chips are muted.
- **The teach line (same file, T0092's pattern):** the first boss wave's preview shows one muted line under the card: "boss: one big shape instead of a crowd" — the file's TEACH table plus its `teachLine()` derivation from the run's state. Shown only while the run has not yet held a boss wave: wave 20's and 30's previews do not show it, and a resumed run past wave 10 never does.
- **The banner chip (the wave banner card — src/ui/hud/WaveBanner.ts, or src/ui/hud/topBanner.ts, whichever one holds the "quiet" and "tight" chip T0080 added):** a boss wave's banner reads "Wave 10 · boss" — the chip beside the number, T0080's pattern, the same muted purple.
- No new keys, no new card; the pause screen's controls are unchanged.

## Acceptance criteria
- [ ] The build-phase preview before wave 10 (and 20, 30, …) shows the boss token row and a muted purple "boss" chip; the preview before every non-boss wave is byte-identical to today.
- [ ] Wave 10's preview in a fresh run shows the teach line "boss: one big shape instead of a crowd" under the card, once; wave 20's preview does not show it, and a resumed run past wave 10 never does.
- [ ] A boss wave's banner reads "Wave 10 · boss" with the chip beside the number (T0080's pattern); every untagged wave's banner is byte-identical to today.
- [ ] The chip and the teach line fit their cards at 412x915 and 1280x720; the pause screen is unchanged.

## Design (architect, yoga)

### Files
- edit `src/core/waves.ts` - in `planWave`'s boss early return (T0253's `if (isBossWave(wave)) return {...}` near the top of the function, before the budget walk), change `tags: []` to `tags: ['boss']` and drop the "no tag in this slice" remark. Nothing else: do NOT touch the final `return { ... tags: isQuietWave(wave) ? ['quiet'] : isTightWave(wave) ? ['tight'] : [] }` (the early return protects it; wave 20 is a multiple of 4 and must not wear "quiet").
- edit `src/ui/hud/NextWavePreview.ts` - (a) one row in the in-file `TEACH` table; (b) the tag chip in `build()` reads `plan.tags` and gains the boss color; (c) trim the then-unused `isQuietWave`/`isTightWave` imports.
- edit `src/ui/hud/topBanner.ts` - one line: the chip fill color ternary gains the boss color.
- edit `tests/core/waves.test.ts` - one test asserting the boss tag.
- `src/ui/hud/WaveBanner.ts` is NOT touched: it already passes `game.waves.currentPlan?.tags` into `TopBanner.show`, so the "boss" chip flows through with no change there.

### Interfaces
none (no new types, functions or fields; only data literals and one color per chip).

### Steps
1. `waves.ts`: in the boss branch's returned object set `tags: ['boss']`.
2. `NextWavePreview.ts`, `TEACH` table — add after the `tight` row, exactly:
   ```ts
   { tag: 'boss', first: 10, text: 'boss: one big shape instead of a crowd' },
   ```
   (`teachLine()` already derives "show while `run.wavesCleared < first`", so the line shows only for wave 10's preview: 20/30 and resumed-past-10 runs derive false with no stored state.)
3. `NextWavePreview.ts`, `build()` — replace the whole `if (isQuietWave(plan.number) || isTightWave(plan.number)) { ... }` block with this (same look, size and left-edge position as today's chip; quiet/tight output is unchanged because the plan's tag is exactly its word):
   ```ts
   const tag = plan.tags[0];
   if (tag) {
     const label = scene.add.text(0, 0, tag, textStyle(11, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
     const chipW = Math.ceil(label.width) + 14;
     const chip = scene.add.graphics();
     chip.fillStyle(tag === 'tight' ? PALETTE.muted : tag === 'boss' ? PALETTE.purpleDeep : PALETTE.blueDeep, 1);
     chip.fillRoundedRect(-chipW / 2, -9, chipW, 18, 9);
     countsPieces.push(scene.add.container(chipW / 2, 0, [chip, label]));
     cursor += chipW + GROUP_GAP;
   }
   ```
   (Boss chip: same 18-px rounded chip, white bold 11-px label, in the boss's muted purple `PALETTE.purpleDeep`, like quiet's `blueDeep`.)
4. `NextWavePreview.ts`, line 5 import — it becomes `import { waveCounts, type WavePlan } from '../../core/waves';` (the two wave-number functions are no longer referenced here).
5. `topBanner.ts`, the `g.fillStyle(...)` line — becomes:
   ```ts
   g.fillStyle(tag === 'tight' ? PALETTE.muted : tag === 'boss' ? PALETTE.purpleDeep : PALETTE.blueDeep, 1);
   ```
   The card width already grows from the chips (`w = W + (row - this.text.width)`), so "Wave 10" + "boss" chip needs no other change; no tags → byte-identical to today.
6. `tests/core/waves.test.ts` — after the "carries its tags" test add:
   ```ts
   it('boss waves carry the boss tag', () => {
     expect(planWave(10, new Rng(10), ENEMIES).tags).toEqual(['boss']);
   });
   ```
7. Layout check (no code): the teach line is the card's second line, already inside the card (`cardH = LINE_H + ROW_GAP + TEACH_H + PAD*2`, centered by `build()`). Longest text "boss: one big shape instead of a crowd" ≈ 250 px + 32 px padding < 412 − 2·EDGE (380), and < 1248 at 1280x720; `place()`'s `fitScale()` still guards. The card grows up, clear of the top HUD. Pause screen and hotkeys untouched.

### Pitfalls
- Unused imports: after step 3, `isQuietWave`/`isTightWave` are dead in `NextWavePreview.ts` — `npm run check` (lint) fails if step 4 is skipped.
- Do not add `isBossWave` to the final `tags` ternary in `waves.ts`; the tag lives only on the boss branch (wave 20 is a multiple of 4 — a quiet check there would misfire if the early return ever moved).
- The chip must come from `plan.tags`, not wave number: the preview reads `game.waves.nextPlan` and the banner `currentPlan`, both `WavePlan` with `tags` — so T0259's wave-20 Titan wears "boss" with no change here.
- `first: 10` in the TEACH row is what makes the teach line exactly once (wave 10 = the tag's first wave, like quiet→4, tight→6); any other value teaches it on wave 20 too.
- No pooling, listeners or scenes involved — nothing to clean up; the preview card is rebuilt per wave via `this.box.destroy()`, already handled.

### Tests
- `tests/core/waves.test.ts`: "boss waves carry the boss tag" as in step 6 (the tag is a core rule a later branch change could silently drop).
