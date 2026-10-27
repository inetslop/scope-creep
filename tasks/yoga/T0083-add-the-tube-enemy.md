---
id: T0083
title: Add the Tube enemy
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T06:15:12Z
---

## Goal
The first regular rectangle in the spawn roster: a long yellow bar that slides slowly toward you and snaps in two when killed — the yellow "heavy" language now has a length, and the split mechanic (Splitter) becomes a new silhouette instead of a new square.

## Details
- Two new data files, both copying existing entries: `src/content/enemies/tube.ts` (copy the shape of `src/content/enemies/slab.ts`, the big yellow square) and `src/content/enemies/tube-half.ts` (copy `src/content/enemies/splinter.ts`, the non-spawning split fragment).
- Tube: `rect` shape (the same shape the Eraser uses, T0047), 120×16 units, yellow. hp 80, speed 40, contactDamage 10, xp 6, threat 4, spawnWeight 3, unlockAtSec 210, knockbackResist 0.5, behavior `chase`. Marginalia `note`: "SPLITS IN TWO".
- On death the tube splits into two tube-half bars — the same data-driven `splitsInto` field and death burst the Splitter (T0009) uses to break into two Splinters; point the tube's `splitsInto` at the tube-half id.
- Tube half: `rect`, 60×16 units, yellow, hp 30, speed 65, contactDamage 8, xp 2, threat 2, behavior `chase`, and no natural spawn — exactly the same treatment as the Splinter (never director-spawned; it only exists as a split fragment).
- Register both in the enemy roster the same way the Splitter/Splinter pair is registered.
- No scene, system, or behavior changes: `chase`, the `rect` shape and `splitsInto` all exist.

## Acceptance criteria
- [ ] After 210 s of a run a long yellow bar (~120 units long, 16 wide) can spawn and slide toward the player; on its first appearance the marginalia "SPLITS IN TWO" fades in beside it.
- [ ] Killing the tube breaks it into two shorter yellow bars (~60×16) that scatter faster than the parent bar moved.
- [ ] Tube halves never spawn from the arena edge on their own (same rule as the Splinter) — only a dying tube produces them.
- [ ] `npm run check` and `npm run smoke` (desktop + mobile) pass.
