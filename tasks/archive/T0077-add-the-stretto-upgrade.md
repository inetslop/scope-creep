---
id: T0077
title: Add the Stretto upgrade
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0076]
attempts: 1
created: 2026-10-27T04:56:47Z
claimed_at: 2026-10-27T05:26:13Z
finished_at: 2026-10-27T05:33:59Z
---

## Goal
A 41st level-up card — Stretto — that pairs armor with fire rate: the armored-tempos build that holds its ground and keeps a fast volley going. It is the last untapped pair on the armor axis (every other armor card is taken: Mass, Plate, Pedal, Tenuto, Vellum).

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Tenuto (T0073) and Sotto Voce (T0074) entries). Open the file first and append after whichever entry is currently last — T0076 (Vellum) is queued on this same machine ahead of this task and will likely have appended an entry, so never assume which entry is last.
- `id: 'stretto'` (one word, passes the existing kebab-case content validation), display name "Stretto", description `'+1 armor, +10% fire rate'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.yellow` (the same yellow as the defensive cards `plate`, `pedal`, `tenuto`).
- Two mods, copied from existing entries, armor first and fire rate second:
  - the +1 armor mod from the `plate` entry (same stat, same op, value 1) — +1 armor per level,
  - the +10% fire-rate mod from the `pressure` entry (same stat, same op, ×1.10 — the same stat `rhythm` uses at ×1.20) — +10% fire rate per level.
- At max level: +3 armor and ≈×1.33 fire rate; stacks with the other cards that use those stats (Mass/Plate/Pedal/Tenuto for armor, Rhythm/Pressure/Legato/Ostinato for fire rate).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `tenuto` test pattern: assert the exact two mods (armor first, fire rate second), apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Stretto" appears as a yellow level-up card in the three-card choice, reading "+1 armor, +10% fire rate".
- [ ] Picking it adds +1 armor and +10% fire rate per level; at 3 levels, +3 armor and ≈×1.33 fire rate (the player shrugs off more hits and fires faster).
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one new `UpgradeDef` at the END of the `UPGRADES` array, after whichever entry is currently last (T0076/Vellum may have appended first; never assume `sotto-voce` is last)
- edit `tests/core/upgrades.test.ts` - append one `it(...)` after the `tenuto` test
### Interfaces
No new types, stats, or functions. Both mods reuse existing `StatKey`s: `armor` (add) and `fireRateMul` (mul).
### Steps
1. In `src/content/upgrades/index.ts`, after the last entry, before the closing `];`, add exactly:
```ts
  {
    id: 'stretto',
    name: 'Stretto',
    description: '+1 armor, +10% fire rate',
    maxLevel: 3,
    weight: 4,
    mods: [
      { stat: 'armor', op: 'add', value: 1 },
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
    ],
    color: PALETTE.yellow,
  },
```
(armor mod = `plate`'s mod; fire-rate mod = `pressure`'s second mod. `PALETTE` is already imported in that file.)
2. In `tests/core/upgrades.test.ts`, after the `tenuto` test add:
```ts
  it('stretto offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('stretto')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'armor', op: 'add', value: 1 },
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('stretto')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
```
3. Run `npm run check`, then `npm run smoke`.
### Pitfalls
- Do not edit `src/core/stats.ts`, `content/types.ts`, or the level-up scene: cards render from the registry automatically (`GameScene` rolls from `UPGRADES`, `LevelUpScene` looks up via `UPGRADE_BY_ID`).
- Keep armor mod FIRST and fire rate SECOND — the test asserts exact order.
- Use `1.10` not `1.1`; `maxLevel: 3`, `weight: 4`, `PALETTE.yellow` exactly as above.
- `id: 'stretto'` (no hyphen) passes the kebab-case check; it is unique.
- Max level math is already safe: armor 0+3, fireRateMul 1.10³ ≈ 1.33, both within `STAT_LIMITS`.
### Tests
- `tests/core/upgrades.test.ts`: new `stretto` test as above; `tests/content.test.ts` validates the entry automatically.

## Result (attempt 1, yoga)

Added the Stretto upgrade (41st level-up card) by appending an `UpgradeDef` at the end of `UPGRADES` in `src/content/upgrades/index.ts` — `id: 'stretto'`, "+1 armor, +10% fire rate", maxLevel 3, weight 4, `PALETTE.yellow`, with the armor mod from `plate` first and the ×1.10 `fireRateMul` mod from `pressure` second — completing the last untapped pair on the armor axis. Also added the matching unit test in `tests/core/upgrades.test.ts` (after the `tenuto`-pattern tests, following the file's ordering) asserting the exact mods, 3 offerable levels, then unavailable. `npm run check` (typecheck + lint + 239 tests) and `npm run smoke` (desktop + phone in a real browser) both pass; no new stats, types, or scene code needed since cards render from the registry.

- Self-review: APPROVE
- Time: 7.8 min

```
game/src/content/upgrades/index.ts | 12 ++++++++++++
 game/tests/core/upgrades.test.ts   | 16 ++++++++++++++++
 2 files changed, 28 insertions(+)
```
