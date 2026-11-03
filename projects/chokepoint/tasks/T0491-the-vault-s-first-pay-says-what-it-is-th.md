---
id: T0491
title: "The vault's first pay says what it is: the last-stand doubling taught once"
size: S
priority: 2
status: todo
depends_on: [T0490]
attempts: 0
created: 2026-11-03T11:18:16Z
epic: E29
---

## Goal
The last stand's vault (T0490) doubles the bank's pay at one life; the run's first time that doubled pay is about to land should say so once, so the tech reads as working at the moment it fires instead of as a quiet +8 becoming a +16.

## Details
- One-time, per run, on the first build phase where all three hold: the vault node is owned, the run is at exactly 1 life, and the bank has gold to pay on (gold above zero). A small white chip — the first-leak chip's look (T0107) — pops under the stats card's "bank +N" line and fades over ~1.5 s, reading "at one life the bank pays double."
- It shows once per run (a flag the run save carries), never on a run without the node, never at 2 or more lives, and never twice.
- No sound, no HUD change beyond the one-time chip; the "bank +N" line itself still shows the doubled number.

## Acceptance criteria
- [ ] On the first build phase of a run with the vault owned at exactly 1 life and some gold banked, the chip pops under the "bank +N" line once, reads "at one life the bank pays double," and fades in ~1.5 s.
- [ ] The chip never shows on a run without the node, at 2 or more lives, or a second time in the same run; the flag survives a resume (the run save carries it).
- [ ] No other HUD element, sound, or permanent mark is added; the "bank +N" line is unchanged.

## Design (architect, yoga)

### Files
- create `src/ui/hud/VaultTell.ts` - the one-time teach chip part (model it on `src/ui/hud/NextWavePreview.ts` for the HudPart shape, and copy the first-leak chip's look from `src/systems/fx/leakCost.ts`)
- edit `src/core/run.ts` - one field on `RunState`, after the `farGateTold` line (line 59): `vaultTold = false; // the run's one vault chip showed (T0491): a resumed run never re-teaches`
- edit `src/core/saveRun.ts` - the `SavedRun` field after line 68 (`farGateTold: boolean;`): `vaultTold: boolean; // the run's one vault chip showed; older saves predate the field`; validate line after line 121: `if (p.vaultTold !== undefined && typeof p.vaultTold !== 'boolean') return undefined;`; read line after line 168: `vaultTold: p.vaultTold === true,`
- edit `src/systems/RunSave.ts` - persist line after `farGateTold: run.farGateTold,` (line 59): `vaultTold: run.vaultTold,`; restore line after `run.farGateTold = saved.farGateTold;` (line 90): `run.vaultTold = saved.vaultTold;`
- edit `src/scenes/HudScene.ts` - import `VaultTell` (between the `TowerPanel` and `WaveBanner` imports) and one part line after `new StatsCard(this),`: `new VaultTell(this),`
- edit `tests/core/saveRun.test.ts` - `vaultTold: false,` in `sample()` after `farGateTold: false,`, plus the test below

### Interfaces
```ts
// src/ui/hud/VaultTell.ts
import type Phaser from 'phaser';
import { PALETTE } from '../../content/palette';
import { BANK_NODES } from '../../content/tech/bank';
import type { GameScene } from '../../scenes/GameScene';
import { textStyle } from '../text';
import { EDGE, type HudPart } from './hud';

const VAULT_ID = BANK_NODES[2].id; // the last stand's vault (T0490): the bank's pay doubles at one life
/** Under the stats card's "bank +N" line: the line's screen y (the box centre 12 + 72/2 + 37), plus 20 for the pop. */
const CHIP_X = EDGE + 98; // the stats card's centre x, as StatsCard.layout() places it
const CHIP_Y = 12 + 72 / 2 + 37 + 20;

/** The last stand's vault's one teach: the run's first build phase with the vault owned, exactly one
 *  life and gold to pay on pops "at one life the bank pays double" under the stats card's "bank +N"
 *  line, once per run (run.vaultTold; the run save carries it). The first-leak chip's look
 *  (systems/fx/leakCost.ts): a small white chip that stays ~1.5 s. */
export class VaultTell implements HudPart {
  private readonly scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) { this.scene = scene; }
  layout(_width: number, _height: number): void {}
  update(game: GameScene): void {
    const run = game.run;
    if (run.vaultTold || run.phase !== 'build' || run.lives !== 1 || run.gold <= 0 || !run.techOwned.includes(VAULT_ID)) return;
    run.vaultTold = true;
    this.chip();
  }
  private chip(): void {
    const label = this.scene.add.text(0, -1, 'at one life the bank pays double', textStyle(12, PALETTE.muted, { fontStyle: 'bold' }));
    label.setOrigin(0.5);
    const g = this.scene.add.graphics();
    const w = label.width + 14;
    g.fillStyle(PALETTE.cardDeep, 1);
    g.fillRoundedRect(-w / 2, -8, w, 20, 10); // side face
    g.fillStyle(PALETTE.card, 1);
    g.fillRoundedRect(-w / 2, -11, w, 20, 10); // chip body
    const chip = this.scene.add.container(CHIP_X, CHIP_Y, [g, label]);
    chip.setScale(0);
    this.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: chip, alpha: 0, delay: 1000, duration: 300, ease: 'Quad.easeIn', onComplete: () => chip.destroy() });
  }
}
```

### Steps
1. `src/core/run.ts`: add the `vaultTold` field after the `farGateTold` line.
2. `src/core/saveRun.ts`: add the interface field, validate line and read line (each after its `farGateTold` line).
3. `src/systems/RunSave.ts`: add the persist and restore lines (each after its `farGateTold` line).
4. Create `src/ui/hud/VaultTell.ts` exactly as above.
5. `src/scenes/HudScene.ts`: add the import and `new VaultTell(this),` after `new StatsCard(this),`.
6. `tests/core/saveRun.test.ts`: add the sample line and this test after the far-gate test:
```ts
it('round-trips a vault-told save, and a save written without the key loads as untold', () => {
  const store = memory();
  saveRun(store, sample({ vaultTold: true }));
  expect(loadSavedRun(store)).toEqual(sample({ vaultTold: true }));
  const without = { ...sample() } as Record<string, unknown>;
  delete without.vaultTold; // older saves predate the field
  store.setItem(SAVED_RUN_KEY, JSON.stringify(without));
  expect(loadSavedRun(store)).toEqual(sample());
  broken({ vaultTold: 'x' });
});
```
7. `npm run check` must pass.

### Pitfalls
- `VAULT_ID` is `BANK_NODES[2].id` — the branch's third entry, which T0490 appends (node depth = its position in the list). After T0490 lands, verify that entry is the one whose line names the 1-life doubling; do not guess the id string.
- The trigger is per-frame over `run.phase === 'build'`; `run.lives === 1` exactly, `run.gold > 0` (not interest ≥ 1 — the chip may pop while the "bank +N" line is hidden for small gold; that is the spec).
- The flag is set before building the chip; it is persisted by `RunSave` on the next phase change, so a resume never re-teaches. A save written before the chip fired may show it once after resume — intended.
- The chip is a throwaway: destroy it in the fade-out `onComplete`; never keep it around, never pool it. No depth (HudScene is its own scene); it draws over the level chips while it pops, which is fine for 1.5 s.
- Fits 412x915: chip is ~210 px wide centered at x=114 (left edge ≥ 4), top edge 95; no layout change needed, `layout()` stays empty. No sound, no `Math.random`, no `dt` (tween timing only).

### Tests
- `tests/core/saveRun.test.ts`: the vault-told round-trip test above (the flag must survive a resume).
