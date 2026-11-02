---
id: T0443
title: "The move's limit: one move per tower per build phase, and its teach"
size: M
priority: 2
status: todo
depends_on: [T0389]
attempts: 0
created: 2026-11-02T20:29:42Z
epic: E15
---

## Goal
A moved tower does not move again in the same build phase — repositioning stays a one-shot decision with a price, not a free undo — and the player learns the limit once, at the moment they first open the move state (E15's last slice).

## Details
- **The limit:** after a tower's move is committed (✓, the T0394 core), that tower's panel line reads "moved" instead of "Move · −N" for the rest of that build phase: the line is dimmed in its own short-gold muted ink with no price, and tapping it does nothing — no move state, no outlines, no ✓/✗, no gold moves. Every other tower can still move once; the limit is per tower, per build phase — not per run, not shared between towers.
- **The reset:** at the start of the next build phase every tower's line reads "Move · −N" again, priced from its current slots (the T0394 rule); a tower that moved, then gained or lost a slot, re-prices normally.
- **The teach:** the first time in a run the player opens the move state (the first tap on any "Move · −N" line), one muted line "one move per build phase" appears under the move line in the one-time teach line's own look (T0314's shape: a muted line that fades after ~2 s), visible while the move state is open; it never shows again in that run — not for another tower, not in a later phase. The run remembers the moment it has shown, the way the other once-moments do (the marked-cell chip's field, T0389): a run resumed after the moment does not replay it; a resume before the moment still shows it when it comes.
- **Nothing else:** the commit itself (the fee, the "−N" chip at the old cell, the ~300 ms slide, the drop-in bounce, the place haptic, the T0392 note), the cancel, the marked-cell buff's follow and the sell line are all byte-identical to T0394. No new key, no new button, no new line on any card; the pause screen's controls list is unchanged.
- **The save:** the teach moment rides the run save like the other once flags (T0389's field pattern, including the save's validation and round-trip test). The moved state itself needs no save: a mid-build resume restores the pre-move snapshot (the T0394 rule) and the state clears at the build phase's start regardless.

## Acceptance criteria
- [ ] In a build phase, after committing a tower's move, its panel shows the dimmed "moved" line where "Move · −N" was; tapping it does nothing (no dim, no outlines, no ✓/✗, no gold moves); its sell line and the rest of the panel are unchanged.
- [ ] Every other tower in the same build phase can still move exactly once; after two towers have each moved, both read "moved".
- [ ] At the start of the next build phase every tower's line reads "Move · −N" again, priced from its current slots.
- [ ] In a fresh run, the first time the player opens the move state, the muted "one move per build phase" line fades under the move line while the state is open; it never shows again in that run, and a run resumed after the moment does not replay it (a resume before the moment still shows it when it comes).
- [ ] The commit, cancel, fee, slide, chip, bounce, haptic, the T0392 note, the marked-cell buff's follow and the sell line are byte-identical to T0394; the panel fits at 412x915 and 1280x720.
- [ ] `npm run check` and the desktop + mobile smoke pass.

## Design (architect, desktop)

### Files
- edit `src/core/run.ts` - add the run's once flag `moveTold` (the teach moment)
- edit `src/core/saveRun.ts` - add `moveTold` to `SavedRun` + its validation + default in `loadSavedRun`
- edit `src/systems/RunSave.ts` - carry `moveTold` in `persist()` and `restore()`
- edit `src/entities/Tower.ts` - add the per-tower `moved` flag
- edit `src/systems/Building.ts` - two lines: refuse `startMove` for a moved tower; set `moved` on commit
- edit `src/systems/RunFlow.ts` - one line: clear `moved` on every tower when the build phase starts
- edit `src/ui/hud/TowerPanel.ts` - dimmed "moved" line instead of the Move button; publish the move line's screen spot
- create `src/ui/hud/MoveTell.ts` - the one-time muted teach line while the move state is open
- edit `src/scenes/HudScene.ts` - one import + one line in the `parts` list
- edit `src/debug/runChecks.ts` - one invariant line
- edit `tests/core/saveRun.test.ts` - `moveTold` in `sample()` + round-trip test

### Interfaces
```ts
// entities/Tower.ts, after `targetMode: TargetMode = 'first';`
moved = false; // this tower used its one move this build phase (T0443); RunFlow clears it at the next build's start

// core/run.ts, after `farGateTold = false;`
moveTold = false; // the run's one move-limit tell showed (T0443): a resumed run never re-teaches

// core/saveRun.ts, in SavedRun after `farGateTold: boolean;`
moveTold: boolean; // the move-limit tell showed; older saves predate the field

// ui/hud/MoveTell.ts
export class MoveTell implements HudPart {
  layout(): void; // {}
  update(game: GameScene): void;
}

// Scene registry (CSS px, shared), set by TowerPanel, read by MoveTell:
'moveLineSpot': { x: number; y: number } | undefined
```
No other signatures change. `tower.moved` is never saved (`SavedTower` stays as is — a resume makes fresh `Tower` instances, so it is already the pre-move snapshot).

### Steps
1. `core/run.ts`: add the `moveTold` field (exact line above).
2. `core/saveRun.ts`: interface field after line 68; validation after line 121: `if (p.moveTold !== undefined && typeof p.moveTold !== 'boolean') return undefined;`; in the returned object after `farGateTold: p.farGateTold === true,`: `moveTold: p.moveTold === true,`.
3. `systems/RunSave.ts`: in `persist()` after `farGateTold: run.farGateTold,`: `moveTold: run.moveTold,`; in `restore()` after `run.farGateTold = saved.farGateTold;`: `run.moveTold = saved.moveTold;`.
4. `entities/Tower.ts`: add the `moved` field (exact line above).
5. `systems/Building.ts`, exactly two lines: in `startMove()` make the guard `if (!tower || tower.moved || this.run.phase !== 'build' || this.moveTower) return;`; in `commitMove()` after `tower.moveTo(cell, this.board);` add `tower.moved = true; // the move limit: once per tower per build phase (T0443)`. Touch nothing else in the commit/cancel.
6. `systems/RunFlow.ts`, `finishDraft()` after `this.run.startBuild(seconds);`: `for (const t of this.s.towers.towers) t.moved = false; // the move limit resets with the build phase (T0443)`.
7. `ui/hud/TowerPanel.ts`, in `build()` inside `if (sell)`, wrap the existing move-line block (from `const moveCost = movePrice(...)` through `items.push(moveButton.container);`) in `if (tower.moved) { ... } else { ...existing unchanged... }`; the new branch:
```ts
// The move limit (T0443): this tower moved this build phase — the line reads "moved", dimmed in muted ink with no price, and taps nothing.
const movedButton = makeButton(scene, 0, H / 2 - 16 - SELL_H - ROW_GAP - MOVE_H / 2, '', () => {}, { width: RW, height: MOVE_H, radius: 12, fadeWhenDisabled: false });
movedButton.content.add(scene.add.text(0, 0, 'moved', textStyle(20, PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0.5));
movedButton.content.setAlpha(0.6); // the line's own short-gold dim
movedButton.setEnabled(false);
items.push(movedButton.container);
```
Then after the `const y = Math.max(...)` line (before `this.box =`): `if (sell) scene.registry.set('moveLineSpot', { x, y: y + H / 2 - 16 - SELL_H - ROW_GAP + 14 }); // just under the move line: the T0443 tell's spot`. In the moved branch `this.moveBtn` stays `undefined`.
8. Create `ui/hud/MoveTell.ts` (imports: `type Phaser`, `cssColor, PALETTE` from `../../content/palette`, `type GameScene` from `../../scenes/GameScene`, `textStyle` from `../text`, `type HudPart` from `./hud`; keep `private readonly scene` like `TowerPanel`):
```ts
update(game: GameScene): void {
  if (!game.building.moveTower) { this.clear(); return; } // the move state closed: the line goes with it
  if (game.run.moveTold || this.label) return;
  const spot = this.scene.registry.get('moveLineSpot') as { x: number; y: number } | undefined;
  if (!spot) return;
  this.label = this.scene.add
    .text(spot.x, spot.y, 'one move per build phase', textStyle(14, PALETTE.muted, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 }))
    .setOrigin(0.5)
    .setScale(0);
  this.scene.tweens.add({ targets: this.label, scale: 1, duration: 200, ease: 'Back.easeOut' });
  this.scene.tweens.add({ targets: this.label, alpha: 0, delay: 1500, duration: 300, ease: 'Quad.easeIn', onComplete: () => { this.label?.destroy(); this.label = undefined; } }); // hold ~1.5 s, out 300 ms: ~2 s total, T0314's look
  game.run.moveTold = true; // shown: never again this run, on any tower, in any phase
}
private clear(): void {
  if (!this.label) return;
  this.scene.tweens.killTweensOf(this.label);
  this.label.destroy();
  this.label = undefined;
}
```
9. `scenes/HudScene.ts`: import `MoveTell` (alphabetically between `LevelChips` and `NextWaveButton`), and `new MoveTell(this),` in `parts` directly after `new TowerPanel(this),`.
10. `debug/runChecks.ts`, after the `['building.pending', ...]` line: `['building.moveLimit', (g) => (g.building.moveTower?.moved ? 'a moved tower has its move state open' : null)],`.
11. `tests/core/saveRun.test.ts`: add `moveTold: false,` to `sample()` after `farGateTold: false,`; after the far-gate test add, modeled on it: `it('round-trips a move-told save, and a save written without the key loads as untold', ...)` with `saveRun(store, sample({ moveTold: true }))`, `toEqual(sample({ moveTold: true }))`, delete `without.moveTold` → `toEqual(sample())`, and `broken({ moveTold: 'x' })`.
12. `npm run check`, then `npm run smoke`.

### Pitfalls
- `this.moveBtn` must stay `undefined` in the moved branch — `update()` would then refresh a price text that does not exist.
- The moved line is the same `MOVE_H` × `RW` as the Move button, so panel height and the 412x915 / 1280x720 fit are byte-identical to T0394; the teach line is ~155 px wide, 14 px tall, 52 px above the panel's bottom edge — inside the play area at both sizes.
- Never destroy the tell's label without `killTweensOf` first (WaveCard's pattern); it must vanish when the state closes early (✗, a tap off a free cell, or the build countdown's `cancelPending` → `cancelMove`).
- Set `game.run.moveTold = true` only after the label is created; the registry spot is CSS px on the HUD scene, never board units.
- Don't save or clear `tower.moved` in `RunSave.restore` — fresh instances are already `false` (the pre-move snapshot); the only live-tower path into a new build phase is `finishDraft`.
- Keep the commit (fee, chip, slide, bounce, haptic, T0392 note), cancel, marked-cell follow and sell line byte-identical: the only `Building.ts` edits are the two lines in step 5.

### Tests
- `tests/core/saveRun.test.ts`: `moveTold` in `sample()` plus the round-trip / missing-key / broken-value test (step 11). No other unit tests — the limit itself lives on the `Tower`/`Building`, not in `core/`.
