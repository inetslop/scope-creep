---
id: T0393
title: "The tower shows its reach: the selected tower's range ring"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T00:29:33Z
claimed_at: 2026-11-02T12:37:49Z
---

## Goal
While a tower's panel is open, the selected tower wears its range ring on the board — the same ring the player sees while placing — so "does this tower cover that stretch of road, that crossing?" is an answer you see, not a number you estimate. With the sky crossing in the game (E10), reach is a question the player asks every build.

## Details
- The moment a tower's panel opens, a thin ring appears at the tower's base with radius exactly the tower's current range — the same number the panel's stats line already says. It uses the placement ring's own painter and look (the what-if ghost, T0096, already reuses that ring), so it reads as the same object the player knows from placing.
- Support towers wear their aura's reach the same way: a Rally's ring shows which towers it speeds, a Mint's which kills it pays. A Beam wears its beam's reach.
- The ring is a readout, not an event: no pulse, no sound, it never blocks input, enemies and shots pass through it. It stays for as long as the panel is open, and fades out over ~150 ms the moment the panel closes (tap elsewhere or deselect).
- While the panel is open, if the tower commits a slot that changes its range (a Reach), the ring matches the panel's new number.
- If E15's move state (T0382) is in when this lands: the reach ring keeps showing the tower's current reach at its current cell while the move's own ring shows the tapped destination — two rings, two questions.
- Why the screen has room: the panel already says the range as a number, but nothing shows the reach as space on the board while inspecting (the placement ring does it only while placing; the "On screen" and "Systems" lists have no selected-tower ring). The ring is conditional — with no tower selected the board is byte-identical to today — and it teaches with a ring the player already knows, so no new mark, text or key.
- Shape: a new small board-FX system for the ring's state and fade (closest examples: systems/towerGhost.ts and systems/PushWindup.ts), hooked where the tower panel opens and closes (Building owns the selection); it reuses the placement ring's painter, no new art.

## Acceptance criteria
- [ ] Tapping any tower opens its panel and, with it, a thin ring at its base with radius exactly the tower's range stat, in the placement ring's look.
- [ ] The ring stays for the whole time the panel is open — through a wave and 2x speed, with enemies crossing it — and fades out over ~150 ms the moment the panel closes; with no tower selected the board is identical to before this task.
- [ ] A support tower (a Rally, a Mint) shows its aura's reach and a Beam its beam's reach; after committing a slot that changes the range, the ring matches the panel's new number.
- [ ] No new button, key or HUD element; the pause screen's controls list is unchanged; the ring is readable at the default zoom on 412x915 and 1280x720.

## Design (architect, cachyos-x8664)

### Files
- create `src/systems/RangeRing.ts` — the ring's state + fade: reads `building.selectedTower` each frame, draws the placement ring's own look at `t.spec.range * CELL` while the panel is open, fades over 0.15 s on deselect; `update(dt)`, `broken()`.
- edit `src/scenes/GameScene.ts` — 4 lines: import (between RallySystem 32 and RunFlow 33 imports), field `rangeRing` next to `windup` (80), `new RangeRing(this, this.building)` after windup ctor (167), `update(simDt)` after `this.windup.update(simDt)` (248).
- edit `src/systems/Building.ts` — delete exactly two lines: `this.board.showRange(tower, this.towers.rangeOf(tower));` (187) and `this.board.showRange(undefined, 0);` (194). Nothing else.
- edit `src/systems/Board.ts` — delete the `range` field (29), its init (46) and `showRange` (182–190); the system owns the ring now.
- edit `src/debug/runChecks.ts` — `['rangeRing.valid', (g) => g.rangeRing.broken()],` next to `pushWindup.valid` (135).
- Same-file edits declared (runner serializes): T0392 touches Building.ts; T0346 and T0377 touch GameScene.ts and runChecks.ts.

### Interfaces
```ts
// src/systems/RangeRing.ts
const FADE_SEC = 0.15;
export class RangeRing {
  constructor(private readonly scene: Phaser.Scene, private readonly building: Building);
  update(dt: number): void; // selectedTower: read t.x/t.y/t.spec.range, fade = 1, draw(1)
  // no selection: fade -= dt / FADE_SEC; draw(fade) while > 0, then clear + forget pos
  private draw(a: number): void; // g lazy once, setDepth(DEPTH.preview), clear,
  // fillStyle(PALETTE.teal, 0.07*a).fillCircle(p.x,p.y,p.r); lineStyle(2, PALETTE.teal, 0.45*a).strokeCircle(...)
  broken(): string | undefined; // fade in [0,1], pos finite
}
```
`update` never reads the tower after deselect: it stores `pos = { x: t.x, y: t.y, r: t.spec.range * CELL }` per frame and the fade branch uses only the stored point. `draw` guards `p.r <= 0` → draws nothing (like `showHover`'s `range > 0`).

### Steps
1. Create `src/systems/RangeRing.ts` exactly as above (imports: `type Phaser`, `CELL, DEPTH` from `../config`, `PALETTE` from `../content/palette`, `type { Building }` from `./Building`).
2. GameScene: the four lines at the exact spots listed.
3. Building: remove the two `showRange` lines only.
4. Board: remove field, init, method (the ink `showRange` ring is the pre-task one-shot; the new system replaces it).
5. runChecks: the one invariant line.

### Pitfalls
- Keep only one ring: if `Board.showRange` lingers, its ink ring double-draws under the teal one — delete field, init and method together.
- Never read `t` during the fade: after deselect the tower may be sold (sell-away destroys its Image); the stored `{x,y,r}` carries the fade.
- Graphics created once lazily, cleared per frame, never destroyed (it dies with the scene at shutdown); no per-frame destroy/recreate.
- Radius read every frame from `t.spec.range * CELL` — the panel's own number (shot "Range X", support "within X cells", beam line's reach), so a Reach committed via `pickCard` (which does not re-select) keeps the ring fresh and E15's moved tower (T0382) is tracked for free; never capture the radius at selection.
- Fade runs on `simDt` (2x): ~75 ms real at 2x speed — fine; the per-frame redraw keeps it through waves and speed.
- GameScene stays wiring-only; no art file, sound, key, HUD part or pause-controls change; with nothing selected the (empty, cleared) Graphics leaves the board byte-identical.

### Tests
None — no core rule; the smoke run covers it: select a tower → teal ring at the panel's range, close → 150 ms fade, add a Reach to the open tower → radius grows live.
