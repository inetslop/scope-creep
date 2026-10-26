---
id: T0016
title: Add the Plate upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0013]
attempts: 1
created: 2026-10-26T19:20:22Z
claimed_at: 2026-10-26T19:59:49Z
finished_at: 2026-10-26T20:05:49Z
---

## Goal
A new defensive upgrade for players who want to tank: pure armor, no other effects.

## Details
- Edit only `src/content/upgrades/index.ts`. Append one entry to the end of the `UPGRADES` array, in the same style as the others.
- Values: `id: 'plate'`, `name: 'Plate'`, `description: '+1 armor'`, `maxLevel: 2`, `weight: 5`, `color: PALETTE.yellow`.
- `mods`: a single mod that adds 1 armor — copy the armor mod from the `mass` entry (same stat, same op, value 1).

## Acceptance criteria
- [ ] The new upgrade is in `UPGRADES` with exactly these values
- [ ] The level-up menu offers Plate up to 2 times, and each level grants the same armor as the `mass` entry's armor mod
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- edit `src/content/upgrades/index.ts` - append one entry to the end of the `UPGRADES` array, after the `draft` entry (the entry ending at line 133) and before the closing `];` on line 134. No other file changes.
### Interfaces
No new types or functions. The entry must be exactly (field order matches the other entries):

```ts
  {
    id: 'plate',
    name: 'Plate',
    description: '+1 armor',
    maxLevel: 2,
    weight: 5,
    mods: [{ stat: 'armor', op: 'add', value: 1 }],
    color: PALETTE.yellow,
  },
```
### Steps
1. Open `src/content/upgrades/index.ts`. Find the `draft` entry (last entry, ends with `},` at line 133).
2. Insert the entry above immediately after it, keeping the trailing comma, so the array ends `... },\n];`.
3. Do not touch the `mass` entry or any other entry; `PALETTE` is already imported at the top of the file.
4. Run `npm run check`, then `npm run smoke`. Both must pass.
### Pitfalls
- Insertion point: after `draft`, before `];` — a missing comma here is a syntax error that `npm run check` will catch.
- `weight: 5` is the relative offer chance, not a stat — do not turn it into a mod.
- No `requires`, `requiresWeapon`, or `grantsWeapon` fields: this is a pure stat mod; `mods` alone satisfies the content test's "must do something" rule.
- `armor` is already clamped 0–50 in `STAT_LIMITS`; with `maxLevel: 2` plate alone can never exceed it, so no limit change is needed.
### Tests
- none — `tests/content.test.ts` auto-validates the new entry (unique kebab-case id, `maxLevel ≥ 1`, `weight > 0`, `armor` is a known stat), and `tests/core/core.test.ts` already applies every upgrade to `maxLevel` generically.

## Result (attempt 1, yoga)

Added the `plate` upgrade to `UPGRADES` in `src/content/upgrades/index.ts` — a pure defensive option (`+1 armor`, maxLevel 2, weight 5, PALETTE.yellow) that mirrors the armor mod from the `mass` entry. One deviation from the design: its insertion point said "after the `draft` entry (line 133)", but `draft` is no longer the last entry (`contrast` and `staccato` were added since), so per the task goal I appended at the true end of the array instead. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 6.0 min

```
game/src/content/upgrades/index.ts | 9 +++++++++
 1 file changed, 9 insertions(+)
```
