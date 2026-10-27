---
id: T0074
title: Add the Sotto Voce upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T04:27:23Z
---

## Goal
A quiet sustain-and-economy card: Sotto Voce pairs shard value with slow healing on one card, for players who want to sweep the shards and outlast the swarm at once. It joins the sustain family (Adagio's HP + regen, Pedal's armor + regen) as its economy voice.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Vivace (T0067), Arpeggio (T0069) and Tenuto (T0073) entries). Open the file first and append after whichever entry is currently last — T0072 (Legato) and T0073 (Tenuto, both on yoga) run around this one, and the open T0055 (Counterpoint, on desktop-4070) also appends to this array, so never assume which entry is last.
- `id: 'sotto-voce'` (kebab-case, per the existing content validation), display name "Sotto Voce", description `'+15% shard XP, +0.5 HP/s regen'`.
- `maxLevel: 3`, roll `weight: 4`, `color: PALETTE.yellow` (the same yellow as the sustain/economy cards `adagio`, `pedal`, `gather`, `glissando`).
- Two mods, copied from existing entries:
  - the +15% shard-XP mod from the `glissando` entry (same stat and op, `xpMul` ×1.15) — +15% shard XP per level,
  - the +0.5 HP/s regen mod from the `adagio` entry (same stat and op, `regenPerSec` +0.5) — +0.5 HP/s regen per level.
- At max level: ≈×1.52 shard XP and 1.5 HP/s regen; stacks with the other cards that use those stats (Composition/Gather/Glissando for shard XP, Balance/Adagio/Pedal for regen).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the `pizzicato`/`impasto`/`tenuto` test pattern: assert the exact two mods, apply it 3 times, and assert it is offered 3 times then stops.

## Acceptance criteria
- [ ] "Sotto Voce" appears as a yellow level-up card in the three-card choice, reading "+15% shard XP, +0.5 HP/s regen".
- [ ] Picking it raises shard value and adds per-second healing; at 3 levels, ≈×1.52 shard XP and 1.5 HP/s regen (a damaged player visibly regens back).
- [ ] After 3 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
