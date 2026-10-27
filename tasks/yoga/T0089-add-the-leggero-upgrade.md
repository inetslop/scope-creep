---
id: T0089
title: Add the Leggero upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T07:44:20Z
claimed_at: 2026-10-27T07:58:04Z
---

## Goal
One more level-up card: **Leggero** pairs +1 pierce with +10% move speed — the light-arms card that gives the pierce builds (Vector, Ostinato, Gravure, Incision, Pizzicato, Riff) a mobility partner for the first time: your volleys go deeper and you are harder to hit.

## Details
- New `leggero` entry appended at the end of `UPGRADES` in `src/content/upgrades/index.ts`, copying the shape of the `riff` entry (T0084 — the most recent card, which already uses `extraPierce` add). Open the file first and append after whichever entry is currently last — T0086 (Con Brio) and T0088 (Rubato) are ahead of this one in the queue and both append entries, so never assume which entry is last.
- Exact values: `id: 'leggero'`, `name: 'Leggero'`, `description: '+1 pierce, +10% move speed'`, `maxLevel: 2`, `weight: 3`, `color: PALETTE.green`.
- Two mods per level, pierce first and move speed second:
  - a pierce mod on the same `extraPierce` stat and `add` op the `riff` and `vector` entries use, value +1 — +1 pierce per level,
  - a move-speed mod on the same move-speed stat and `mul` op the `sweep` entry uses, value ×1.10 — +10% move speed per level.
- At max level: +2 pierce and ≈×1.21 move speed; stacks with the mobility cards (Momentum, Tempo, Presto, Sweep, Legato, Andante and the queued Con Brio) and the pierce cards (Vector, Ostinato, Gravure, Incision, Pizzicato, Riff).
- `maxLevel: 2` / `weight: 3` follow the pierce-pair family convention (Gravure, Incision, Pizzicato and Riff are all max 2, weight 3).
- Green is deliberate: every pierce-family card so far is ink, and Leggero is the first pierce card on the mobility axis, which renders green (Sweep, Riff).
- No new stats, types, or scene changes: both stats already exist, cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, appended after the last test in the file, in the same shape as the `riff` test: assert the exact two mods in order, apply `leggero` twice to a fresh run, assert level 2, +2 pierce and move speed ≈×1.21 above a plain fresh run (close-enough comparison for the float), and that a third offer is rejected.

## Acceptance criteria
- [ ] "Leggero" appears as a green level-up card in the three-card choice, reading "+1 pierce, +10% move speed".
- [ ] Picking it makes every volley pierce one extra enemy and the player move 10% faster per level; at level 2 that is +2 pierce and ≈×1.21 move speed, stacking with Vector and Sweep builds.
- [ ] After 2 levels it is never offered again.
- [ ] The new unit test passes in the automated gate.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` — append the `leggero` entry at the end of `UPGRADES` (after the `rubato` entry, before the closing `];` at line 540)
- edit `tests/core/upgrades.test.ts` — append the `leggero` test after the last test in the file (the `rubato` test, ending line 401)

### Interfaces
None — data only; no type or signature changes (`extraPierce` and `moveSpeed` stats, `add`/`mul` ops, `PALETTE.green` all exist).

### Steps
1. In `src/content/upgrades/index.ts`, confirm `rubato` is still the last `UPGRADES` entry (it is; T0088 is committed). Insert after it:

```ts
  {
    id: 'leggero',
    name: 'Leggero',
    description: '+1 pierce, +10% move speed',
    maxLevel: 2,
    weight: 3,
    mods: [
      { stat: 'extraPierce', op: 'add', value: 1 },
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.green,
  },
```

2. In `tests/core/upgrades.test.ts`, insert after the `rubato` test, before the `});` that closes the `describe`:

```ts
  it('leggero offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('leggero')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraPierce', op: 'add', value: 1 },
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('leggero')).toBe(2);
    expect(run.stats.extraPierce).toBe(2);
    const plain = new RunState(1);
    expect(run.stats.moveSpeed).toBeCloseTo(plain.stats.moveSpeed * 1.21);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```

3. Run `npm run check`.

### Pitfalls
- Append after whichever entry is last — never assume a fixed end-of-array line (queued T0086/T0088 both append to this file; `leggero` itself may not be last either).
- Mod order is asserted: pierce first (`extraPierce`, `add`, 1), move speed second (`moveSpeed`, `mul`); write `value: 1.10` to match the `sweep` entry's source form.
- Use `toBeCloseTo` for moveSpeed (float: 230×1.1×1.1 ≈ 278.3 = plain 230 × 1.21), not `toBe`; `extraPierce` is exact `toBe(2)`.
- No `requires`/`requiresWeapon`/`grantsWeapon` fields; `id: 'leggero'` passes the kebab-case check in `tests/content.test.ts`, which auto-validates the new entry.
- Green card + level-up rendering come for free from `color` + registry — no scene, art, or system change.

### Tests
- `tests/core/upgrades.test.ts`: the `leggero` test above (exact two mods in order, applied twice → level 2, +2 pierce, ≈×1.21 moveSpeed vs a fresh `RunState`, third offer rejected).
