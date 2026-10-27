---
id: T0117
title: Shard glint — gilt is legible in the hand
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T15:11:35Z
---

## Goal
The moment a gilt shard (T0112) is picked up, the player hears and sees it was gilt — the 3× payoff lands in the hand, not just on the page.

## Details
- Sound: the existing shard-pickup pluck (the pickup SFX in `src/audio/Sfx.ts`, the one with the combo pitch-rise) plays one semitone (~×1.06 pitch) higher for a gilt shard than for a normal shard at the same pickup-combo position. Normal shards sound exactly as they do today. No new tone.
- Color: the moment a gilt shard is collected, a small yellow (PALETTE.yellow) "+N" pop prints at the pickup point, where N is the XP actually granted by that pickup (gilt 3×, existing multipliers on top). It rises and fades over ~0.6 s in the style of the kill feed (T0106) — same rise/fade timing, and the ink-text pool idiom in `src/systems/ScoreFeed.ts` is the closest example to copy; the pop is pooled and capped like that one.
- The gilt flag is already known at pickup: `Shard` carries the `gilt` field and both collect paths in `src/systems/PickupSystem.ts` already apply the gilt XP (T0112) — hook the sound and the pop there.
- Normal shards: unchanged sound, no pop. Gilt XP values are unchanged (3× normal, existing pickup multipliers on top).
- No HUD element, no input, no scene, no enemy, no number changes.

## Acceptance criteria
- [ ] Picking up a gilt shard plays the pickup pluck one semitone higher than a normal shard at the same combo position, and a small yellow "+N" pop (N = XP actually granted) rises and fades over ~0.6 s at the pickup point.
- [ ] Picking up a normal shard sounds exactly as before and prints no pop.
- [ ] Gilt shards are still worth exactly 3× a normal shard's XP with the existing multipliers on top; the existing gilt tests stay green.
- [ ] No new HUD element, key, scene or enemy is added; `npm run check` and `npm run smoke` pass.
