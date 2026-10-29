---
id: T0212
title: "The tech tree: the pool branch's third node — Mend"
assignee: inet-racing
size: M
priority: 2
status: in-progress
depends_on: [T0153, T0209]
attempts: 1
created: 2026-10-29T15:15:13Z
claimed_at: 2026-10-29T16:04:24Z
epic: E2
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

## Design (architect, cachyos-x8664)

### Files
- edit `src/content/tech/pool.ts` — add the third `POOL_NODES` entry and update the "Two nodes for now" doc comment.
- edit `tests/core/tech.test.ts` — update the three pool-row tests (row map, buy refusals, purchase).

### Interfaces
No new types or functions — `POOL_NODES` already is `readonly PoolNode[]` with `{ id, name, line, price, unlocks }`, `buyPoolNode(store, id)` is generic over `POOL_NODES`, and `TechScene` maps `POOL_NODES` and gates each node against the `AUGMENTS` index per-node (`unlocks` id in content?) — so nothing else changes. The new entry is exactly:

```ts
{ id: 'mend', name: 'Mend', line: 'unlocks the Mend augment in the draft', price: 30, unlocks: 'mend' },
```

### Steps
1. In `src/content/tech/pool.ts`, after the `momentum` line of `POOL_NODES`, add the line above; change the comment `Two nodes for now: Haste and Momentum, each adding its augment to the draft.` to say three nodes (Haste, Momentum and Mend). Do not touch `src/core/tech.ts`, `src/scenes/TechScene.ts` or `src/ui/` — the row, card look, states, chime, pop and layout (narrow: `Math.ceil(3/2)` grid rows, odd last card centered at `x = 0`; wide: three cards at 172 spacing) all already ride on the mapping.
2. In `tests/core/tech.test.ts` update the three pool tests, keeping their names honest:
   - `the pool row is two nodes: Haste at 25 and Momentum at 30, each unlocking its augment` → rename to three nodes and expect `POOL_NODES.map((n) => [n.id, n.price, n.unlocks])` toEqual `[['haste', 25, 'haste'], ['momentum', 30, 'momentum'], ['mend', 30, 'mend']]`.
   - `a pool node buys only when it is known, unowned and affordable` — add the mend cases beside the momentum ones: `const brokeM = withCoins(29); expect(buyPoolNode(brokeM, 'mend')).toBe(false); expect(loadProfile(brokeM).coins).toBe(29);` and `const ownedM = withCoins(60, ['mend']); expect(buyPoolNode(ownedM, 'mend')).toBe(false); expect(loadProfile(ownedM).coins).toBe(60);` (unknown id is already covered by `'nope'`).
   - `a pool purchase deducts exactly the price and saves the id alongside the run-start ones` — append: `const store3 = withCoins(85, ['haste', 'momentum']); expect(buyPoolNode(store3, 'mend')).toBe(true); expect(loadProfile(store3).coins).toBe(55); expect(loadProfile(store3).purchased).toEqual(['haste', 'momentum', 'mend']);`
3. Run `npm run check`.

### Pitfalls
- The id must be exactly `mend` (equals the augment id — T0095's draft gate reads this id from `profile.purchased`); renaming it breaks the gate.
- Price 30 (not 25 — that is Haste's); `unlocks: 'mend'` (not a different string); `requires` stays out — pool nodes have no prerequisites.
- Do not change `refresh()`/`buy()` in TechScene: while Mend is not in `AUGMENTS` the node is already dimmed ("not in the game yet", no price), disabled, and `buy()` early-returns before any chime or coin change; once T0095 lands, the node rides on the existing gate.
- Layout is data-driven: do not hardcode row counts or card positions anywhere.
- Haste (T0152) and Momentum (T0064) augments may not be in content either — their nodes ride the same per-node gate; this task adds no gate logic.

### Tests
Extend `tests/core/tech.test.ts` as in Step 2 (the acceptance-criteria unit tests live there). No new test file.
