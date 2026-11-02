---
id: T0425
title: "The combo says what it pays: the first ×5 chain's one-time chip"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T13:12:56Z
---

## Goal
A first-time player who sees the extra gold pop on quick kills knows why: the run's first kill chain to reach ×5 says, once, at the moment the first +2 lands, that quick kills pay extra — taught with the one-time board chip the game already uses, not a new card, line or mark.

## Details
- **The rule already pays:** the kill-combo chain (T0031) pays +2 gold on the fifth kill of a chain and +4 on the tenth (T0066), each shown as its own small gold pop at the kill spot ~100 ms after the normal kill gold. Nothing anywhere says why the extra gold appears.
- **When:** the moment the run's kill chain first reaches ×5 — the same moment that fifth kill's "+2" pop lands at the kill spot.
- **What:** one small chip in the first-leak chip's own look (T0107/T0384: muted ink on a small white rounded chip) that pops at the kill spot, reading "×5 chains pay +2 gold", and fades after ~1.5 s (the first-leak chip's own timing: pop, hold, fade). It never covers the ×N counter (which rises above the kill) or the +2 pop.
- **Once per run:** the run remembers the moment it has shown — the far-gate chip's own once rule (T0384): a later ×5 or ×10 chain in the same run shows no chip, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes).
- **Nothing else:** no sound (the +2 pop, the ×N counter, the combo bar (T0220) and the ×10 milestone — the yellow counter, the chime, the 12-chip burst (T0034, T0254) — all play exactly as they do), no button, no new line on any card, no permanent mark on the board.

## Acceptance criteria
- [ ] In a fresh run, the moment a kill chain first reaches its fifth kill within the chain's 1.5 s window, a small white chip reading "×5 chains pay +2 gold" pops at the kill spot with that kill's "+2" gold pop, holds, and fades after ~1.5 s.
- [ ] The chip shows exactly once per run: no later chain (×5 or ×10) shows it, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes).
- [ ] The chip never appears on kills that make the chain ×1–×4, never covers the ×N counter or the +2 pop.
- [ ] The +2/+4 payouts, the gold pops, the kill-gold coin trail, the ×N counter, the combo bar, the ×10 milestone and the combo-break note (T0398) are all byte-identical to before.
- [ ] No new sound, button, card line or permanent board mark; the chip is board-space like the first-leak chip's and fits at 412x915 and 1280x720.

## Design (architect, yoga)

### Files
- create `src/systems/fx/comboTell.ts` - the one-time "×5 chains pay +2 gold" chip fx (copy of `farGateTell.ts`'s body, new text, kill-spot position, 100 ms delay to land with the +2 pop)
- edit `src/systems/enemyHooks/comboGold.ts` - in `onKill`, after the `comboGoldPop` line: fire `comboTell` on the run's first `bonus === 2`, setting `run.comboGoldTold`
- edit `src/core/run.ts` - new field `comboGoldTold` after `farGateTold` (line 59)
- edit `src/core/saveRun.ts` - `comboGoldTold` in `SavedRun` (after line 68), its validation line (after line 121) and parse (after line 168)
- edit `src/systems/RunSave.ts` - persist line (after line 59) and restore line (after line 90)
- edit `tests/core/saveRun.test.ts` - `comboGoldTold: false,` in `sample()` after line 34; one new `it` block after the far-gate test (line 232)
### Interfaces
- New: `export function comboTell(fx: FxSystem, x: number, y: number): void` in `src/systems/fx/comboTell.ts`
- New fields: `RunState.comboGoldTold = false` (mutable, like `farGateTold`); `SavedRun.comboGoldTold: boolean`
### Steps
1. Create `src/systems/fx/comboTell.ts` exactly:
```ts
import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import type { FxSystem } from '../FxSystem';

/** The run's one chip: the chain's first +2 says why the extra gold pays (T0425).
 * "×5 chains pay +2 gold" at the kill spot, 100 ms after the kill gold, with the "+2" pop
 * (fx/comboGold.ts); 26 below the spot, so it never covers the ×N counter or the +2 pop,
 * which ride above the kill. Looks like the first-leak chip (fx/leakCost.ts): muted ink
 * on a white rounded chip, 200 ms in, 1 s hold, 300 ms out. */
export function comboTell(fx: FxSystem, x: number, y: number): void {
  if (fx.full) return;
  fx.scene.time.delayedCall(100, () => {
    if (fx.full) return;
    const label = fx.scene.add.text(0, -1, '×5 chains pay +2 gold', {
      fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: cssColor(PALETTE.muted),
      resolution: 1 / fx.scene.scale.zoom,
    });
    label.setOrigin(0.5);
    const g = fx.scene.add.graphics();
    const w = label.width + 14;
    g.fillStyle(PALETTE.cardDeep, 1);
    g.fillRoundedRect(-w / 2, -8, w, 20, 10); // side face
    g.fillStyle(PALETTE.card, 1);
    g.fillRoundedRect(-w / 2, -11, w, 20, 10); // chip body
    const chip = fx.scene.add.container(x, y + 26, [g, label]);
    chip.setDepth(DEPTH.fx).setScale(0);
    fx.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
    fx.track(chip, 300, { alpha: 0, delay: 1000, ease: 'Quad.easeIn' }); // hold 1 s, out 300 ms
  });
}
```
2. In `src/systems/enemyHooks/comboGold.ts` add `import { comboTell } from '../fx/comboTell';` and, inside `onKill`, right after the `comboGoldPop(...)` line:
```ts
    // The run's one chip: the first +2 says why the extra gold pays (fx/comboTell.ts).
    if (bonus === 2 && !run.comboGoldTold) {
      run.comboGoldTold = true;
      comboTell(fx, enemy.x, enemy.y);
    }
```
3. `src/core/run.ts`, after line 59: `  comboGoldTold = false; // the run's one first-×5 gold chip showed (T0425)`
4. `src/core/saveRun.ts`, three lines each after its `farGateTold` kin: interface `  comboGoldTold: boolean; // the run's one first-×5 gold chip showed; older saves predate the field`; validation `  if (p.comboGoldTold !== undefined && typeof p.comboGoldTold !== 'boolean') return undefined;`; parse `    comboGoldTold: p.comboGoldTold === true,`
5. `src/systems/RunSave.ts`: in `persist` after line 59 `      comboGoldTold: run.comboGoldTold,`; in `restore` after line 90 `    run.comboGoldTold = saved.comboGoldTold;`
6. `tests/core/saveRun.test.ts`: in `sample()` after line 34 `  comboGoldTold: false,`; after the far-gate `it` (line 232) add the identical block pattern with `comboGoldTold` (title: `'round-trips a combo-gold-told save, and a save written without the key loads as untold'`), exactly like the far-gate one: save `{ comboGoldTold: true }`, load-equal, `delete without.comboGoldTold` loads as `sample()`, `broken({ comboGoldTold: 'x' })`.
### Pitfalls
- Fire only on `bonus === 2` (chain 5); the ×10 kill pays `bonus === 4` and must not show the chip.
- Set `run.comboGoldTold` before calling `comboTell` (the `farGatePulse` pattern in RunFlow.ts:219-222): a chip skipped at `fx.full` never replays.
- The 100 ms delay is on the scene clock (`fx.scene.time.delayedCall`, like `comboGoldPop`): it is cleared on scene shutdown, so no chip after the run ends; re-check `fx.full` inside the callback.
- Position is 26 board units below the kill spot: the ×N counter sits at `y-40`+ and the +2 pop rises from `y-20`; a chip at `y-26` or `y+15` or higher would cover them.
- Chip is board-space exactly like the first-leak chip: no screen-space clamping, no size check; it scales with the board zoom at 412x915 and 1280x720.
- Do not touch EnemySystem, RunFlow, FxSystem, `fx/comboGold.ts` or the hook registry — nothing else changes.
### Tests
- `tests/core/saveRun.test.ts`: the new round-trip `it` block (mandatory: `sample()` is typed `SavedRun`, so the field must be in it or typecheck fails).
