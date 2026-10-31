---
id: T0072
title: "Looks made of two shapes get one shared outline: the Goo and the Flee"
size: S
priority: 2
status: todo
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

## Design (architect, yoga)

### Files
- edit `src/content/projectiles/goo.ts` — replace the `look.draw` body (keep everything else, incl. the `goo` def)
- edit `src/content/monsters/flee.ts` — replace the `look.draw` body and add `drawFace` to the api import line

No registries, no other files.

### Interfaces
No new types. Uses only existing exports from `engine/api.ts`: `drawCritter(g, look, e, { ink, face? })` (body outline width is `Math.max(1.5, Math.min(3, r * 0.2))`, `DrawView` line 837) and `drawFace(g, face, r, angle, ink)` (line 851).

### Steps
1. In `goo.ts`, replace lines 5–15 (the `look.draw` assignment) with exactly:
```ts
look.draw = (g, e) => {
  const r = e.radius, back = e.angle + Math.PI; // tail behind the drop -> reads as chasing
  const tail = () => {
    g.beginPath();
    g.moveTo(Math.cos(back + 0.5) * r * 0.9, Math.sin(back + 0.5) * r * 0.9);
    g.lineTo(Math.cos(back) * r * 1.7, Math.sin(back) * r * 1.7);
    g.lineTo(Math.cos(back - 0.5) * r * 0.9, Math.sin(back - 0.5) * r * 0.9);
    g.closePath();
  };
  tail();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2)) * 2; // the part's outline, doubled
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  drawCritter(g, look, e, { ink: PALETTE.ink });
  tail();
  g.fillStyle = e.flash ? '#ffffff' : look.color; // no stroke: covers the inner half
  g.fill();
};
```
2. In `flee.ts`, add `drawFace` to the existing import from `engine/api.ts`, then replace lines 17–40 (`look.draw`) with exactly:
```ts
look.draw = (g, e) => {
  const scared = e.slots[0] === 1;
  const face = scared ? PANIC_F : CALM;
  const r = e.radius;
  g.save();
  if (scared) {
    const j = r * 0.15;
    g.translate(Math.sin(e.time * 24 + e.seed * 3.1) * j, Math.cos(e.time * 31 + e.seed) * j);
  }
  g.save();
  g.rotate(e.angle);
  const nose = () => {
    g.beginPath();
    g.moveTo(0.6 * r, -0.55 * r);
    g.lineTo(1.7 * r, 0);
    g.lineTo(0.6 * r, 0.55 * r);
    g.closePath();
  };
  nose();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2)) * 2;
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  g.restore();
  drawCritter(g, look, e, { ink: PALETTE.ink, face });
  g.save();
  g.rotate(e.angle);
  nose();
  g.fillStyle = e.flash ? '#ffffff' : look.color;
  g.fill();
  g.restore();
  drawFace(g, face, r, e.angle, PALETTE.ink); // the nose fill can cover the near eye; face on top
  g.restore();
};
```
(Keep the surrounding `flee` def untouched. The outer `g.save()` at the top is the one paired with the final `g.restore()`.)

### Pitfalls
- The tail/nose fill must be a plain `g.fill()` with NO `g.stroke()` — a leftover stroke brings the inner line back.
- Don't keep Goo's old hard-coded `lineWidth = 2`; the doubled formula is what makes the outline as thick as the body's.
- Flee: the face is already drawn inside `drawCritter` before the fill, so it must be drawn again after the fill (always, not conditionally) or the eye is half-covered when the nose points at it.
- Nose geometry, jitter math, `slots[0]` read, colors and sizes stay byte-identical except the white-while-`flash` fill.
- Both `draw`s run on every client every frame: drawing only, no server state.

### Tests
- none (content is tested automatically by engine/tests/: pure draw functions, every look in a real match).
