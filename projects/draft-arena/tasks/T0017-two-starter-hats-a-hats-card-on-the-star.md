---
id: T0017
title: "Two starter hats: a Hats card on the start screen"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T03:51:35Z
epic: E5
---

## Goal
A player puts a hat on their critter on the start screen and keeps it: two free starter hats for E5 — the first things to wear while the shop (E6) does not exist yet.

## Details
Two new accessories, slot **head**, price 0 (free: everyone owns them, no buying yet):
- **Cone** — a yellow party cone: a tall yellow triangle sitting tilted on the top-right of the head, a red ball at the tip. Description: "A yellow party cone with a red tip."
- **Beanie** — a purple beanie: a purple band and fold across the top of the head, a small pink ball on top. Description: "A purple beanie with a pink pom."
- Both: a clear silhouette at a player's size (36 units across), they never cover the eyes, they reach at most one radius (18 units) above the top of the head (the player's name sits above that), candy colors with ink outlines, no glow.
- The head slot is empty today: there is no existing hat to compare with or recolor.

A new menu part (its own file and its own .css, listed in MENU_PARTS): a white sticker card labeled **Hats**, above Play.
- The card shows what the player is wearing: a small drawing of the hat, or **None** to start.
- Tapping it opens a bigger panel over the start screen: the player's critter preview (the engine already previews the player's critter wearing things), and 3 choices — **None**, **Cone**, **Beanie**, each a small drawing with its name. Tapping a choice wears it at once (preview updates, saved in the profile's "what they wear"); tapping the worn hat takes it off. All three are owned, so the panel shows no prices and no buying.
- In the match, the player's critter wears the hat for everyone in the match, every life. Bots wear the new hats at random, so they show up on the field at once.
- The pick is kept in the profile and survives a reload and the next visit; a new browser is **None**.
- Layout: the card is at least 44 px tall on a phone; the 3 choices fit in one row; the panel sits over the start screen without covering the name field or Play; it fits at 412x915 and 1280x720. Nothing new on the in-match HUD — the hat shows on the critter, on the field.

## Acceptance criteria
- [ ] The start card shows a new white sticker card labeled "Hats" above Play: what the player is wearing, "None" to start.
- [ ] Tapping it opens a panel with the critter preview and the choices None, Cone, Beanie; tapping Cone puts a yellow cone with a red tip on the critter in the preview and saves it; tapping the worn hat takes it off.
- [ ] In the match, the player's critter wears the hat for everyone in the match, every life; at least one bot on the field wears a hat.
- [ ] Reload the page in the same browser: the hat is still worn; in a fresh browser it is "None".
- [ ] The cone and the beanie never cover the eyes, reach at most one radius above the head, and read clearly on a critter at 412x915 and 1280x720.
- [ ] A hat changes nothing in play: the player's hp, speed, radius and pickup range are the same with and without it.
