---
id: T0224
title: "The rewards card: one tidy column that fits its card"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T17:00:35Z
claimed_at: 2026-10-29T17:07:27Z
designer: desktop
---

## Goal
The rewards card (the claim screen after a run) has outgrown its layout. Seen at 412x915: an empty band above the "Rewards" title; the coin breakdown ("waves +13 · stopped +40 · clean +11") runs past both edges of the card and the score breakdown nearly does; the coin icon sits far from "+64 coins"; the gaps between lines are uneven (the coin line crowds its neighbours, a large gap above Menu). Make it one tidy column that always fits inside its card.

## Details
- **Why it broke:** every line in `src/scenes/RewardsScene.ts` has a hand-placed y offset that tasks added one at a time, and the card's height comes from a separate formula (`panelH`, the `dy` per "middle line") that no longer matches the lines.
- **Lay the card out as one column, built from its lines in order:** each line's y comes from the line above it (its height plus a gap), and the card's height is the content plus the same padding at the top and the bottom. Two gap sizes only: a small one inside a group, a bigger one between groups.
- **The groups, top to bottom:** the title; the run (Waves held, Stopped, Clean, Best combo); Score and its breakdown; the coins and their breakdown; the board code (and Flawless when the run was flawless); the Menu button.
- **The two breakdown lines** (muted gray) are smaller than the lines they explain (about 16 px against 22 px), and never wider than the card minus its padding: if one would be wider, it shrinks to fit (never below 13 px).
- **The coin icon** sits right beside "+N coins" (a small fixed gap), and the pair is centered.
- **Keep:** the count-up, the colors, which lines appear when (Clean only after a clean wave, Best combo from 2, Flawless only when flawless), the Menu button, and the scaling that keeps the whole card on screen.

## Acceptance criteria
- [ ] At 412x915 and 1280x720, no text crosses the card's edges (at least 16 px inside them), for a long run (a 5-digit score, a 4-digit stopped count, 3-digit coins) and for a short one.
- [ ] The padding above the title equals the padding below the Menu button: no empty band.
- [ ] The gaps are the same between the lines of a group, and the same between groups.
- [ ] The coin icon sits beside the coin number.
- [ ] The lines appear under the same conditions as before, and the count-up works as before.
