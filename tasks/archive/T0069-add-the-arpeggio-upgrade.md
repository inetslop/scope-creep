---
id: T0069
title: Add the Arpeggio upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T03:40:32Z
claimed_at: 2026-10-27T04:01:56Z
finished_at: 2026-10-27T04:08:51Z
---

## Goal
A rare "crit swarm" level-up card — an extra projectile plus a crit-chance bump on one card — the fourth member of the "+1 projectile per volley" family (Trill, Vivace, Impasto), so crit builds can spread their crits across a wider volley instead of betting on a single point.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Vivace (T0067) and Impasto (T0062) entries). Open the file first and append after whichever entry is currently last — the open tasks T0067 (Vivace) and T0055 (Counterpoint) may also have appended to this array, so never assume which entry is last.
- `id: 'arpeggio'`, display name "Arpeggio", description `'+1 projectile per volley, +5% crit chance'`.
- `maxLevel: 2`, roll `weight: 3`, `color: PALETTE.red` (the same red as the crit cards `accent` and `contrast`).
- Two mods, copied from existing entries:
  - the +1 projectile-per-volley mod from the `repetition`/`trill` entries (same stat and op) — +1 projectile per level,
  - the crit-chance mod from the `accent` entry (same stat and op, value 0.05) — +5% crit chance per level.
- No new stats: both `extraProjectiles` and `critChance` already exist (T0013) — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- At max level: +2 projectiles per volley and +10% crit chance; stacks with the other cards that use those stats (Repetition/Trill/Vivace/Impasto for projectiles, Contrast/Accent/Pulse for crit chance).
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`impasto` test pattern: assert the exact two mods, apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Arpeggio" appears as a red level-up card in the three-card choice, reading "+1 projectile per volley, +5% crit chance".
- [ ] Picking it adds +1 projectile per volley and +5% crit chance per level; at 2 levels, +2 projectiles per volley and +10% crit chance (each volley visibly fires one more ink point, and red crit numbers appear more often).
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` — append one `UpgradeDef` entry to the `UPGRADES` array (end of array, before the closing `];`)
- edit `tests/core/upgrades.test.ts` — append the arpeggio test to the `rollUpgradeChoices` describe block

### Interfaces
None. Data-only: the entry satisfies the existing `UpgradeDef` (`src/content/types.ts`); both stats (`extraProjectiles`, `critChance`) already exist in `src/core/stats.ts`. `UPGRADE_BY_ID` and card rendering are registry-driven — no scene, core, or scene-key changes.

### Steps
1. In `src/content/upgrades/index.ts`, find the LAST entry of `UPGRADES` (read the file — do not assume `impasto`; T0067/T0055 also append there) and insert after it:
   ```ts
   {
     id: 'arpeggio',
     name: 'Arpeggio',
     description: '+1 projectile per volley, +5% crit chance',
     maxLevel: 2,
     weight: 3,
     mods: [
       { stat: 'extraProjectiles', op: 'add', value: 1 },
       { stat: 'critChance', op: 'add', value: 0.05 },
     ],
     color: PALETTE.red,
   },
   ```
2. In `tests/core/upgrades.test.ts`, after the `impasto` test, add (imports already present):
   ```ts
   it('arpeggio offers 2 levels, then stops', () => {
     const run = new RunState(1);
     const def = UPGRADE_BY_ID.get('arpeggio')!;
     expect(def).toBeDefined();
     expect(def.mods).toEqual([
       { stat: 'extraProjectiles', op: 'add', value: 1 },
       { stat: 'critChance', op: 'add', value: 0.05 },
     ]);
     for (let i = 0; i < def.maxLevel; i++) {
       expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
       run.applyUpgrade(def);
     }
     expect(run.upgradeLevel('arpeggio')).toBe(2);
     expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
   });
   ```
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Copy only the two specified mods: `extraProjectiles`/`add`/`1` (from `repetition`/`trill`) and `critChance`/`add`/`0.05` (from `accent`) — NOT `trill`'s `fireRateMul` mod, NOT `accent`'s `damageMul` mod, and `0.05` not `0.1` (that's `contrast`).
- `maxLevel: 2`, `weight: 3`, `color: PALETTE.red` (already imported at the top of the file; no new imports).
- Do not touch `src/core/stats.ts`, `src/content/types.ts`, the LevelUp scene, or `UPGRADE_BY_ID` — cards render from the registry; `tests/content.test.ts` validates the new entry automatically.
- `extraProjectiles` clamps at 12 and `critChance` at 0.5 in `STAT_LIMITS` — +2/+10% at max is far inside limits.

### Tests
- `tests/core/upgrades.test.ts`: "arpeggio offers 2 levels, then stops" (exact two mods; offered/applied 2 times, then unavailable) — same pattern as `pizzicato`/`impasto`.

## Result (attempt 1, yoga)

Added the Arpeggio upgrade — a rare red crit-swarm card (`maxLevel: 2`, `weight: 3`, `PALETTE.red`) granting +1 projectile per volley (`extraProjectiles add 1`) and +5% crit chance (`critChance add 0.05`) per level, capped at +2 projectiles/+10% crit — appended to `UPGRADES` in `src/content/upgrades/index.ts`. Added the matching unit test in `tests/core/upgrades.test.ts` asserting the exact two mods, that it is offered and applied 2 times, then stops. Both `npm run check` and `npm run smoke` pass; cards render from the registry, so no scene or core changes were needed.

- Self-review: APPROVE
- Time: 6.9 min

```
game/src/content/upgrades/index.ts | 12 ++++++++++++
 game/tests/core/upgrades.test.ts   | 16 ++++++++++++++++
 2 files changed, 28 insertions(+)
```
