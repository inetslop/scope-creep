---
id: T0139
title: The Varnish — a rare yellow drop from elites
assignee: narcissus
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T19:37:42Z
claimed_at: 2026-10-27T20:28:16Z
designer: desktop
---

## Goal
Elite kills become a decision instead of a free payday: 10% of the time an elite also drops the Varnish — pick it up and you trade the shard economy for 8 s of contact immunity.

## Details
- Drop: 10% of elite kills (one seeded draw from the run RNG, the gilt-roll idiom, T0112) also drop one Varnish at the corpse: a small flat yellow circle, radius 6, 2 u ink outline, no shadow. It drifts toward the player at 20 u/s and picks up like a shard (the Gravity pickup radius, T0016, applies). Normal enemies and bosses never drop it. If not picked up within 8 s it fades out over its last 1 s.
- Pickup: plays the existing pickup pluck (no new SFX).
- The coat (8 s from pickup; a second pickup refreshes to a fresh 8 s, never stacking):
  - the player's circle wears a flat 2 u yellow outline 2 u just outside the blue fill — inside the first build ring (T0131, 4 u out) and distinct from The Palette's swatch stripes (T0097).
  - all contact damage the player takes (enemy, elite, boss or boss part) is halved, rounded down, applied after armor. Enemy bullets and continuous burns (the Gutter, T0099; the Crop, T0045; Tide, T0127; The Press wall, T0116) are not halved.
  - the platemark (T0094) still prints on a halved hit.
  - shards: while coated, a shard that reaches pickup range is not collected — it is pushed 60 u straight out from the player's center over 0.2 s, grants no XP, and comes to rest there (the push does not repeat; a pushed shard stays put). The moment the coat ends, normal pickup resumes — a shard in range at that moment is collected as usual.
- End: after 8 s the outline fades over 0.3 s and everything returns to normal.
- No new key, HUD element, scene or SFX.

## Acceptance criteria
- [ ] An elite kill has a 10% seeded chance to also drop a small flat yellow circle (radius 6, 2 u ink outline) that drifts toward the player and can be picked up; normal enemies and bosses never drop it; an unpicked Varnish fades out after 8 s.
- [ ] Picking it up plays the existing pickup pluck and puts a flat 2 u yellow outline on the player's circle for exactly 8 s; a second pickup while coated refreshes to a fresh 8 s.
- [ ] While coated, contact damage from any shape is halved (rounded down, after armor); enemy bullets and continuous burns are unaffected; the platemark still prints on a halved hit.
- [ ] While coated, a shard in pickup range pops 60 u away and grants no XP, and once the coat ends the same shard picks up normally if still in range.
- [ ] After 8 s the outline fades over ~0.3 s; no new key, HUD element, scene or SFX; the same seed gives the same Varnish drops.
