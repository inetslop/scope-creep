---
id: T0074
title: Add the Sotto Voce upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T04:27:23Z
claimed_at: 2026-10-27T04:33:58Z
finished_at: 2026-10-27T04:40:18Z
---

## Goal
A quiet sustain-and-economy card: Sotto Voce pairs shard value with slow healing on one card, for players who want to sweep the shards and outlast the swarm at once. It joins the sustain family (Adagio's HP + regen, Pedal's armor + regen) as its economy voice.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Vivace (T0067), Arpeggio (T0069) and Tenuto (T0073) entries). Open the file first and append after whichever entry is currently last — T0072 (Legato) and T0073 (Tenuto, both on yoga) run around this one, and the open T0055 (Counterpoint, on desktop-4070) also appends to this array, so never assume which entry is last.
- `id: 'sotto-voce'` (kebab-case, per the existing content validation), display name "Sotto Voce", description `'+15% shard XP, +0.5 HP/s regen'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.yellow` (the same yellow as the sustain/economy cards `adagio`, `pedal`, `gather`, `glissando`).
- Two mods, copied from existing entries:
  - the +15% shard-XP mod from the `glissando` entry (same stat and op, `xpMul` ×1.15) — +15% shard XP per level,
  - the +0.5 HP/s regen mod from the `adagio` entry (same stat and op, `regenPerSec` +0.5) — +0.5 HP/s regen per level.
- At max level: ≈×1.52 shard XP and 1.5 HP/s regen; stacks with the other cards that use those stats (Composition/Gather/Glissando for shard XP, Balance/Adagio/Pedal for regen).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`impasto`/`tenuto` test pattern: assert the exact two mods, apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Sotto Voce" appears as a yellow level-up card in the three-card choice, reading "+15% shard XP, +0.5 HP/s regen".
- [ ] Picking it raises shard value and adds per-second healing; at 3 levels, ≈×1.52 shard XP and 1.5 HP/s regen (a damaged player visibly regens back).
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one `UpgradeDef` entry at the end of the `UPGRADES` array, after `tenuto` (the current last entry)
- edit `tests/core/upgrades.test.ts` - add one `it(...)` test in the existing `describe('rollUpgradeChoices')` block, appended after the `tenuto` test

### Interfaces
No new types or functions. Both stats already exist and are used by existing entries (`xpMul` in `glissando`, `regenPerSec` in `adagio`/`pedal`). Do not touch `src/core/stats.ts`, `src/content/types.ts`, or the level-up scene.

### Steps
1. In `src/content/upgrades/index.ts`, after the `tenuto` entry (the object whose `id` is `'tenuto'`, still the last entry unless T0055/T0072-T0073 land first — always re-open the file and append after whatever is last), add:
```ts
  {
    id: 'sotto-voce',
    name: 'Sotto Voce',
    description: '+15% shard XP, +0.5 HP/s regen',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'xpMul', op: 'mul', value: 1.15 },
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
    ],
    color: PALETTE.yellow,
  },
```
2. In `tests/core/upgrades.test.ts`, after the `'tenuto offers 3 levels, then stops'` test, add the same pattern with `sotto-voce`:
```ts
  it('sotto voce offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('sotto-voce')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'xpMul', op: 'mul', value: 1.15 },
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('sotto-voce')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check` then `npm run smoke`; both must pass.

### Pitfalls
- The mods array order must be exactly `[xpMul, regenPerSec]` — `tests/content.test.ts` and the new test assert exact mods via `toEqual`.
- `stat` names must be `xpMul` and `regenPerSec` exactly (existing keys in `PlayerStats`); do not invent new stats or touch `stats.ts`.
- `color: PALETTE.yellow` (same as `adagio`/`pedal`/`gather`/`glissando`), not green — the sustain cards are yellow.
- Do not modify any other entry; the array is shared with T0055, which appends concurrently.

### Tests
- New test `'sotto voce offers 3 levels, then stops'` in `tests/core/upgrades.test.ts` (exact two mods, apply 3×, stops offering). Content validation in `tests/content.test.ts` covers id/name/registry rules automatically.

## Result (attempt 1, yoga)

Added the "Sotto Voce" upgrade (sustain-and-economy card) as a new `UpgradeDef` entry appended after `tenuto` at the end of `UPGRADES` in `src/content/upgrades/index.ts` — yellow, maxLevel 3, weight 4, with exactly two mods: `xpMul` ×1.15 (from glissando) and `regenPerSec` +0.5 (from adagio), so at 3 levels it grants ≈×1.52 shard XP and 1.5 HP/s regen, stacking with the other cards using those stats. Cards render from the registry automatically, so no scene, stat, or type changes were needed. Added the matching unit test `'sotto voce offers 3 levels, then stops'` in `tests/core/upgrades.test.ts` asserting the exact mods, 3 offers, and the stop. `npm run check` (230 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 6.3 min

```
game/src/content/upgrades/index.ts | 12 ++++++++++++
 game/tests/core/upgrades.test.ts   | 16 ++++++++++++++++
 2 files changed, 28 insertions(+)
```
