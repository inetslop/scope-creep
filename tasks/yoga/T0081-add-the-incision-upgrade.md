---
id: T0081
title: Add the Incision upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T06:00:29Z
claimed_at: 2026-10-27T06:06:07Z
designer: yoga
---

## Goal
A rare card for the pierce build: **Incision** pairs +1 pierce with +5% crit chance, so a volley that punches through a row of enemies can land double-damage hits all the way through it — the last untapped pair on the pierce axis.

## Details
- New `UpgradeDef` appended at the end of `UPGRADES` in `src/content/upgrades/index.ts`, copying the shape of the `pizzicato` entry (T0056, the rare ink pierce card). Append after whatever is currently last — `andante`, or `gravure` if T0080 has landed first.
- `id: 'incision'`, name "Incision", description "+1 pierce, +5% crit chance", `maxLevel: 2`, `weight: 3`, `color: PALETTE.ink` (same as Ostinato, Pizzicato, Gravure).
- Two mods per level, in this order: `extraPierce` +1 (the same stat as the `pizzicato`/`ostinato` pierce mods), then `critChance` +0.05 (the same stat as the `accent` crit mod).
- No stats, types, or scene changes: cards render from the registry automatically and both stats already exist.
- One new unit test in `tests/core/upgrades.test.ts`, appended after the last `it` block and copying its shape (the marcato/andante test): Incision offers exactly 2 levels, then stops, and each level applies exactly two mods in order — `extraPierce` +1 first, `critChance` +0.05 second.

## Acceptance criteria
- [ ] In a level-up deal an "Incision" card can appear, ink-colored, reading "+1 pierce, +5% crit chance".
- [ ] Picking Incision twice is possible; after 2 levels it is never offered again.
- [ ] With Incision at 2, volleys pass through 2 extra enemies and the run's crit chance is +0.10 over base (crits still show as the existing red doubled numbers).
- [ ] The new unit test passes in `npm run check` and `npm run smoke` (desktop + mobile) is green.
