---
id: T0407
title: "The island's drop-in: a new board settles into place"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T05:22:32Z
design_attempts: 1
---

## Goal
A new run's board arrives with a moment: the island settles into place with a soft drop-in, so "every run is a new board" is felt at the run's open, not just noticed.

## Details
- When a run opens on a freshly generated board (a new Play or Iron run from the menu, or a Ghost run), the board's drawing (the raised island, the road and the rocks) plays a one-time settle: the whole board scales from 1.03 to 1.0 around its own center over ~400 ms with a soft bounce (ease-out that overshoots 1.0 by ~2% and settles), in the tower drop-in bounce's language (pillar 5) but for the island.
- The settle is render-only: the board's data (cells, road, rocks, camera bounds, placement hit-testing) is unchanged, and the scale reaches exactly 1.0 before the first build phase's countdown starts. No per-cell or per-frame work on the board's data during the settle — one transform on the drawing.
- The settle plays once per new board: a resumed run (the save restore) shows no settle — the board is already there.
- The menu's live demo board never settles: the demo is the menu's furniture, not a new board arriving.
- No new sound, no mark painted on the board, no HUD change: the moment is the motion itself, seen under the first draft's cards.

## Acceptance criteria
- [ ] A new run from the menu (Play, Iron or a Ghost run) shows the island settling from 1.03 to 1.0 with a soft bounce over ~400 ms, once, at the run's open.
- [ ] A resumed run shows no settle; the board draws exactly as before the change.
- [ ] The menu's demo board never settles.
- [ ] The board's cells, road, rocks and tower placement hit-testing are unchanged: a placement made after the settle lands on the same cell as it would on the un-animated board.
- [ ] The settle holds 60 fps on a mid-range phone: one transform on the board's drawing, no per-cell work per frame.

## Design (architect, cachyos-x8664)

### Files
- `src/systems/Board.ts` — capture the board's image in a new `private readonly boardImage` field (assigned in `drawCells()`, where it is today a bare expression), and add `dropIn(tweens)`, `settleNow(tweens)` and a private `settleRest()`. Nothing else changes: the camera/view (`layout`/`apply`), the `towers` grid, and the data-based hit-test (`toBoard`/`toScreen`/`cellAt`) are left alone.
- `src/systems/RunFlow.ts` — exactly two one-line touches: `openDraft()` triggers the settle on the first draft, and `finishDraft()` snaps it to rest right after `startBuild`. No other change.

No new file, no `core/` or `content/` change, no new sound, no HUD part, no `INVARIANTS` line (it is a one-shot render effect, not a system).

### Interfaces
New public surface on `Board` (the `boardImage` stays private; the rest values are the existing rest state — origin 0, position `(-BOARD_MARGIN, -BOARD_MARGIN)`, scale `ART_SCALE`):

```ts
/** The run-start "settle": the board's island eases from 1.03x its rest scale to rest,
 *  centered, on the given tween manager. The caller picks it.
 *  (The board's own rest state is origin 0 at (-BOARD_MARGIN, -BOARD_MARGIN),
 *  scale ART_SCALE; the centre of that state is (width/2, height/2).) */
dropIn(tweens: Phaser.Tweens.TweenManager): void

/** Force the board back to rest: cancel any live settle and set the rest transform. */
settleNow(tweens: Phaser.Tweens.TweenManager): void

private settleRest(): void  // origin 0, position (-BOARD_MARGIN, -BOARD_MARGIN), scale ART_SCALE
```

`RunFlow` resolves the driver once and passes it to both calls. `this.scene` is the GameScene; `this.scene.scene.get(SCENES.hud)` is the running HudScene; `.tweens` is its `Phaser.Tweens.TweenManager`:

```ts
// in openDraft(), after the launch/pause block:
if (this.run.wave === 0) this.s.board.dropIn(this.scene.scene.get(SCENES.hud).tweens);
// in finishDraft(), right after this.run.startBuild(seconds):
if (this.run.wave === 0) this.s.board.settleNow(this.scene.scene.get(SCENES.hud).tweens);
```

### Steps
1. `Board.drawCells()`: change the bare expression to store the image —
   `this.boardImage = artScale(this.scene.add.image(-BOARD_MARGIN, -BOARD_MARGIN, key).setOrigin(0).setDepth(DEPTH.board));`
   (`boardImage: Phaser.GameObjects.Image` declared as a new private field, next to the other readonly image-ish members.)
2. `Board.dropIn(tweens)`: capture `const full = this.boardImage.scaleX` (rest = `ART_SCALE`); re-anchor to origin 0.5 centered on `(this.width/2, this.height/2)` at scale `full * 1.03`; then `tweens.add({ targets: this.boardImage, scale: full, duration: 400, ease: 'Back.easeOut', onComplete: () => this.settleRest() })`.
3. `Board.settleNow(tweens)`: `tweens.killTweensOf(this.boardImage); this.settleRest();`
4. `RunFlow.openDraft()`: after the empty-offer early return (so the no-draft path never plays), next to `scene.launch`/`scene.pause`: `if (this.run.wave === 0) this.s.board.dropIn((this.scene.scene.get(SCENES.hud) as Phaser.Scene).tweens);`
5. `RunFlow.finishDraft()`: right after `this.run.startBuild(seconds)`: `if (this.run.wave === 0) this.s.board.settleNow((this.scene.scene.get(SCENES.hud) as Phaser.Scene).tweens);`

### Pitfalls
- Driver: only HudScene runs through the first draft. GameScene is paused by `openDraft()` (its tweens freeze); DraftScene's tweens are destroyed at SHUTDOWN when the pick closes it. So `this.scene.scene.get(SCENES.hud).tweens` is the only valid driver; `scene.get` (not `.scene`) and the `as Phaser.Scene` cast follow the existing cross-scene pattern already used in `runChecks.ts`/`endRun`.
- Fast pick (< 400 ms): `settleNow` must `killTweensOf` first — a live tween rewrites the scale every frame and would undo the snap. Then `settleRest` puts it at rest exactly before the first build countdown decrements.
- Render-only: animate only the stored `boardImage` scale (origin 0.5 centered on `(width/2, height/2)` while settling). Never touch the camera/view or board data: `toBoard`/`toScreen`/`cellAt`/`canBuild`/`onMarked` are data-based, so a placement made after the settle lands on the same cell as on a non-animated board. One image tween, no per-frame/per-cell work.
- Rest values: origin 0 + position `(-BOARD_MARGIN, -BOARD_MARGIN)` + scale `ART_SCALE` (not 1 — the texture is painted at ART×). `layout()`/resize only move the camera and never re-derive the image, so `boardImage.scaleX` stays `ART_SCALE` and `settleRest` is always valid.
- Gating: `run.wave === 0` = first draft + first build only; only `!saved` runs open a draft, so a resumed run never settles; MenuDemo and `paintBoardPreview` never construct `Board`, so the menu demo board never settles.
- Empty-offer path: `openDraft` returns early before the settle line, so `dropIn` never runs there; the guard then only no-ops through `settleNow` (kill is a no-op, `settleRest` is idempotent — the board is already at rest).

### Tests
- None required (render-only). `npm run check` typechecks the new Board members and the two RunFlow lines; `npm run smoke` plays it — the smoke pick fires at 800 ms, after the 400 ms settle, so the board is at rest before the first build phase and `settleNow` is a no-op.
