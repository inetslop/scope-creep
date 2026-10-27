---
id: T0089
title: Add the Leggero upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T07:44:20Z
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
