---
summary: the screen (the HUD's cards and buttons, the talents panel, and what the start screen shows). Read before writing or editing any task that adds, changes or removes something on screen.
---
# The screen

Everything over the field is HTML. The start screen is the engine's (a name field, one Play button, the match playing behind it): tasks can't change it. The HUD is the game's: one element per file in src/hud/ with its own .css, listed in HUD_PARTS. "On screen" in the inventory says what each element shows and where.

What a HUD element can know: you (hp, level, xp, kills, score, banked talent points, every tree and talent with its rank and whether you can take it), the scoreboard (name, score, level, kills, bot or not), the player count, online or in this tab, the connection, and whether the device is touch. It knows nothing else: not where monsters, players or events are, nor what anyone else has taken. Those show on the field, through looks and effects.

The layout today: the connection card top left, your level and xp top centre, the scoreboard top right, the Talents button bottom centre (its panel a column at the right on a desktop, above the button on a phone), and the knockout card in the centre while you are down. The middle of the screen is your critter; a phone's thumb drags anywhere to move.

## The bar
- **One in, one out.** Something new that stays on screen says what it replaces, or why the screen has room and the player needs it more than the space.
- **Nothing shown twice.** Check "On screen" in the inventory first: your level is on the xp bar, your score and rank on the scoreboard, the player count on the connection card, banked points on the Talents button.
- **One control per action.** Never a second button for something an existing one does.
- **Every input is shown where it is used:** a key appears on its button on a desktop (the Talents button shows T), and every button is at least 44 px tall on a phone. The game's inputs are moving, the Talents button (T) and Esc. A new kind of input (an aimed ability, a second action) needs the engine: it goes to IDEAS.md under "Needs the engine".
- **It fits.** Every line that can show at once, with the longest names (16 letters) and numbers, fits its card at 412x915 and 1280x720, without covering the cards already there or the middle of the screen. The card sizes itself from its lines, and long text wraps.
- **Critters.** White sticker cards (`hud-card`) with ink text in Fredoka; no glow, gradients or dark panels.

## A task that adds or changes something on screen
- Where it goes on a desktop and on a phone, and what it must not cover.
- Its fullest state: every line it can show at once, with the longest name and the biggest numbers.
- When it shows and when it hides (while you are down, while the talents panel is open, in a match in this tab).
- What it replaces, or why the screen has room.

## Not in this game
The owner removed these. Don't propose them again, or anything that works the same way.
- Icons of the talents you hold in a corner of the screen: on their own, symbols don't say what they mean. The talents panel shows what you hold.
- "Weapon" and "capstone" tags on talents in the panel: they told the player nothing the talent's text doesn't.
