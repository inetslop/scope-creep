---
id: T0424
title: "The boards reference wears the board's shape: a small live board on each row"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T12:40:16Z
claimed_at: 2026-11-02T13:00:39Z
designer: inet-racing
---

## Goal
The pause's Boards reference (T0350) names every board modifier in words — "the fork · some boards," "the far gate · tech · The door" — but a board's shape is only ever seen in a run. Each row now wears its modifier's board, so a first-time player who draws a fork pauses and sees the fork, not just the word.

## Details
- Each row of the pause's Boards reference — the list of the board's modifiers and where each comes from (always / tech · <node> / some boards) — gains a small board to the left of the row's name line, in the Enemies reference's own pattern (the token at the left of the name): the island, the white road, the gates, the rocks and the build cells in the board's own look, scaled to the row at ~96 px tall.
- One fixed seed per row's modifier, a committed constant (never a roll): the board grown from it exhibits that row's modifier. The fork row shows a fork, the loop row shows the road circling the island once, the cove row shows the bay with its pocket, the far gate row shows the second entrance, the switchback row shows the road folded back on itself, the marked cell row shows the marked cell's own look, and a plain base row (if the reference lists one) shows a plain road. A row's board is the same every time the reference opens, on any profile.
- The thumbnails follow the rows: the row set is unchanged (nothing added or removed), and the row's name and its source words are the reference's own, unchanged. A row whose modifier has no seed constant (a row added later) shows text only, exactly as the reference is today.
- The mini-board shows the shape only: no new mark, name, number or chip painted on it (the board's bar: nothing painted to hint, teach or decorate). The shape is shown nowhere in the reference today (the rows are words only); the boards leaderboard's entries, if they render a board, are scored run records, not modifier examples.
- It fits: the row grows to the board's height in the reference's own row pattern; if the rows no longer fit the card, the card takes the Enemies reference's own pattern (all rows in one card, every row reachable). Every row is reachable on screen at 412x915 and 1280x720 with the longest row name.
- No sound, no new key or button, no change to the pause's controls list. The run is untouched: the seeds are reference-only constants, and board generation, the run's save and the in-run readouts are unchanged.

## Acceptance criteria
- [ ] In the pause's Boards reference, each listed modifier's row shows a small board at the left of the name, and the board exhibits the row's modifier: the fork row shows a fork, the loop row shows the road circling the island once, the cove row shows the bay, the far gate row shows the second entrance.
- [ ] A row's board is identical every time the reference opens (a fixed seed, not a roll), on a fresh profile and an old one.
- [ ] A unit test grows each row's seed's board and asserts the board's facts carry that row's modifier, covering every row the reference lists today.
- [ ] The reference's row set is unchanged (nothing added or removed); a row without a seed constant shows text only, exactly as before; the row's name and source words are the reference's own.
- [ ] The mini-board carries no new mark, label or number; the card fits at 412x915 and 1280x720 with the longest row name, and every row is reachable on screen.
- [ ] The run is unaffected: board generation, the run's save and the in-run readouts are unchanged; a run's board is still rolled from the run's own seed.
