---
id: T0084
title: "A sting: a small sting when the mark lands on you"
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-31T14:05:22Z
epic: E19
---

## Goal
The mark is silent today: a player should hear the moment they become the target — a small sting plays once when the mark lands on the local player, by the event or by a kill.

## Details
- One new sound in the audio layer, src/audio/sfx.ts — the closest examples in that same file are the toot (crown fall) and the coin tick: two quick descending "bip-bip" sine blips, 660 Hz then 520 Hz, 0.08 s each, peak about 0.08 — clearly lower and duller than the level-up chime (E6→G6) and separate from the toot (500→300 Hz).
- It plays only when the local player becomes marked: the `marked` status lands on view.me, whether by the event's random mark or by a kill, and again if a kill refreshes it while marked. Once per landing, deduped and throttled the way the other per-effect sounds in sfx.ts are. It never plays for another player's mark.
- No DOM, no card: sound only, the way the coin tick and the chime are.

## Acceptance criteria
- [ ] When the local player becomes marked, the bip-bip sting plays once at the moment the red ring appears; a refresh while already marked plays it again, at most once per landing.
- [ ] The sound does not play when another player is marked.
- [ ] It sits under the action like the other candy sounds (short and quiet, 0.2 s total or less).
- [ ] No new DOM element or card; the HUD is otherwise unchanged.
