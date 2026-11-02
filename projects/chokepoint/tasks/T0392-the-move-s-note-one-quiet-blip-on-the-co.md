---
id: T0392
title: "The move's note: one quiet blip on the commit"
size: S
priority: 2
status: todo
depends_on: [T0382]
attempts: 0
created: 2026-11-02T00:02:34Z
epic: E15
---

## Goal
The move (T0382) is the panel's priciest action after the sell, and the sell already has its note (T0390): the move's commit should be heard at the moment it happens, the way the speed toggle's flip is heard (T0315).

## Details
- One new method in `src/audio/Sfx.ts`, `moveBlip()`, placed next to `speedBlip()`: one 60 ms sine, ~D5, volume 0.1 — the speed-blip's own quiet class (never above the build chime's).
- It plays **once, at the move's commit**: the same point where T0382's ✓ pays the fee, pops the −N chip at the old cell and starts the ~300 ms slide. One call site, next to that commit (the single flip-point pattern T0315 used in `WaveSpeed.toggle()`).
- It plays **never** on a cancelled move (✗, or a tap elsewhere), never on a rejected one (not enough gold, no free cell in reach), and never a second time (the one-move-per-build-phase limit means no second commit on the same tower; other towers play their own).
- Silent with sound off; no screen change, no new HUD element.

## Acceptance criteria
- [ ] Committing a move plays the blip once, in the same frame the slide starts and the −N chip pops
- [ ] Cancelling the move state (✗ or a tap elsewhere) plays nothing; a failed commit (gold short) plays nothing
- [ ] With sound off the commit is silent; the pause screen's controls list is unchanged (no new key or button)
- [ ] `npm run check` and the desktop + mobile smoke pass

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` — add the method `moveBlip()`, placed directly after `speedBlip()` (which ends at line 253, before `comboChime()`)
- edit `src/systems/Building.ts` — one line at T0382's move commit (T0382 is built before this task; its commit is where ✓ pays the move fee, pops the −N chip at the old cell and starts the ~300 ms slide — the method T0382 adds, next to `sellTower()`; if it lives in another file, name that file in the commit and put the line there instead)

### Interfaces
```ts
// in class Sfx (src/audio/Sfx.ts), directly after speedBlip():
/** The move commits: one D5 (587 Hz), 60 ms, the speed-blip's quiet class. */
moveBlip(): void {
  this.tone(587, 0.06, 'sine', 0.1);
}
```
One call site, exact line: `this.sfx?.moveBlip();`

### Steps
1. Add the `moveBlip()` method to `Sfx` between `speedBlip()` and `comboChime()` (never at the class end).
2. In T0382's code, find the move commit: the single point where the move fee leaves the gold, the "−N" chip pops at the old cell and the ~300 ms slide starts. Add exactly the one line `this.sfx?.moveBlip();` there, next to the fee-pay / chip lines — the single flip-point pattern of `WaveSpeed.toggle()` (which calls `this.sfx?.speedBlip(...)` where the flip happens).
3. Run `npm run check` and `npm run smoke`.

### Pitfalls
- The line goes only on the commit (success) path: never on ✗/cancel, a tap elsewhere, gold-short or no-free-cell — those keep only their existing `deny()`/hint sounds.
- `tone()` already returns silent when muted or the audio context is locked: add no muted guard, no other call site, no change to `WaveSpeed`.
- D5 is 587 Hz — not 659 (E5, the coin/speed-down note); duration 0.06 s, volume 0.1, type `'sine'`, no `slideTo`/delay arguments.
- One commit, one blip: the one-move-per-build-phase limit means the same tower never commits twice; other towers' commits play their own blip from the same one line.
- No key, button, HUD or screen change; the pause screen's controls list is untouched.

### Tests
- none
