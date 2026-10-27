---
id: T0077
title: Add the Stretto upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T04:56:47Z
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
