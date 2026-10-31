---
id: T0314
title: The first clean wave says what the streak pays
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T00:11:52Z
---

## Goal
A first-time player watches the exit's clean text count "1 of 3 in a row" and never learns what reaching 3 does; on the run's first clean wave, the line names the reward — in the game's teach-once pattern (T0107's first leak, T0272's early send, T0307's Hauler).

## Details
- On the run's first clean wave, one muted line under the exit's clean text (T0205's two-line green text at the exit gate): "3 in a row brings a life back · once per run".
- The teach lines' own look (T0107/T0272's muted line): muted ink, ~1.5 s, no sound, no input — nothing stays on the board after it fades.
- Once per run: the run's second, third and later clean waves show nothing new. Re-derived on resume (T0272's pattern): it shows only at the moment of the run's first clean wave — a resumed run whose ledger already holds a clean wave never shows it. No new run field: the first clean wave is the clear at which the ledger's clean count is still zero.
- The streak rule (T0045: three clean in a row, one life, once per run), the exit's clean text (T0205) and the streak's pay note (T0290) are untouched.
- Closest example for the build: the first-leak teach — a new file in `src/systems/fx/` (a sibling of `src/systems/fx/leakCost.ts`) fired from the one place the exit's clean text is spawned on a clean wave (T0205's site).

## Acceptance criteria
- [ ] In a fresh run, the first clean wave shows the muted line under the exit's clean text for ~1.5 s; later clean waves show only the existing text.
- [ ] A run that never holds a clean wave never sees the line; a resumed run never sees it.
- [ ] No sound plays with the line, and the streak rule, the exit's clean text and the streak's note behave exactly as before.
- [ ] The line fits the exit text's own size at 412x915 and 1280x720, and no mark remains on the board after it fades.

## Design (architect, yoga)

### Files
- create `src/systems/fx/streakTeach.ts` - the first-clean-wave teach: one muted line "3 in a row brings a life back · once per run" at absolute board coords, ~1.5 s, self-destroying. Full contents (model: sibling `src/systems/fx/leakCost.ts`):
```ts
import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import { textStyle } from '../../ui/text';
import type { FxSystem } from '../FxSystem';

/** The run's first clean wave: the muted line under the clean text naming the streak's pay.
 * Pops in, ~1.5 s, no sound, no input; the text is destroyed when it fades. */
export function streakTeach(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  const label = fx.scene.add
    .text(x, y, '3 in a row brings a life back · once per run', textStyle(14, PALETTE.muted, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }))
    .setOrigin(0.5)
    .setDepth(DEPTH.fx)
    .setScale(0);
  fx.scene.tweens.add({ targets: label, scale: 1, duration: 200, ease: 'Back.easeOut' });
  fx.track(label, 300, { alpha: 0, delay: 1000, ease: 'Quad.easeIn' }); // hold ~1 s, then fade and destroy
}
```
- edit `src/systems/RunFlow.ts` - one import line (`import { streakTeach } from './fx/streakTeach';`, next to the other `./` imports, after the `./FxSystem` import) and one line in `clearWave()` at the clean site (T0205), after `this.s.fx.cleanLines(cx, cy + 40, second);`:
```ts
      if (cleanBefore === 0) streakTeach(this.s.fx, cx, cy + 40 + 52); // run's first clean wave: cleanWaves still 0, the muted line names the pay
```

### Interfaces
- `export function streakTeach(fx: FxSystem, x: number, y: number): void` in `src/systems/fx/streakTeach.ts`. Nothing else changes: no run field, no save change, no `FxSystem`/`Sfx`/registry edits.

### Steps
1. Create the fx file exactly as above (text-only, no chip, no sound; `fx.track` destroys it at the end of the fade).
2. In `RunFlow.clearWave()`, where `clean` is true (lines 151-155), add the guard line after the `cleanLines` call. `cleanBefore` (the `run.cleanWaves` captured before `this.run.clearWave()`) is 0 exactly at the run's first clean wave: a later clean wave has `cleanBefore ≥ 1` and shows nothing new; a resumed run's ledger restores `cleanWaves` from the save (`RunSave.restore`), so a run that already holds clean waves can never show it.

### Pitfalls
- y is `cy + 40 + 52`, derived from `cleanLines`: container at `cy + 40`, its second line at +28, this line 24 px below that (14 px font, one size under the 16 px line it sits under). Never a hand-picked offset — overlapping the second line is the failure mode.
- No state anywhere: no closure variable, no run field, no save/`run.ts`/`saveRun.ts`/`RunSave.ts` edits (the task forbids a new run field; T0310 edits `RunSave.ts` in parallel).
- Don't touch `FxSystem.ts` (T0235 edits it), `run.ts` (T0064/T0292), the green `cleanLines`/`cleanStreakLine` text or `streakPay` — all must behave exactly as before.
- The line must be gone before it can linger: fade completes at ~1.5 s; the draft veil opens at 1 s; the object is destroyed on fade `onComplete` (the `track` does that — don't add your own timer).

### Tests
- none
