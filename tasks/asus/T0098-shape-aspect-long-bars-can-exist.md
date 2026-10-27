---
id: T0098
title: Shape aspect — long bars can exist
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 2
created: 2026-10-27T09:43:38Z
claimed_at: 2026-10-27T14:30:33Z
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

## Design (architect, desktop)

### Files
- create `src/core/barHit.ts` — pure capsule hit-test `barContains` (no Phaser import; `core/` rule)
- create `tests/core/barHit.test.ts` — unit tests for the acceptance points
- edit `src/content/types.ts` — add optional `bar` to `EnemyLook`
- edit `src/art/shapes.ts` — add `barPoints` + `drawBar`; do NOT touch `shapePoints`/`polygonPoints`/`drawShape` (T0096 pins the 2:1 rect)
- edit `src/art/textures.ts` — `drawEnemy` draws a bar (same square texture sizing) and an eye dot sized from thickness
- edit `src/entities/Enemy.ts` — add `hitTestPoint()`; do NOT change `spawn()` (the existing `setCircle(r, w/2 - r, h/2 - r)` line becomes the coarse body for free, since a bar's `radius` = halfLength + halfThickness)
- edit `src/systems/CombatSystem.ts` — precise capsule gate in `onProjectileHit` and `onPlayerTouched` (bars only)
- edit `src/systems/OrbitSystem.ts` — precise gate after the coarse distance check (bars only)
- edit `tests/content.test.ts` — bar validation, radius range for bars, expressibility test

### Interfaces
```ts
// src/content/types.ts — add to EnemyLook:
/** Long bar, e.g. 120x16 or 160x12. Drawn as a sharp-cornered rectangle; hit-tested as a capsule along the long axis.
 *  When set: shape must be 'rect', radius must be length/2 + thickness/2, and length / thickness >= 3. */
bar?: { length: number; thickness: number };

// src/core/barHit.ts — exact signature from the task:
export function barContains(cx: number, cy: number, angleRad: number, halfLength: number, halfThickness: number, px: number, py: number): boolean;

// src/art/shapes.ts:
export function barPoints(cx: number, cy: number, length: number, thickness: number): Point[]; // 4 corners, long axis along +X
export function drawBar(g: Graphics, cx: number, cy: number, length: number, thickness: number, color: number, style: ShapeStyle = {}): void;

// src/entities/Enemy.ts:
hitTestPoint(px: number, py: number, inflate = 0): boolean;
```
### Steps
1. `barContains`: translate `(px-cx, py-cy)`, rotate by `-angleRad` into the bar frame (long axis +X): `lx = dx*cos - dy*sin`, `ly = dx*sin + dy*cos` with `cos/sin` of `-angleRad`; clamp `lx` to `[-halfLength, halfLength]`; return `(lx - clamp)² + ly² <= halfThickness²` (inclusive, `<=`).
2. `shapes.ts`: `barPoints` = `[{cx-len/2, cy-th/2}, {cx+len/2, cy-th/2}, {cx+len/2, cy+th/2}, {cx-len/2, cy+th/2}]`. `drawBar` mirrors `drawShape`: shadow `fillPoints(barPoints(cx + SHADOW_OFFSET, cy + SHADOW_OFFSET, ...), true)` at ink 0.18 when `style.shadow !== false`; flat `fillPoints`; then if `width = style.outlineWidth ?? Math.max(2, Math.round(thickness * 0.14))` > 0, `lineStyle(width, style.outline ?? PALETTE.ink, 1)` and `strokePoints(barPoints(cx, cy, Math.max(0, length - width), Math.max(0, thickness - width)), true, true)` (outline inset exactly like `drawShape`'s `r - width/2`).
3. `types.ts`: add the `bar` field with that doc comment.
4. `textures.ts drawEnemy`: keep `size = Math.ceil((look.radius + PAD) * 2)` and `c` unchanged (bar texture is square — required so the coarse circle body centers; see Pitfalls). If `look.bar`: `drawBar(g, c, c, look.bar.length, look.bar.thickness, look.body, { outlineWidth: look.outlineWidth })` else the existing `drawShape` line. Eye dot: `const eyeR = look.bar ? Math.max(2.5, look.bar.thickness * 0.22) : Math.max(2.5, look.radius * 0.22);` rest of the call unchanged.
5. `Enemy.ts` (import `barContains` from `'../core/barHit'`; `distance` is already imported):
```ts
hitTestPoint(px: number, py: number, inflate = 0): boolean {
  const look = this.def.look;
  const s = this.scaleX;
  if (!look.bar) return distance({ x: px, y: py }, this) <= (look.radius + inflate) * s;
  return barContains(this.x, this.y, this.rotation, (look.bar.length / 2) * s, (look.bar.thickness / 2) * s + inflate, px, py);
}
```
6. `CombatSystem`: after the `!p.active || !e.active || p.hitSerials` guard in `onProjectileHit` add `if (e.def.look.bar && !e.hitTestPoint(p.x, p.y, (p.body as Phaser.Physics.Arcade.Body).width / 2)) return;` and in `onPlayerTouched` `if (e.def.look.bar && !e.hitTestPoint(this.player.x, this.player.y, PLAYER_RADIUS)) return;` (extend the existing `'../config'` import with `PLAYER_RADIUS`).
7. `OrbitSystem.update`: right after `if (dx * dx + dy * dy > r * r) continue;` add `if (e.def.look.bar && !e.hitTestPoint(cx, cy, circleRadius)) continue;` (the coarse check already uses the enclosing `look.radius`, so it is a superset).
8. `tests/content.test.ts`, in the `enemies` block only: (a) radius check → `const maxR = e.look.bar ? 96 : 80; expect(e.look.radius >= 4 && e.look.radius <= maxR, ...)`. (b) `it.each(ENEMIES.filter((e) => e.look.bar)...)` asserting `shape === 'rect'`, `radius` toBeCloseTo `length/2 + thickness/2`, `length/thickness >= 3`, numbers positive. (c) an expressibility test running the same assertions on literal looks `{ shape: 'rect', radius: 68, body: 0, accent: 0, bar: { length: 120, thickness: 16 } }` and `{ shape: 'rect', radius: 86, body: 0, accent: 0, bar: { length: 160, thickness: 12 } }` (also assert `radius` within `[4, 96]`).
9. `tests/core/barHit.test.ts` (pattern: `vec.test.ts`): 120×16 bar (halfLength 60, halfThickness 8) at origin, angle 0: `(60,0)`, `(65,0)`, `(30,5)` → true; `(70,0)`, `(0,12)` → false. Angle `Math.PI/2`: `(0,60)` → true, `(12,0)` → false. Plus: boundary inclusive `barContains(0,0,0,60,8,68,0)` and `(0,0,0,60,8,0,8)` true; a point 50 units along the axis at angles `Math.PI/4`, `Math.PI`, `-Math.PI/3` true.
10. `npm run check`, then `npm run smoke`.
### Pitfalls
- Do not reorder `Enemy.spawn`'s `setCircle`/`setScale` or change the setCircle line — a pre-existing scale-state quirk in body centering is load-bearing for the current roster; bars inherit it unchanged.
- The bar texture MUST stay square with the existing `(radius + PAD) * 2` formula. A tight non-square texture breaks `setCircle(r, this.width/2 - r, ...)` and the coarse broad-phase circle; square size with `radius = halfLength + halfThickness` centers the enclosing circle exactly.
- Gates fire only when `look.bar` is set — every existing enemy/boss is still resolved purely by its Arcade body, so their hit tests stay byte-identical and T0096's 2:1 rect pin stays green.
- Enemy↔enemy separation keeps the coarse circle bodies (over-conservative for bars). That is accepted; do not add capsule colliders or director changes in this task.
- `tests/content.test.ts` is also touched by open T0097 (bosses block) and T0055 — keep your edits inside the `enemies` describe block, no reformatting elsewhere.
- No pooling changes: `hitTestPoint` is stateless; no new listeners, scenes, debug hooks, or input — nothing to clean up on shutdown.
### Tests
- `tests/core/barHit.test.ts` (new): acceptance capsule points, boundary inclusivity, rotated-axis cases.
- `tests/content.test.ts` (edit): bar look validation + 120×16 / 160×12 expressibility.

## Attempt 1 interrupted (asus)

The runner stopped mid-task (crash, restart or reboot). Requeued.
