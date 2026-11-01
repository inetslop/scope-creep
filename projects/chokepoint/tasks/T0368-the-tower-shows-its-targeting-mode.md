---
id: T0368
title: The tower shows its targeting mode
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T17:18:47Z
---

## Goal
T0114's per-tower targeting mode (First / Strongest / Closest) is only visible in the selected tower's panel and on the pause screen. Make it readable across the whole board: a tower that is not on First wears one small notch on its plinth, and the first time a mode is chosen this run, a chip over the tower says what it means.

## Details
- **The plinth notch.** Every tower whose mode is Strongest or Closest wears one short muted-ink tick on its plinth, ~2 px, clear of the tier pip row (the face's free corner or the plinth's top edge — the plinth's look owns the exact spot). Muted ink, like the pips; no color and no per-mode shape: one mark, one meaning — "this tower is off First" — while the mode's own words stay where they are (the panel, the chip, T0114's pause line). It appears and clears the moment the mode changes, and it clears with the tower when it sells (the mode rides T0114's `targetMode`, so the notch is drawn from it every frame). A run in which no tower ever leaves First is byte-identical to today. It is a state read on the tower, in the family of the quiet idle dot (towerIdle) and the milestone ring (T0270) — not a cell hint: the removed T0140 notch painted the cells, this marks nothing about the board.
- **The one-time chip.** The first time this run a tower is switched to Strongest, a small white chip pops over that tower for ~1.5 s: "strongest · most hp". The first switch to Closest: "closest · nearest the tower". One chip per mode per run (at most two), the same small white chip as the new-enemy name chip (T0085) and the wave-tag chip (T0092). Switching back to First never chips — the notch simply clears. The run remembers what it has taught, through resume (T0085's once-per-type-per-run pattern): a resumed run never re-fires a chip that has already shown.
- **Display only.** No change to targeting behavior, no sound, no HUD card, no pause-screen change. The plinth face already wears the tier pip row, and the tower already wears its augment marks and its working ring: one ~2 px tick in the free corner says across the board what the panel says one tower at a time. Nothing is replaced.

## Acceptance criteria
- [ ] Set a tower to Strongest or Closest in its panel: the muted tick appears on its plinth, clear of the pip row; switch it back to First and it clears; a tower on First is byte-identical to today.
- [ ] The first switch this run to Strongest pops a small white chip over that tower for ~1.5 s reading "strongest · most hp" (Closest: "closest · nearest the tower"); a later switch to the same mode chips nothing; a resumed run never re-fires a chip that has already shown.
- [ ] Targeting, sound, the HUD and the pause screen are all unchanged; a run that never changes a mode is byte-identical to today.

## Design (architect, yoga)

### Files
- create `src/systems/fx/modeChip.ts` — the one-time white chip ("strongest · most hp" / "closest · nearest the tower"), a copy of `systems/fx/nameLabel.ts` retimed to ~1.5 s
- edit `src/core/run.ts` — 2 new fields, after `blockTold` (line 55)
- edit `src/core/saveRun.ts` — SavedRun interface (after line 64), validation (after line 114), load result (after line 158)
- edit `src/systems/RunSave.ts` — persist (after line 54) and restore (after line 82), like the `blockTold` lines
- edit `src/entities/Tower.ts` — private `modeTick` graphics + public `setModeTick()`, called from `refresh()`; in `sellAway()` and `destroy()`
- edit `src/ui/hud/TowerPanel.ts` — one import + the mode-chip `pointerup` handler (lines 104-110)
- edit `tests/core/saveRun.test.ts` — `sample()` fields + one round-trip test

### Interfaces
```ts
// core/run.ts, after `blockTold = false;`
modeStrongestTold = false; // the run's one strongest-mode chip showed (T0368): a resumed run never re-teaches
modeClosestTold = false; // the run's one closest-mode chip showed (T0368)

// core/saveRun.ts SavedRun (optional: older saves predate them), after `blockTold: boolean;`
modeStrongestTold?: boolean;
modeClosestTold?: boolean;
// validation, after the blockTold check:
if (p.modeStrongestTold !== undefined && typeof p.modeStrongestTold !== 'boolean') return undefined;
if (p.modeClosestTold !== undefined && typeof p.modeClosestTold !== 'boolean') return undefined;
// load result, after `blockTold: p.blockTold === true,`
modeStrongestTold: p.modeStrongestTold === true,
modeClosestTold: p.modeClosestTold === true,

// entities/Tower.ts — the plinth notch, a state read on the tower (never in DECORATIONS: a Decoration gets spec, not targetMode)
setModeTick(): void {
  const g = this.modeTick;
  g.clear();
  if (this.targetMode === 'first') return;
  g.fillStyle(PALETTE.muted, 1);
  g.fillRoundedRect(-3.5, -21.7, 7, 2.4, 1.2); // plinth's top edge, centred: clears the pip row (y + 22) and the Frost ring (r 20.4±1.5 at y - 4)
}
// field after `idleDot` (line 34); in constructor after line 87: this.modeTick = scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(x, y);
// refresh(): this.setModeTick(); after this.drawPips();  sellAway() parts array and destroy(): + this.modeTick

// systems/fx/modeChip.ts
export function modeChip(fx: FxSystem, x: number, y: number, mode: 'strongest' | 'closest'): void
```

### Steps
1. `run.ts`: the two fields.
2. `saveRun.ts`: the three edits (interface, validation, load).
3. `RunSave.ts`: persist `modeStrongestTold: run.modeStrongestTold,` / `modeClosestTold: run.modeClosestTold,` after the blockTold line; restore `run.modeStrongestTold = saved.modeStrongestTold;` / `run.modeClosestTold = saved.modeClosestTold;` after line 82.
4. `Tower.ts`: field, constructor line, `setModeTick()`, `refresh()` call, `sellAway()` parts, `destroy()`.
5. Create `src/systems/fx/modeChip.ts` — duplicate `nameLabel.ts` body: early return on `fx.full`; text `mode === 'strongest' ? 'strongest · most hp' : 'closest · nearest the tower'`; same inlined font (12 px bold, `cssColor(PALETTE.muted)`, `resolution: 1 / fx.scene.scale.zoom`); chip at `(x, y - 32)`; `fx.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' })`; `fx.track(chip, 100, { alpha: 0, delay: 1200, ease: 'Quad.easeIn' });` (200 + 1200 + 100 ≈ 1.5 s).
6. `TowerPanel.ts`: import `import { modeChip } from '../../systems/fx/modeChip';` after the GameScene import; in the chip handler, after `chipLabel.setText(...)`, before `getSfx(scene)?.blip();`:
```ts
tower.setModeTick();
const mode = tower.targetMode;
if (mode !== 'first') {
  if (!(mode === 'strongest' ? game.run.modeStrongestTold : game.run.modeClosestTold)) {
    if (mode === 'strongest') game.run.modeStrongestTold = true;
    else game.run.modeClosestTold = true;
    modeChip(game.fx, tower.x, tower.y, mode);
  }
}
```
7. `tests/core/saveRun.test.ts`: `sample()` gains `modeStrongestTold: false, modeClosestTold: false,` after `blockTold: false,`; new `it(...)` after the block-told test: save `sample({ modeStrongestTold: true, modeClosestTold: true })`, expect `toEqual`; delete both keys from a written save, expect `toEqual(sample())`; `broken({ modeStrongestTold: 'x' }); broken({ modeClosestTold: 'x' });`.

### Pitfalls
- `modeTick` must be in `sellAway()`'s parts and `destroy()` — otherwise the tick survives the sell fade or leaks.
- `setModeTick()` in `refresh()` is what makes a resumed tower show its notch: `RunSave.restore` sets `targetMode` before `addAugment` → `refresh`. Don't call it only from the panel.
- Set the told flag BEFORE `modeChip` (the `haulerTold`/`blockTold` pattern): even if `fx.full` suppresses the chip, the run counts it taught.
- No import from `ui/` in `modeChip.ts` (it drags in debug/flags and breaks Node tests) — inline the font string like `nameLabel.ts`.
- Tick at top-edge centre only: face corners are crossed by the base rings (Anchor r 22.5, Toll 25.3, Mark 27.5); the pip row (y + 22, x −15…15) is untouched.
- `first` mode: graphics cleared → nothing painted → a First tower is byte-identical to today.
- Total chip life ~1.5 s via the `delay: 1200` in the track tween, not a manual timer.

### Tests
- `tests/core/saveRun.test.ts`: the new round-trip/older-save/corrupt test above (the save fields are the only new rule).
