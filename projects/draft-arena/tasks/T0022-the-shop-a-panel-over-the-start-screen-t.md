---
id: T0022
title: "The shop: a panel over the start screen that sells looks"
size: M
priority: 1
status: design
depends_on: [T0019, T0021]
attempts: 0
created: 2026-10-31T04:59:35Z
epic: E6
---

## Goal
The coin line on the start card opens the shop: patterns on top, accessories in rows by slot, a preview critter that wears what you point at, and a Buy button that spends coins — what a player buys is theirs to wear, kept for their next visit.

## Details
- Where it opens and closes: tapping the coin line on the start card (T0019) opens the shop panel over the start card; a close button in the panel's top right (at least 44 px tall on a phone) or Esc on a keyboard closes it. The panel is a white sticker card; the match keeps playing behind it, and Play is one close away.
- The panel, top to bottom: a header with "Shop" and the coin balance (the coin line behind the panel is what opened it, so while the panel is open the balance lives in the header, not twice); a big preview critter in the player's color wearing their current pattern, hat and the selected item; a row of pattern swatches; then one row per accessory slot that has priced stock — today Face and Back, and a Hat row appears when a priced hat exists. Each swatch is a mini critter (about 64 px) in the player's color wearing the item; an unowned swatch carries a small coin price stamp, an owned one does not.
- Trying on: hovering a swatch on a desktop, tapping it on a phone, selects it (an ink outline on the swatch): the preview critter wears it and a footer line shows its name (at most 18 characters), its one-line description (wraps) and its state.
- One button in the footer, one control per action:
  - "Buy · 40" — unowned and affordable: spends the coins (the header balance and the start card's coin line both come down), the item is owned and kept for the next visit, the button becomes "Wear", and a confetti pop plays on the preview critter.
  - "Wear" — owned, not worn: puts the item on for the next match (visible on the player's critter for everyone in it) and on the preview; wearing an item in a taken slot replaces what the player had there.
  - "Wearing" — owned and worn: tapping it takes the item off.
  - "Costs 40 coins" — disabled, when the player has fewer coins than the price.
  - "Needs 2 prestiges" — disabled, when the item's prestige gate is higher than the player's prestiges in all, even with enough coins.
- The shop sells looks only: nothing bought changes how anyone plays.
- Fullest state: 12 patterns, 10 Face, 10 Back, 10 Hat, 9999 coins, an 18-character name and a long wrapped description — the swatch rows wrap and everything fits its card at 412x915 and 1280x720.

## Acceptance criteria
- [ ] Tapping the coin line on the start card opens the shop panel over the start card; the close button or Esc closes it; Play still works from the closed start card.
- [ ] The panel shows the header with the balance, the preview critter, the pattern row and a row for Face and for Back; each swatch is a mini critter in the player's color wearing the item, and owned and unowned swatches read differently at a glance.
- [ ] Hovering (desktop) or tapping (phone) a swatch: the preview critter wears it on top of the player's current pattern and hat, and the footer shows its name, description and state; an 18-character name and a wrapped description fit.
- [ ] "Buy · N" spends the coins — the header balance and the start card's coin line both come down — and the item is owned, kept for the next visit, with the button now "Wear".
- [ ] "Wear" puts the item on for the next match (seen on the player's critter by everyone in it) and on the preview; wearing an item in a taken slot replaces the old one; "Wearing" takes it off.
- [ ] An item the player cannot afford shows a disabled "Costs N coins"; an item above the player's prestiges in all shows a disabled "Needs N prestiges" even with enough coins.
- [ ] The fullest state above fits at 412x915 and 1280x720 as a white sticker card.
