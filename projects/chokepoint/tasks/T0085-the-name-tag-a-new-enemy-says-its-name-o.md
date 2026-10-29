---
id: T0085
title: "The name tag: a new enemy says its name once"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
claimed_at: 2026-10-29T00:22:12Z
designer: desktop
---

## Goal
A shape's name is learned the moment it first matters: the first time an enemy type appears in a run, a small white label with its name pops up where it appears.

## Details
- When an enemy type spawns for the first time in a run, a small white rounded label with the enemy's name (the same name its content uses: "Sprinter", "Hauler", …) pops up above the spot where it appeared: ~200 ms scale-in, ~700 ms hold, fade — gone in about 1 s (the clean chip's (T0005) motion family, small).
- The label stays at the spot it appeared at (the enemy walks on, the label fades in place — the gold pop's (T0017) family, not a follower).
- Style: one line of bold ~12 px muted ink on a white rounded chip — the HUD card language at the banner's (T0067) scale, small.
- The second and later appearances of the same type in the run show nothing. The "seen" set resets on a new run and on a resumed run (it is a display state, not part of the save).
- No sound, no input, no rule change, no new HUD element in the card layout.
- Closest example: the enemy-hook pattern of T0059's `burnLeap.ts` (one new hook file, one line of registration, effects outside the hub files per 1f3a65f) for where it triggers — at spawn, once per type per run; T0005's clean chip for the pop motion; T0017's gold pop for the label's painter style.

## Acceptance criteria
- [ ] The first Dot of a run gets a "Dot" label above its spawn spot for ~1 s; the second Dot gets nothing.
- [ ] Every enemy type shows its own correct name on its first appearance in a run (a test covers each of the landed types with a fresh seen set).
- [ ] A resumed run: the seen set is empty, so the first spawned enemy of the resumed wave gets its label again.
- [ ] No sound and no new input; desktop 1280x720 and mobile 412x915 smoke pass.
