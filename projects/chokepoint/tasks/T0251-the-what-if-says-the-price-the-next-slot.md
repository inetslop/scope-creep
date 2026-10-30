---
id: T0251
title: "The what-if says the price: the next slot's cost beside the ghost's marker"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T02:57:28Z
claimed_at: 2026-10-30T02:57:36Z
designer: yoga
---

## Goal
While a hand card is held, the player sees what the next slot costs on every tower the card could go into — the placement decision is made knowing what it costs, not just where it lands (T0243's fit row shows where; this shows the cost).

## Details
- While a hand card is selected, every tower that wears the what-if ghost (T0096: a tower with a free slot) also wears, beside the ghost's marker, the price of that tower's next free slot: a small "· N" in the HUD's muted ink, ~11 px. N is exactly the number the tower panel shows as that tower's "next one's price" — the same source of truth, never a second formula.
- When the run's gold is below N the price reads in the HUD's red (the same red the buy-slot button uses for a short price); at or above it, muted ink. It updates live if the gold changes while the card is held.
- It appears and disappears with the ghost: never shown with no card held, never on a tower with no free slot, and never on an empty cell (a new tower takes the held card in its first slot — there is no price to show there).
- No new HUD card, no new input, no sound, no permanent marks. The closest example is the ghost's own marker in src/systems/towerGhost.ts and the panel's price line in src/ui/hud/TowerPanel.ts (read the price from wherever the panel gets it; do not re-derive it).

## Acceptance criteria
- [ ] Holding a hand card, every tower with a free slot shows "· N" beside its what-if marker, N equal to that tower's panel next-slot price.
- [ ] With the run's gold below N the price is the HUD's red, at or above it the muted ink, and it switches live as the gold changes.
- [ ] Clearing the card selection removes all prices; a tower with no free slot shows none; an empty cell shows none.
- [ ] The price sits beside the marker without covering it and stays on the plinth's face at 1x zoom, at 412x915 and 1280x720.
- [ ] No gameplay change: with no card held the run is byte-identical (damage, gold, waves, resume).
