---
id: T0019
title: "Coins from kills: every kill pays, the start card shows the balance"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T04:17:26Z
epic: E6
---

## Goal
A player earns coins in the match for what they kill, the coins are kept for the next visit, and the start screen shows the balance — the first slice of the shop epic, so there is something to save up for.

## Details
- Earning (the only sources for now):
  - Monster kill: +1 coin, any monster.
  - Player knockout (a real player, not a bot): +coins equal to the victim's level (a level 12 knockout pays 12).
  - Nothing else yet; events and prestige earn coins in later slices of E6.
- Coins go straight into the player's profile with `ctx.giveCoins` — kept in the browser, visible on the next visit. Bots never receive coins.
- Seen where it happens: a new effect — a candy coin (a small yellow circle with an ink outline) pops where the kill happened, rises about 30 world units over 0.6 s and fades. On a player knockout, one coin per coin paid, each starting 0.05 s after the last: a level 10 knockout throws a short fountain of 10 coins.
- Start screen: a thin line in the start card, above Play: a small yellow coin and "N coins" (ink on a white sticker card, Fredoka). Shown even at 0, so a new player can see what it is. The in-match HUD is unchanged: no HUD element shows coins, the coin pop is the readout.
- Pace, to check in a smoke match: a new player farming for 5 minutes earns roughly 60–120 coins, a good player 150–250. That is the scale the shop prices are set against (first stock: T0021).

## Acceptance criteria
- [ ] Kill a Dot in a match: a yellow coin pops at the death spot and the player's coin balance goes up by 1.
- [ ] Knock out a real player at level 8: the balance goes up by 8, with a fountain of 8 coins at the spot. Knock out a bot: 0 coins.
- [ ] The start card shows the coin balance (even 0); after closing the browser and coming back, the same balance is still there.
- [ ] No new element on the in-match HUD; the HUD inventory is unchanged.
- [ ] A 5-minute farming match by a new player ends with roughly 60–120 coins — not 10, not 1000.
