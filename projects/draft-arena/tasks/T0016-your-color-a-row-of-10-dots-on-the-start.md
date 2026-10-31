---
id: T0016
title: "Your color: a row of 10 dots on the start screen"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T03:51:35Z
epic: E5
---

## Goal
A player makes their critter theirs: they pick one of the 10 colors on the start screen and keep it for their next visit. First slice of E5: the smallest version that works end to end — a pick, saved, seen by everyone in the match.

## Details
- The start card gets one of its own panels (a new menu part: its own file and its own .css, listed in MENU_PARTS, the same way the start screen's panels work): a white sticker card labeled **Color**, above Play.
- The card shows the current pick: a dot in the picked color, or the word **Random** if the player has not picked.
- Tapping it opens a bigger panel over the start screen (the start card's button-opens-panel pattern): the player's critter preview (the engine already previews the player's critter), and 11 choices — the 10 player colors from rules.playerColors as dots, plus a **Random** choice. Tapping a dot picks it at once: the preview updates and the pick is saved in the profile. Tapping the card again closes the panel.
- The pick is the player's own: it does not change any other player's or bot's color.
- In the match, the player's critter is that color for everyone in the match, every life. With **Random**, the game picks a color as it does today.
- The pick is kept in the profile (the player's own browser) and survives a reload and the next visit; a new browser or cleared data is **Random**.
- Layout: the card is at least 44 px tall on a phone; in the panel the dots wrap to at most 2 rows and the card sizes itself from its lines; the panel sits over the start screen without covering the name field or Play; it fits at 412x915 and 1280x720. Nothing new on the in-match HUD — the color shows on the critter itself, on the field (the screen shows the color nowhere today, so nothing is shown twice).

## Acceptance criteria
- [ ] The start card shows a new white sticker card labeled "Color" above Play: a dot in the picked color, or the word "Random".
- [ ] Tapping it opens a bigger panel with the player's critter preview, the 10 color dots and a Random choice; tapping a dot updates the preview and saves the pick; tapping the card again closes the panel.
- [ ] In the match, the player's critter is that color for everyone in the match, every life; with Random the game picks a color as today.
- [ ] Reload the page in the same browser: the pick is still there; in a fresh browser it is Random.
- [ ] It fits at 412x915 and 1280x720: the card is at least 44 px tall on a phone, the dots wrap to at most 2 rows, the panel does not cover the name field or Play, and no in-match HUD element is added or changed.
