---
id: T0147
title: First Proof — the first kill of each type pays
assignee: narcissus
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T21:50:56Z
claimed_at: 2026-10-27T22:22:14Z
designer: desktop
---

## Goal
The marginalia teaches you a new shape; the First Proof pays you for meeting it. The first kill of each enemy type in a run drops one extra shard, so the run's bestiary is worth completing.

## Details
- A new drop rule, owned by a **pure rule module in `src/core/`** (the rest/underexposure pattern) with unit tests: a per-run set of proven types, `firstKill(id)` true exactly once per id.
- The rule: the first time in a run you kill a given **director-spawnable enemy type** — Wedge, Dart, Block, Sentry, Splitter, Hare, Platen, Wash (the types the spawn director unlocks on its own) — that kill drops **one extra normal shard** at the kill position, on top of the enemy's normal drops. Spawn-only kin (Splinter, The Frame's wedge minion) and boss parts (type blocks, swatches) are excluded.
- Elite or normal: whichever variant dies first for a type claims the proof.
- The extra shard is a normal shard: same size, motion and pickup as the enemy's normal drops, worth the same as one of them — **no gilt roll** (a clean bonus), no new art. It drops through the normal shard drop path, so it obeys everything a normal shard obeys: Gravity's pickup radius, the Varnish push (T0139), and the Gallery study rules (in No Level-Ups, T0129, it grants no XP like every other shard there).
- A small flat ink ring pops at the extra shard's drop point (the first-light ring idiom, T0138: ~8→24 u, 300 ms fade) — the proof is seen where it lands. No new sound.
- Once per type per run; a fresh run starts clean; per run, not persisted.
- No new key, scene, HUD element, marginalia, or change to stat, spawn, hazard, weapon, clock or music.
- Unit tests lock: the first kill of a type is true, the second is false, different types are independent (a kill of one type does not consume another type's proof), and a fresh run has no proofs.

## Acceptance criteria
- [ ] The first time you kill each of the eight director-spawnable enemy types in a run, that kill drops one extra normal shard at the kill position on top of the normal drops, with a small ink ring pop at the drop point.
- [ ] The second and later kills of the same type drop only the normal shards (no ring, no extra).
- [ ] An elite kill claims the type's proof the same way a normal kill does.
- [ ] Killing spawn-only kin (Splinter, Frame Wedge) or boss parts drops no extra shard.
- [ ] The extra shard behaves like a normal shard in every respect except the gilt roll (no gilt), and obeys the Gallery study rules (in No Level-Ups it grants no XP).
- [ ] A pure rule module with unit tests (first-kill true, repeat false, types independent, fresh run clean); the full gate (typecheck, lint, unit tests, desktop + mobile smoke) passes.
