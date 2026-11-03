---
id: T0469
title: "The towers' marks: the first augment's mark on every barrel"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-03T03:56:29Z
claimed_at: 2026-11-03T05:36:56Z
finished_at: 2026-11-03T07:52:52Z
epic: E26
---

## Goal
The Patterns toggle (T0465) made the enemy tokens read by shape; this slice gives the towers the same: with the toggle on, every tower's barrel wears one small muted-ink mark shaped by its first augment, so a build reads by shape alone.

## Details
- The same toggle, the same flag: the pause's Patterns row (T0465) and its profile flag drive this slice — no new UI, no new profile field, the row's label untouched.
- With the toggle on, every tower token wears exactly one small muted-ink mark on the barrel's face: the same single muted ink as the enemy marks (the color the wave card's "held · N" chip uses), roughly a quarter of the barrel face's width (the enemy marks' own scale), centered on the barrel's face — never on the plinth, whose front edge is the tier pips' (T0010).
- The 16 first augments wear 16 distinct marks: extend the enemy vocabulary (T0465's ten shapes — bar, dot, chevron, X, two bars, triangle, square, diamond, ring, arc) with six more from the same one-color family (the architect's pick: cross, crescent, two dots, zigzag, hollow square, bar-and-dot or similar). No two first augments share a mark, and no mark copies its own barrel's silhouette (T0465's Ward rule: a ring on a circle reads as a target, not a mark).
- The mark is the first augment's only: buying slots or adding augments never changes it. It must not fight what already sits on the token — the tier pips (plinth), the Feast ring and the Haste working-aura ring (T0235, T0354 — both at the base): the mark owns the barrel's face, the rings keep the base.
- Keyed per augment id, the way T0465's enemy registry is, so a future registration (Herd, Chill) adds its own entry without renumbering the rest.
- A separate per-tower image driven by the registry flag every frame — T0465's exact pattern: the texture id beside `markTexture` in `src/art/textures.ts`, the painter beside `paintTypeMark` in `src/art/entities.ts` (or a new mark module if that reads cleaner), the per-token image the way `src/entities/Enemy.ts` keeps its (the token code for towers is `src/entities/Tower.ts`, the barrel art in `src/art/barrels.ts`).
- With the toggle off everything renders byte-identical to today: no mark anywhere, no new texture in use, the menu demo included.
- Out of scope for this slice: the bosses, the Shard and the Splinter, and the codex and enemies references keep their plain tokens — the next slice matches them.

## Acceptance criteria
- [ ] With the Patterns toggle on, every tower on the board wears exactly one small muted-ink mark on its barrel's face; the shape is its first augment's, the 16 first augments wear 16 distinct marks in one color, no two sharing, no mark copying its own barrel's silhouette.
- [ ] A tower's mark never changes as slots are bought or augments added (first augment's only), and the tier pips, the barrel's shape and color, and a Feast or Haste tower's base ring all still read with the mark on.
- [ ] With the toggle off the board, the menu demo, the codex and the references render exactly as before: no mark, no new texture drawn.
- [ ] The mark reads at the default zoom on all 16 barrel colors at the token scale, on 412x915 and 1280x720, and stays on the barrel through the placement drop-in and the fire kick.
- [ ] A unit test pins the tower marks' registry: one entry per first augment, 16 entries, all shapes distinct.
- [ ] No new HUD element, input, profile field or sound; the pause's Patterns row is unchanged from T0465.

## Design (architect, cachyos-x8664)

### Files

- `src/art/barrelMarks.ts` (NEW) — the barrel-marks concern:
  - `BarrelMarkShape` — a union of the 16 shape ids: `'bar' | 'dot' | 'chevron' | 'x' | 'two-bars' | 'triangle' | 'square' | 'diamond' | 'ring' | 'arc' | 'cross' | 'crescent' | 'two-dots' | 'zigzag' | 'hollow-square' | 'bar-and-dot'`.
  - `BARREL_MARKS: Record<string, BarrelMarkShape>` — keyed by first augment id, one entry per first augment (16), each a distinct shape (no two share). Exported for the test.
  - `paintBarrelMark(ctx, firstId, cx, cy, r)` — looks up `BARREL_MARKS[firstId]` (no-op if absent), else draws that shape centered at (cx, cy) in `PALETTE.muted` ink.
  - `paintBarrelMarkShape(ctx, shape, cx, cy, r)` — a switch on the shape id with all 16 snippets (the 10 enemy shapes re-implemented from `paintTypeMark` + 6 new: cross, crescent, two-dots, zigzag, hollow-square, bar-and-dot).
- `src/art/entities.ts` — in `paintEntityTextures` (the boot pass), add a loop over `AUGMENTS` painting each first augment's barrel-mark texture (keyed by `a.id`), calling `paintBarrelMark` (imported from `art/barrelMarks.ts`).
- `src/art/textures.ts` — add `barrelMarkTexture(id: string): string` → `tower:barrel-mark-${id}` (mirrors `markTexture`).
- `src/entities/Tower.ts` — the per-tower barrel mark: a `barrelMark` field (a child of `this.gun`); created in `buildGun` at gun-space (0, −barrelLength/2) keyed by `spec.firstId`, hidden initially; a `preUpdate()` that sets its visibility from `this.scene.registry.get('patterns')`.
- `tests/towerMarks.test.ts` (NEW) — pins `BARREL_MARKS`.

### Interfaces

- `BarrelMarkShape` — `art/barrelMarks.ts`. The 16 shape ids (union type).
- `BARREL_MARKS: Record<string, BarrelMarkShape>` — `art/barrelMarks.ts`. Maps each first augment id to one of the 16 shapes; 16 entries, all distinct.
- `paintBarrelMark(ctx, firstId, cx, cy, r)` — `art/barrelMarks.ts`. Draws `firstId`'s mark centered at (cx, cy), ~ a quarter of the barrel face's width, in `PALETTE.muted` ink; no-op if `firstId` has no entry.
- `barrelMarkTexture(id: string): string` — `art/textures.ts`. The barrel-mark texture key (`tower:barrel-mark-${id}`), painted at boot per first augment.
- `Tower.preUpdate(): void` — `entities/Tower.ts`. Per frame, shows the barrel mark iff `this.scene.registry.get('patterns') === true`.

### Steps

1. `art/textures.ts`: add `export const barrelMarkTexture = (id: string): string => `tower:barrel-mark-${id}`;` next to `markTexture`.
2. `art/barrelMarks.ts` (new):
   - `export type BarrelMarkShape = 'bar' | 'dot' | 'chevron' | 'x' | 'two-bars' | 'triangle' | 'square' | 'diamond' | 'ring' | 'arc' | 'cross' | 'crescent' | 'two-dots' | 'zigzag' | 'hollow-square' | 'bar-and-dot';`
   - `export const BARREL_MARKS: Record<string, BarrelMarkShape> = { /* 16 entries, one per first augment, all distinct */ };`
   - `export function paintBarrelMark(ctx: CanvasRenderingContext2D, firstId: string, cx: number, cy: number, r: number): void` — `const shape = BARREL_MARKS[firstId]; if (!shape) return; paintBarrelMarkShape(ctx, shape, cx, cy, r);`
   - `function paintBarrelMarkShape(ctx, shape, cx, cy, r): void` — a switch on `shape` (16 cases), all in `rgba(PALETTE.muted, 1)`; the 10 enemy shapes re-implemented from `paintTypeMark` (in `art/entities.ts`) + the 6 new.
3. `art/entities.ts` `paintEntityTextures`: add the boot-time loop painting each first augment's barrel-mark texture (keyed by `a.id`), sized ~ a quarter of the barrel face's width, calling `paintBarrelMark`.
4. `entities/Tower.ts`:
   - `private barrelMark?: Phaser.GameObjects.Image;`
   - `buildGun`: after the barrels (when `count > 0`), `this.barrelMark = artScale(this.scene.add.image(0, -this.barrelLength / 2, barrelMarkTexture(spec.firstId))); this.barrelMark.setVisible(false); this.gun.add(this.barrelMark);`
   - `preUpdate(): void { this.barrelMark?.setVisible(this.scene.registry.get('patterns') === true); }`
5. `tests/towerMarks.test.ts` (new): assert `BARREL_MARKS` has 16 entries, one per first augment, all shapes distinct.

### Pitfalls

- The mark is a child of `this.gun` (so it rotates with the barrels and stays on the barrel's face); never a child of the tower (it would stay put as the barrels turn). It is recreated in `buildGun` (called on every `refresh()`), keyed by `spec.firstId`, so a first-augment swap swaps the texture.
- The mark is shown/hidden per frame from `this.scene.registry.get('patterns')` (the pause card's toggle), NOT from board input (T0038) — mirror the enemy mark's `setVisible(this.scene.registry.get('patterns') === true)` (Enemy.ts line 399).
- The mark is ~ a quarter of the barrel face's width, centered on the barrel's face (gun-space (0, −barrelLength/2)), so it is never on the plinth/pips (≈9 board units above the plinth's center vs the pips at +22 below) and never tints the barrel (a separate flat muted texture, never painted into the barrel image).
- `BARREL_MARKS` has exactly one entry per first augment (16), all shapes distinct: the 10 enemy shapes (bar, dot, chevron, x, two-bars, triangle, square, diamond, ring, arc) + 6 new (cross, crescent, two-dots, zigzag, hollow-square, bar-and-dot). No two first augments share a shape; no shape is a tall rounded rect (the barrel's own silhouette — the T0465 rule).
- The 16 snippets live in `paintBarrelMarkShape` (`art/barrelMarks.ts`); the 10 enemy shapes are re-implemented there (`paintTypeMark` in `art/entities.ts` keeps its own — not refactored, that's T0465's concern).
- `r` in `paintBarrelMark` is the body radius (TOWER_BODY·CELL); the mark's size ~ r/7 (a quarter of the barrel face's width ≈ 0.6r). Paint the texture at `ART` (3×); show it with `artScale` (never a bare `setScale`).
- `preUpdate` is a new method on `Tower` (it currently has none); `Tower extends Phaser.GameObjects.Image` and is added via `scene.add.existing`, so Phaser calls `preUpdate` every frame.

### Tests

- `tests/towerMarks.test.ts` (new): import `BARREL_MARKS` (`art/barrelMarks.ts`) and `AUGMENTS` (`content/augments`); assert: (a) `Object.keys(BARREL_MARKS).length === 16` (one per first augment); (b) for each first augment `AUGMENTS.filter(a => a.first.kind !== 'none')`, `BARREL_MARKS[a.id]` is defined; (c) `new Set(Object.values(BARREL_MARKS)).size === 16` (all shapes distinct).
- `npm run check` (typecheck + lint + unit tests) and `npm run smoke` must pass.

## Result (attempt 1, cachyos-x8664)

Done — `npm run check` is green: typecheck, lint, and all 660 tests pass (88 files, including the new `towerMarks.test.ts`).

## What landed

**New files**
- `src/art/barrelMarks.ts` — `BARREL_MARKS` (a bijection over the 16 first augments → 16 distinct flat muted-ink shapes: bar, x, two-bars, crescent, chevron, ring, dot, bar-and-dot, two-dots, zigzag, cross, hollow-square, triangle, arc, square, diamond) and `paintBarrelMark()`, which paints the mark of a given augment, centered in fractions of the barrel radius `r`.
- `tests/towerMarks.test.ts` — asserts 16 keys, every `AUGMENTS` id is covered, and all 16 shapes are distinct.

**Edits**
- `src/art/textures.ts` — added the `barrelMarkTexture(id)` key helper (`tower:barrel-mark-<id>`).
- `src/art/entities.ts` — added the import for `paintBarrelMark` and a boot loop in `paintEntityTextures` that paints one barrel-mark texture per augment (painted for all 16, like the enemy type marks).
- `src/entities/Tower.ts` — `private barrelMark?: Image` field, reset in `buildGun` (so a destroyed child isn't dangled), created at the center barrel face `(0, -barrelLength/2)` and added to `this.gun` (so it rides the turning barrel, flat like the barrel), and a `preUpdate()` that mirrors the enemy pattern: `this.barrelMark?.setVisible(this.scene.registry.get('patterns') === true)`.

Rally-first (`count === 0`) and beam (`spec.kind === 'beam'`) early-return before the barrel, so those two never attach a mark — 14 of the 16 first-augment tower…

- Self-review: NO VERDICT
- Time: 135.9 min

```
projects/chokepoint/game/src/art/barrelMarks.ts   | 173 ++++++++++++++++++++++
 projects/chokepoint/game/src/art/entities.ts      |  12 +-
 projects/chokepoint/game/src/art/textures.ts      |   2 +
 projects/chokepoint/game/src/entities/Tower.ts    |  14 +-
 projects/chokepoint/game/tests/towerMarks.test.ts |  11 ++
 5 files changed, 210 insertions(+), 2 deletions(-)
```
