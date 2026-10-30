---
id: T0263
title: "Sell: the tower panel's sell line"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T06:24:50Z
epic: E7
design_attempts: 1
---

## Goal
A misplaced tower is a fixable mistake, not a permanent one: in the build phase the tower panel wears a bottom line, "Sell · +N", that takes the tower back and pays 70% of what its slots cost. First slice of E7 (changing your mind); the augment "take out" line is the next slice and is not in this task.

## Details
- Build phase only. While a tower's panel is open in the build phase, the panel's new bottom row — under the slots, the last thing on the card — is a chunky row button in the pause-screen row language (T0245): a coin glyph and "Sell · +N", the whole row one tap target.
- N is exact and live: floor of 70% of the gold this tower's slots cost — the same slot prices the panel's buy-slot button prices, summed over the tower's current slots. A one-slot tower refunds 70% of the first slot; a two-slot tower refunds 70% of both. Selling always pays; it is never dimmed and never unaffordable.
- The tap: the panel closes, the tower lifts out of the board over ~250 ms (the drop-in bounce run backwards, pillar 5), a "+N" gold pop at the plinth (the kill-gold pop's look) and one coin slides from the plinth to the stats card's gold number (T061's coin trail). One soft low blip as the tower starts to lift (the deny's pitch, volume 0.08, the tier chime's quiet class) — the pop and trail carry the rest; no new HUD.
- The augments are gone: selling returns gold only. That is the point — the second slice's "Take out" retrieves an augment; selling does not.
- Effects end the moment the tower lifts: a sold Rally stops speeding up neighbours, a sold Mint stops paying kill gold, a sold Toll stops paying leak gold, a sold Anchor/Frost/Push aura vanishes with it.
- The hand is untouched: if a hand card is selected when the sell is tapped, it stays selected afterwards.
- A sold tower's kills stay in the run's totals (score, stopped count, coins); the end card's by-tower list (T0216) shows only towers standing at run end, so a sold tower simply is not listed.
- While a wave runs the line is absent and the panel is otherwise byte-identical; there is no sell on the draft, rewards or any other screen. No second control for it anywhere (screen bar: one control per action).
- Resume: the save stores the towers, so a sold tower is simply absent after a resume; nothing is re-paid.
- Pause screen: one new line in the controls list (pillar 8), in the list's own muted style — that a tower's panel carries a sell line in the build phase that pays 70% of its slots.
- Fit: the panel already sizes to its rows (T0136); with the sell row in, every panel state (one slot, full slots, maxed, with the what-if ghost active) still fits over the hand at 412x915 and beside the board at 1280x720.

## Acceptance criteria
- [ ] In the build phase, opening a tower's panel shows the bottom row "Sell · +N" with N exactly the floor of 70% of the tower's slots' prices; it updates live as the tower's slot count changes (checked on a one-slot and a two-slot tower).
- [ ] Tapping it closes the panel, lifts the tower out over ~250 ms, shows the "+N" gold pop and the coin trail, adds N to the gold, and the freed cell accepts a new tower immediately after the lift; a held hand card stays selected.
- [ ] Selling a support tower ends its effect at once: a sold Rally's neighbours return to their old attack rate, a sold Mint pays no more kill gold, a sold Toll pays no more leak gold.
- [ ] During a wave the row is absent and the panel is otherwise unchanged; a sold tower's kills still count in the run's totals and the end card's by-tower list shows only standing towers.
- [ ] The pause screen's controls list carries the sell line, and the panel with the sell row fits at 412x915 and 1280x720 in every slot state.
