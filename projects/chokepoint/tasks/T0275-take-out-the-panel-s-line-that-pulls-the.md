---
id: T0275
title: "Take out: the panel's line that pulls the last augment back into the hand"
size: M
priority: 2
status: designing
depends_on: [T0274]
attempts: 0
created: 2026-10-30T09:46:01Z
claimed_at: 2026-10-30T10:06:37Z
epic: E7
designer: inet-racing
---

## Goal
The second way to change your mind (E7): a wrong added augment is pulled back into the hand for 5 gold — the card returns, the tower stays, and its attack reverts to what the rest of its augments make it. Selling (T0274) refunds the whole tower; taking out keeps the tower and fixes one card.

## Details
- **The line (the tower panel, beside the sell line T0274 adds):** while a tower holding **at least two augments** is selected in the build phase, the panel wears a second bottom line, "Take out · 5": 5 gold pulls the tower's last augment (the highest filled slot) back into the hand. A tower with one augment in it shows only the sell line (taking its last augment out would leave an empty tower). No line in the wave phase or the draft.
- **The take-out:** tap the line and the 5 gold spends with the buy-slot's own spend feedback (the stats card's gold number falling by 5), the last augment's barrel, ring or tick vanishes from the tower's look, and the tower's attack reverts to what the remaining augments make it (a Beam that loses its Bolt ray is a plain beam again; a Bolt that loses its Rapid returns to the Bolt's own rate). The card lands in the hand with the hand's own placement — the same card: its name, its tier and its copies intact (an Epic stays an Epic, the owned-dot count, T0094, moves with it). The panel stays open on the (now shorter) tower.
- **The slot stays the tower's:** the vacated slot is simply free again — refitting it costs no slot price, and the next *unbought* slot's price is unchanged. The panel's slot row shows the taken-out slot as free, as it already does for any free slot.
- **The hand cap:** the returned card counts toward the hand's cap like any hand card (keys 1-9); with the hand full, or the gold under 5, the line is dimmed with a red 5 and does nothing on tap (the buy-slot's quiet language).
- **The books:** the tower's kills, its identity and its other augments are untouched; the end card's by-tower list still shows the tower (T0216). A take-out is part of the current build phase, like a sell: the phase-boundary save covers it (in the wave-phase save with the card in the hand; undone on resume from the build-phase save).
- **The pause screen (Pillar 8):** the controls line gains "Take out — the panel's line, build phase only" next to the sell's line.
- **Nothing shown twice:** the line says what it takes (the panel already shows the tower's last augment as its own card) and the price; no new readout, mark or chip.

## Acceptance criteria
- [ ] In the build phase, a selected tower holding at least two augments wears a "Take out · 5" line beside the sell line; a one-augment tower shows only the sell line; no line in the wave phase or the draft.
- [ ] Tapping it spends 5 gold (the gold number falling), removes the tower's last augment from its look and its attack — a Beam + Bolt reads as a plain beam again, a Bolt + Rapid fires at the Bolt's own rate again — and lands that card in the hand with its name, tier and copies intact; the panel stays open and shows one fewer augment row.
- [ ] The vacated slot stays the tower's: it is free to refit at no slot price, the next unbought slot's price is unchanged, and the slot row shows it as free.
- [ ] With the hand full or the gold under 5, the line is dimmed with a red 5 and a tap does nothing.
- [ ] The tower's kills, identity and remaining augments are untouched; the end card's by-tower list still shows the tower.
- [ ] The pause screen's controls line lists both lines; the panel with both lines and the pause card fit at 412x915 and 1280x720.
- [ ] A take-out during the build phase survives to the wave (in the wave-phase save, card in the hand) and is undone on resume from the build-phase save.
