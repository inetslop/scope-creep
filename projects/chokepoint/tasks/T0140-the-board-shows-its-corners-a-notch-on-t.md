---
id: T0140
title: "The board shows its corners: a notch on the bend cells"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T11:23:58Z
---

## Goal
The build cells that touch a bend of the road carry a small notch, so a first-time player sees which cells are worth more before the first placement (pillar 1: the board, not a tutorial, teaches where to build).

## Details
- A build cell that touches a bend of the road (a buildable cell beside a point where the road changes direction) carries one small notch on its face — a flat muted-ink tick in the cell's surface (the name tag's muted-ink color, T0085), not a floating chip.
- The notch is static: it is painted with the board when the board is grown (the board's own paint, alongside the road and the rocks), not a per-frame effect; it never moves, fades, or animates.
- No rule change: the notch is purely informational — it does not change a cell's value, its gold, or whether it can be built on.
- Closest example is the board's rock paint (static shapes drawn with the board); this adds a small notch to the face of each bend-adjacent build cell. The bends are the path's direction changes, already part of the board's geometry.

## Acceptance criteria
- [ ] On a new board, every build cell that touches a bend of the road shows one small muted notch on its face; cells beside straight stretches show no notch.
- [ ] The notch is static (painted with the board, no animation) and does not change a cell's value, gold, or buildability.
- [ ] The rest of the board looks the same (the road, the rocks, the cell shapes) — only the bend-adjacent cells gain the notch.
- [ ] No new sound, key, button, or pause-screen line.
