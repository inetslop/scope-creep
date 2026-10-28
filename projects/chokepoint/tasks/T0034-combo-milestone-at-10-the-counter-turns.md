---
id: T0034
title: "Combo milestone: at ×10 the counter turns yellow"
assignee: desktop-4070
size: S
priority: 2
status: done
depends_on: [T0021]
attempts: 1
created: 2026-10-28T08:30:13Z
claimed_at: 2026-10-28T11:51:22Z
finished_at: 2026-10-28T11:58:44Z
---

## Goal
A long kill chain pays off: at ×10 the kill-combo counter turns yellow and the milestone kill bursts bigger, so a fast hand is noticed the way a clean wave is.

## Details
- The kill-combo counter from T0031 is normally bold 14 px muted ink above the last kill. When a chain reaches ×10, the counter turns yellow — and stays yellow for the rest of that chain (×11, ×12, ...), until the 1.5 s window breaks.
- The kill that takes the chain to ×10 bursts with twice the usual chip count (same chip size, spread and color as a normal kill burst).
- A chain that breaks before ×10 never turns yellow. After a break, the next chain starts muted ink again.
- No sound, no new HUD element, no change to the combo window, the counter's size, position or fade.

## Acceptance criteria
- [ ] Chains from ×2 to ×9 look exactly as today: muted-ink counter, normal chip burst.
- [ ] The kill that takes a chain to ×10 bursts with twice the usual chip count, and its counter reads ×10 in yellow.
- [ ] The counter stays yellow through ×11, ×12, ... while the chain holds.
- [ ] After the chain breaks, the next chain's counter starts muted ink again.
- [ ] No change to the 1.5 s window, the counter's 14 px bold style or position, or any sound or other effect.

## Design (architect, yoga)

### Files
- edit `src/systems/FxSystem.ts` — `killCount()` returns whether the kill reached ×10 and turns the counter yellow there; `burst()` gains an optional `double` flag that doubles the chip count (6 → 12).
- edit `src/systems/EnemySystem.ts` — in `strike()`, the two fx lines swap so the ×10 flag flows into the burst.

### Interfaces
```ts
// FxSystem (both already imported: textStyle, PALETTE, cssColor)
killCount(x: number, y: number): boolean;              // was : void — true only for the kill that takes the chain to ×10
burst(x: number, y: number, color: number, double: boolean = false): void;  // double: 12 chips instead of 6
```
No other signature changes; `MenuDemo.ts:175` keeps its 3-arg `burst` call working.

### Steps
1. In `FxSystem.burst()`, replace the chip loop header only: `const n = double ? 12 : 6;` then `for (let i = 0; i < n && this.live < FxSystem.MAX; i++)` and `const a = (i / n) * Math.PI * 2 + Math.random() * 0.6;` — the rest of the method (white pop, chip size `0.6 + Math.random() * 0.5`, distance `22 + Math.random() * 14`, tint) is untouched. Update its doc line: `` `double` scatters 12 chips instead of 6 (the ×10 milestone kill). ``
2. In `FxSystem.killCount()`: change signature to `): boolean {`; change `if (this.comboN < 2) return;` → `if (this.comboN < 2) return false;`; after the `t.setText(\`×${this.comboN}\`);` line add exactly: `if (this.comboN === 10) t.setStyle(textStyle(14, PALETTE.yellow, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }));`; after the `this.comboTimer = this.scene.time.delayedCall(1500, () => this.comboFadeStart());` line add `return this.comboN === 10;`. Nothing else in the method moves — the 1.5 s check, position `y - 40`/`- 8`, pop tween and fade stay byte-identical.
3. In `EnemySystem.strike()`, replace lines 101–102 (`this.fx.burst(...)` + `this.fx.killCount(e.x, e.y);`) with: `const milestone = this.fx.killCount(e.x, e.y);` then `this.fx.burst(e.x, e.y, PALETTE[e.def.look.color], milestone);`

### Pitfalls
- The counter text is created once per chain in muted ink and destroyed only by the existing fade; at ×10 it is guaranteed alive, so `setStyle` on it is safe, and the yellow simply rides on the same object through ×11, ×12, ... — no extra state field, nothing to clean up, the existing fade `onComplete` still destroys it and a new chain's text is built from the unchanged muted line, so it starts muted again.
- Apply the style only on `comboN === 10`, never `>= 10` — the double burst must fire exactly on the taking-kill (that is what `killCount` returns).
- Don't touch the white pop, chip size/spread/tint, the 1.5 s window, the 1.5 s→400 ms fade, `DEPTH`, or any sound — acceptance forbids it.
- The 12-chip path stays under the existing `MAX` cap (`live < FxSystem.MAX` per chip); no pooling involved.
- T0021 (Mint) edits the same `strike()` gold lines — merge after it or the two-line hunk conflicts.

### Tests
- none

## Result (attempt 1, desktop-4070)

At ×10 the kill-combo counter now turns yellow (and stays yellow for the rest of that chain) and the milestone kill bursts with 12 chips instead of 6 — implemented in `src/systems/FxSystem.ts` (`killCount()` returns true only on the taking-kill and recolors the shared counter text; `burst()` gained an optional `double` flag) and a two-line swap in `EnemySystem.strike()` so the flag reaches the burst. No other effect, timing, style, position or sound was changed; `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 7.4 min

```
projects/chokepoint/game/src/systems/EnemySystem.ts |  4 ++--
 projects/chokepoint/game/src/systems/FxSystem.ts    | 15 +++++++++------
 2 files changed, 11 insertions(+), 8 deletions(-)
```
