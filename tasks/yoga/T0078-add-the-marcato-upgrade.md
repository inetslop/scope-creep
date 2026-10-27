---
id: T0078
title: Add the Marcato upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: [T0077]
attempts: 1
created: 2026-10-27T05:18:34Z
claimed_at: 2026-10-27T05:38:59Z
---

## Goal
A 43rd level-up card — Marcato — that pairs crit chance with projectile speed: marked shots that arrive faster. It is the last untapped pair on the crit axis (every other crit card is taken: Contrast, Accent, Pulse, Arpeggio).

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Stretto (T0077) and Sotto Voce (T0074) entries). Open the file first and append after whichever entry is currently last — T0076 (Vellum) and T0077 (Stretto) are queued on this same machine ahead of this task and will likely have appended entries, so never assume which entry is last.
- `id: 'marcato'` (one word, passes the existing kebab-case content validation), display name "Marcato", description `'+5% crit chance, +10% projectile speed'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.red` (the same red as the crit cards `contrast`, `accent`, `arpeggio`).
- Two mods, copied from existing entries, crit first and projectile speed second:
  - the +5% crit-chance mod from the `accent` entry (same stat, same op, value 0.05) — +5% crit chance per level,
  - the +10% projectile-speed mod from the `pizzicato` entry (same stat, same op, ×1.10) — +10% projectile speed per level.
- At max level: +15% crit chance (the existing 0–0.5 crit clamp, locked by the T0024 tests, caps it if a run stacks more crit cards) and ≈×1.33 projectile speed; stacks with the other cards that use those stats (Contrast/Accent/Pulse/Arpeggio for crit chance, Draft/Staccato/Presto/Fugue/Pizzicato/Vivace for projectile speed).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `tenuto`/`stretto` test pattern: assert the exact two mods (crit chance first, projectile speed second), apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Marcato" appears as a red level-up card in the three-card choice, reading "+5% crit chance, +10% projectile speed".
- [ ] Picking it adds +5% crit chance and +10% projectile speed per level; at 3 levels, +15% crit chance and ≈×1.33 projectile speed (shots arrive visibly faster and crits land more often).
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` — append the Marcato `UpgradeDef` as the LAST entry of `UPGRADES` (after whichever entry is currently last — do not assume it is `vellum`; T0077 may have added `stretto` first)
- edit `tests/core/upgrades.test.ts` — append the marcato test after the currently-last `it(...)` block (same caveat: it may be `vellum` or `stretto`)

### Interfaces
No new types or functions — pure data on the existing `UpgradeDef`/`StatMod`.

Exact entry for `UPGRADES`:
```ts
  {
    id: 'marcato',
    name: 'Marcato',
    description: '+5% crit chance, +10% projectile speed',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'critChance', op: 'add', value: 0.05 },
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.red,
  },
```
Exact test (same shape as the `tenuto` test at tests/core/upgrades.test.ts:238):
```ts
  it('marcato offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('marcato')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'critChance', op: 'add', value: 0.05 },
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('marcato')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```

### Steps
1. Open `src/content/upgrades/index.ts`, scroll to the end of the `UPGRADES` array; insert the entry above after the last existing entry, before the `];`.
2. Run `npm run check` — the content validation (kebab-case id, valid stats, weight > 0) now covers `marcato` automatically.
3. Open `tests/core/upgrades.test.ts`, insert the test above after the last `it(...)` block.
4. Run `npm run check` again, then `npm run smoke`.

### Pitfalls
- Mod ORDER matters: `critChance` first, `projectileSpeedMul` second — the test's `toEqual` is order-sensitive (copy from `accent` line 1 and `pizzicato` line 2, in that order).
- Never assume which entry is last in the array (T0076/T0077 land on this same machine); always open the file and look at the tail before appending.
- Do not touch `src/core/stats.ts`, `content/types.ts`, or the LevelUp scene — both stats already exist and cards render from the registry (name/description/color all data). The 0–0.5 crit clamp is `STAT_LIMITS` in `stats.ts:71`; no change needed.
- Values per level: 0.05 crit (3 levels → 0.15, 15%, within clamp) and 1.10^3 ≈ 1.331 projectile speed.

### Tests
- `tests/core/upgrades.test.ts`: the marcato test above.
