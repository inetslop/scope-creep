---
id: T0084
title: Add the Riff upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T06:43:50Z
---

## Goal
One more level-up card: Riff, the last untapped pair on the projectile axis — a rare card that adds a projectile to every volley and makes each one pierce, so spread builds punch through whole rows of shapes.

## Details
- New `riff` entry appended at the end of `UPGRADES` in `src/content/upgrades/index.ts` (after the `incision` entry, the current last one). Copy the entry shape of the `arpeggio` and `impasto` entries: both mod fields it uses, `extraProjectiles` (add) and `extraPierce` (add), already exist on those cards.
- Exact values: `id: 'riff'`, `name: 'Riff'`, `description: '+1 projectile per volley, +1 pierce'`, `maxLevel: 2`, `weight: 3`, `color: PALETTE.green`; mods: `extraProjectiles` add 1 and `extraPierce` add 1 per level (max = +2 projectiles per volley and +2 pierce).
- Green is deliberate: the rest of the +1-projectile family (Trill red, Vivace orange, Impasto red, Arpeggio red) is warm, and Riff is the family's last card.
- Include a small unit test in the same shape as the tests shipped with T0081/T0076: apply `riff` twice to a fresh run and assert +2 extra projectiles per volley and +2 pierce over base; a fresh run without Riff has neither.

## Acceptance criteria
- [ ] A level-up roll can deal a green card "Riff — +1 projectile per volley, +1 pierce".
- [ ] Picking Riff twice gives +2 projectiles per volley and +2 pierce, stacking with Trill/Vivace/Impasto/Arpeggio on one axis and Vector/Ostinato/Pizzicato/Gravure/Incision on the other.
- [ ] A maxed Riff (level 2) is never offered again.
- [ ] The new unit test passes in the automated gate.
