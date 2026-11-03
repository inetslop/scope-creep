---
id: T0487
title: "The memory's teach: the first leakers that come back say why"
size: S
priority: 2
status: todo
depends_on: [T0473]
attempts: 0
created: 2026-11-03T10:07:19Z
epic: E27
---

## Goal
The moment the road first remembers — a build phase whose next wave carries leakers that came back — the player learns, once, that what leaked comes back (Pillar 8), at the exact moment the rule fires.

## Details
- On the run's first build phase in which the next plan carries a remembered addition (T0473's rule grew the plan), one white chip appears directly under the next-wave preview card (above the round button): "come back: <Type>" for each type that comes back in that wave, in the order the plan carries them, with " ×n" only for n ≥ 2 (so a doubled type reads "Hauler ×2"; a wave with two single types reads "come back: Dot, Ward"). Bold 12 px muted ink on a rounded white chip — the first-leak chip's look (T0107) with the name chip's text style (T0085). It pops in, holds ~1.5 s, fades, and never shows again: the run's one-time-teach flag pattern (T0431's shape — a run-scoped flag set on show, carried by the run save, so a resumed run never re-teaches).
- The types and counts to name are the additions the next plan carries, read from the rule T0473's module computes — the HUD never re-derives the leak record itself, and the chip never shows when the plan carries no additions.
- In a Blind run (the level whose build hides the preview) the chip never shows at all — its text would name what the level hides.
- It lives in its own small file (the T0431 BankTell shape: one HUD part file, one import and one part line in the HUD scene, one run flag and its save lines) so no existing card's layout changes. No sound, no key, no button, no permanent mark.
- It fits: the longest line is "come back: Hauler ×2, Dot, Ward" (the 3-walker cap), under the preview card's width at 412x915 and 1280x720.

## Acceptance criteria
- [ ] In a run whose just-ended wave leaked, the next build phase shows the chip under the preview once for ~1.5 s naming each type that comes back (×n for n ≥ 2), then it never shows again — not in that run, not after a resume, not in later runs.
- [ ] The chip does not show when the next plan carries no additions, in a Blind run, or when the flag is already set.
- [ ] It adds no sound, no key, no button and no permanent mark; a run with no leaks is unchanged.

## Design (architect, yoga)

### Files
- create `src/ui/hud/MemoryTell.ts` - the one-time chip part (models `src/ui/hud/NextWavePreview.ts` for the HudPart shape + corner math, and `src/systems/fx/leakCost.ts` for the chip look)
- edit `src/core/run.ts` - one flag, after the `farGateTold = false;` line: `memoryTold = false; // the run's one memory chip showed (T0487): a resumed run never re-teaches`
- edit `src/core/saveRun.ts` - after `farGateTold` in each spot: interface `memoryTold: boolean; // the memory teach showed; older saves predate the field`; in `loadSavedRun` the line `if (p.memoryTold !== undefined && typeof p.memoryTold !== 'boolean') return undefined;`; in the return object `memoryTold: p.memoryTold === true,`
- edit `src/systems/RunSave.ts` - persist: `memoryTold: run.memoryTold,` after `farGateTold: run.farGateTold,`; restore: `run.memoryTold = saved.memoryTold;` after `run.farGateTold = saved.farGateTold;`
- edit `src/scenes/HudScene.ts` - import `MemoryTell` (alphabetical: between `LevelChips` and `NextWaveButton`) and one part line `new MemoryTell(this),` after the `preview,` line
- edit `tests/core/saveRun.test.ts` - `memoryTold: false,` in `sample()` after `farGateTold: false,`, plus one `it` block copying the far-gate-told block for `memoryTold`

### Interfaces
No new types. The part reads the additions from T0473's `src/core/remember.ts`: open that file and `WaveSystem.planNext()` (its only call site) and copy that exact call into `update()` — it returns the types that come back this wave (id + count, in the order the plan carries them). If T0473 stored them on the plan object, read them off `game.waves.nextPlan` instead.
Part shape: `constructor(scene: Phaser.Scene)`, `layout(width, height)`, `update(game)`. `update` guards in order: `this.chip`, `run.memoryTold`, `run.phase !== 'build'`, `run.level.includes('blind')`; then the additions call — `if (additions.length === 0) return;`. Then set `run.memoryTold = true` (on show) and build the chip: text `come back: ` + `additions.map(a => getEnemy(a.id).name + (a.count >= 2 ? ' ×' + a.count : '')).join(', ')` (match the module's entry field names); label `textStyle(12, PALETTE.muted, { fontStyle: 'bold' })` at (0,-1) origin 0.5; `chipW = Math.ceil(label.width) + 14`; graphics with the exact leakCost rectangles: `fillRoundedRect(-w/2, -8, w, 20, 10)` in `PALETTE.cardDeep` (side), `fillRoundedRect(-w/2, -11, w, 20, 10)` in `PALETTE.card`; container `[g, label]`. Pop: `setScale(0)` + tween scale 1 / 200 / `Back.easeOut`; then tween alpha 0 / `delay: 1000` / 300 / `Quad.easeIn` / `onComplete` destroys it and nulls `this.chip` (capture the container in a closure). `place()`: `bottom = height - HUD.bottom / 2`; `above = isNarrow(width) ? bottom - NEXT_SIZE / 2 - 22 - 30 : bottom - (NEXT_SIZE / 2 + 7) - 10` (the preview card's bottom, copied from `NextWavePreview.place()`); `x = Math.min(width - EDGE - NEXT_SIZE / 2 - 4, width - EDGE - this.chipW / 2)`; `setPosition(x, above + 14)`. `layout()` stores size and re-calls `place()` if `this.chip` is alive.

### Steps
1. Read `src/core/remember.ts` and its call in `WaveSystem.planNext()` (T0473 lands first).
2. Flag + save lines (run.ts, saveRun.ts, RunSave.ts) — one line each, next to `farGateTold`.
3. Create `src/ui/hud/MemoryTell.ts` per Interfaces.
4. Wire `HudScene.ts` (import + part line).
5. Test block in `tests/core/saveRun.test.ts`; `npm run check`.

### Pitfalls
- Never re-derive the leaks: no `run.story`, no scanning `plan.spawns` — only the remember-module call.
- Flag is set the frame the chip is created; the `this.chip` guard blocks re-entry during its ~2 s life.
- Screen space only: no `DEPTH`, no board units, no `artScale`, no sound/key/button; `textStyle` (display ratio) not a raw font string.
- On wide the chip's bottom sits ~7 px over the button's ring top (the 17 px clearance < 20 px chip) — expected, do not move the button or card.
- Destroy on fade end; a mid-life resize is handled by `layout()` re-placing.

### Tests
- `tests/core/saveRun.test.ts`: the new `it` round-trips `memoryTold: true`, loads a keyless save as `false`, rejects `memoryTold: 'x'`.
