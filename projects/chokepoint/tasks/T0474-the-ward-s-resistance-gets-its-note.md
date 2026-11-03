---
id: T0474
title: "The Ward's resistance gets its note"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T05:21:43Z
---

## Goal
When a control fails on a Ward, the player sees it (T0335's resist ring at the Ward's base) but never hears it: the tower's side gets no sign that its push gust, root or slow did not take. One quiet blip per resist, so a failed control is heard where it happens.

## Details
- Trigger: the exact moment T0335's resist ring paints on a Ward — a Push gust, an Anchor root, or a slow that does not take. One blip per ring, never per frame; a Ward resisting two controls at one moment gets one per ring.
- Sound: one 60 ms sine blip, pitch falling C5→A4, volume 0.08 — the run's quietest class (T0419's Mute note), under the hit blip. Silent with the sound toggle off (T0035).
- Files: a new trigger file beside `systems/enemyHooks/bossDeath.ts` riding the same path that paints the resist ring (T0335's hook), and the note as a new method in `src/audio/Sfx.ts` beside T0460's sip. Closest example to follow: T0460 (the Leech's drink gets its note).
- No new HUD, board mark or text; the ring's look and timing are untouched, and the Ward's behavior is untouched.

## Acceptance criteria
- [ ] A Push gust or Anchor root that fails on a Ward plays one soft blip at the resist ring's moment; with the sound toggle off nothing plays.
- [ ] Exactly one blip per resist ring — no repeats, no per-frame plays.
- [ ] The ring's look, the Ward's behavior and everything else on screen are unchanged; no new HUD element or text.
