---
id: T0090
title: Add the Sostenuto upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T07:59:07Z
claimed_at: 2026-10-27T08:06:56Z
designer: yoga
---

## Goal
One more level-up card: **Sostenuto** pairs +8% damage with +4 max HP per level — the brawler's card: every level you hit harder *and* take harder, completing the max-HP pairing trio (Mass's HP+armor, Adagio's HP+regen) and finishing the Slab build.

## Details
- New `sostenuto` entry appended at the end of `UPGRADES` in `src/content/upgrades/index.ts`, copying the shape of the recent `adagio` (T0052) and `tenuto` (T0073) entries. Open the file first and append after whichever entry is currently last — T0086 (Con Brio) and T0089 (Leggero) are ahead of this one in the queue and both append entries, so never assume which entry is last.
- Exact values: `id: 'sostenuto'`, `name: 'Sostenuto'`, `description: '+8% damage, +4 max HP'`, `maxLevel: 3`, `weight: 4`, `color: PALETTE.yellow` (the same yellow as the sustain cards `adagio`, `pedal`, `andante`, `sotto-voce` and `rubato`).
- Two mods per level, damage first and max HP second:
  - a damage mod on the same `damageMul` stat and `mul` op that the `emphasis` entry uses, but with value ×1.08 instead of ×1.15 — +8% damage per level,
  - a max-HP mod on the same `maxHp` stat and `add` op that the `adagio` entry uses, but with value +4 instead of +6 — +4 max HP per level.
- At max level: ≈×1.26 damage and +12 max HP; stacks with the other cards that use those stats (Weight/Emphasis/Pressure/Fugue/Tenuto/Con Brio for damage, Mass/Tessitura/Adagio for max HP).
- No new stats, types, or scene changes: both stats already exist, cards render from the registry automatically. Do not touch `src/core/stats.ts`, `content/types.ts` or the level-up scene.
- Add the matching unit test in `tests/core/upgrades.test.ts`, appended after the last test in the file, following the `andante` test pattern: assert the exact two mods in order (damage first, max HP second), apply the upgrade 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Sostenuto" appears as a yellow level-up card in the three-card choice, reading "+8% damage, +4 max HP".
- [ ] Picking it adds +8% damage and +4 max HP per level (the HUD max HP visibly rises by 4 and damage numbers get bigger); at 3 levels ≈×1.26 damage and +12 max HP, stacking with Emphasis and Adagio builds.
- [ ] After 3 levels it is never offered again.
- [ ] The new unit test passes in the automated gate (`npm run check` and `npm run smoke` on desktop + mobile green).
