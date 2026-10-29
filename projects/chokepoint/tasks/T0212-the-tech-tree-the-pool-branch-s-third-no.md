---
id: T0212
title: "The tech tree: the pool branch's third node — Mend"
size: M
priority: 2
status: designing
depends_on: [T0153, T0209]
attempts: 0
created: 2026-10-29T15:15:13Z
claimed_at: 2026-10-29T15:35:20Z
epic: E2
designer: cachyos-x8664
---

## Goal
The pool branch gets its third node: a node that unlocks the Mend augment (T0095) into the draft, so the branch — “new augments unlocked into the draft pool” — holds the three gated rule-changing Epics (Haste, Momentum, Mend) as a real choice of what deepens your pool.

## Details
- The “The pool” row (T0153) gains a third node card beside Haste and Momentum: “Mend” — 30 coins — card line: “unlocks the Mend augment in the draft.” The row keeps T0153's layout logic and simply gains a card: at 1280×720 all three cards sit on one row at the row's even spacing; at 412×915 all three stay visible (wrapping to a second row the way the four-card draft does, T0065), the scroll cue behaving as today.
- States: T0103's four (affordable bright, unaffordable dimmed with a red price, locked, owned with the yellow border) plus T0153's gate state: while the game has no Mend augment in its content (T0095 not landed), the node shows the locked/dim look with the muted line “not in the game yet” in place of the price, and a tap does nothing (no chime, no balance change). Once Mend is in the content, the node becomes buyable (affordable/unaffordable by the coin balance). T0153's state logic is per-node (`node.unlocks` against the AUGMENTS index) — the third node rides on it with no change to the state logic.
- Buying: 30 coins, T0103's balance pop and two-note chime, the owned state, saved to the profile's purchased list (T0103's persistence; a buy is permanent and survives a reload). The node id `mend` equals the augment id — T0153's rule, the gate reads this id from `profile.purchased`; do not rename it.
- Effect: buying it adds Mend to the draft pool permanently — realized by Mend's own gate (T0095, filed this cycle), the same way Haste's gate is T0152's and Momentum's is T0064's: absent from every draft roll (pre-wave-1, later, reroll, the fourth card) until the purchased list holds `mend`. Either task can land first (T0153's rule): the node first, it sits “not in the game yet”; Mend first, it never rolls until the node is bought.
- This task owns only the node, its states and its purchase (exactly T0209's scope, T0209 is the closest example — same branch, same pattern, one cycle old); the draft gate is T0095's line. `POOL_NODES` in `src/content/tech/pool.ts` gains the third entry; `buyPoolNode` in `core/tech.ts` is already generic over `POOL_NODES`; the `rows` list in `TechScene.ts` maps `POOL_NODES`, so the row grows by one card.

## Acceptance criteria
- [ ] The “The pool” row shows three node cards: “Haste” (25), “Momentum” (30) and “Mend” (30), T0103's card look; at 412×915 and 1280×720 all three are visible and buyable (the scroll cue behaving as today).
- [ ] While Mend is not in the content: the node shows the locked/dim look with the muted line “not in the game yet” (no price) and is unbuyable — a tap does nothing, no chime, no balance change.
- [ ] Buying it (with Mend in content) pays 30 coins with T0103's pop + chime, shows the owned (yellow border) state, and survives a reload; the Haste and Momentum nodes and their states are untouched.
- [ ] Unit tests: `POOL_NODES` maps to `[['haste', 25, 'haste'], ['momentum', 30, 'momentum'], ['mend', 30, 'mend']]`; `buyPoolNode` on `mend` refuses unknown/already-owned/unaffordable (29 coins → false, coins unchanged), deducts 30 on success, and saves `mend` alongside `haste` and `momentum` in the purchased list.
- [ ] The draft side of the gate is T0095's: with `mend` in the purchased list and Mend in the content, the next draft can offer Mend (Epic only); with the node not owned, no draft offers it — node owned iff Mend is rollable.
