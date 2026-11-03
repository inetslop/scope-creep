---
id: T0481
title: "The bosses' marks: the boss ladder's own marks under Patterns"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-03T08:12:52Z
claimed_at: 2026-11-03T09:06:09Z
finished_at: 2026-11-03T09:18:42Z
epic: E26
---

## Goal
Patterns (the pause's toggle, T0465) makes the board readable by shape alone, but its vocabulary covers only the 10 regular enemies and the towers' barrels: the boss ladder has no marks of its own, so a Patterns player still reads the bosses by color. Give every boss its own mark, and every split child its parent's mark in miniature.

## Details
- A new mark vocabulary for the boss ladder, beside the barrel-marks file (T0469's pattern): one flat muted-ink shape per boss id the wave plans declare — today nine: the Colossus, the Titan, the Orb, the Hive, the crosser (the wave-50 Flyer), the Blinker, the Mender, the Leech and the Gorge; if the Fracture (T0435) has landed by build time it is in the same list. Each shape is distinct from the other bosses' and from all 10 regular-enemy marks and all 16 barrel marks — one shape means one thing across the whole vocabulary.
- While Patterns is on, every boss token wears its own mark on its face, painted the same way a regular enemy token wears its mark (T0465's draw path, the same registry flag; no new toggle — still off by default and remembered in the profile).
- The split children wear their parent's mark smaller: a Shard (the Orb's split) wears the Orb's mark, a Splinter (the Splitter's split) the Splitter's, at about 60% of the parent mark's size, same muted ink, same toggle. The Hive's popped Dots, the Mender's Ward escorts and the Leech's Hauler escorts are regular types and keep their own regular marks, unchanged.
- The bosses reference off the pause (T0277's rows) wears the same marks on its row tokens while Patterns is on, so the reference doubles as the legend; with Patterns off the rows stay plain.
- The marks are display-only: flat muted-ink shapes on the token face — no new rings, colors, HUD, sound or text.

## Acceptance criteria
- [ ] With Patterns on, each boss that spawns (wave 10 and up) wears a flat muted-ink mark on its token face, distinct from every regular-enemy mark and every barrel mark; with Patterns off the boss tokens are exactly as before.
- [ ] A Shard wears the Orb's mark and a Splinter the Splitter's, at about 60% of the size, while Patterns is on; the Hive's Dots, the Mender's Wards and the Leech's Haulers wear their own regular marks.
- [ ] The bosses reference shows marked row tokens while Patterns is on and plain tokens while it is off.
- [ ] A unit test asserts the bijection: every boss id in the ladder has exactly one mark, all distinct, and none equal to a regular-enemy mark or a barrel mark.

## Design (architect, desktop)

### Files
- create `src/art/bossMarks.ts` - the boss-ladder mark vocabulary, modeled exactly on `src/art/barrelMarks.ts` (shape union + `Record` + `paintBossMark`)
- create `tests/bossMarks.test.ts` - the bijection test (model: `tests/towerMarks.test.ts`)
- edit `src/art/entities.ts` - the mark-texture loop (lines 57-66) paints boss marks and split-child miniatures; export `REGULAR_MARKS` name table
- edit `src/entities/Enemy.ts` - gate the type mark on "a mark texture exists" instead of `!def.spawnOnly`
- edit `src/scenes/BossesScene.ts` - row tokens wear their mark while Patterns is on

### Interfaces
```ts
// src/art/bossMarks.ts (import { PALETTE, rgba } from '../content/palette'; import { roundRectPath, shapePath } from './paint';)
export type BossMarkShape = 'pentagon' | 'ring-dot' | 'two-triangles' | 'three-bars' | 'two-chevrons' | 'star' | 'arc-pair' | 'hollow-diamond' | 'hexagon' | 'hollow-triangle';
export const BOSS_MARKS: Record<string, BossMarkShape> = {
  colossus: 'pentagon', titan: 'ring-dot', orb: 'two-triangles', hive: 'three-bars', crosser: 'two-chevrons',
  blinker: 'star', mender: 'arc-pair', leech: 'hollow-diamond', gorge: 'hexagon',
};
export function paintBossMark(ctx: CanvasRenderingContext2D, bossId: string, cx: number, cy: number, r: number): void;
// src/art/entities.ts (after paintTypeMark, names mirror its case comments; exists for the vocabulary test)
export const REGULAR_MARKS: Record<string, string> = { dot: 'bar', block: 'dot', dasher: 'chevron', sprinter: 'x', splitter: 'two-bars', hauler: 'triangle', mute: 'square', flyer: 'diamond', ward: 'ring', bulwark: 'arc' };
// src/entities/Enemy.ts: new private field `private wearsMark = false;` next to `typeMark`
```

### Steps
1. **`src/art/bossMarks.ts`** - copy the file header/style of `barrelMarks.ts`. `paintBossMark` looks up `BOSS_MARKS[bossId]`, returns early if undefined, sets `ctx.fillStyle = ctx.strokeStyle = rgba(PALETTE.muted, 1)`, then a switch, all flat, in fractions of `r` (the token radius; a miniature passes `0.6 * parentRadius`):
   - `'pentagon'`: `shapePath(ctx, 'pentagon', cx, cy, 0.3 * r); ctx.fill();`
   - `'hexagon'`: `shapePath(ctx, 'hexagon', cx, cy, 0.26 * r); ctx.fill();`
   - `'star'`: one path, 10 vertices from angle `-Math.PI/2` stepping `Math.PI/5`, radii alternating `0.3 * r` (even i) / `0.12 * r` (odd i), `closePath(); fill();`
   - `'ring-dot'`: `lineWidth = 0.07 * r`; stroked circle r `0.2 * r`; filled circle r `0.09 * r`
   - `'two-triangles'`: left triangle `(cx-0.3r, cy-0.16r) (cx-0.3r, cy+0.16r) (cx-0.08r, cy)`, right mirrored, `fill()` each
   - `'three-bars'`: `for (const off of [-0.14, 0, 0.14]) { roundRectPath(ctx, cx - 0.15 * r, cy + off * r - 0.04 * r, 0.3 * r, 0.08 * r, 0.04 * r); ctx.fill(); }`
   - `'two-chevrons'`: `shapePath(ctx, 'chevron', cx, cy - 0.17 * r, 0.14 * r); fill();` and same at `cy + 0.17 * r`
   - `'arc-pair'`: `lineWidth = 0.07 * r; lineCap = 'round'`; stroke arc r `0.18 * r` from `Math.PI * 0.75` to `Math.PI * 1.25` (left), and arc from `-Math.PI * 0.25` to `Math.PI * 0.25` (right)
   - `'hollow-diamond'`: `lineWidth = 0.06 * r; shapePath(ctx, 'diamond', cx, cy, 0.22 * r); ctx.stroke();`
   - `'hollow-triangle'` (reserved, no record entry yet): `lineWidth = 0.06 * r; shapePath(ctx, 'triangle', cx, cy, 0.24 * r); ctx.stroke();`
2. **`src/art/entities.ts`** - add `import { BOSS_MARKS, paintBossMark } from './bossMarks';` next to the barrelMarks import. Replace the loop at lines 57-66 with:
   ```ts
   for (const e of ENEMIES) {
     const parent = e.spawnOnly === undefined ? undefined : ENEMIES.find((d) => d.splitsInto === e.id || d.splitsAt?.into === e.id);
     if (e.spawnOnly !== undefined && BOSS_MARKS[e.id] === undefined && parent === undefined) continue; // the Titan's Guard escort stays plain
     const r = e.look.size * CELL;
     const depth = tokenDepth(r);
     const size = tokenRoom(r, depth) * 2;
     const cx = size / 2;
     const cy = size / 2 - depth / 2;
     paintTexture(scene, markTexture(e.id), size, size, (ctx) => {
       if (e.spawnOnly === undefined) paintTypeMark(ctx, e.id, cx, cy, r);
       else if (BOSS_MARKS[e.id] !== undefined) paintBossMark(ctx, e.id, cx, cy, r);
       else { // a split child: the parent's mark at 60% of its size (the painters scale linearly with the radius given)
         const pr = parent!.look.size * CELL;
         if (BOSS_MARKS[parent!.id] !== undefined) paintBossMark(ctx, parent!.id, cx, cy, pr * 0.6);
         else paintTypeMark(ctx, parent!.id, cx, cy, pr * 0.6);
       }
     });
   }
   ```
   Update the loop's comment: regular types, bosses (`art/bossMarks.ts`) and split children wear marks; the spawn-only pieces without one (the Guard) keep their plain look.
3. **`src/entities/Enemy.ts`** - (a) add the `wearsMark` field; (b) in `spawn()` replace lines 207-215 with:
   ```ts
   this.wearsMark = this.scene.textures.exists(markTexture(this.def.id));
   if (this.wearsMark) {
     if (this.typeMark === undefined) {
       this.typeMark = this.scene.add.image(0, 0, markTexture(this.def.id));
       this.typeMark.setDepth(DEPTH.enemies);
     }
     this.typeMark.setTexture(markTexture(this.def.id)); // a recycled slot must not keep the first type's mark
   }
   this.typeMark?.setVisible(false); // hidden until advance() places it (and while the toggle is off)
   ```
   (c) in `advance()` change the condition at line 398 to `if (this.typeMark !== undefined && this.wearsMark)` (keep the rest of the line, update the comment: worn by regular types, bosses and split children). `despawn()` stays.
4. **`src/scenes/BossesScene.ts`** - add `markTexture` to the `../art/textures` import. In `build()`, right after the constants: `const patterns = this.registry.get('patterns') === true; // read once: the flag cannot change while the reference is open`. In the row loop, replace the single `parts.push(artScale(this.add.image(...enemyTexture...)))` with:
   ```ts
   const tokenX = -this.panelW / 2 + PAD + TOKEN / 2;
   const tokenY = rowTop + row.h / 2;
   const tokenScale = 16 / (row.def.look.size * CELL);
   parts.push(artScale(this.add.image(tokenX, tokenY, enemyTexture(row.def.id)), tokenScale));
   if (patterns) parts.push(artScale(this.add.image(tokenX, tokenY, markTexture(row.def.id)), tokenScale)); // same canvas + scale: the mark sits on the face; added after the token, so it draws on top
   ```
5. **`tests/bossMarks.test.ts`**:
   ```ts
   import { describe, expect, it } from 'vitest';
   import { BARREL_MARKS } from '../src/art/barrelMarks';
   import { BOSS_MARKS } from '../src/art/bossMarks';
   import { REGULAR_MARKS } from '../src/art/entities';
   import { ENEMIES } from '../src/content/enemies';
   import { isBossWave, waveBudget } from '../src/core/waves';

   describe('boss marks', () => {
     // The boss ladder, read the way BossesScene reads it.
     const inLadder = (id: string): boolean => {
       const e = ENEMIES.find((d) => d.id === id);
       return e !== undefined && e.spawnOnly !== undefined && isBossWave(e.fromWave) && e.threat === waveBudget(e.fromWave);
     };
     const bosses = ENEMIES.filter((e) => e.spawnOnly !== undefined && isBossWave(e.fromWave) && e.threat === waveBudget(e.fromWave));

     it('every boss in the ladder wears exactly one mark, and no non-boss has one', () => {
       for (const b of bosses) expect(BOSS_MARKS[b.id]).toBeDefined();
       for (const id of Object.keys(BOSS_MARKS)) expect(inLadder(id)).toBe(true);
     });
     it('the regular mark names cover every regular type, one each', () => {
       expect(Object.keys(REGULAR_MARKS).sort()).toEqual(ENEMIES.filter((e) => e.spawnOnly === undefined).map((e) => e.id).sort());
     });
     it('all boss marks are distinct, and none is a regular-enemy mark or a barrel mark', () => {
       const shapes = Object.values(BOSS_MARKS);
       expect(new Set(shapes).size).toBe(shapes.length);
       const taken = new Set<string>([...Object.values(REGULAR_MARKS), ...Object.values(BARREL_MARKS)]);
       for (const s of new Set(shapes)) expect(taken.has(s)).toBe(false);
     });
   });
   ```
6. If `src/content/enemies/fracture.ts` exists (T0435 landed): add one line `fracture: 'hollow-triangle',` to `BOSS_MARKS` (the painter case already exists). Otherwise leave it out — the test enforces the right answer either way.
7. Run `npm run check`.

### Pitfalls
- No mark copies its own token's silhouette (the T0465 rule): the Hive is a pentagon token (got three-bars), the Orb a hexagon (got two-triangles), Colossus/Titan are square. Do not reassign shapes to "fit" the token.
- Marks are never painted into the token texture (the white hit flash tints the token image only) — keep them on the separate `markTexture` canvas, centered at the face (`size/2, size/2 - depth/2`).
- The miniature is exact because painters scale linearly with the radius passed: `0.6 * parentRadius` — do not re-derive the scale from the child's radius.
- Pooled slots: `wearsMark` is reset in `spawn()`; `setTexture()` every spawn so a recycled boss slot never keeps a regular mark; never `destroy()` the mark image.
- The crosser (triangle) and blinker (almond) tokens rotate; the marks are flat, so `setRotation(this.rotation)` on the mark image is safe, exactly like today's marks.
- The Gorge's spiral face is busy: the solid hexagon mark reads on it; a stroked shape would not — keep the assignment.
- Don't touch `EnemySystem`, `FxSystem`, `debug/runChecks.ts` or `Sfx` — display-only, no invariant, no sound.

### Tests
- `tests/bossMarks.test.ts` (full code above) — the task's required bijection: every ladder boss exactly one mark, all distinct, none equal to a regular-enemy mark or a barrel mark; plus the `REGULAR_MARKS` coverage check.

## Result (attempt 1, desktop)

Every boss on the ladder (Colossus, Titan, Orb, Hive, crosser, Blinker, Mender, Leech, Gorge) now has its own flat muted-ink mark in a new vocabulary (`src/art/bossMarks.ts`, modeled on the barrel marks), painted into the mark textures in `src/art/entities.ts` and worn on the token face by `Enemy.ts` through the existing Patterns toggle (off by default, profile-remembered); a Shard wears the Orb's mark and a Splinter the Splitter's at 60%, while the Hive's Dots, Mender's Wards and Leech's Haulers keep their own regular marks, and the Titan's Guard escort stays plain. The bosses reference (`BossesScene`) now shows marked row tokens while Patterns is on, doubling as the legend, and `tests/bossMarks.test.ts` asserts the bijection (every ladder boss exactly one mark, all distinct, none colliding with a regular-enemy or barrel mark). One deviation from the design, forced by the actual code: the design's test predicate (`threat === waveBudget`) can never match the escort-carrying bosses — Titan (95/100), Mender (348/350), Gorge (448/450) — yet the goal and the design's own record give all nine marks, so the test defines the ladder the way the wave plans declare it, `bossId(fromWave) === id` (`core/waves.ts`).

- Self-review: APPROVE
- Time: 12.6 min
- Did not delete none: only files in src/, tests/, docs/, public/ can be deleted.

```
projects/chokepoint/game/src/art/bossMarks.ts      | 132 +++++++++++++++++++++
 projects/chokepoint/game/src/art/entities.ts       |  27 ++++-
 projects/chokepoint/game/src/entities/Enemy.ts     |  15 ++-
 projects/chokepoint/game/src/scenes/BossesScene.ts |   9 +-
 projects/chokepoint/game/tests/bossMarks.test.ts   |  32 +++++
 5 files changed, 203 insertions(+), 12 deletions(-)
```
