---
id: T0070
title: Gentler squash for the Zippy and the Sleeper
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T12:51:01Z
claimed_at: 2026-10-31T13:26:14Z
designer: desktop
---

## Goal
The squash-and-stretch looks wrong on some monsters. The Zippy flattens to 60% in one frame, its triangle sheared sideways when its lane is diagonal, its face squashed with it; the Sleeper's cushion squashes its eyes. Keep the idea, make it look like a soft critter.

## Details
- At most 20%: scales between 0.8 and 1.2 (today the Zippy uses 1.3 x 0.6).
- Along the creature's own axis, not the screen's: the Zippy squashes along its lane (rotate to the lane, scale, rotate back), so its triangle stays a triangle at any angle.
- Eased: into the squash and back out over 0.15 s, never in one frame. The client only sees slots: put the time since the phase began in a slot (hundredths of a second) and ease from it.
- The face keeps its shape: draw the body squashed with drawCritter() and no face, then restore and draw the face with drawFace(), moved down by the height the body lost so it stays inside. The Sleeper's closed eyes move with its face.
- Check every monster's look while it moves fast (the Zippy's dash) and while it changes phase.
- The engine's own small wobble while moving is not part of this.

## Acceptance criteria
- [ ] No monster's look scales below 0.8 or above 1.2 in any direction.
- [ ] The Zippy's wind-up flattens along its lane at any angle, eases in and out, and its face isn't squashed.
- [ ] The Sleeper's sleeping cushion eases in and out, and its eyes aren't squashed.
