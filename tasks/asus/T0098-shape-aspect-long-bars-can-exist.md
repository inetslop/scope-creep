---
id: T0098
title: Shape aspect — long bars can exist
assignee: asus
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T09:43:38Z
---

## Goal
Long-bar enemies become expressible: the shape system gains a width:height aspect so bars like Tube (120×16) and The Rail (160×12) can exist, and long shapes hit-test as a tight capsule instead of an oversized circle. Pure capability — no new enemy ships in this task, and nothing visible changes for the current roster.

## Details
- A long bar is expressed in the shape/look data by its full length and thickness (e.g. 120×16, 160×12), alongside the existing shape/radius fields. Every existing enemy and boss keeps its current shape: the rect stays 2:1 and all other shapes stay as they are — drawn points and hitbox byte-identical to today. The shape-geometry tests written by T0096 (including the exact 2:1 rect pin) must stay green, and the existing `shapePoints`/`polygonPoints` signatures stay as-is (T0096 calls them unchanged) — the bar capability is additive.
- Drawing: a bar draws as a sharp-cornered rectangle at its length × thickness (the rect kind, stretched), with the standard ink outline and hard paper-cut shadow, rotating with the enemy like every other shape. Texture sizing and any per-shape cached textures must handle non-square extents.
- Hitbox: a bar's hit test is a capsule along its long axis — a segment of the bar's full length with radius half its thickness, rotated with the enemy; a point is inside when it is within that radius of the segment, end caps included. Shapes with aspect < 3 (everything existing, including the 2:1 rect) keep today's hitbox exactly.
- A pure hitbox helper (pattern: the pure modules in `src/core/`): `barContains(cx, cy, angleRad, halfLength, halfThickness, px, py): boolean` — unit-tested in a new test file (pattern: `tests/core/vec.test.ts`):
  - A 120×16 bar (halfLength 60, halfThickness 8) centered at the origin, axis along X: contains (60, 0) [on the axis], (65, 0) [inside the end cap — the capsule extends to 68], (30, 5) [within the thickness]; does not contain (70, 0) [beyond the cap], (0, 12) [beyond the thickness].
  - The same bar rotated 90°: contains (0, 60); does not contain (12, 0).
- No debug hooks, no menu, no spawn-director change in this task — the next task (Tube or The Rail) consumes the capability.

## Acceptance criteria
- [ ] The shape/look data expresses a long bar by length × thickness, and both 120×16 and 160×12 are expressible in content data.
- [ ] The new pure bar-hitbox test passes: (60, 0), (65, 0) and (30, 5) inside; (70, 0) and (0, 12) outside; rotated 90°: (0, 60) inside, (12, 0) outside.
- [ ] Every existing enemy and boss looks and hit-tests exactly as before; the shape-geometry tests (T0096), including the 2:1 rect pin, stay green.
- [ ] No new enemy, weapon or HUD element ships in this task.
- [ ] `npm run check` and `npm run smoke` pass.
