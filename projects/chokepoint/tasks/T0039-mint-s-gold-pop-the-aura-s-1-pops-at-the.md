---
id: T0039
title: "Mint's gold pop: the aura's +1 pops at the kill"
size: S
priority: 3
status: todo
depends_on: [T0021, T0028, T0034]
attempts: 0
created: 2026-10-28T10:05:34Z
epic: E4
---

## Goal
A Mint's extra gold is seen where it happens: whenever a kill pays a Mint's +1, a small gold "+1" pops at the kill spot, so a support tower that never fires is visibly working.

## Details
- Mint (T0021) already pays +1 extra gold per kill within its 2 cells, plus +1 more per extra Mint in the killing tower. This task adds only the visual: whenever any part of a kill's gold comes from a Mint bonus, a small gold "+1" pops at the kill spot — the same pop as the normal kill gold (same gold color, same rise and fade).
- One "+1" pop per Mint bonus paid: a kill in range of two Mint towers pops two "+1"s side by side; a Mint inside the killing tower pops one at the kill spot.
- The "+1" pops about 100 ms after the normal kill-gold pop, so the bonus reads as an addition on top.
- No change to gold totals, the run coin tally, sounds, or the normal kill-gold pop. No new HUD element.

## Acceptance criteria
- [ ] A kill within a Mint tower's 2 cells shows the normal kill-gold pop and, ~100 ms later, a small gold "+1" at the same spot.
- [ ] A kill covered by two Mint bonuses (two Mint towers in range, or a Mint in the killing tower plus one nearby) shows one "+1" per bonus, side by side.
- [ ] A kill with no Mint in range and no Mint in the killing tower shows only the normal gold pop, exactly as today.
- [ ] Gold totals, the HUD coin tally and all sounds are unchanged by the pop.

## Design (architect, yoga)

### Files
- edit `src/systems/FxSystem.ts` — add `mintPop()` method, placed directly after `popText()` (last method of the class)
- edit `src/systems/EnemySystem.ts` — two lines in `strike()`: derive the count, call `this.fx.mintPop`
### Interfaces
```ts
// FxSystem new public method (no other new/changed types)
mintPop(x: number, y: number, count: number): void;
```
### Steps
1. T0021 must be in already: in `strike()` the kill line must be `const paid = this.run.addKill(e.def.gold + <mint bonus>)` — the Mint gold folded into what the kill pays. The count below is derived from that paid amount; if T0021 instead pays the bonus in a separate statement, use that statement's value as `mint` and leave `paid` as is.
2. In `FxSystem.ts`, after `popText()`, add:
```ts
/** Mint's +1 pops: one small gold "+1" per bonus the kill was paid, side by side, 100 ms after the kill gold. */
mintPop(x: number, y: number, count: number): void {
  const xs: number[] = [];
  for (let i = 0; i < count; i++) xs.push(x + (i - (count - 1) / 2) * 22);
  this.scene.time.delayedCall(100, () => {
    for (const px of xs) {
      if (this.live >= FxSystem.MAX) break;
      const t = this.scene.add
        .text(px, y, '+1', textStyle(14, PALETTE.goldText, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }))
        .setOrigin(0.5).setDepth(DEPTH.fx);
      this.track(t, 750, { y: y - 34, alpha: 0, ease: 'Quad.easeOut' });
    }
  });
}
```
3. In `EnemySystem.strike()`, after `const paid = this.run.addKill(...)` add `const mint = paid - e.def.gold; // one per Mint bonus, each pays exactly +1 (T0021)`, and after `this.fx.popText(e.x, e.y - 20, `+${paid}`);` add `if (mint > 0) this.fx.mintPop(e.x, e.y - 20, mint);`.
4. `npm run check`, then `npm run smoke`.
### Pitfalls
- The pop must be read-only: never touch gold, the coin tally, `run.addKill` or Sfx; sounds and the normal pop stay byte-identical.
- `paid - e.def.gold` only counts bonuses if T0021 folds them into the `addKill` call — verify step 1 before editing; `mint` is always ≥ 0 here, `if (mint > 0)` guards it.
- Every pop goes through `this.track` (decrements `live`, destroys the text on complete) and the per-pop `FxSystem.MAX` check (`break`, not `return`, inside the loop) — no leaked objects, `count` stays honest.
- `x`, `y` are board units at the kill spot (same anchor as the kill pop, `e.x, e.y - 20`), depth `DEPTH.fx`; the 100 ms is a `scene.time.delayedCall` (dies with the scene clock, like `comboTimer`), not `dt`; do not store the timer event.
- Spacing 22 / font 14 mirror `killCount`'s style; two pops land at `x±11` (side by side), one at `x` (kill spot). T0034 also edits `FxSystem` (`killCount` only) — leave that method and the area above `popText` untouched.
### Tests
none
