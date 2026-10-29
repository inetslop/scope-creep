---
id: T0110
title: "The tech tree: the draft branch"
assignee: desktop-4070
size: M
priority: 2
status: in-progress
depends_on: [T0103]
attempts: 1
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T12:32:14Z
epic: E2
---

## Goal
E2's second branch on the tech screen (T0103): nodes that change the draft itself — a cheaper second slot and a fourth card in the opening draft — so coins spent on the tree change what the next run can pick.

## Details
- A new row on the tech screen: the muted small label "The draft" (the "Run start" row's label style) with three node cards (the node card's look, states, purchase, chime and persistence are exactly T0103's — affordable bright, unaffordable dimmed with a red price, locked "needs the previous", owned "owned" with the yellow border; the two-note chime at 0.1):
  1. "Slot II −5" — 10 coins — "a tower's second slot costs 5 less"
  2. "Slot II −5" — 20 coins — same effect line (needs node 1; together the second slot costs 10 less)
  3. "Fourth card" — 15 coins — "the pre-wave-1 draft offers a fourth card"
- The effects apply to a new run — normal or ghost — and are read from T0103's pure tech module; a resumed run is untouched:
  - Slot II −5: each owned node reduces the price of buying a tower's second slot by 5 gold (the buy-slot price, T0088's commit path); the price never drops below 5 gold; the third slot and every later slot are unchanged.
  - Fourth card: the pre-wave-1 draft (and its reroll) offers four cards — the first three roll exactly as today (the Bolt floor, T0048, in the first slot; the no-repeat rule, T0052), and the fourth rolls like T0065's fourth (same tier odds, same no-repeat rule, flips in last with its own tier chime, T0065's fit: one row at 1280x720, 2×2 at 412x915). Drafts from wave 2 on are never four unless T0065's every-5th rule says so.

## Acceptance criteria
- [ ] The tech screen shows the "The draft" row with the three nodes, buying like T0103's nodes (states, pop, chime, persistence across a reload).
- [ ] With one Slot II node owned, a new run's second-slot price is 5 less than today's at every tower; with two, 10 less (never below 5 gold); with none, byte-identical to today; later slots are unchanged.
- [ ] With the Fourth card node owned, the pre-wave-1 draft and its reroll offer four cards, the fourth flipping in last with its own tier chime and T0065's fit; without it the pre-wave-1 draft is byte-identical to today; drafts from wave 2 on are untouched.
- [ ] The effects apply to a new run and a ghost run, never to a resumed one.

## Design (architect, cachyos-x8664)

T0110 — the tech's "The draft" row (size M): three nodes (two × "Slot II −5", one "Fourth card") whose effects a **new** run (normal or ghost, never resumed) reads at run start: the second slot costs 5 gold less per owned slot node (floor 5, later slots untouched), and the pre-wave-1 draft (and its reroll) offers a fourth card exactly like T0065's.

### Files
- **New** `src/content/tech/draft.ts` — the row's three node defs, in T0103's node format (`id`, `name`, `cost`, its one-line card text, `requires` for node 2, and an effect tag `kind: 'slot2' | 'fourth'`): `slot2-1` "Slot II −5" (10, "a tower's second slot costs 5 less"), `slot2-2` "Slot II −5" (20, requires `slot2-1`, same line), `fourth-card` "Fourth card" (15, "the pre-wave-1 draft offers a fourth card").
- **New** `src/core/techEffects.ts` — the row's pure effects (imports `slotCost`/`draftCardCount` from `core/augments.ts`, `DRAFT_NODES` from the content file).
- **Edit** `src/core/run.ts` — two fields on `RunState`, default off: `slotDiscount = 0; fourthCard = false;` (0/false for a resumed run).
- **Edit** `src/scenes/GameScene.ts` — where `new RunState` / `saver.restore(saved)` happen: when `!saved` (new or ghost), read the owned node ids from T0103's pure tech module and set the two run fields.
- **Edit** `src/systems/TowerSystem.ts` — `nextSlotCost` and `unlockSlot` read the discounted price.
- **Edit** `src/ui/hud/TowerPanel.ts` — the unlock button's price (the `i === tower.slots` branch in `slots()`).
- **Edit** `src/systems/RunFlow.ts` — `openDraft()` and `rerollOffer()` draft counts.
- **Registry, one line** in T0103's row registry: the "The draft" row → `DRAFT_NODES` (node-card look, states, purchase, chime, persistence all come from T0103's machinery).

### Interfaces
In new `src/core/techEffects.ts`:
```ts
export interface DraftTech { slotDiscount: number; fourthCard: boolean }
export function draftTech(owned: readonly string[]): DraftTech // 5 per owned 'slot2' node, fourth when its node is owned
export function slotPrice(index: number, discount: number): number | undefined // slotCost(index), minus the discount on the second slot only, floored at 5
export function draftCardsFor(draftNumber: number, fourthCard: boolean): number // 4 at draft 1 with the node; draftCardCount otherwise
```
In `core/run.ts`, on `RunState`: `slotDiscount: number` (default 0), `fourthCard: boolean` (default false).
Call sites (all already hold `this.run` / `game.run`): `TowerSystem.nextSlotCost` → `slotPrice(tower.slots, this.run.slotDiscount)`; `TowerSystem.unlockSlot` → `const cost = slotPrice(tower.slots, this.run.slotDiscount)`; `TowerPanel.slots()` → `const cost = slotPrice(i, game.run.slotDiscount)!` (and the `unlock.cost` it stores); `RunFlow` both → `draftCardsFor(this.draftWave, this.run.fourthCard)`. `slotCost(0)` sites (TowerSystem.build, Building tap/hover) stay untouched — slot 0 is the tower itself.

### Steps
1. `content/tech/draft.ts`: the three defs; node 2 requires node 1; costs 10/20/15.
2. `core/techEffects.ts` with the three functions above (`slotPrice` = `index === 1 ? Math.max(5, slotCost(1)! - discount) : slotCost(index)`).
3. `RunState`: the two fields with defaults, one-line comments (0/false for a resumed run).
4. GameScene: after `saver.restore` / the `saved` branch, only when `!saved`, `const t = draftTech(<T0103 pure module's owned ids>)`, set `run.slotDiscount`, `run.fourthCard`.
5. TowerSystem + TowerPanel: swap the slot-1 price to `slotPrice(...)` (imports: `slotPrice` in from `core/techEffects.ts`, keep `slotCost` where slot-0 sites use it).
6. RunFlow: swap the two `draftCardCount` calls to `draftCardsFor`.
7. Register the row in T0103's registry with T0103's row format.

### Pitfalls
- Never the save payload: the fields are set only in the `!saved` path, after `restore`, so a resumed run keeps defaults (0/false) and a later purchase never reaches it.
- Discount is slot index 1 only: slot 0 (build, 40) and slots 2/3 (160/400) unchanged — `slotPrice` gates on `index === 1`; the 5-gold floor never triggers at base 70 but is implemented.
- No DraftScene edit: the fourth's flip-in-last delay, tier chime, 1-row/2×2 fit and the no-repeat/tier-odds rolls all already key off `offer.length === 4` / `rollOffer`'s loop.
- Pre-wave-1 gate: only `draftNumber === 1` (run.wave 0); drafts from wave 2 on fall through to `draftCardCount` (the every-5th rule still says 4 there).
- Chime/purchase/persistence are T0103's: the row reuses them; no new node-card code.

### Tests
`tests/core/techEffects.test.ts` (or the repo's name): `slotPrice(0/2/3, anything) === slotCost(0/2/3)` and `slotPrice(1, d) === Math.max(5, 70 - d)` (d 0/5/10, big); `draftTech` over id subsets ({5,false},{10,false},{0,true},{10,true},{}); `draftCardsFor`: (1,true)=4, (1,false)=3, (5,false)=4, (5,true)=4, (6,true)=3; byte-identical: `slotPrice(i, 0) === slotCost(i)` for all i, `draftCardsFor(w, false) === draftCardCount(w)` for all w.
