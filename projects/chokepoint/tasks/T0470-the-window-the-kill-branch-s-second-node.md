---
id: T0470
title: "The window: the kill branch's second node, the chain's window +0.5 s"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T04:20:47Z
claimed_at: 2026-11-03T05:01:15Z
epic: E25
designer: desktop
---

## Goal
The tech's kill branch (T0466's row, just landed) gets its second node: between-run coins buy a longer kill chain — the chain's window +0.5 s (1.5 s → 2.0 s) — so a run's kills chain deeper, and the chain's existing pays (the ×N counter, the Feast buff, the combo milestone gold) land more often.

## Details
- **Tech screen:** the kill row (T0466) gains its second card, **The window**, at **85 coins** by the branch's depth rule (the bounty is the first at 30; T0214's branch discount applies as it does to every row). Same shape as the bounty card: name, one muted one-liner, coin cost, buy, and the owned dot once bought. One-liner: "The kill chain's window +0.5 s". Bought once with between-run coins, on for every run after — read from `run.techOwned` like the bounty, no new HUD anywhere.
- **The effect:** with the node owned, the kill chain's window is **2.0 s instead of 1.5 s** — a kill inside the window keeps the chain alive and extends it exactly as today; a gap longer than the window still breaks it. **Additive with Feast's added form:** window = 1.5 s + 0.5 s (node owned) + 0.4 s per Feast copy. The node's +0.5 s joins at the same single place the window is already computed (where Feast's `chainWindowSec` extends it), so the ×N counter, the ComboBar drain under it (T0220, which already rides Feast's +0.4 s), the Feast buff (T0235) and the combo milestone pays all follow one live window — no second read of the window anywhere.
- **Unowned is byte-identical:** without the node the window stays 1.5 s + 0.4 s per Feast copy and every chain pay is exactly today's.
- The deeper the run, the more the extra half second matters: chains already run long there, and the Feast and milestone pays ride the chain level.

## Acceptance criteria
- [ ] The tech screen's kill row shows two cards; the second is "The window" at 85 coins (with the branch discount applied as on every row), buyable when coins allow, and wearing the owned dot once bought.
- [ ] In a run with The Window owned, two kills 1.8 s apart keep the chain alive (the ×N counter keeps rising, the ComboBar keeps draining); in a run without the node, the same 1.8 s gap breaks the chain at 1.5 s.
- [ ] With one Feast copy and the node, the window is 2.4 s (2.0 + 0.4): kills 2.2 s apart still chain, and the ComboBar under the ×N counter takes 2.4 s to drain, not 1.5 s.
- [ ] The Feast buff and the combo milestone pays follow the extended window: a kill inside the window extends the chain level and pays exactly as before; nothing about how those pays are computed changes.
- [ ] Without the node, the window and every chain pay are byte-identical to today (1.5 s + 0.4 s per Feast copy).
