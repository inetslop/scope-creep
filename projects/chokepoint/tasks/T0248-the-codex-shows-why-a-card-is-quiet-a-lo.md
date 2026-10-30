---
id: T0248
title: "The codex shows why a card is quiet: a lock on the gated augments"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T01:33:38Z
epic: E4
design_attempts: 1
---

## Goal
The codex says why a gated augment is missing from the draft: every pool augment whose tech-tree node is not yet bought wears a small muted lock, so the tree's promise is seen on the screen where the cards are listed.

## Details
- In the codex (src/scenes/CodexScene.ts, the T0221 screen), the card of every pool augment gated by an unbought tech node wears a small muted-gray lock glyph in the card's top-right corner (~9 px: a rounded body with a shackle arc, in the codex's own muted-ink text color, the T0213 dot's position language).
- The gated set is derived, not named: an augment is locked exactly while some tech-tree node names it in its `unlocks` list and that node is unbought (the pool branch's nodes in src/content/tech/pool.ts and the purchased list in src/core/tech.ts — the same lookup the tech screen's locked state uses). Today that is Haste, Momentum and Mend; the ungated Epics (Mark, Rally, Mint, Anchor) never wear a lock.
- The lock is state-based: it clears the moment its node is bought (the codex re-derives on open). While at least one locked card is present, one small muted line under the grid reads "locked · tech tree" (the codex's muted line style); with no locked card there is no line.
- It replaces nothing and the screen has room: the tech tree shows the node's state where coins are spent; the codex is where the cards are listed, and the lock answers "why can't I pick this?" — shown nowhere else. The cards do not grow: the corner glyph and the under-grid line only; the icon, the name line, the tier word, both card lines and the grid layout stay as they are.
- No new input, no sound. Fits at 412x915 (2 columns) and 1280x720 (3 columns) as today.

## Acceptance criteria
- [ ] On a fresh profile the codex shows the lock on exactly the cards whose tech node is unbought (Haste, Momentum and Mend today) and the muted "locked · tech tree" line under the grid; no ungated card wears a lock.
- [ ] After buying one pool node (e.g. Haste) the lock is on the remaining locked cards only; after all three pool nodes are bought the codex is byte-identical to today (no lock, no line).
- [ ] Every card's icon, name line, tier word, card lines and the grid layout are unchanged; the codex fits at 412x915 and 1280x720 as before.
