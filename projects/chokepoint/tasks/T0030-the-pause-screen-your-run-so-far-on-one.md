---
id: T0030
title: "The pause screen: your run so far on one line"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T06:24:55Z
epic: E1
---

## Goal
A paused player sees the whole run at a glance — wave, lives, gold and the coins this run has already earned — on one line, so the run's ledger (what E1 keeps) is readable without hunting across the HUD.

## Details
- One file: the pause scene (`src/scenes/PauseScene.ts` — the white rounded pause card; confirm the file name when you start). One text line added at the top of the pause card, above the key list:
  - `Wave 8 · 20 lives · 45 gold · +3 coins` — 13 px muted-gray bold, the exact style of the HUD's "+N coins" line (T0013), with the same " · " separators.
- The values come from the live run state (the run is frozen while paused, so the line is static while the pause is open): the wave number, the lives, the gold, and the run's coin tally — the same number the HUD's "+N coins" line shows and the same one the game-over screen ends on.
- If any of the four values is already shown on the pause card, add only what is missing; the end state is all four on one line, in this order, separated by " · ".
- No reflow: the line fits on one line at 412x915 and 1280x720 (about 230 px in 13 px bold, well inside the card); nothing else on the pause card moves, resizes or rewraps.
- No new input, no new sound; the key list on the pause screen is unchanged.
- Closest examples: the HUD StatsCard's coin line (T0013) for the text style, and the menu profile card's lines (T0007) for a white-card line layout.

## Acceptance criteria
- [ ] Pausing a run shows one line at the top of the pause card: "Wave N · X lives · Y gold · +Z coins", and the four values match the HUD's wave, lives, gold and the "+N coins" tally.
- [ ] Pause mid-wave, resume, let a few enemies walk, pause again: the line shows the current values, and the coin number still equals the HUD tally.
- [ ] The line fits on one line at 412x915 and 1280x720 in the pause card's existing style; no other element on the card moves.
- [ ] No new key or button, and the key list below the line is unchanged.

## Design (architect, yoga)

### Files
- edit `src/scenes/PauseScene.ts` — one new text line between the "Paused" title and the Resume button. Only file changed.

### Interfaces
None. No types, systems or scenes change; all values come from the existing `game.run` and `coinsForRun()` (`src/core/profile.ts`, same call `StatsCard.update()` makes at `src/ui/hud/StatsCard.ts:41`).

### Steps
1. Imports: change `import { titleStyle } from '../ui/text';` → `import { textStyle, titleStyle } from '../ui/text';`, and add `import { coinsForRun } from '../core/profile';` right after the `PALETTE` import line.
2. In `create()`, after the `const title = ...` line (line 42), add:
```ts
const waveWord = game.run.wave > 0 ? `Wave ${game.run.wave}` : 'Ready';
const coins = coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves });
const stats = this.add
  .text(0, -panelH / 2 + 82, `${waveWord} · ${game.run.lives} lives · ${game.run.gold} gold · +${coins} coins`, textStyle(13, PALETTE.muted))
  .setOrigin(0.5);
```
3. Add `stats` to the box children: `this.add.container(0, 0, [panel, title, stats, resumeButton.container, quitButton.container])`.

### Pitfalls
- Style is `textStyle(13, PALETTE.muted)` with NO `fontStyle: 'bold'` — exactly `StatsCard.ts:29`, the "+N coins" line (T0013); muted text is never bold anywhere in the game. Do not "fix" it to bold.
- `waveWord` mirrors `WaveCard.ts:24` exactly, so before the first wave the line reads "Ready · …", same as the HUD wave card.
- y = `-panelH / 2 + 82` (i.e. -48) is the existing 28 px gap between the title's bottom and the Resume button's top. Do NOT touch the title (`+48`), Resume (`+124`), Quit (`+196`) y values, their sizes, the shade or the `layout` function — no reflow.
- Values are computed once in `create()` — correct because the run is frozen while paused and PauseScene is re-created on every open (`GameScene.openPause` launches it), so re-pausing shows fresh values. No `update()`, no tweens, no listeners, nothing to clean up.
- Longest possible line ≈ 300 px < 360 px card, and the box scale is `Math.min(1, …)` = 1 at both 412x915 and 1280x720, so it stays one line in both.
- The task text mentions a "key list" on the card; there is none — only the two buttons, which stay unchanged. No new input, no sound.

### Tests
none

## Note (by hand, 2026-10-28)

No longer waits on T0019: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.
