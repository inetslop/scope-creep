---
id: T0467
title: "The levels reference: a menu card that names every level"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T03:26:12Z
epic: E21
---

## Goal
The level pick on the run-setup step is a real choice only if the player knows what each level does. A "Levels" card on the menu lists every level with its effect and its coin multiplier, so the pick is readable from one place — and it completes the game's reference set (enemies, waves, bosses, coins, boards, how, the augments codex).

## Details
- A "Levels" button on the menu, in the How/Tech row (the How card's own pattern, T0351). Tapping it opens the card over the dimmed menu.
- The card is a white rounded card (the How card's look) that lists every run level, in the run-setup step's own order, read from the level data — so a new level (Plain, and any after it) names itself here with no change to this file.
- Each row, top to bottom: the level's name in bold ink, its dry one-liner (the run-setup step's own words, not new copy), and its coin multiplier (the run-setup step's own number, e.g. "coins ×1.25").
- The card is a reference only: it does not show the current pick (levels are picked per-run on the setup step, not remembered) and it changes nothing.
- A Back button returns to the menu (the How card's back pattern). If the set ever outgrows the card it scrolls the way the codex does (T0221).
- It fits: every line, with the longest name and the biggest multiplier number, fits its card at 412x915 and 1280x720.

## Acceptance criteria
- [ ] The menu has a "Levels" button in the How/Tech row; tapping it opens the card over the dimmed menu, and Back returns to the menu.
- [ ] The card lists every level with its name, one-liner and coin multiplier, read from the level data (a newly added level appears here with no change to this card).
- [ ] The card is a white rounded card in the How card's look; no other menu element moves or is shown twice.
- [ ] Every line fits at 412x915 and 1280x720.
- [ ] The button is discoverable where it is used and listed on the pause screen's controls (Pillar 8).
