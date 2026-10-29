---
id: T0221
title: "The Augments codex: a menu screen that shows every augment in the pool"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T16:54:18Z
claimed_at: 2026-10-29T16:54:22Z
epic: E4
designer: desktop
---

## Goal
The game's whole vocabulary — every augment, and what it does in both forms — lives in one-word names a first-time player meets three at a time in the draft. A menu screen shows the whole pool at a glance, so "what could this combine into?" is answerable before the first pick.

## Details
- A new "Augments" button in the menu's button group (the Tech button's look and size, beside it) opens a new scene; a round ink back button at the top right (the PauseButton's look) returns to the menu. The scene is a menu-adjacent screen in the Tech scene's pattern; the menu behind it is untouched.
- The scene is one white rounded card (the end card's language, T0216's fit) that scales to fit the screen: a bold "Augments" title at the top, and under it a grid of entries — one per augment in the pool, in the pool's order (the same list the draft rolls from; the 16-cap churn means the grid simply mirrors the pool at open time).
- Each entry is a small card: the augment's icon (the draft's own icon, about 24 px) at left; the name in bold draft-card style, with a small purple "Epic" word after it for the Epic-only augments (the tier word's color, T0100) and plain for every other entry; under the name, the augment's two card rows in the exact text the draft shows — the first-augment row in the ink, the added row muted — one line each, and if a row overflows the entry's width it wraps to a second line and the entry grows (T0136's pattern).
- The grid: 3 columns on desktop (1280x720), 2 columns on mobile (412x915). The card grows with its rows and the whole card scales to fit the screen like the end card (T0216) — no scroll, no clip, no overlap at either size; 14 entries today, 19 with the queued registrations all landing.
- A back tap plays the menu's existing button blip; that is the only sound; no input beyond the back button and no keys.
- It shows the vocabulary only: no odds (the draft shows those), no prices, no tower stats, no "seen" tracking — every entry is visible from the first open, the Epic-only ones included (that is the point: a first-time player sees what the Epic draws can be before they roll them).
- It changes nothing in a run: the draft, the hand, the tower panel, the pool, the tech tree and the board are untouched; the codex reads the pool's data and owns no state.

## Acceptance criteria
- [ ] The menu has an "Augments" button (the Tech button's look) that opens the codex scene, and its back button (top right, round ink) returns to the menu with the button blip.
- [ ] The scene shows exactly one entry per augment in the pool, in the pool's order: icon, name (purple "Epic" word for the Epic-only ones, plain for the rest), and the augment's two card rows in the draft's own text.
- [ ] At 1280x720 the grid is 3 columns and at 412x915 it is 2 columns; the card grows with its rows and scales to fit — nothing scrolls, clips or overlaps at either size, with 14 entries today and 19 with the queue.
- [ ] Opening the codex and leaving it changes nothing: the menu's demo, the profile card, the resume/ghost buttons, the draft and every in-game screen behave exactly as before, and the smoke test passes on desktop and mobile.
