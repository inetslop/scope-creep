---
id: T0409
title: "The cove: a bay in the island's edge"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T06:19:02Z
claimed_at: 2026-11-02T07:17:27Z
designer: desktop
---

## Goal
About one board in six carries a cove: a bay scooped into the island's edge beside a road curve, with a pocket of build cells that covers the curve from both sides at once — a new silhouette and a new visible double-cover position, with nothing painted on it.

## Details
- The cove is a natural board fact, in the fork's and the loop's own class: about one board in six carries it.
- What the player sees: the island's edge dips in — a pocket of the light ground between the rocks, a shallow bay opening onto a curve of the road. Three build cells sit in the pocket, facing the curve. The road itself is unchanged: the cove reshapes the island's edge, not the road (the loop reshapes the road; the cove reshapes the island).
- Why it changes placement: the pocket's cells reach the curve from two sides at once — at least two of the three pocket cells are double-cover cells (two or more straight stretches of the road in range, the choke's own term). The island's own shape suggests the position; the player confirms it with the range ring while placing, as with every cell. Nothing is painted on the cells or the island (the board's bar).
- Coexistence: never on a fork or a loop board — their silhouettes already own the read. Free to coexist with the marked cell, the far gate, the choke and the switchback.
- The facts and the reference name it: the board facts and the boards reference add the cove as a "some boards" fact, in the fork's own line style. No other new words, readout or mark anywhere.
- The board code carries it: the same seed regenerates the same cove (the board code's round-trip rule, the fork's own).
- If a board cannot place the cove's guarantee (the double-cover pocket), it falls back to the plain board — the frequency stays approximate, and a board without the cove is byte-identical to today.
- No new sound, no HUD change, no permanent mark: the shape and the two existing fact displays are the whole task.

## Acceptance criteria
- [ ] Over a sample of at least 1000 generated boards, between one in ten and one in four carries the cove (the target is one in six); none of them is a fork or a loop board.
- [ ] On a cove board, three build cells sit in the pocket and at least two of them each reach two or more straight stretches of the road (a tower built on one covers both sides of the curve).
- [ ] The board facts and the boards reference name the cove as a "some boards" fact; the same seed regenerates the same cove.
- [ ] Boards without the cove are byte-identical to before the change: same road, rocks, cells, choke, marked cell and gates.
- [ ] No mark, label or readout is painted on the board or the HUD; `npm run check` and the desktop + mobile smoke pass.
