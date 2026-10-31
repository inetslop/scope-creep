---
id: T0069
title: A Cosmetics button opens one place to buy and wear every look
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T12:51:01Z
---

## Goal
Players can't tell there is a shop: it only opens when the coin count on the start card is tapped. And hats are worn from a separate Hats card, while everything else is worn from the shop. One clearly named button, one place for every look.

## Details
- Start card: the tappable coin line becomes a button labelled "Cosmetics" with the coin balance on it (the coin icon and the number, e.g. "Cosmetics · 120"). It opens the panel. It uses the menu's button look (`menu-button`, not `primary`) and is at least 44 px tall.
- The panel (today the Shop overlay) is titled "Cosmetics" and lists every accessory, free ones included, by slot (Head, Face, Back), and every pattern. Free items say "Free". The player tries an item on in the preview, buys it if it isn't owned, and wears it or takes it off right there.
- Remove the Hats card from the start screen (src/menu/hats.ts, hats.css and its line in MENU_PARTS): hats are worn from Cosmetics only.
- The color picker stays as it is.
- Fits 412x915 and 1280x720 in its fullest state: every accessory and pattern listed, a 6-digit coin balance.

## Acceptance criteria
- [ ] The start card has a "Cosmetics" button showing the coin balance; it opens the panel.
- [ ] Every hat, other accessory and pattern can be worn and taken off from Cosmetics; free ones need no buying.
- [ ] There is no Hats card on the start screen.
- [ ] What is worn in Cosmetics shows on the critter in the match.
