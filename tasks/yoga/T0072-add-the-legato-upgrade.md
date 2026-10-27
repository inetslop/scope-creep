---
id: T0072
title: Add the Legato upgrade
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T04:08:50Z
---

## Goal
A "fast hands" level-up card — faster volleys and a faster body on one card — for players who want to dart around the page while keeping their ink up. It fills the gap where Tempo (+8%/+8%) is too mild and Presto speeds up projectiles rather than the player.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Vivace (T0067) and Arpeggio (T0069) entries). Open the file first and append after whichever entry is currently last — the open tasks T0069 (Arpeggio, yoga) and T0055 (Counterpoint, desktop-4070) may also have appended to this array, so never assume which entry is last.
- `id: 'legato'`, display name "Legato", description `'+12% fire rate, +12% move speed'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.orange` (the same orange as the speed cards `presto` and `staccato`).
- Two mods, copied from existing entries:
  - the +12% fire-rate mod from the `staccato` entry (same stat and op, value 1.12) — +12% fire rate per level,
  - the move-speed mod from the `presto` entry (same stat and op, value 1.12 to match `staccato`'s speed mod) — +12% move speed per level.
- At max level: ≈×1.40 fire rate and ≈×1.40 move speed; stacks with the other cards that use those stats (Rhythm/Tempo/Staccato/Allegro/Pressure/Pulse/Trill/Glissando for fire rate, Momentum/Presto/Sweep for move speed).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`impasto` test pattern: assert the exact two mods, apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Legato" appears as an orange level-up card in the three-card choice, reading "+12% fire rate, +12% move speed".
- [ ] Picking it adds +12% fire rate and +12% move speed per level; at 3 levels, ≈×1.40 fire rate and ≈×1.40 move speed (the player visibly darts faster and volleys come faster).
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one new entry to the `UPGRADES` array, after the entry that is currently last (open the file; do not assume it is `arpeggio` — T0069/T0055 may have appended entries).
- edit `tests/core/upgrades.test.ts` - append one new `it(...)` block after the last test in the `rollUpgradeChoices` describe block (currently `vivace`).

### Interfaces
None. No new types, stats, or functions. Both stats already exist; cards render from the registry automatically.

### Steps
1. In `src/content/upgrades/index.ts`, after the last entry in `UPGRADES`, add exactly:
```ts
{
  id: 'legato',
  name: 'Legato',
  description: '+12% fire rate, +12% move speed',
  maxLevel: 3,
  weight: 4,
  mods: [
    { stat: 'fireRateMul', op: 'mul', value: 1.12 },
    { stat: 'moveSpeed', op: 'mul', value: 1.12 },
  ],
  color: PALETTE.orange,
},
```
2. In `tests/core/upgrades.test.ts`, append (copied from the `pizzicato`/`impasto` pattern, 3 levels like `pulse`):
```ts
it('legato offers 3 levels, then stops', () => {
  const run = new RunState(1);
  const def = UPGRADE_BY_ID.get('legato')!;
  expect(def).toBeDefined();
  expect(def.mods).toEqual([
    { stat: 'fireRateMul', op: 'mul', value: 1.12 },
    { stat: 'moveSpeed', op: 'mul', value: 1.12 },
  ]);
  for (let i = 0; i < def.maxLevel; i++) {
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
    run.applyUpgrade(def);
  }
  expect(run.upgradeLevel('legato')).toBe(3);
  expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
});
```
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Mod order in the entry must be `fireRateMul` first, `moveSpeed` second — the test's `toEqual` is order-sensitive; keep both identical.
- Use value `1.12` for the move-speed mod (matches `staccato`'s speed mod), not `presto`'s `1.10`.
- Do not touch `src/core/stats.ts`, `content/types.ts`, or the LevelUp scene — nothing new needed. Do not create a new file for this entry (small upgrades live in the list).
- Do not reuse id `legato`/change its casing; content validation enforces unique kebab-case ids.

### Tests
- `tests/core/upgrades.test.ts`: the new `legato` test above (exact mods, 3 levels, then stops). `tests/content.test.ts` validates the entry automatically — no edits.
