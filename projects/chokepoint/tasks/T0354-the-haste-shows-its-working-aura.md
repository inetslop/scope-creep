---
id: T0354
title: The Haste shows its working aura
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T11:14:54Z
claimed_at: 2026-11-01T11:24:16Z
designer: yoga
---

## Goal
A Haste tower never fires, and its aura works both ways — it speeds the towers up and it speeds the enemies up; like the other never-firing supports it should show the moment it is working, so a tower that looks dead is seen doing both jobs.

## Details
- The working-aura language (T0055) at the Mute-ring's example (T0219): while an enemy's center is inside a Haste tower's 2-cell radius, a thin ring in the Haste tower's own color shows at ground level under the tower, out to the full radius, re-pulsing once a second (the Mute ring's own fade in and out, same placement).
- Display only: no sound, no text, no new card or readout; a Haste tower with no enemy in range shows nothing (its tower side is already visible on the towers firing faster — the same reason Rally shows no ring).
- A new small painter file in src/systems/fx/ mirroring the Mute's ring painter (T0219) in shape and timing, wired from the one place src/systems/HasteSystem.ts already knows an enemy is in range; the aura's numbers are untouched.
- Every Haste tower shows its own ring (two in a cluster show two).

## Acceptance criteria
- [ ] while any enemy is inside a Haste tower's 2-cell radius, a thin ring in the tower's own color pulses once a second at ground level under it, out to the radius; the moment no enemy is in range, it is gone
- [ ] it is display only — no sound, no text, no new HUD element — and the Haste aura's numbers are unchanged (enemies +30%, towers +30%, +15% to both per copy)
- [ ] a run with no Haste towers is byte-identical: no ring, no change
