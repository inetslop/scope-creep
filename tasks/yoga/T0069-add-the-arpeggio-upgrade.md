---
id: T0069
title: Add the Arpeggio upgrade
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T03:40:32Z
claimed_at: 2026-10-27T03:44:29Z
designer: yoga
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
