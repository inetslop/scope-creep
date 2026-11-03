---
id: T0465
title: "The patterns: the toggle and the enemy tokens' marks"
size: L
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T02:48:20Z
epic: E26
---

## Goal
A player who can't trust color can still read the board: a "Patterns" toggle beside the pause screen's Sound row (off by default, remembered) paints a small muted-ink mark on every regular enemy token, the mark's shape distinct per type, so the type reads by shape alone.

## Details
- The toggle: a new row on the pause card in the Sound row's own look (T0035's row: one tap target, the label, On/Off flipped in place), stacked under the Sound row (the card grows one row and still fits at 412x915 and 1280x720); stored on the profile beside `sound`; a fresh profile defaults off; with it off the board is byte-identical to today.
- The marks: with the toggle on, each of the 10 regular tokens wears one small muted-ink mark (the same muted ink the wave card's "held · N" chip uses), roughly a quarter of the token's width, painted on the token's face the way the Hauler's coin is (T0098's painter, the closest example): Dot a bar, Block a dot, Dasher a chevron, Sprinter an X, Splitter two bars, Hauler a triangle, Mute a square, Flyer a diamond, Ward a ring, Bulwark an arc. No two types wear the same mark, and a mark never copies its own token's shape (the Ward's ring in its circle reads as a target).
- Placement: the mark sits where the token's face is clear — the Hauler keeps its gold coin and takes its mark to one side of it, and the Bulwark's plate (the taught front, T0399) stays readable over its mark.
- Not a status chip (removed, T0179/T0192): the mark is the type's constant identity on the token itself, shown only while the toggle is on — never a per-effect mark, and nothing new is painted on the cells (Pillar 9).
- One color for every mark: muted ink. The shape is the information, not a new hue.
- Out of scope for this slice: the bosses, the spawnOnly pieces (the Shard, the Splinter) and the towers keep their plain look; the enemies reference and the codex keep their plain tokens until a later slice.

## Acceptance criteria
- [ ] The pause card has a Patterns row in the Sound row's look; tapping it flips On/Off in place, the choice is remembered between sessions, and a fresh profile defaults off.
- [ ] With the toggle off, the board, the menu demo, the game-over and the claim render exactly as before: no mark on any token.
- [ ] With the toggle on, each of the 10 regular enemy tokens wears its own mark (Dot bar, Block dot, Dasher chevron, Sprinter X, Splitter two bars, Hauler triangle, Mute square, Flyer diamond, Ward ring, Bulwark arc) in muted ink, no two types sharing a mark, and the mark still reads at the zoomed-out limit.
- [ ] With the toggle on, the Hauler's coin and the Bulwark's plate are still visible, and the mark stays visible while its token flashes white (a hit, the Dasher's telegraph).
- [ ] The pause card with the new row fits at 412x915 and 1280x720 with the longest labels.

## Design (architect, desktop)

### Files
- edit `src/core/profile.ts` - add `patterns` to `Profile`, load it (default **off**), carry it through `recordRun`, and add `savePatterns` beside `saveSound`
- edit `tests/core/profile.test.ts` - add `patterns: false` to the six profile literals and one `savePatterns` test
- edit `src/art/textures.ts` - add the `markTexture(id)` key next to `enemyTexture`
- edit `src/art/entities.ts` - paint one mark texture per regular enemy + a `paintTypeMark` helper (marks are the enemy token's look, same concern as the coin/plate/disc/eye already painted here)
- edit `src/entities/Enemy.ts` - the per-enemy mark image, on the plate/disc/eye pattern
- edit `src/scenes/BootScene.ts` - one registry line beside the `sfx` line
- edit `src/scenes/PauseScene.ts` - the Patterns row under the Sound row
### Interfaces
```ts
// core/profile.ts
export interface Profile { /* ... */ sound: boolean; patterns: boolean; /* ... */ } // patterns: after sound
// loadProfile: `patterns: typeof parsed.patterns === 'boolean' ? parsed.patterns : false,` (and `patterns: false` in the catch return)
// recordRun literal: `patterns: old.patterns,` after `sound: old.sound,`
export function savePatterns(store: KeyValueStore | undefined, on: boolean): void // exact twin of saveSound
// art/textures.ts, beside enemyTexture:
export const markTexture = (id: string): string => `enemy:mark-${id}`;
// Enemy.ts: `private mark?: Phaser.GameObjects.Image;` beside plate/disc/eye
```
Registry key `'patterns'` (boolean) holds the live toggle: BootScene sets it from the profile (so it survives re-entering the game); PauseScene writes it on toggle; `Enemy.advance()` reads it.
### Steps
1. **core/profile.ts** + **tests/core/profile.test.ts** (six literals: lines 105, 110, 120, 124, 132, 139 get `patterns: false` after `sound: true`; new test mirroring "the sound preference defaults to on and sticks through runs" — default **off**, `savePatterns(store, true)` sticks, `recordRun` keeps it).
2. **art/textures.ts**: `markTexture` one-liner.
3. **art/entities.ts**: after the main `ENEMIES` for-loop, loop `ENEMIES` again, `if (e.spawnOnly !== undefined) continue;`, compute `r = e.look.size * CELL`, `depth = tokenDepth(r)`, `size = tokenRoom(r, depth) * 2`, and `paintTexture(scene, markTexture(e.id), size, size, (ctx) => paintTypeMark(ctx, e.id, size / 2, size / 2 - depth / 2, r))`. Add `private function paintTypeMark(ctx, id, cx, cy, r)`: `fillStyle`/`strokeStyle` = `rgba(PALETTE.muted, 1)`; switch on `id`, all centered at (cx, cy) in fractions of the token radius `r`:
   - dot: bar — `roundRectPath(ctx, cx - r/4, cy - r/8, r/2, r/4, r/8)`, fill
   - block: dot — filled circle radius `0.18r`
   - dasher: chevron — `shapePath(ctx, 'chevron', cx, cy, r * 0.3)`, fill
   - sprinter: X — the bar above rotated `±PI/4` (save/translate/rotate twice)
   - splitter: two bars — `roundRectPath` at (cx−0.2r, cy−0.22r) and (cx−0.2r, cy+0.10r), each `0.4r × 0.12r`, corner `0.06r`
   - hauler: triangle — `shapePath(ctx, 'triangle', cx + r * 0.55, cy, r * 0.2)`, fill (**offset right of the gold coin**, which has radius r/3 at center)
   - mute: square — `shapePath(ctx, 'square', cx, cy, r * 0.24)` (sits in the ring's hole)
   - flyer: diamond — `shapePath(ctx, 'diamond', cx, cy, r * 0.25)`
   - ward: ring — `lineWidth = r * 0.14`, stroked circle radius `0.22r` (small and centered: clear of the armor ring at 0.88r, so it reads as a mark, not a target)
   - bulwark: arc — `lineWidth = r * 0.14`, `lineCap = 'round'`, stroked `ctx.arc(cx, cy, r * 0.2, Math.PI, 2 * Math.PI)` (top half; well inside the plate band, whose inner edge is 0.55r)
4. **entities/Enemy.ts**: import `markTexture`. In `spawn()` after the eye block: create the image once (`if (!this.def.spawnOnly && this.mark === undefined) { this.mark = this.scene.add.image(0, 0, markTexture(this.def.id)); this.mark.setDepth(DEPTH.enemies); }`) then `this.mark?.setVisible(false); // hidden until advance() places it (and while the toggle is off)`. In `advance()` after the eye block: `this.mark.setPosition(this.x, this.y).setScale(ART_SCALE * pop).setRotation(this.rotation).setVisible(this.scene.registry.get('patterns') === true);` (guarded by `!== undefined`). In `despawn()`: `this.mark?.setVisible(false);`
5. **scenes/BootScene.ts**: read the profile once, then `this.registry.set('patterns', profile.patterns);` after the `sfx` registry line.
6. **scenes/PauseScene.ts**: import `savePatterns`. After the soundRow block: `patternText` (`textStyle(20, PALETTE.ink, { fontStyle: 'bold' })`, origin 0, 0.5), `let patterns = profile.patterns;`, a `refreshPatternsRow()` that sets `'Patterns on'`/`'Patterns off'`, colors ink/muted, and centers on `-width/2`; `togglePatterns()` that flips, `savePatterns(window.localStorage, patterns)`, `this.registry.set('patterns', patterns)`, refreshes; `patternsRow = makeButton(this, 0, 0, '', togglePatterns, { width: 240, height: 52, radius: 26 })`, `patternsRow.content.add([patternText])`, `refreshPatternsRow()`. Placement: between the soundRow and enemies lines (`patternsRow.container.setY(cy(52)); y += GAP_S;`); height chain: one more `+ GAP_S + 52` after the 4th `+ GAP_S + 52`; `boxKids`: `patternsRow.container` after `soundRow.container`.
7. `npm run check`, then `npm run smoke`.
### Pitfalls
- The mark must be a **separate image**, never painted into the enemy texture: the white hit-flash/telegraph is `setTintFill(0xffffff)` on the token image and would wipe a baked mark. Separate images (plate/disc/eye precedent) keep the mark visible through the flash.
- Paint the mark at the **face center** `(size/2, size/2 - depth/2)`, not the texture center — the face is raised by half the side-face depth; at the texture center the mark lands on the side face.
- Read the registry **every frame in advance()**, never cache the flag per enemy: the toggle happens from the paused card, so marks must appear/disappear on resume, and a recycled slot must never carry a stale state.
- The Flyer's token rotates: `setRotation(this.rotation)` on the mark keeps the diamond on the face.
- Card height must stay content-derived (one `+ GAP_S + 52` term + one `cy(52)` placement); the box auto-scales to fit, and the row keeps the sound row's exact dimensions so 412x915 / 1280x720 fit as today.
- Set the On/Off color on the row's own text in `content` (like `soundText`), not the button's `label` — `makeButton`'s `draw()` resets its own label's color on hover.
- Menu demo, enemies reference and codex draw plain `enemyTexture` images (not `Enemy` objects) — they stay plain with no change; with the toggle off nothing renders differently anywhere.
- `recordRun`'s object literal must carry `patterns: old.patterns` or the setting resets every run end.
### Tests
- `tests/core/profile.test.ts`: add `patterns: false` to the six expected profile objects; import `savePatterns`; one `it` mirroring the sound test: fresh/missing storage defaults off, `savePatterns(store, true)` persists, a `recordRun` keeps it, `savePatterns(store, false)` turns it back off.
