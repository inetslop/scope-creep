---
id: T0464
title: "The tower's milestone gets its note"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T02:24:38Z
---

## Goal
The tower's milestone ring (T0270: a ring at a tower's base when its kills first cross 10, 25 and 50) is seen but not heard: one quiet two-note rise at the ring's pop, so a tower's own record is noticed where it stands.

## Details
- One note per crossing: when a tower's kills first cross 10, 25 or 50 — the same edge the ring pops on (the ring's path plays no sound today; if the architect finds one on that exact edge, the note joins it rather than doubling) — play one quiet two-note rise. A tower earns the note at most three times a run (its 10th, 25th and 50th kills); two towers crossing at the same moment each play their own note.
- The note is a short quiet rising two-sine in Sfx's softest class (the Leech sip's class, T0460, never above a kill blip): two 60 ms sine notes rising, ~30 ms apart, E4→G4 (330→392 Hz), 0.06 pre-master. A new method `towerMilestone()` in src/audio/Sfx.ts beside `leechDrink()`.
- The closest example is the Leech's drink note (src/systems/enemyHooks/leechDrinkNote.ts, T0460): a new file on the per-frame reconcile pattern — edge-triggered, silent otherwise — named `towerMilestoneNote.ts` in the towers' hook home; if the towers' note needs its own registry where the enemy hooks live, it is a new file wired the way src/systems/enemyHooks/index.ts wires the enemy hooks.
- It respects the pause's Sound toggle (Sfx.tone's existing mute check).
- No HUD, no chip, no text: sound only, like T0460 and T0419. Everything else byte-identical.

## Acceptance criteria
- [ ] A tower's 10th, 25th and 50th kills each play exactly one quiet two-note rise at the ring's pop; the 51st kill plays nothing and the ring is unchanged.
- [ ] A second tower crossing a milestone plays its own note.
- [ ] With the pause's Sound toggle off the milestone is silent.
- [ ] No sound, HUD element or visual is added anywhere else.
