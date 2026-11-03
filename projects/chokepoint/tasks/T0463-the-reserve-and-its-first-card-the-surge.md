---
id: T0463
title: "The reserve and its first card, the surge: the next wave's towers attack 50% faster"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T02:24:38Z
claimed_at: 2026-11-03T02:45:19Z
epic: E24
designer: cachyos-x8664
---

## Goal
The run's gold buys the shape of the next wave: the build phase gains the reserve — the surge is a 60-gold once-per-run buy that makes the next wave's towers attack 50% faster. The first of the three heavy cards (E24): the run's big economy call — the next tower slot, or the next wave's tempo.

## Details
- The reserve card: a new white card in the top-left stack, under the level chips (under the stats card when the run has no level chips), the stats card's own width (196 px); it appears with the build phase's HUD and is gone in the wave and draft phases. For now it holds one entry: the bold line **Surge · 60** (13 px name, the price with the coin glyph, the stats card's coin icon; the line is the tap target) and under it one muted one-liner, the iron card's subline pattern (T0406): "the next wave's towers +50% faster — once per run".
- The buy: 60 gold, once per run — a per-run flag the run save carries (the first pass's pattern, T0433). On a tap with 60+ gold: the gold drops with the gold pop's look and one small muted coin blip at the card (the Toll leak pay's blip class, T0255), and the line flips to **Surge · used** — muted, dimmed, untappable; the one-liner stays. Under 60 gold the line dims and the price goes red (the pattern E15's move line wears, T0394) and the tap does nothing. A resumed run keeps the bought state.
- The effect: the wave that starts next — sent by the countdown or early — has every tower attack 50% faster for the whole wave. The +50% adds to the tower's attack-speed total the way Haste's +30% does: a tower inside a Haste ring during the surged wave attacks 1.8× as fast (a Common Bolt, 1.6/s, fires at 2.4/s for that wave). Every attack cycle is sped — shots, pulses, gusts, roots, marks; the beam is a continuous line and its per-second damage is untouched. When the wave ends the effect ends; the wave after is normal.
- The chip: while the surged wave runs, the wave card wears a muted "surged" chip under the wave number, the WaveCard's own chip look (the "held · N" chip still lands after a wave that lost lives). It is gone by the next build phase.
- The pause screen's controls list names the reserve card one line, the way the speed and zoom controls are listed.
- Nothing else changes: the draft, the waves, the hand, the tower panel, the claim card (its "reserve" line is a later slice of E24), the board.
- It fits 412x915 and 1280x720: one entry is the bold line plus the one-liner (~48 px tall); nothing overlaps the stats card, the level chips or the next-wave preview.

## Acceptance criteria
- [ ] Every build phase of a run shows the reserve card under the level chips with the "Surge · 60" line and its muted one-liner; it is gone in the wave and draft phases.
- [ ] A tap with 60+ gold pays 60 (the gold pop, one coin blip), the line reads "Surge · used" dimmed, and the surge is never buyable again in the run — including a resumed run.
- [ ] With under 60 gold the line is dimmed with a red price and the tap does nothing.
- [ ] The next wave, sent by the countdown or early, has every tower attacking 50% faster for its whole duration — a Common Bolt fires at 2.4/s, a tower in a Haste ring at 1.8×, a beam's per-second unchanged — and the wave after is normal again.
- [ ] During the surged wave the wave card wears the muted "surged" chip under its number, gone by the next build phase; a held wave still lands its "held · N" chip after.
- [ ] The pause's controls list names the reserve card.
- [ ] At 412x915 and 1280x720 the card fits the top-left stack without overlapping another element.
