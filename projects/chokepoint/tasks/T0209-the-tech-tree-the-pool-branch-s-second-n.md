---
id: T0209
title: "The tech tree: the pool branch's second node — Momentum"
size: M
priority: 2
status: todo
depends_on: [T0103, T0153]
attempts: 0
created: 2026-10-29T13:49:24Z
epic: E2
---

## Goal
The pool branch gets its second node: a node that unlocks the Momentum augment (T0064) into the draft, so the branch — "new augments unlocked into the draft pool" — offers a real choice between the two gated Epics instead of a single stub.

## Details
- The “The pool” row (T0153) gains a second node card beside Haste: “Momentum” — 30 coins — card text: “unlocks the Momentum augment in the draft.” The row's two-card layout is T0153's (wide: the two cards at ±86; narrow: the two columns at ±86).
- States: T0103's four (affordable bright, unaffordable dimmed with a red price, locked, owned with the yellow border) plus T0153's gate state: while the game has no Momentum augment in its content (T0064 not landed), the node shows the locked/dim look with the muted line “not in the game yet” in place of the price, and a tap does nothing (no chime, no balance change). Once Momentum is in the content, the node becomes buyable (affordable/unaffordable by the coin balance). T0153's state logic is per-node (`node.unlocks` against the AUGMENTS index) — the second node rides on it with no change to the state logic.
- Buying: 30 coins, T0103's balance pop and two-note chime, the owned state, saved to the profile's purchased list (T0103's persistence; a buy is permanent and survives a reload). The node id `momentum` equals the augment id — T0153's rule, the gate reads this id from `profile.purchased`; do not rename it.
- Effect: buying it adds Momentum to the draft pool permanently — realized by Momentum's own gate (T0064), the same way Haste's gate is T0152's: absent from every draft roll (pre-wave-1, later, reroll, the fourth card) until the purchased list holds `momentum`. Either task can land first (T0153's rule): the node first, it sits “not in the game yet”; Momentum first, it never rolls until the node is bought.
- This task owns only the node, its states and its purchase (exactly T0153's scope); the draft gate is T0064's line. `POOL_NODES` in `src/content/tech/pool.ts` gains the second entry; `buyPoolNode` in `core/tech.ts` is already generic over `POOL_NODES`; the `rows` list in `TechScene.ts` maps `POOL_NODES`, so the row grows by one card.

## Acceptance criteria
- [ ] The “The pool” row shows two node cards: “Haste” (25) and “Momentum” (30), T0103's card look; at 412×915 and 1280×720 both are visible and buyable (T0153's two-card row layout, the scroll cue behaving as today).
- [ ] While Momentum is not in the content: the node shows the locked/dim look with the muted line “not in the game yet” (no price) and is unbuyable — a tap does nothing, no chime, no balance change.
- [ ] Buying it (with Momentum in content) pays 30 coins with T0103's pop + chime, shows the owned (yellow border) state, and survives a reload; the Haste node and its state are untouched.
- [ ] Unit tests: `POOL_NODES` maps to `[['haste', 25, 'haste'], ['momentum', 30, 'momentum']]`; `buyPoolNode` on `momentum` refuses unknown/already-owned/unaffordable (29 coins → false, coins unchanged), deducts 30 on success, and saves `momentum` alongside `haste` in the purchased list.
- [ ] The draft side of the gate is T0064's: with `momentum` in the purchased list and Momentum in the content, the next draft can offer Momentum (Epic only); with the node not owned, no draft offers it — node owned iff Momentum is rollable.

## Design (architect, cachyos-x8664)

### Files
- edit `src/content/tech/pool.ts` — add the `momentum` entry to `POOL_NODES` and update the doc comment.
- edit `tests/core/tech.test.ts` — update the `POOL_NODES` expectation and extend the `buyPoolNode` tests to cover `momentum`.

### Interfaces
No new types. The `PoolNode` interface already has all needed fields (`id`, `name`, `line`, `price`, `unlocks`). The new entry:

```ts
{ id: 'momentum', name: 'Momentum', line: 'unlocks the Momentum augment in the draft', price: 30, unlocks: 'momentum' }
```

### Steps
1. In `src/content/tech/pool.ts`, change the doc comment from "One row for now: Haste, the first node to add an augment to the draft." to "Two nodes for now: Haste and Momentum, each adding its augment to the draft." Add the `momentum` entry after the `haste` entry in `POOL_NODES`:
   ```ts
   { id: 'momentum', name: 'Momentum', line: 'unlocks the Momentum augment in the draft', price: 30, unlocks: 'momentum' },
   ```
2. In `tests/core/tech.test.ts`, update the pool-row test to expect two nodes:
   ```ts
   it('the pool row is two nodes: Haste at 25 and Momentum at 30, each unlocking its augment', () => {
     expect(POOL_NODES.map((n) => [n.id, n.price, n.unlocks])).toEqual([['haste', 25, 'haste'], ['momentum', 30, 'momentum']]);
   });
   ```
3. Extend the refusal test (`a pool node buys only when it is known, unowned and affordable`) to add momentum cases:
   ```ts
   const brokeM = withCoins(29);
   expect(buyPoolNode(brokeM, 'momentum')).toBe(false); // unaffordable: 29 < 30
   expect(loadProfile(brokeM).coins).toBe(29);
   const ownedM = withCoins(60, ['momentum']);
   expect(buyPoolNode(ownedM, 'momentum')).toBe(false); // already owned
   expect(loadProfile(ownedM).coins).toBe(60);
   ```
4. Extend the purchase test (`a pool purchase deducts exactly the price and saves the id alongside the run-start ones`) to add a momentum purchase that saves alongside haste:
   ```ts
   const store2 = withCoins(55, ['haste']);
   expect(buyPoolNode(store2, 'momentum')).toBe(true);
   expect(loadProfile(store2).coins).toBe(25);
   expect(loadProfile(store2).purchased).toEqual(['haste', 'momentum']);
   ```

### Pitfalls
- The node id and `unlocks` field must both be `'momentum'` (matching T0064's augment id). If either is misspelled, the gate (T0064's draft roll) won't find the node in `profile.purchased` and the node will stay "not in the game yet" forever.
- The `unlocks` field is what `TechScene.refresh()` checks against `AUGMENTS` to decide the "not in the game yet" state. Until T0064 lands (adding `momentum` to `AUGMENTS`), the node shows locked/dim. This is correct and expected — the two tasks can land in either order.
- The row layout in `TechScene.ts` already handles 2-card rows: wide puts them at ±86 via `(i - (row.length-1)/2) * 172`, narrow puts them as two columns at ±86. No changes needed to `TechScene.ts` or `core/tech.ts`.
- `buyPoolNode` is already generic over `POOL_NODES` — it finds the node by id, checks ownership, checks affordability, deducts, and saves. No changes needed.

### Tests
- Update `tests/core/tech.test.ts` as described in Steps 2–4. No new test file needed.
