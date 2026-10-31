---
id: T0029
title: "The prestige pays: the Nth prestige this life pays 25 x N coins"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T05:50:41Z
claimed_at: 2026-10-31T06:30:40Z
epic: E7
designer: desktop
---

## Goal
Prestiging pays: every reset this life banks coins for the shop (E6), so a life that resets early and often is a coin engine — without handing back the power the reset took. (Replaces T0024: the engine exposes only prestiges this life, so the pay is scoped to the life.)

## Details
- A new director (one file in src/content/directors/, the closest example: gem-rain.ts for the shape; it uses the engine's onPrestige hook, planning/modules/prestige.md): when a player prestiges, they get 25 x n coins, where n is their prestiges this life including this one — 1st pays 25, 2nd pays 50, 3rd pays 75, and it keeps going (25 x n). Bots get no coins.
- The reward is coins only (the shop sells looks): right after a prestige the player is a level-1 critter with only Bolt rank 1 — score, kills and hp kept — weaker than a level-17 player, never overpowered again.
- A life that prestiges twice adds 75 coins on top of what kills and events pay (T0019, T0027) — about a cheap shop item, so a second life is worth living but never worth skipping the fight.
- A new HUD card (one file in src/hud/ plus its .css, listed in HUD_PARTS; the closest example: the knockedOut card — a card that shows and hides on its own): a white sticker card under the xp bar, top centre, shown for 2 s when the player's own prestiges-this-life counter goes up: "Prestige! +25 coins" (2nd: "Prestige! +50 coins"). It shows what nothing on screen shows — the coins just earned (the start card shows the balance between matches only). It is transient: 2 s, then gone; it replaces nothing and never stacks (a new prestige within 2 s restarts the timer).
- Fullest state: "Prestige 9! +225 coins" — one line, fits at 412x915 and 1280x720 under the xp bar and above the middle of the screen.
- The players around see the prestige itself with the big ring (T0023); this task adds only the coins and the card for the one who did it.

## Acceptance criteria
- [ ] A player's 1st, 2nd and 3rd prestige this life pays 25, 50 and 75 coins, visible in the start card's balance after the match.
- [ ] When the player prestiges, the card under the xp bar shows "Prestige! +25 coins" (or the right amount) for 2 s, then hides.
- [ ] A knockout (back to level 1) resets the count: the next prestige after it pays 25 again.
- [ ] A bot that prestiges gets no coins.
- [ ] The card never covers the xp bar, the scoreboard or the middle of the screen at 412x915 and 1280x720.
