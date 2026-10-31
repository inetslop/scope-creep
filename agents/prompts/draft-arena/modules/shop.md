---
summary: coins and the shop (how players earn coins in the match and spend them on accessories and patterns, the start screen's panels, and the player's color). Read before writing or editing any task about coins, prices, the shop or what players wear.
---
# Coins and the shop

The only thing kept between visits is the player's **profile, in their own browser**: their coins, what they bought, what they wear, their color and their prestiges in all. Nothing is kept on the server: a new browser or cleared data starts over, and a player could edit their own coins (fine: coins only buy looks).

- **Earning:** content gives coins with `ctx.giveCoins(player, n)` from any server hook: a kill, an event, a prestige, a pickup. Bots get none. Today nothing gives coins: what earns them, and how many, is yours to design.
- **Spending:** accessories (planning/modules/accessories.md) and patterns (planning/modules/patterns.md) have prices; free ones (price 0) everyone owns, and some wait for prestiges.
- **The start screen's panels** (src/menu/, mounted in the start card above Play) are where players see their coins, try things on, buy and wear. The engine gives them the profile, every accessory and pattern, buy, wear, take off, pick a color, why something can't be bought yet ("Costs 120 coins", "Needs 2 prestiges"), and a preview of the player's critter wearing anything. Today there are no panels: the start screen is the name and Play.
- **Color:** every player may pick any of the 10 player colors for free, or leave it to the game.
- **In the match,** the HUD knows the player's coins (earned this match included).

## The bar
- **The shop only sells looks.** Nothing bought changes how anyone plays: no stats, no talents, no head start. The other players are the real threat, and that stays fair.
- **Earning is steady and seen:** a new player can buy something cheap after a match or two, and sees coins come in when they do (an effect where it happened, or a readout).
- **Prices span:** cheap things for a first match, middle ones, and goals that take many matches; prestige items as the longest goals.
- **The start card stays short:** a button opens a bigger panel over the start screen. Panels follow planning/modules/screen.md (sticker cards, they fit at 412x915 and 1280x720, one control per action).

## A task about coins or the shop
- For earning: what gives coins and how many, and how many coins a 5-minute match gives a new player and a good one.
- For a panel: its fullest state (the most items, the longest names, the biggest coin count), where it opens and closes, how a player tries on, buys, wears and takes off, and what it shows for something that can't be bought yet.
- For prices: every item's price next to what a match earns.

## Not in this game
(nothing removed yet)
