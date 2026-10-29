---
id: T0102
title: Remove the panic pulse
size: S
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T07:01:07Z
claimed_at: 2026-10-29T07:01:47Z
designer: narcissus
---

## Goal
The panic pulse (T0063: pay 25 gold once per wave and every enemy on the board vanishes) leaves the game. Remove it completely: no button, no rule, no sound, no line on the pause screen.

## Details
- Everything T0063 added goes, and nothing else changes. Where it lives today:
  - `src/ui/hud/PanicButton.ts`: the button (delete the file), and its line and import in `src/scenes/HudScene.ts`;
  - `src/config.ts`: `PANIC_COST`;
  - `src/core/run.ts`: the `panicUsed` field, the `panic(cost)` method and its reset in `startWave()`;
  - `src/audio/Sfx.ts`: `panic()`; `src/systems/FxSystem.ts`: `panicFlash()`;
  - `src/scenes/PauseScene.ts`: the "Panic — clear the board, 25 gold, once per wave" line, and the room the card made for it;
  - `tests/core/run.test.ts`: the panic tests.
- The HUD and the pause card close up where the button and the line were: no empty gap.
- Mend (T0095) mentions the panic clear only to say it is not a kill; leave that task as it is.

## Acceptance criteria
- [ ] No panic button during a wave, at 412x915 and 1280x720, and the HUD around where it was looks as it did before T0063.
- [ ] The pause screen has no panic line and no gap where it was.
- [ ] No "panic" is left anywhere in `src/` or `tests/`.
- [ ] Gold, waves and every other control work as before.
