---
id: T0068
title: "Coin chip: your coin balance on the match HUD"
size: M
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-31T12:44:22Z
---

## Goal
The shop's numbers are hidden while you play: coins tick in (the clink, the pop) but nothing says how many you have. A small chip on the match HUD shows the balance, so a life's earning is visible while it happens and a shop goal (Bloom 150, Chef Hat 300) reads as "close" or "not yet".

## Details
- What it shows: the player's coin balance — the same number the start card's coin line shows, live during the match. It ticks up the moment a kill coin, an event coin or a prestige pay lands, at the same instant the coin clink plays. Nothing else: no label — the coin says it.
- What it looks like: one small white sticker chip, one line: a yellow coin (the pickup's coin look, drawn small) and the balance, ink text in Fredoka.
- Where: top left, just under the connection card, on desktop and on the phone (412x915). It never grows past one line: the coin, then up to 5 digits without separators (99999). It must not cover the connection card, the xp bar, the middle of the screen or the thumb's drag path.
- When it shows: the whole time the match is shown — online or in this tab — including while you are down (the knockout card is centred; the chip stays top left). It is HUD, not start screen: the start card's coin line stays the place to see it between matches.
- What it replaces, or why the screen has room: it replaces nothing. Top left under the connection card is empty on both layouts, and the chip is one small line.
- A first-time player reads it in a second: the same coin that pops where a kill happens, with the number the shop spends.

## Acceptance criteria
- [ ] During a match, a small white chip under the connection card shows a yellow coin and the player's coin balance, updating at the moment coins land (a kill, an event gem, a prestige pay).
- [ ] The chip fits one line at 412x915 and 1280x720 with a 5-digit balance, covering nothing already on screen.
- [ ] It shows while online, in this tab, and while the player is down; it is not shown on the start screen.
- [ ] The start card's coin line still shows the balance between matches, unchanged.
