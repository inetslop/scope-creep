---
id: T0080
title: Add the Gravure upgrade
assignee: yoga
size: S
priority: 2
status: design
depends_on: [T0079]
attempts: 0
created: 2026-10-27T05:46:39Z
---

## Goal
A 45th level-up card — Gravure — that pairs pierce with damage: the rare card for pierce builds, so a volley that already carves through a crowd hits harder on the way through. It completes the core of the pierce axis (Vector's pure pierce, Ostinato's pierce + fire rate, Pizzicato's pierce + projectile speed) with the one stat a piercing volley wants most: damage.

## Details
- Add one new `UpgradeDef` entry to `UPGRADES` in `src/content/upgrades/index.ts`, appended at the end of the array (same pattern as the recent Stretto (T0077), Marcato (T0078) and Andante (T0079) entries). Open the file first and append after whichever entry is currently last — T0078 (Marcato) and T0079 (Andante) are queued on this same machine ahead of this task and will each have appended an entry, so never assume which entry is last.
- `id: 'gravure'` (one word, passes the existing kebab-case content validation), display name "Gravure", description `'+1 pierce, +15% damage'`.
- `maxLevel: 2`, roll `weight: 3`, `color: PALETTE.ink` — a rare sibling of the two-level pierce cards `ostinato` and `pizzicato` (same weight and ink color as `pizzicato`).
- Two mods, copied from existing entries, pierce first and damage second:
  - the +1 pierce mod from the `pizzicato` entry (same stat `extraPierce`, same op `add`, value 1 — the identical mod `vector` and `ostinato` use) — +1 pierce per level,
  - a damage mod on the same `damageMul` stat and `mul` op that `emphasis` uses, with value ×1.15 — +15% damage per level.
- At max level: +2 pierce and ≈×1.32 damage; stacks with the other pierce cards (Vector, Ostinato, Pizzicato) and the damage cards (Weight, Emphasis, Fugue, Pressure, Tenuto, Impasto).
- No new stats: both stats already exist — do not touch `src/core/stats.ts`, `content/types.ts`, or the level-up scene; cards render from the registry automatically.
- Add the matching unit test in `tests/core/upgrades.test.ts`, following the two-level-card pattern already in the file (e.g. the `pizzicato` test): assert the exact two mods in order (pierce first, damage second), apply it 2 times, and assert it is offered 2 times then stops.

## Acceptance criteria
- [ ] "Gravure" appears as an ink level-up card in the three-card choice, reading "+1 pierce, +15% damage".
- [ ] Picking it makes volleys pierce +1 enemy and deal +15% damage per level; at 2 levels, +2 pierce and ≈×1.32 damage (volleys visibly carve through an extra enemy and hit harder).
- [ ] After 2 levels it is never offered again (covered by the new test and the existing content validation).
- [ ] `npm run check` and `npm run smoke` pass.
