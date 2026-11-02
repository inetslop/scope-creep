---
id: T0431
title: "The bank's first pay says what it is: the interest rule, taught once"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T15:49:41Z
---

## Goal
A first-time player who sees the "bank +N" line on the stats card learns, once, that their gold earns interest — closing a "nothing unexplained" gap (Pillar 8) on a rule that today only shows a number.

## Details
- On the run's first build phase in which the stats card's "bank +N" line is visible (gold at least 20, the line's own condition from T0374), one muted line appears once directly under it: "your gold pays 5% each wave" — the bank rate's own number (T0363) — in the line's own muted style, for about 1.5 s, then it fades and never shows again.
- It follows the run's one-time teach pattern (the early-send teach's shape, T0272; the first-clean-wave line's shape, T0314) in its own small file, so the stats card's own layout is untouched.
- It is a one-time teach, not a permanent mark: it never repeats, and it does not restate the number the "bank +N" line already shows — it only names the rule behind that number. It rides the build phase only, and adds no sound.

## Acceptance criteria
- [ ] On a run's first build phase where the "bank +N" line is visible, a muted "your gold pays 5% each wave" line appears once under it for ~1.5 s, then fades and never shows again in that run or any later run.
- [ ] It does not show when the "bank +N" line is not visible (gold under 20), and it never shows twice.
- [ ] It adds no permanent mark, no key, no button and no sound.

## Design (architect, yoga)

### Files
- create `src/ui/hud/BankTell.ts` — the run's one-time teach, a `HudPart` (model: `LevelChips.ts` for the part shape; `systems/fx/streakTeach.ts` for the pop-in/hold/fade timing; `ui/hud/TowerPanel.ts:135` for the one-time-flag trigger)
- edit `src/scenes/HudScene.ts` — one import + one line in `parts`
- edit `src/core/run.ts` — `bankTold` flag (after the `farGateTold` line)
- edit `src/core/saveRun.ts` — `SavedRun` field + parse check + mapping (3 lines, after the `farGateTold` lines)
- edit `src/systems/RunSave.ts` — persist + restore (2 lines, after the `farGateTold` lines)
- edit `tests/core/saveRun.test.ts` — `sample()` field + one round-trip test (after the far-gate test)

### Interfaces
```ts
// src/ui/hud/BankTell.ts
import type Phaser from 'phaser';
import { PALETTE } from '../../content/palette';
import { bankInterest } from '../../core/bankInterest';
import type { GameScene } from '../../scenes/GameScene';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

/** The run's one bank-rate line: "your gold pays 5% each wave" under the stats card's "bank +N" line, on
 *  the first build phase that line is up (bankInterest >= 1): pops in, stays ~1.5 s, never re-shown;
 *  a resumed run never re-teaches (run.bankTold, saveRun). No sound, no input. */
export class BankTell implements HudPart {
  constructor(private readonly scene: Phaser.Scene) {}
  layout(): void {}
  update(game: GameScene): void {
    if (game.run.bankTold) return;
    if (game.run.phase !== 'build' || game.scene.isPaused() || bankInterest(game.run.gold) < 1) return; // the bank line's own show condition (StatsCard.bankRow)
    game.run.bankTold = true;
    const label = this.scene.add.text(EDGE + 98 - 60, 100, 'your gold pays 5% each wave', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5).setScale(0);
    this.scene.tweens.add({ targets: label, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: label, alpha: 0, delay: 1000, duration: 300, ease: 'Quad.easeIn', onComplete: () => label.destroy() });
  }
}
```
Position: `EDGE + 98 - 60` is the bank line's own left edge (box at `EDGE+98`, line at `-60`, `StatsCard.ts`); `y = 100` is 15 below the bank line's centre (y = 85): the line sits at the card's bottom edge (104), above the level chips (which start at card bottom + 6 = 110). `textStyle(13, PALETTE.muted)` is the bank line's own style: not bold, no stroke, no chip behind it.
Wiring, each after the line named:
- `core/run.ts` after `farGateTold = false;`: `bankTold = false; // the run's one bank-rate line showed (T0431): a resumed run never re-teaches`
- `core/saveRun.ts` after `farGateTold: boolean;`: `bankTold: boolean; // the run's one bank-rate line showed; older saves predate the field`; after the farGateTold parse check: `if (p.bankTold !== undefined && typeof p.bankTold !== 'boolean') return undefined;`; after `farGateTold: p.farGateTold === true,`: `bankTold: p.bankTold === true,`
- `systems/RunSave.ts` persist after `farGateTold: run.farGateTold,`: `bankTold: run.bankTold,`; restore after `run.farGateTold = saved.farGateTold;`: `run.bankTold = saved.bankTold;`
- `HudScene.ts` import between the BossDeathBanner and HandBar imports: `import { BankTell } from '../ui/hud/BankTell';`; in `parts`, after `new StatsCard(this),`: `new BankTell(this), // the run's one "your gold pays 5% each wave" under the bank line (T0431)`
- `tests/core/saveRun.test.ts` `sample()` after `farGateTold: false,`: `bankTold: false,`; then the far-gate test, copied with `farGateTold` → `bankTold`.

### Steps
1. Create `src/ui/hud/BankTell.ts` exactly as above.
2. Wire the four run-flag files (run.ts, saveRun.ts, RunSave.ts) one line each, after the `farGateTold` line.
3. Add the part line in `HudScene.create()` after `new StatsCard(this),`.
4. Add the sample field and the round-trip test.

### Pitfalls
- Do not edit `StatsCard.ts` — its layout and the bank row are untouched; the part re-derives the row's own show condition instead of sharing a field.
- It is screen-space (HudScene), not board-space `fx.`: do not route it through `FxSystem` (camera-attached); the text is added to the HUD scene, so it draws over the card.
- Never re-place it from `layout()`: its x/y are fixed CSS pixels, like the stats card's own anchor; no overlap with LevelChips (chips at y ≥ 110) at 412x915 and 1280x720.
- The label must be destroyed in the fade tween's `onComplete` (no leak); two tweens on one target is the `streakTeach` shape (pop 200 ms, hold 1000 ms, fade 300 ms ≈ 1.5 s, no sound).
- The flag is run-scoped (as the one-time teach pattern dictates): set on show, persisted via saveRun, so a resume of the run never re-teaches.
- All new lines go next to the `farGateTold` line, never at the end of a list.

### Tests
- `tests/core/saveRun.test.ts`: `bankTold` round-trips, a save without the key loads as untold, `bankTold: 'x'` is broken (mirrors the far-gate test).
