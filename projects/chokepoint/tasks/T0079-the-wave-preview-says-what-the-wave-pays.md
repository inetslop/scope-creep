---
id: T0079
title: The wave preview says what the wave pays
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
epic: E1
---

## Goal
The break between waves has a price on it: the wave preview card (T0015) shows how much gold clearing the wave pays, so the build phase reads as a trade, especially now that Send (T0077) prices the rest of the countdown.

## Details
- One small muted line under the wave preview card during the build phase: "+N gold" — N is the wave's existing clear bonus, the same value the run pays when the wave is cleared (read from the wave plan / the clear flow, never recomputed a second way).
- Shown for every wave's preview, quiet waves included: the quiet wave's (T0071) clear bonus is unchanged by the quiet rule (only kill gold doubles), so the line shows the quiet wave's ordinary clear bonus.
- Muted ink, the preview card's own small text size (the counts' style), part of the same white card — no second card, no input, no sound, no count-up.
- The card grows by one fixed line height; the counts row and the quiet chip (T0071) keep their positions.
- Closest example: the preview card's own counts (T0015) and the quiet chip (T0071) — same card, same muted language; the line sits under the counts the way the claim card's recipe line (T0075) sits under its coins.

## Acceptance criteria
- [ ] During the build phase, the preview card shows "+N gold" under the counts, and N equals the clear bonus the run actually pays when that wave is cleared.
- [ ] The line is present on quiet waves (4, 8, 12, …) with that wave's unchanged clear bonus.
- [ ] Between waves and on the game-over/menu screens nothing changes; the line is only on the build-phase preview card.
- [ ] No layout change besides the one added line; desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/NextWavePreview.ts` — add a muted "+N gold" line under the counts row in the build-phase preview card; N = `RunState.waveBonus(plan.number)`, the exact bonus `clearWave()` pays

### Interfaces
none (no new types or functions)

### Steps
1. In the import block, after the `core/waves` import add: `import { RunState } from '../../core/run';`
2. After `const H = 44;` add: `const LINE = 16;`
3. In `build(plan)`, just before `const left = ...`, add the line text:
   `const payLine = scene.add.text(0, -H / 2, `+${RunState.waveBonus(plan.number)} gold`, textStyle(14, PALETTE.muted)).setOrigin(0.5, 0.5);`
4. Change the end of `build` to shift every existing piece down half a line and push the card taller:
   `for (const p of pieces) { p.x += left; p.y += LINE / 2; }` / `pieces.push(payLine);` / `pieces.unshift(makeCard(scene, 0, 0, this.cardW, H + LINE, (H + LINE) / 2));` (was `makeCard(scene, 0, 0, this.cardW, H, H / 2)`)
5. In `place()`, change `setPosition(x, above - H / 2)` to `setPosition(x, above - (H + LINE) / 2)` — the card keeps its bottom edge and grows upward.

### Pitfalls
- The card must grow UP only: the bottom stays at `above`, so the wide-screen card keeps its 10 px gap above the teal ring's top arc; growing down would cover the ring.
- Apply `p.y += LINE / 2` to all existing pieces (counts, dots, icons AND the quiet-chip container) so the row's screen position is unchanged; `payLine` is created after that loop at `y = -H/2` — do not run it through the loop.
- N must come from `RunState.waveBonus(plan.number)` — the same static method `clearWave()` pays with; never recompute from `WAVE_BONUS` or the plan. `plan.number` is already the wave to be fought (invariant in `debug/runChecks.ts`), and quiet plans don't change it.
- No width change: the line (≤"+NNN gold", ~60 px) always fits the existing ≥75 px card. No tween, sound or count-up; plain static text.
- The line exists only while the card exists (build phase): no change needed for draft/wave/game-over/menu.

### Tests
none
