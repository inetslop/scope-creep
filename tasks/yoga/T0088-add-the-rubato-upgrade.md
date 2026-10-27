---
id: T0088
title: Add the Rubato upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T07:26:36Z
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
