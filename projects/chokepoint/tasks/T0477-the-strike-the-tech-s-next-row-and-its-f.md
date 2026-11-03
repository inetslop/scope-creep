---
id: T0477
title: "The strike: the tech's next row and its first node, The long arm"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T06:43:18Z
epic: E28
---

## Goal
The tech tree has covered run start, board, pool, claim, wave, tower management, exit, draft and kill — but not the tower's own strength: a tenth row, **The strike**, lets between-run coins buy the tower's raw power. Its first node, **The long arm** (30 coins), gives every tower +10% range, so a board that barely reached a choke now reaches it, in every run after.

## Details
- **Tech screen:** a new row "The strike" after The kill's row, with its first card, **The long arm**, shown at **30 coins** — the branch's base, the shown price from the row's own nodeCost as on every row (the branch base is never hardcoded). Same card shape as every branch: name, one muted one-liner, coin cost, buy, and the owned dot once bought. One-liner: "every tower's range +10%". Bought once with between-run coins, on for every run after, read from `run.techOwned` like the bounty (T0466). No buy-gate inside the branch: it buys independently at its depth price. No new HUD anywhere, and no change to any tower's look.
- **The effect:** with the node owned, every tower's range is ×1.1 — a new pure read in `core/tech.ts` (1.0 without the node, 1.1 with it) joined at the single place where a tower's spec composes its range (Tower.spec, `core/augments.ts`), the way the marked cell's damage multiplier rides its tower (T0340). It rides the composed range, not the base: a Reach's +35% grows a range that is then ×1.1, and a rally's reach (T0103) carries it too. The panel's range stat, the range ring (T0393), the placement ring and the targeting all read the tower's live range, so they all show the +10% with no change of their own.
- **Nothing else moves:** damage, attack speed, gold, slot costs, the marked cell's damage, the Haste aura, the surge and the Feast buff all behave exactly as today — the node only stretches the range.
- **Unowned is byte-identical:** without the node, every range, ring, reach and shot lands exactly as today, and the tech screen is otherwise unchanged.

## Acceptance criteria
- [ ] The tech screen shows a tenth row, "The strike", with one card: "The long arm" at 30 coins (the depth-1 price from nodeCost), buyable on its own, wearing the owned dot once bought; 29 coins refuses the buy.
- [ ] In a run with the node owned, a freshly built single-augment tower's panel range stat reads its composed range ×1.1, and the range ring and the placement ring match it; in a run without the node the same tower reads the bare composed range.
- [ ] The +10% rides growth on top of the base: a Reach-added tower and a rally's reach both carry it, and a shot still lands exactly where the ring says it reaches.
- [ ] Damage, attack speed, gold, slot costs, the marked cell's damage, the Haste aura, the surge and the Feast buff are untouched by the node.
- [ ] Without the node, every range and reach is byte-identical to today; unit tests cover the row shape, the 30 price, the ×1.1 read (with dedupe and unknown ids, like the bounty's tests) and the buy refusal, and npm run check is green.
