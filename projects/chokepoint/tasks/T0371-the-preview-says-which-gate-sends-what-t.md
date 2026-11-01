---
id: T0371
title: "The preview says which gate sends what: the far-gate share on the next-wave card"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T17:47:11Z
claimed_at: 2026-11-01T17:47:42Z
epic: E13
designer: inet-racing
---

## Goal
On a board with the far gate (T0338, or every board with The door owned, T0358), the build phase's next-wave preview (T0015) shows the incoming wave's gate split — so the player chooses which of the two lanes to cover in the build, not at the wave's door.

## Details
- **The line:** one muted line under the preview card's per-type counts, shown only on far-gate boards and only before non-boss waves: "far gate ×N", N the number of the wave's enemies that come in through the far gate (T0338's third of each non-boss wave). The count is read from the plan's existing gate split (read-only); if a pure count of it is missing, add the read to core/farGate.ts — not to core/waves.ts, whose plan logic is settled.
- **Look:** the preview card's own muted line (the tag-teach line's look, T0092): the card grows from its measured lines like every other line on it. Boss waves show no line (they come through the entrance alone); boards without the far gate show no line — those previews are byte-identical to today.
- **Why the screen has room:** the preview card already answers "what comes" with the per-type counts; on a two-gate board the build's real decision is which lane to cover, and the split is the one input the player does not have (the board shows the gate exists, the preview shows the composition, neither shows the split). One line in an existing card, no new HUD element, nothing shown twice. It is not the removed "+N gold" line (T0223): that showed the wave's clear bonus, this shows which gate sends the wave's enemies.
- No key, no sound, no other screen change.

## Acceptance criteria
- [ ] On a far-gate board, the build-phase preview before a non-boss wave shows one muted "far gate ×N" line under the per-type counts; N equals the plan's gate split for that wave.
- [ ] Boards without the far gate and every boss wave's preview are byte-identical to today (no line); a resumed far-gate run shows the line again in its next build phase.
- [ ] The preview's per-type counts, tag chips and the card's fit at 412x915 and 1280x720 are unchanged; the game is playable menu to game over on desktop and mobile.
