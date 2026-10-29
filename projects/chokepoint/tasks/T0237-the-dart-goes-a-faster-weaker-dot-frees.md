---
id: T0237
title: "The Dart goes: a faster, weaker Dot frees the enemy cap"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T23:34:09Z
---

## Goal
Remove the Dart — the one regular enemy that is its behavior with other numbers — so the 10-enemy regular cap opens a slot and the Feeder (next in the enemy queue) can be tasked.

## Details
- The Dart is a `walk` enemy (hp 16, speed 2.8, gold 3, livesCost 1, threat 1, from wave 2, an orange triangle, size 0.21): a faster, weaker Dot. Nothing about how it moves, survives or interacts is new — the bar in modules/enemies.md says new numbers on an existing behavior are not a new enemy, and it is the one regular that fails it. The fast niche stays covered with a behavior each: the Sprinter (from wave 8, ramps when hit) and the Dasher (from wave 5, burst dash).
- Removal: the Dart's content file (`game/src/content/enemies/dart.ts`), its entry in the enemy pool list, its look/texture generation, and every reference — wave mix, tests, and any name-tag or demo data that names it.
- Wave mix (`game/src/core/waves.ts`): the Dart leaves the fill pool. Wave threat budgets stay exactly as today, and the reserved slots are untouched (the Splitter's one-per-seven from wave 9, the Hauler, the Mute from 11, the Bulwark from 12, the Ward from 15). Wave 1 is byte-identical (the Dart is from wave 2 and wave 1 was Dot-only). Waves 2-3 fill their budget with Dots; from wave 4 on the mix re-normalizes over the remaining pool (Dot, Block, Sprinter, Splitter, Hauler). Quiet (every 4th) and tight (every 8th) waves keep their halving and their re-add rules.
- The Sprinter's numbers were derived from the Dart's 2.8 (speed 2.52 = 90%, ramp +0.28 = 10% of it per hit, cap 5.32 = 190%): the stored numbers stay byte-identical — if the code, a test or a comment derives them from the Dart's data, inline the constants instead.
- Saved runs: a resume save and a ghost run keep their exact board and play as before; if a saved wave plan can still name a Dart, loading drops that entry (or regenerates the plan from its wave number) — never a crash or a missing-token.
- Everything else is data-driven and needs no change: the wave preview, the name tag, the menu demo, the codex (augments only). The count becomes 9 regular types plus the Splinter (spawnOnly).
- What this trades: the early waves (2-3) lose their speed spike — Dots instead, slower and a little deeper in total hp — and the first pressure change now lands with the Block at wave 4. If a later balance pass finds waves 2-3 too easy or too hard, that is a tuning task (a Dot number or the wave budget), not a re-add of the Dart.

## Compared with what exists
Why the Dart goes and no other walk enemy does (the full same-behavior set):

| Existing | What it shares | What it has that the Dart can't |
| --- | --- | --- |
| Dot | `walk`, the basic walker — the Dart is a numbers-change of it | the baseline of wave 1 and the game's first word; one of the two must carry the niche and the Dot is the one |
| Block | `walk` | slow and heavy, costs two lives on a leak |
| Sprinter | `walk`, the fast niche | a speed ramp on every hit; also owns the Dart's 2.8-derived numbers, so the niche survives the removal |
| Dasher | the fast niche | a dash behavior — a way of moving no walker has |
| Splitter | `walk` | splits into two splinters on death |
| Hauler | `walk` | hauls a fortune: 10 gold, a leak costs a life plus 5 gold |
| Mute | `walk` | silences every tower within two cells while it lives |
| Bulwark | `walk` | a front plate that halves shots into its face |
| Ward | `walk` | ignores slow, root and push entirely |
| Splinter | `walk`, small and fast | a spawnOnly piece of a killed Splitter — never in a wave's mix, so it holds no cap slot |

## Acceptance criteria
- [ ] A fresh run never shows a Dart: waves 2 and 3 are Dots only (same threat budget as today), the wave preview never shows the orange triangle, and no name tag ever reads "Dart".
- [ ] Wave 1 is byte-identical to today (same plan, same spawn times); the reserved slots (Splitter per-seven from 9, Hauler, Mute from 11, Bulwark from 12, Ward from 15) are unchanged, and quiet/tight waves halve as before.
- [ ] The Sprinter plays byte-identically (2.52, +0.28 per hit, cap 5.32) with no reference to Dart data left in code, tests or comments.
- [ ] Content and wave-mix tests pass with 9 regular types; every test that named the Dart is updated or removed, and no test left does.
- [ ] A saved run made with the old content (a wave plan that names a Dart) loads without error and plays the wave with the remaining types; ghost and resume runs keep their exact board.
- [ ] Nothing new on screen at 412x915 and 1280x720 — a removal only.
