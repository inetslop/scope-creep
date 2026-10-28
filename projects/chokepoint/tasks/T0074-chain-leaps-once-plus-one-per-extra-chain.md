---
id: T0074
title: Chain leaps once, plus one per extra Chain
size: S
priority: 1
status: todo
depends_on: [T0025]
attempts: 0
created: 2026-10-28T21:08:30Z
---

## Goal
Chain (T0025) lands with 3 leaps per attack: against a group that is 45 damage or more every 1.2 s, about twice what Lance or Bolt deal. Start it at one leap and let every extra Chain in the tower add one, the same way Lance's pierce grows: one Chain hits 2 enemies, two Chains 3.

## Details
- **As a tower's first augment:** the zap strikes the enemy furthest along in range, then leaps **once** (2 enemies in all). Every further Chain in the same tower (any slot, any tier) adds 1 leap: a Chain tower with one more Chain added leaps twice (3 enemies).
- **Added to another tower:** unchanged: each attack leaps to 1 more enemy per Chain added.
- Damage per leap (15 / 18 / 20), cadence (every 1.2 s / 1.05 s / 0.9 s), range (2.8 cells) and leap reach (2.5 cells) stay as T0025 built them.
- **Card line (Common):** first: "A zap that leaps: 15 damage, 1 leap, every 1.2s." Rare and Epic show their own damage and cadence the same way; the added line is unchanged.
- **Tower panel line:** says how many enemies the zap reaches.

## Acceptance criteria
- [ ] A lone Chain tower's zap strikes 2 enemies per attack (when 2 are in reach); with a second Chain in the tower, 3.
- [ ] A Bolt with one Chain added still leaps to 1 more enemy, with two Chains added to 2 more.
- [ ] The card lines and the tower panel show the new counts at every tier.
- [ ] Chain's unit tests are updated to the new counts.

## Design (architect, yoga)

### Files
- edit `src/content/augments/chain.ts` - first form's leap count 3 → 1; the three card first-lines (Common `asTower`, `tiers.rare.asTower`, `tiers.epic.asTower`) say "1 leap"
- edit `tests/core/chain.test.ts` - expectations to the new counts
- edit `src/systems/attacks/chain.ts` - only if T0025 hardcoded the count there instead of reading it from the tower spec (verify, step 4)
- edit `src/core/augments.ts` - only if T0025's `describeSpec` zap line hardcodes the enemy count instead of using the spec (verify, step 4)

### Interfaces
No new types or functions: T0074 retunes fields T0025 already added (the zap's leap count in the first form and `added`, and the matching `TowerSpec` field accumulated in `towerSpec` exactly like `pierce`). In `src/content/augments/chain.ts`:
```ts
asTower: 'A zap that leaps: 15 damage, 1 leap, every 1.2s.',
first: { kind: 'zap', damage: 15, range: 2.8, rate: 1 / 1.2, leaps: 1, leapRange: 2.5 }, // leaps: was 3
// tiers:
rare: { /* damageMul/cooldownMul as T0025 */, asTower: 'A zap that leaps: 18 damage, 1 leap, every 1.05s.' },
epic: { /* as T0025 */, asTower: 'A zap that leaps: 20 damage, 1 leap, every 0.9s.' },
```
`added` and `asAdded` are untouched.

### Steps
1. Read `src/content/augments/chain.ts` (T0025's, in the tree by now). Find the first form's leap-count field (next to `damage: 15`, likely named `leaps`) — it is 3.
2. Change it to 1. Delete any tier override of the leap count in `tiers` if T0025 added one (every tier must keep 1).
3. Set the three first-lines exactly as in Interfaces ("1 leap" singular at every tier); if `description` mentions the count, 3 → 1. Do not touch `added`/`asAdded`.
4. Read `src/systems/attacks/chain.ts` and the zap branch of `describeSpec` in `src/core/augments.ts`: both must take the count from the tower's spec, the way `shot.ts` reads `spec.pierce` and `describeSpec` shows `${spec.pierce + 1}`. If either hardcodes 3 (attacks) or 4 enemies (panel line), replace with the spec field / `spec.leaps + 1`; otherwise leave them alone (expected: no change).
5. Update `tests/core/chain.test.ts` to the new counts.

### Pitfalls
- The `added` form is untouched: a Bolt with one Chain added still leaps to exactly 1 more enemy — the change is only the first form's base (3 → 1).
- Damage per leap (15/18/20), cadence (1.2/1.05/0.9 s), range (2.8) and leap reach (2.5) stay as T0025 built them; only the leap count moves.
- Tier first-lines must stay ≤56 chars (`tests/content.test.ts` enforces it); the three lines above are ~50.
- Do not touch the `towerSpec` accumulation (`spec.leaps += e.leaps ?? 0`, the pierce mirror), `tierFirst`/`tierAdded`, or `content/types.ts`.

### Tests
- `tests/core/chain.test.ts` (existing file, updated in place; model on the "pierce (Lance)" block in `tests/core/augments.test.ts`): `spec('chain')` → 1 leap (2 enemies); `spec('chain', 'chain')` → 2 (3 enemies); `spec('bolt', 'chain')` → 1; `spec('bolt', 'chain', 'chain')` → 2. `tierTowerLine(chain, t)` equals the three lines for every tier; `tierAddedLine` unchanged. `describeSpec(spec('chain'))` shows 2 enemies, `describeSpec(spec('chain', 'chain'))` shows 3.
