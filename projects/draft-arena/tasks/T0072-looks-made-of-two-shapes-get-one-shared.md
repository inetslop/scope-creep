---
id: T0072
title: "Looks made of two shapes get one shared outline: the Goo and the Flee"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T12:51:01Z
---

## Goal
A creature or shot built from two shapes should read as one sticker with one outline. Today the Goo (the Goober tree's drop: a ball with a triangle tail) and the Flee (a circle with a triangle nose) draw each shape with its own ink outline, so a line runs across the inside where they overlap.

## Details
- In src/content/projectiles/goo.ts and src/content/monsters/flee.ts, draw the extra part (the tail, the nose) this way:
  1. trace the extra part and stroke it in ink at twice the body's outline width, `Math.max(1.5, Math.min(3, r * 0.2)) * 2`;
  2. draw the body with drawCritter() as now;
  3. trace the extra part again and fill it in the body's color (white while `e.flash`), with no stroke.
  The fill covers the inner half of the part's outline and the stretch of the body's outline inside the part: one outline around both.
- The face stays on top: if the Flee's nose fill could cover an eye at some angle, draw the face again after the fill with drawFace().
- Colors and sizes don't change.

## Acceptance criteria
- [ ] The Goo and the Flee each show one continuous outline around body and tail or nose, with no line across the inside, at every angle.
- [ ] Their outline is as thick as every other critter's.
