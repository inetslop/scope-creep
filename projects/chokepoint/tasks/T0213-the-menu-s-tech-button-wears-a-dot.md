---
id: T0213
title: "The menu's Tech button wears a dot"
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0103]
attempts: 1
created: 2026-10-29T15:15:13Z
claimed_at: 2026-10-29T15:28:09Z
finished_at: 2026-10-29T16:04:11Z
epic: E2
---

## Goal
A player who just earned coins should see that the tech tree can spend them: while any unowned node is in reach, the menu's Tech button wears a small dot, so the tree pulls the player in instead of waiting to be found.

## Details
- The menu's “Tech” button (under Play, T0103) shows a small yellow dot (~6 px, the HUD's own yellow, the profile card's star family, T016) in its top-right corner while the player's coins can buy at least one node the profile does not own — across all branches (run start, draft, pool, board and the claim branch when it lands).
- The dot is a pure derivation: a new helper beside `buyPoolNode` in `core/tech.ts` — `nodeInReach(purchased, coins)`: true when at least one node in any branch is unowned and its price is ≤ coins (the branch node lists are the ones the tech screen's rows read). The button draws the dot on build and re-derives it on every menu refresh (after a run's claim, after a purchase, after abandoning a resume); the dot itself is never an input target — a tap on the button opens the tree exactly as today.
- The dot clears the moment nothing is affordable: a buy that spends the last coin clears it; a run that pays out a node's price can set it. No sound, no text, no new control on the pause screen (it is a mark on an existing button, not a button).
- A first-time player (0 coins) never sees it. The profile card's coin number is untouched: the dot says “you can spend”, the card says “how much” — nothing shown twice.
- Closest existing: the “Best” star on the profile card (T016) — a small conditional mark on a menu card, derived from the profile.

## Acceptance criteria
- [ ] With coins ≥ some unowned node's price, the Tech button shows the small yellow dot in its top-right corner at 412×915 and 1280×720; with 0 coins, or with every node owned, it shows none.
- [ ] Buying a node that leaves nothing affordable clears the dot on the same screen; finishing a run that pays out an unowned node's price sets it on returning to the menu (the dot is re-derived on the menu's refresh, not cached).
- [ ] A tap on the button, with or without the dot, opens the tech screen exactly as today; no sound, and the pause screen's controls list is unchanged.
- [ ] Unit tests for the helper: 0 coins → false; 5 coins with nothing owned → true (the run-start branch's cheapest node); a balance that reaches no unowned node → false; every node owned → false at any balance.

## Design (architect, yoga)

### Files
- edit `src/core/tech.ts` — add `nodeInReach(purchased, coins)` directly after `buyPoolNode` (line 80)
- edit `src/scenes/MenuScene.ts` — draw the 6 px yellow dot in the Tech button's top-right corner; one import, two lines in `create()`
- edit `tests/core/tech.test.ts` — unit tests for the helper

### Interfaces
```ts
/** true while at least one node in any branch is unowned and its price is ≤ coins. */
export function nodeInReach(purchased: readonly string[], coins: number): boolean
```

### Steps
1. In `src/core/tech.ts`, after `buyPoolNode`, add:
```ts
/**
 * The menu's Tech button wears a dot while the coins reach at least one unowned node. The
 * branch node lists are the ones the tech screen's rows read (TechScene's `rows`).
 */
export function nodeInReach(purchased: readonly string[], coins: number): boolean {
  for (const node of [...TECH_NODES, ...POOL_NODES]) {
    if (!purchased.includes(node.id) && node.price <= coins) return true;
  }
  return false;
}
```
Check `TechScene.ts`'s `rows` initializer (lines 52–55) at build time: it lists exactly which branch node lists the tech screen reads — if a draft/board/claim branch list exists there by then, add its name to the spread (e.g. `...BOARD_NODES,`), one list per piece.
2. In `MenuScene.create()`, extend the import from `'../core/tech'` (add `nodeInReach`) and, right after the `tech` button (line 98) and before `techLine`:
```ts
const dot = this.add.circle(98, -18, 3, cssColor(PALETTE.yellow)).setVisible(nodeInReach(p.purchased, p.coins)); // top-right corner, while a node is in reach
tech.container.add(dot);
```
`p` is the profile already loaded at line 60. The dot is a direct child of `tech.container` (after `content`, so it draws above the card) — not in `tech.content` (it must not lift with the press) and not a sibling of the button.
3. In `tests/core/tech.test.ts`, add `nodeInReach` to the import from `'../../src/core/tech'`, and after the last pool test add:
```ts
it('the Tech button's dot: in reach while some unowned node's price is within the coins', () => {
  expect(nodeInReach([], 0)).toBe(false);
  expect(nodeInReach([], 5)).toBe(true); // gold-1, the run-start branch's cheapest node
  expect(nodeInReach([], 4)).toBe(false); // a balance that reaches no unowned node
  expect(nodeInReach([...TECH_NODES, ...POOL_NODES].map((n) => n.id), 99999)).toBe(false); // every node owned
});
```

### Pitfalls
- Re-derivation needs no events: every return to the menu (Tech's "Menu" button, RewardsScene, GameOverScene, PauseScene abandon) is `this.scene.start(SCENES.menu)` — a fresh `create()`, which re-derives `nodeInReach` from the freshly loaded profile. Never cache the boolean, and never touch the profile card's coin number (the dot says "you can spend", the card says "how much").
- The dot must stay a non-interactive child of `tech.container`: the container's hit area is fixed by `setSize(220, 60)`, so a tap anywhere on the button — corner included — opens the tech scene exactly as today; the Circle itself has no input.
- Position (98, −18) = 12 px in from the top-right corner (110, −30) of the 220×60 button; keep it out of `layout()` — the button's own placement carries it, at 412×915 and 1280×720. It fades in with `tech.container` automatically.
- No sound, no text, no pause-screen change: it is a mark on an existing button, not a control.
- The "every node owned" test must build its id list from the node lists themselves (as written), so a later branch task adding a node can't silently break it; the 4-coin case stays below the cheapest price (5).

### Tests
- `tests/core/tech.test.ts`: the four `nodeInReach` cases above (0 coins → false; 5 coins nothing owned → true; 4 coins → false; all ids owned at any balance → false).

## Result (attempt 1, yoga)

The menu's Tech button now wears a small 6 px yellow dot in its top-right corner while the profile's coins can buy at least one unowned node across all branches. Added `nodeInReach(purchased, coins)` after `buyPoolNode` in `src/core/tech.ts` and the two-line dot in `MenuScene.create()` (a non-interactive child of the button's container, re-derived from the freshly loaded profile on every menu launch — never cached), plus unit tests in `tests/core/tech.test.ts`. Four minimal deviations from the design, all forced by the actual code: (1) the design's own build-time check applies — the claim branch exists (TechScene's rows read `CLAIM_NODES`), so the helper spreads all three node lists; (2) consequently the "every node owned" test owns ids from all three lists (the claim node `clean2` is otherwise left unowned and would make the case true); (3) the installed Phaser types type `add.circle`'s fill as `number`, so the dot passes `PALETTE.yellow` instead of `cssColor(...)`; (4) the design's test title contains apostrophes that can't live in a single-quoted string, so it is double-quoted.

- Self-review: APPROVE
- Time: 36.1 min

```
projects/chokepoint/game/src/core/tech.ts        | 11 +++++++++++
 projects/chokepoint/game/src/scenes/MenuScene.ts |  3 +++
 projects/chokepoint/game/tests/core/tech.test.ts |  9 ++++++++-
 3 files changed, 22 insertions(+), 1 deletion(-)
```
