---
id: T0024
title: "Prestige coin: the Nth prestige in all pays 25 x N coins"
size: M
priority: 1
status: design
depends_on: [T0019]
attempts: 0
created: 2026-10-31T04:59:35Z
epic: E7
---

## Goal
Prestiging is worth it: every prestige in all pays coins the moment it happens (looks only, so a player who just reset is never overpowered again), and the player sees exactly what they got.

## Details
- The reward: the moment a player prestiges (level 18 to level 1), they get 25 x N coins, where N is their prestiges in all (the profile count, across all lives) counting this one: the 1st prestige in all pays 25, the 2nd 50, the 3rd 75. The coins go to the profile and are kept for the next visit. Bots get none.
- Looks only: coins buy only looks (the shop's bar), so a prestiged player — level 1, only the free Bolt, banked points gone, score, kills and hp kept — stays weaker than at level 17, stays a target worth hunting, never untouchable. The reward never hands back the power the reset took.
- Built as a small director (src/content/directors/, modeled on the gem-rain director): its onPrestige hook calls ctx.giveCoins(player, 25 x N) and plays T0019's coin pop at the player's position.
- A new HUD card (src/hud/, modeled on the knockedOut card's file): when you prestige, in the centre of the screen for 2.5 s, for you only:
  - line 1: "Prestige!"
  - line 2: "+50 coins"
  - line 3: "Level 1 again — 2 prestiges this life"
  A white sticker card, ink text. (The in-match HUD knows your prestiges this life; the in-all count that sets the pay lives on the start screen.) The players around you see T0023's ring, and the coin pop is visible to everyone.
  - Fullest state: 4-digit coins (25 x 40 = 1000) and a 2-digit count, fitting at 412x915 and 1280x720 without covering the level bar or the scoreboard.
  - A moment card like the knockout card, not something that stays on screen; it shows nothing the screen shows today (no element shows your coins or your prestiges this life), so it replaces nothing.

## Acceptance criteria
- [ ] When a player prestiges, their coins go up by 25 x their prestiges in all counting this one: 25 for a first-ever prestige, 50 for a second, 75 for a third; the coins are kept when they leave the match and show on the start card.
- [ ] T0019's coin pop plays at the player's position when the pay happens, visible to the players around them.
- [ ] For 2.5 s after the prestige, the player sees the centre card with "Prestige!", "+N coins", "Level 1 again — N prestiges this life"; it hides afterwards and shows no numbers the HUD already shows.
- [ ] Bots get no coins from prestiging.
- [ ] Right after, the player is at level 1 with only the free Bolt: the reward adds no hp, damage, speed, xp or talents.
- [ ] A player knocked out before reaching level 18 gets no coins and no card.
