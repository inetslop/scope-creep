---
id: T0102
title: Remove the panic pulse
size: S
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T07:01:07Z
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

## Design (architect, narcissus)

### Files
- Delete `src/ui/hud/PanicButton.ts` (whole file).
- Edit: `src/scenes/HudScene.ts`, `src/config.ts`, `src/core/run.ts`, `src/audio/Sfx.ts`, `src/systems/FxSystem.ts`, `src/scenes/PauseScene.ts`, `tests/core/run.test.ts`.

### Interfaces
No new symbols. Removed: `PanicButton` HUD part, `RunState.panic()` + `panicUsed`, `Sfx.panic()`, `FxSystem.panicFlash()`, `PANIC_COST`. Verified these are referenced only by each other and the two files edited below — nothing else (no hooks, invariants, hotkeys) touches panic.

### Steps
1. Delete `src/ui/hud/PanicButton.ts`.
2. `src/scenes/HudScene.ts`: delete the line `import { PanicButton } from '../ui/hud/PanicButton';` and the line `new PanicButton(this, game),` in the `parts` array. Parts lay themselves out independently — no other change.
3. `src/config.ts`: delete `export const PANIC_COST = 25;` and its comment line above it.
4. `src/core/run.ts`: delete (a) `panicUsed = false;` plus its comment line, (b) the whole `panic(cost)` method plus its doc comment, (c) the line `this.panicUsed = false;` inside `startWave()`. Keep `canAfford()`, reroll and everything else byte-identical.
5. `src/audio/Sfx.ts`: delete the `panic(): void { ... }` method plus its doc comment.
6. `src/systems/FxSystem.ts`: delete the whole `panicFlash(x, y)` method plus its doc comment, AND change the config import line to exactly `import { DEPTH } from '../config';`. Keep the `fillRing` import (still used by other fx).
7. `src/scenes/PauseScene.ts`: delete the line `const actionLine = this.add.text(0, 143, 'Panic — clear the board, 25 gold, once per wave', textStyle(12, PALETTE.muted)).setOrigin(0.5);` and the token `actionLine,` in the `boxKids` array (two places). Then close up: `const panelH = 476;` → `const panelH = 460;`, and the soundRow y from `-panelH / 2 + 416` to `-panelH / 2 + 406`. Change nothing else.
8. `tests/core/run.test.ts`: delete both panic tests (`'panics once per wave, for the cost'` and `'cannot panic without the gold, and keeps the panic'`) leaving one blank line between the reroll test and the ledger test; change the import to `import { REROLL_COST, START } from '../../src/config';`.

### Pitfalls
- Step 6's import edit is mandatory: `CELL` was used only inside `panicFlash`, so leaving it in the import fails lint in `npm run check`. `DEPTH` stays (used ~11 other places).
- PauseScene children are all pinned to the card top via `-panelH / 2 + X`; shrinking `panelH` trims from the bottom, so only the two number edits above are correct. Do not re-offset title/stats/keys/resume/quit or any offset changes show as shifted rows.
- The 'Controls' text block in PauseScene mentions Space/Send/F/1-9/+/- — none of that is panic; leave it exactly as-is.
- Do not remove `RunState.canAfford` (generic, still used) or any reroll/streak code.

### Tests
No new tests — the two panic tests are removed with the rule. Done when: `grep -ri panic src tests` prints nothing, `npm run check` passes, and the pause card at 412x915 and 1280x720 shows quit button → 12 px → sound row, no hole where the line was (panel still scales 1 at both sizes).
