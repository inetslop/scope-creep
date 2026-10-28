---
id: T0048
title: The first draft always offers the default shot
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T12:01:28Z
epic: E4
---

## Goal
A first-time player's first tower is the game's default shot: the very first draft always includes a Common Bolt, so the opening pick is never a dead end.

## Details
- The pre-wave-1 draft (the first pick, before any wave) always includes at least one **Common** Bolt among its three offered cards.
- If the run's one reroll (T0036) is spent on that first draft, the rerolled offer still guarantees at least one Common Bolt.
- From the second draft onward (after wave 1 clears), the roll is completely normal — Bolt is not guaranteed and tiers roll as usual.
- Only the offer selection changes — which cards are rolled for that one draft. The card display, tier frames, odds line, and the rest of the run are untouched; in particular this must not touch the draft card's corner rendering, which the owned-dot work (T0044) owns.
- This is onboarding: the first tower a new player builds is the augment that "shoots the enemy furthest along," the game's default shot.

## Acceptance criteria
- [ ] On a fresh profile's first run, the pre-wave-1 draft shows at least one Common Bolt among its three cards.
- [ ] Using the reroll on that first draft re-rolls the offer but still shows at least one Common Bolt.
- [ ] The draft after wave 1, and every later draft, rolls normally with no Bolt guarantee.
- [ ] The tier odds, card frames, and the draft card's owned-dot corner are unchanged by this.
