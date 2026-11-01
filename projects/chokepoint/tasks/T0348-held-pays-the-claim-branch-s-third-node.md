---
id: T0348
title: "Held pays: the claim branch's third node"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T08:42:47Z
claimed_at: 2026-11-01T08:42:50Z
designer: desktop
---

## Goal
The tech tree's claim branch gets its third node, **Held pays**: waves that lost lives pay coins — one coin per life lost — so a run that held on is paid for the waves it held, not only the ones it cleaned. A third sink for the coins E9's multipliers pour in, and the payout lands where E12's held-wave marks already live: the run's story.

## Details
- **The node.** The claim branch in the Tech scene grows a third card under "Clean ×2" and "Flawless": name **Held pays**, price **155 coins** (depth 3 on the branch's re-priced curve, T0288 — Clean ×2 is 30 at depth 1, Flawless 85 at depth 2; confirm the exact rounding against the depth function in `core/tech.ts`). Gated on Flawless, as the siblings gate in branch order. One dry line of card text: "a wave that leaks pays 1 coin per life it lost." Owned mark like the siblings.
- **The rule.** When a wave ends having lost one or more lives, the run earns +1 coin per life lost that wave, paid at the wave's end — the same moment the ledger closes the wave's per-wave record (T0333). Whatever the ledger recorded as that wave's leaks pays, including the death wave, which closes at the run's end like any other wave.
- **The coin formula.** The term joins `coinsForRun` inside the multiplied sum (where Flawless's +10 lives, T0313), so the stats card's live coin tally, the pause's worth line (T0087) and the claim card's recipe line (T0075) all pick it up, and the level-augment multiplier and Iron's 2× apply to it like every other coin. The recipe's multiplier line is unchanged.
- **The recipe line.** The claim card reads "waves +N · stopped +N · clean +N · held +N" — the held term shows only when it pays more than 0, so a clean run's line and a no-node run's line stay byte-identical.
- **The moment.** When the term pays, one small muted "+N" coin pop rises at the exit gate (the Toll blip's look, T0255) and the coin chime's low note plays once (T0009's shape, volume 0.08) — one pop and one note per held wave: a wave that leaked 3 lives pays one "+3" pop, not three. Silent with sound off.
- **Without the node, nothing changes:** no term, no pop, no sound, the recipe line and the worth line byte-identical.
- The node's content rides the claim branch's own pattern (its node files sit in `src/content/tech/`, per T0211), so the Tech scene reads it with no new scene code.

## Acceptance criteria
- [ ] The Tech scene's claim branch shows a third card, **Held pays**, at 155 coins (the re-priced depth-3 price) with the one-line text; it is gated on Flawless, and buying it spends the coins and wears the owned mark.
- [ ] With the node owned, a wave ends having lost 1 life: the coin tally on the stats card rises by 1 at the wave's end, with the muted "+1" coin pop at the exit gate and one low coin-chime note; a wave that lost 3 lives pays one "+3" pop, not three.
- [ ] The claim card's recipe line shows "· held +N" exactly when a held wave paid, and the term sums into the coins shown under the level multiplier and Iron's 2×; a run with no leaks, or without the node, shows the old line.
- [ ] The pause's worth line includes the held coins mid-run (the same formula the claim card uses).
- [ ] A run that ends on a wave that lost 2 lives shows "held +2" on the claim card (node owned) — the death wave pays like any other wave.
- [ ] A run without the node is unchanged: no term, no pop, no sound, recipe line and worth line byte-identical.
- [ ] Unit tests on the coin formula: the held term at 0, 1 and multiple lives lost in one wave; its interplay with the level multiplier and Iron's 2×; the death wave's held coins.
