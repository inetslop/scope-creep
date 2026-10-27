---
id: T0081
title: Add the Incision upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T06:00:29Z
claimed_at: 2026-10-27T06:09:57Z
finished_at: 2026-10-27T06:16:43Z
---

## Goal
A rare card for the pierce build: **Incision** pairs +1 pierce with +5% crit chance, so a volley that punches through a row of enemies can land double-damage hits all the way through it — the last untapped pair on the pierce axis.

## Details
- New `UpgradeDef` appended at the end of `UPGRADES` in `src/content/upgrades/index.ts`, copying the shape of the `pizzicato` entry (T0056, the rare ink pierce card). Append after whatever is currently last — `andante`, or `gravure` if T0080 has landed first.
- `id: 'incision'`, name "Incision", description "+1 pierce, +5% crit chance", `maxLevel: 2`, `weight: 3`, `color: PALETTE.ink` (same as Ostinato, Pizzicato, Gravure).
- Two mods per level, in this order: `extraPierce` +1 (the same stat as the `pizzicato`/`ostinato` pierce mods), then `critChance` +0.05 (the same stat as the `accent` crit mod).
- No stats, types, or scene changes: cards render from the registry automatically and both stats already exist.
- One new unit test in `tests/core/upgrades.test.ts`, appended after the last `it` block and copying its shape (the marcato/andante test): Incision offers exactly 2 levels, then stops, and each level applies exactly two mods in order — `extraPierce` +1 first, `critChance` +0.05 second.

## Acceptance criteria
- [ ] In a level-up deal an "Incision" card can appear, ink-colored, reading "+1 pierce, +5% crit chance".
- [ ] Picking Incision twice is possible; after 2 levels it is never offered again.
- [ ] With Incision at 2, volleys pass through 2 extra enemies and the run's crit chance is +0.10 over base (crits still show as the existing red doubled numbers).
- [ ] The new unit test passes in `npm run check` and `npm run smoke` (desktop + mobile) is green.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one `UpgradeDef` to the end of the `UPGRADES` array, after the `gravure` block (the `];` line)
- edit `tests/core/upgrades.test.ts` - append one new `it` block after the `gravure` test, before the closing `});`
### Interfaces
No new types or functions. Data only.
### Steps
1. In `src/content/upgrades/index.ts`, add as the last element of `UPGRADES`:
```ts
{
  id: 'incision',
  name: 'Incision',
  description: '+1 pierce, +5% crit chance',
  maxLevel: 2,
  weight: 3,
  mods: [
    { stat: 'extraPierce', op: 'add', value: 1 },
    { stat: 'critChance', op: 'add', value: 0.05 },
  ],
  color: PALETTE.ink,
},
```
2. In `tests/core/upgrades.test.ts`, copy the `gravure` `it` block and change only the id to `'incision'`, the mods to `[
    { stat: 'extraPierce', op: 'add', value: 1 },
    { stat: 'critChance', op: 'add', value: 0.05 },
  ]`, and the level assertion to `expect(run.upgradeLevel('incision')).toBe(2);` (test title: `it('incision offers 2 levels, then stops', ...)`).
3. Run `npm run check`, then `npm run smoke`.
No other files. Do not touch `UPGRADE_BY_ID` (built from the array) or any scene/system.
### Pitfalls
- The id in the test (`UPGRADE_BY_ID.get('incision')`) must be spelled exactly `incision` — a typo just fails `expect(def).toBeDefined()`.
- Do not reorder existing entries; append only. Order matters for diff review, not behavior.
- `mods` order is checked by the test: `extraPierce` first, `critChance` second.
### Tests
- `tests/core/upgrades.test.ts`: the new incision block (shape of the gravure/marcato tests). `tests/content.test.ts` validates the new entry automatically.

## Result (attempt 1, yoga)

Added the Incision upgrade — a rare ink card pairing +1 pierce with +5% crit chance, max 2 levels, weight 3 — appended to `UPGRADES` in `src/content/upgrades/index.ts` after the gravure entry, plus its unit test (2 levels, then stops, mods in order) in `tests/core/upgrades.test.ts`. `npm run check` is green (247 tests) and `npm run smoke` passes on desktop and mobile, closing out the last untapped pair on the pierce axis.

- Self-review: APPROVE
- Time: 6.8 min

```
game/src/content/upgrades/index.ts | 12 ++++++++++++
 game/tests/core/upgrades.test.ts   | 16 ++++++++++++++++
 2 files changed, 28 insertions(+)
```
