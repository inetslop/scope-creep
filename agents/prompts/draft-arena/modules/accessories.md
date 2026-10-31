---
summary: accessories (what players wear on their head, face or back: hats and more, each with a price). Read before writing or editing any task that adds, changes or removes an accessory.
content: accessories
group_by: [slot]
---
# Accessories

What players wear, one item per slot: `head` (hats), `face` (around the eyes and mouth) and `back` (behind the body). Everyone in the match sees what each player wears, and bots wear things at random, so a new accessory shows up on the field at once. Players pick what they wear on the start screen and buy what isn't free there (planning/modules/shop.md).

Each is one file in src/content/accessories/: `name` (at most 18 characters), `description` (one line for the shop), `slot`, `price` in coins (0: everyone has it), `prestige` (optional: prestiges in all before it can be bought, planning/modules/prestige.md), and how it is drawn on the critter.

## The bar for a new accessory
- **It reads at a glance on a critter in a crowd:** a clear silhouette at a player's size (36 units across), and it never covers the eyes.
- **Critters:** candy colors from the palette, ink outlines, at most a little bounce; no glow, and no themed dressing (fantasy, sci-fi, weapons, armor).
- **Not a copy:** it looks different from every accessory in its slot, not a recolor of one.
- **It changes nothing in play:** no stats, no size; a head item reaches at most one radius above the head (the player's name sits above that).
- **Priced against the others:** the price says how special it is next to the rest under "What exists now".
- **At most 10 per slot.** Past that, the same task (or one before it) removes or merges one and says which.

## A task that adds or changes an accessory
- Its name, description, slot, price (and prestige), and how it looks: shapes, colors by name, where it sits on the critter.
- **## Compared with what exists:** a table with one row for every accessory in its slot:

| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |

A missing row gets the task rejected by the architect.

## Not in this game
(nothing removed yet)
