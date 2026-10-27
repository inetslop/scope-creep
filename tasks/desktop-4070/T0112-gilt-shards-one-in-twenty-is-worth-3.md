---
id: T0112
title: Gilt shards — one in twenty is worth 3×
assignee: desktop-4070
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T13:24:32Z
---

## Goal
The shard economy gets a small gamble: 5% of the shards you collect are gilt and worth 3× XP, so a run starts to feel like a treasure hunt — without a new pickup type, HUD element or sound.

## Details
- Roll: every shard instance rolls exactly once at spawn, with the existing seeded Rng: 5% of all dropped shards become gilt. No per-source special cases — normal, elite and boss drops all use the same roll. Keep the roll as a pure, unit-testable helper in `src/core/` — the closest example is the pure rule module `src/core/underexposure.ts` — and store the result as a `gilt` flag on the shard (entity: `src/entities/Shard.ts`).
- Look: a gilt shard is identical to a normal shard in shape, size, motion and pickup radius (Gravity), with a 2 u yellow (PALETTE.yellow) outline and a small yellow center dot at 40% of the shard body's radius — flat Bauhaus, no glow or gradient. Normal shards render exactly as today.
- Value: a gilt shard is worth exactly 3× the XP a normal shard of the same drop would be worth. The existing pickup multiplier (the Composition upgrade's `xpMul`) applies on top, in the same order as today. XP math lives in the pickup path (`src/systems/Pickup.ts` is the closest existing file).
- No new SFX (the pickup sound is unchanged), no new HUD element, no new input, no new scene. The HUD score and the kill feed (T0106) are untouched — shards and score stay separate.

## Acceptance criteria
- [ ] The gilt roll is deterministic under a fixed seed, and over 1000 seeded rolls the gilt fraction lands between 0.03 and 0.07 — locked by unit tests (new test file, model on `tests/core/underexposure.test.ts`)
- [ ] A gilt shard looks like a normal shard with a 2 u yellow outline and a small yellow center dot; normal shards are unchanged
- [ ] Picking up a gilt shard grants exactly 3× the XP a normal shard of the same drop grants, with the Composition multiplier applied on top exactly as today
- [ ] Pickup radius, pickup sound and shard motion are identical for both kinds
- [ ] Elite and boss kills drop shards exactly as today, with the same 5% roll per shard
- [ ] `npm run check` and `npm run smoke` pass
