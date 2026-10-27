---
id: T0096
title: Unit tests for the shape geometry
assignee: asus
size: S
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T09:18:11Z
claimed_at: 2026-10-27T09:19:03Z
---

## Goal
Lock down the outline geometry every enemy and boss is drawn from, so a change to `src/art/shapes.ts` cannot silently turn a square into a diamond or squash the rect without a test failing. Written by hand as the first task for asus after it was unpaused: small on purpose, to check the machine end to end.

## Details
- New test file `tests/art/shapes.test.ts` for `polygonPoints`, `starPoints` and `shapePoints` in `src/art/shapes.ts` (untested today; its Phaser import is type-only, so it loads in the node test environment).
- Follow the shape of `tests/core/vec.test.ts`: one `describe`, short `it`s with concrete numbers.
- Tests only: no change to `src/`, content or scenes.

## Acceptance criteria
- [ ] `tests/art/shapes.test.ts` exists and covers polygons, stars and every `ShapeKind` in `shapePoints`.
- [ ] All tests pass in the automated gate.

## Design (written by hand)

### Files
- create `tests/art/shapes.test.ts` (closest example: `tests/core/vec.test.ts`)

### Interfaces
None new. Import from `'../../src/art/shapes'`:
```ts
polygonPoints(cx, cy, r, sides, rotation = 0): { x: number; y: number }[]
starPoints(cx, cy, outerR, innerR, points): { x: number; y: number }[]
shapePoints(kind: ShapeKind, cx, cy, r, points = 5): { x: number; y: number }[] | null
```

### Steps
1. `polygonPoints`:
   - `polygonPoints(0, 0, 10, 4)` gives 4 points, the first at (10, 0) (rotation 0 puts the first corner on the right), then (0, 10), (-10, 0), (0, -10).
   - every point of `polygonPoints(3, -2, 7, sides)` for sides 3 to 8 lies at distance 7 from (3, -2).
   - `polygonPoints(5, 5, 2, 3, Math.PI / 2)` starts at (5, 7).
2. `starPoints(0, 0, 10, 4, 5)`: 10 points, the first at (10, 0); even indices at distance 10 from the centre, odd indices at distance 4.
3. `shapePoints(kind, 0, 0, 10)`:
   - `circle` returns `null`.
   - `triangle`, `pentagon`, `hexagon` give 3, 5 and 6 points, each starting at (10, 0).
   - `diamond` gives (10, 0), (0, 10), (-10, 0), (0, -10).
   - `square` gives 4 axis-aligned corners: every point has |x| = |y| = 10 / Math.SQRT2.
   - `rect` gives exactly (-10, -5), (10, -5), (10, 5), (-10, 5): twice as wide as tall.
   - `star` gives 10 points by default (inner radius 5) and 8 with `points = 4`.
4. Run `npm run check`.

### Pitfalls
- The points come from `Math.cos`/`Math.sin`: compare coordinates with `toBeCloseTo`, never `toBe` or `toEqual` (e.g. `Math.cos(Math.PI / 2)` is 6e-17, not 0). `rect` is exact.
- Do not test `drawShape`: it needs a Phaser `Graphics` object.

### Tests
This task is the tests.
