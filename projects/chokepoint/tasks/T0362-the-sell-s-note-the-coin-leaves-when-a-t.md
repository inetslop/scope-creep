---
id: T0362
title: "The sell's note: the coin leaves when a tower sells"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T15:28:41Z
claimed_at: 2026-11-01T15:29:01Z
designer: yoga
---

## Goal
Selling a tower is a deliberate economy decision that already pays its gold with a pop and a coin trail, but it is silent; give the refund its own quiet note, in the coin-blip's language (T0255).

## Details
- The moment a tower sells — the same moment its gold pop and its coin trail to the stats card start (the selected tower's panel "Sell · +N" line, T0274, build phase only) — play the existing quiet coin blip once: `Sfx.coinBlip()` (T0255: one 60 ms E5 sine at volume 0.08) at its existing volume.
- Closest example: the Toll's leak blip (its exit hook plays `coinBlip` with the leak's coin blip) and the coin chime next to it in `src/audio/Sfx.ts`.
- No new HUD, no text, no change to the sell's price (70% of its slots' cost), its pop or its trail. The sell is the only tower-economy action that plays this note: building a tower, placing a card, buying a slot, kills and wave bonuses keep their existing notes only.
- Silent with sound off (the pause's toggle), like every note.

## Acceptance criteria
- [ ] Selling a tower plays the coin blip once, at the same moment as its gold pop.
- [ ] Building a tower, placing a card, buying a slot, a kill's gold and a wave bonus do not play this note; their existing notes are unchanged.
- [ ] With sound off the sell is silent; the sell's price, pop and trail are unchanged.
- [ ] npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
