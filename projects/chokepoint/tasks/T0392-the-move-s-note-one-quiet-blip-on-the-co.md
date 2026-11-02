---
id: T0392
title: "The move's note: one quiet blip on the commit"
size: S
priority: 2
status: designing
depends_on: [T0382]
attempts: 0
created: 2026-11-02T00:02:34Z
claimed_at: 2026-11-02T00:08:48Z
epic: E15
designer: yoga
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
