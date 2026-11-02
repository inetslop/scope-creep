---
id: T0436
title: "The double mark: the second marked cell on some boards"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T17:22:19Z
---

## Goal
About one board in four carries a second marked cell, so placement reads two guaranteed strong cells instead of one — the marked cell's own mark and buff, nothing new to learn.

## Details
- ~1-in-4 boards (the seed-hash decision, the twin's own frequency and determinism pattern) mark a second open build cell, a different cell from the first mark, derived from the board's own seed the way the marked cell is; the first mark is untouched — every board still has exactly one first mark.
- The second cell wears the marked cell's own ground mark and the same buff: a tower built on it deals 1.25× damage, 1.5× with The rich cell — the buff reads through the marked cell's own rule, so the tech node, the panel's "marked · +N% damage" line and the marked cell's one-time chip all work on both cells with no change.
- No exclusivity: the double mark does not change the road, so it coexists with the fork, the loop, the cove and the twin.
- The boards reference gains its row: "The double mark — some boards", with its own committed seed and mini board (the twin row's pattern, the next free committed seed).
- No new teach: the marked cell's one-time chip already says what the mark means; the second one is the same mark.

## Acceptance criteria
- [ ] ~1-in-4 boards (hash-rate test, the twin.test's pattern) carry exactly 2 marked cells on different cells, deterministic per seed; no-hash boards keep exactly the one first mark; every board has exactly one first mark.
- [ ] A tower built on the second cell deals the marked cell's own buff (1.25×, 1.5× with The rich cell), shows the panel's marked line, and the marked cell's one-time chip works on it.
- [ ] The boards reference shows the row with its committed-seed mini board; a runChecks invariant (two marks, different cells) passes; the cove/loop/twin/boardFacts tests are untouched (no exclusivity); `npm run check` and the desktop + mobile smoke pass.
