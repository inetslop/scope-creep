---
id: T0337
title: "The rush tag: the wave where every walker comes faster"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T03:39:37Z
claimed_at: 2026-11-01T04:12:37Z
designer: desktop
---

## Goal
The wave rhythm (quiet, tight, boss) gains its third tag: a rush wave where every walker moves 1.5× faster — a speed spike between the quiet breather and the tight press, read in the preview and answered with slows and roots, so the late waves (the Hive's and the Flyer's peaks) alternate against a rhythm instead of a flat climb.

## Details
- **The rule:** from wave 11, every 7th wave that is not already quiet, tight or boss carries the "rush" tag — waves 11, 18, 25 and 39 first (32 is quiet, 46 tight, 60 the boss — each collision keeps its own tag, the tight tag's yield-to-quiet rule). The tag's data lives with the other tags in core/waves.ts (the tag table the waves reference reads, T0264).
- **The effect:** the rush wave's plan is otherwise unchanged — same count, hp, mix and intervals — except its walkers move at 1.5× their normal speed: the wave's speed factor, stacked with the level Swift's ×1.15 when it is on (a Swift run's rush wave walks at 1.675×). The factor is the walk speed: the Dasher's dash keeps its 3-cell distance (the flash is 1.5× faster), the Sprinter's ramp rides the faster base, and a Frost slow or an Anchor root holds a rush walker exactly as usual (the control multiplies the already-faster speed).
- **Compared with the rhythm:** quiet thins the wave and pays double gold (a breather); tight halves the spawn intervals (a density press); rush keeps the whole wave and speeds the walkers — the exposure time per enemy, not the count or the gap, is what changes; it is the wave-level shape of the Sprinter's ramp and the Dasher's surge (per-enemy speed) as a wave.
- **On screen (the tag's own language, no new HUD):** the rush wave's preview shows the tag's chip and one muted teach line under the card — "rush — the walkers move 1.5× faster" (the quiet and tight tags' line, T0092); the wave banner wears the chip — "Wave 11 · rush" (T0080's pattern); the waves reference (T0264) grows its row from the tag table (chip, meaning, next one) with no change to that file.
- No new HUD element, input, sound or mark on the board; the 2× fast-forward, the level augments and the tight tag all compose with it (2× on a rush wave is the player's own call).

## Acceptance criteria
- [ ] Waves 11, 18, 25 and 39 carry the "rush" tag and their walkers spawn at 1.5× speed; a colliding wave (32 quiet, 46 tight, 60 boss) keeps its own tag; every other wave's plan is byte-identical, including the 10, 20, 30, 40 and 50 boss plans.
- [ ] The rush wave's count, hp, mix and intervals equal its untagged plan; the factor stacks with level Swift (1.675×); the Dasher's dash distance stays 3 cells, the Sprinter's cap rides the faster base, and a rooted or slowed rush walker is held as usual (unit tests).
- [ ] The wave 10 build phase's preview shows the "rush" chip and the teach line under the card; the wave banner reads "Wave 11 · rush"; the waves reference lists the new row (chip, meaning, next one) read from the tag table.
- [ ] No new HUD element, input, sound or board mark; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
