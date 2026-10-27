---
id: T0088
title: Add the Rubato upgrade
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T07:26:36Z
claimed_at: 2026-10-27T07:42:10Z
---

## Goal
One more level-up card: **Rubato** pairs +8% fire rate with +0.5 HP/s regen — a tempo-sustain build that "steals" time: you shoot faster while slowly knitting yourself back together, the last untapped pair on the regen axis.

## Details
- New `rubato` entry appended at the end of `UPGRADES` in `src/content/upgrades/index.ts`, copying the shape of the `andante` entry (T0079, the yellow regen card). Open the file first and append after whichever entry is currently last — T0086 (Con Brio) and T0087 (Divider) are ahead of this one in the queue and T0086 appends an entry, so never assume which entry is last.
- Exact values: `id: 'rubato'`, `name: 'Rubato'`, `description: '+8% fire rate, +0.5 HP/s regen'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.yellow` (the same yellow as the sustain cards `adagio`, `pedal`, `andante` and `sotto-voce`).
- Two mods per level, copied from existing entries, fire rate first and regen second:
  - a fire-rate mod on the same fire-rate stat and `mul` op that the `rhythm` entry uses, but with value ×1.08 instead of ×1.20 — +8% fire rate per level,
  - a regen mod on the same `regenPerSec` stat and `add` op that the `andante` entry uses, value +0.5 — +0.5 HP/s regen per level.
- At max level: ≈×1.26 fire rate and +1.5 HP/s regen; stacks with the other cards that use those stats (Rhythm/Tempo/Legato/Staccato/Stretto/Pulse/Glissando/Allegro for fire rate, Adagio/Pedal/Andante/Sotto Voce for regen).
- No new stats, types, or scene changes: both stats already exist, cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, appended after the last test in the file, following the `andante` test pattern: assert the exact two mods in order (fire rate first, regen second), apply the upgrade 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Rubato" appears as a yellow level-up card in the three-card choice, reading "+8% fire rate, +0.5 HP/s regen".
- [ ] Picking it makes volleys fire 8% faster and the player visibly regain 0.5 HP/s per level; at 3 levels ≈×1.26 fire rate and +1.5 HP/s regen, stacking with Rhythm builds and the Adagio/Pedal/Andante sustain builds.
- [ ] After 3 levels it is never offered again.
- [ ] The new unit test passes in the automated gate (`npm run check` and `npm run smoke` on desktop + mobile green).

## Design (architect, yoga)

### Files
- edit `src/content/upgrades/index.ts` - append one new `rubato` entry to `UPGRADES` (after the entry that is currently LAST — re-open the file and check; do not insert mid-list)
- edit `tests/core/upgrades.test.ts` - append one new `it` block after the last test in the file, copying the `andante` test shape with the ids/vals below

### Interfaces
No new types, stats, or functions. Both stats (`fireRateMul`, `regenPerSec`) already exist in `PlayerStats` (`src/core/stats.ts`); cards render from the `UPGRADES` registry automatically.

Exact entry (paste as-is; `PALETTE` is already imported in that file):
```ts
{
  id: 'rubato',
  name: 'Rubato',
  description: '+8% fire rate, +0.5 HP/s regen',
  maxLevel: 3,
  weight: 4,
  mods: [
    { stat: 'fireRateMul', op: 'mul', value: 1.08 },
    { stat: 'regenPerSec', op: 'add', value: 0.5 },
  ],
  color: PALETTE.yellow,
},
```
Exact test (paste as-is after the last `it` block):
```ts
it('rubato offers 3 levels, then stops', () => {
  const run = new RunState(1);
  const def = UPGRADE_BY_ID.get('rubato')!;
  expect(def).toBeDefined();
  expect(def.mods).toEqual([
    { stat: 'fireRateMul', op: 'mul', value: 1.08 },
    { stat: 'regenPerSec', op: 'add', value: 0.5 },
  ]);
  for (let i = 0; i < def.maxLevel; i++) {
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
    run.applyUpgrade(def);
  }
  expect(run.upgradeLevel('rubato')).toBe(3);
  expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
});
```

### Steps
1. Open `src/content/upgrades/index.ts`; find the last entry in `UPGRADES` and insert the entry above after it (keep the trailing comma style).
2. Open `tests/core/upgrades.test.ts`; insert the test above as the final `it` block inside the existing `describe`.
3. Run `npm run check` — must be green.

### Pitfalls
- Mods order is fire rate FIRST, regen second — the opposite of `andante`'s order; the test asserts the exact ordered array.
- Do not copy `andante`'s mods or values: fire rate uses `fireRateMul`/`mul`/`1.08` (from `rhythm`), not `moveSpeed`; description must read exactly `+8% fire rate, +0.5 HP/s regen`.
- Do not hardcode the list position (e.g. "after `riff`") — T0086 appends another entry ahead of this task; only rule is "after whatever is last when you open the file".
- Max-level math: 1.08^3 ≈ 1.2597 (≈×1.26) and +1.5 HP/s — no clamping needed; `fireRateMul` limit is 8.

### Tests
- `tests/core/upgrades.test.ts`: the `rubato` test above. `tests/content.test.ts` validates the new entry automatically (unique kebab id, weight > 0, known stats, mods present) — no edit needed there.
