---
id: T0400
title: The near miss gets its note
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T03:05:38Z
---

## Goal
The near miss (T0271) — the wave's last enemy dying within 1.5 cells of the exit — is shown as a small "close" chip but never heard. The close call is one of the run's tensest beats; giving it a soft note makes it felt as well as seen.

## Details
- One new method in `src/audio/Sfx.ts`, `nearMiss()`, placed next to `leakWarn()` (T0014): one soft sine at A3 (~220 Hz), 0.15 s, volume 0.09 — the leak-tick's own quiet class, pitched up a touch and shorter than the leak thud (140→70 Hz, 0.3 s), so the near miss reads as a close call, not the leak itself.
- It plays **once, on the near miss**: the same point where the "close" chip pops — the wave's last kill, that enemy within 1.5 cells of the exit (T0271's own trigger). One new hook file beside the other enemy hooks, registered in `src/systems/enemyHooks/index.ts` (the combo-break-note's own pattern, T0398).
- It plays **never** on an ordinary kill (only the wave's last kill within 1.5 cells of the exit), never on an actual leak (the leak thud plays instead), and never twice in the same moment (no stacking).
- Silent with sound off; no screen change (the chip already shows the moment), no new HUD element, no new key or button.

## Acceptance criteria
- [ ] When the wave's last enemy dies within 1.5 cells of the exit, the soft note plays once, in the same frame the "close" chip pops
- [ ] An ordinary kill and an actual leak (the leak thud) never play it; it is quieter than and shorter than the leak thud
- [ ] Silent with sound off; the chip, the pause screen's controls list and all other feedback are untouched; `npm run check` and the desktop + mobile smoke pass
