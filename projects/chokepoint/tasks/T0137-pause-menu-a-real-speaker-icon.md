---
id: T0137
title: "Pause menu: the Sound toggle gets a real speaker icon"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T09:46:49Z
claimed_at: 2026-10-29T10:07:21Z
designer: cachyos-x8664
---

## Goal
The Sound row in the pause menu shows a dark blob (a rounded block with a triangle pointing outward, reading like a play button) instead of a speaker. Players should see at a glance that it is the sound toggle, and whether sound is on or off.

## Details
- Where: `scenes/PauseScene.ts`, `paintGlyph` (the `glyph` Graphics in the sound row). Keep the row, the "Sound" word and the On/Off text as they are.
- The speaker, about 24x20 px, drawn with flat fills in the row's color (ink when on, muted when off), no outlines:
  - the box: a small rounded rectangle, 6 px wide, 8 px tall, on the left, vertically centered;
  - the cone: a trapezoid joined to the box's right side, narrow at the box (8 px tall) and flaring to 18 px tall, 7 px wide, so it opens away from the box (the current triangle points the wrong way);
  - **On:** two sound-wave arcs to the right of the cone (radii about 5 and 9 px, about 90 degrees each, centered on the cone's middle), drawn as thin filled rings with `fillRing()` (`ui/ring.ts`), never a thick Graphics stroke;
  - **Off:** no arcs; a small "x" of two 2 px rounded bars (8 px long) to the right of the cone instead.
- The whole glyph stays inside the button and lifts with it (it is already in `soundRow.content`). It must not collide with the "Sound" word: keep at least 8 px of space between them.

## Acceptance criteria
- [ ] With sound on, the pause menu shows an ink speaker (box, cone opening right, two arcs) left of "Sound".
- [ ] Toggling sound off shows a muted speaker with an "x" and no arcs; toggling back restores the arcs.
- [ ] The icon is crisp at 412x915 and 1280x720 and doesn't touch the "Sound" word.
