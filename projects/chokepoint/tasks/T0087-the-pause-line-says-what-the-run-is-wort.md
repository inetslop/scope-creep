---
id: T0087
title: The pause line says what the run is worth
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T00:22:08Z
epic: E1
---

## Goal
A player who pauses can see what the run is worth in coins right now, not only at the claim card — "rewards that carry over" visible where a run is paused.

## Details
- The pause card (T0030) grows one muted line directly under its run-so-far line, above the controls: "worth +N coins" — N is the run's own coin formula (T0001: waves + floor(stopped ÷ 10) + clean) applied to what has happened so far: waves cleared so far, enemies stopped so far, clean waves so far. Read from the run ledger with the same pure formula the payout (T0001) and the claim card's recipe line (T0075) use — never recomputed a second way.
- Muted gray, the run line's own size (~13 px); the pause card grows by one fixed line height, laid out at 1280x720 and 412x915 like the card's existing lines.
- While the run line reads "Ready" (before wave 1), the worth line is not shown — a run that has not started is not yet worth counting.
- Display only: nothing changes on the ledger, the payout, the claim card or the game-over card. No input, no sound.
- Closest example: the run-so-far line (T0030) for placement and style; the recipe line (T0075) for the formula and its plain-numbers honesty.

## Acceptance criteria
- [ ] Pausing mid-wave-3 with 2 waves cleared, 14 stopped and 1 clean wave shows "worth +4 coins" (2 + floor(14 ÷ 10) + 1).
- [ ] Pausing before wave 1 (the run line reads "Ready") shows the run line only — no worth line.
- [ ] The number grows as the run goes: pausing again after wave 3 has cleared shows the risen value; the claim card's payout and recipe are byte-identical.
- [ ] No input and no sound; desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, yoga)

### Files
- edit `src/scenes/PauseScene.ts` — the pause card grows one muted "worth +N coins" line under the run-so-far line (value moves there, out of the run line's end segment)

### Interfaces
None. No new types, functions, files or core rules.

### Steps
All in `PauseScene.create()`, which already computes `const coins = coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves, seed: game.run.seed })` (line 48) — reuse it, never recompute.
1. `const panelH = 434;` → `const panelH = 452;` (one fixed line height of 18, the card's middle-line rhythm).
2. The run line's end segment drops the coins: restText text `` ` · ${game.run.lives} lives · ${game.run.gold} gold · +${coins} coins` `` → `` ` · ${game.run.lives} lives · ${game.run.gold} gold` `` (the value would otherwise be printed twice).
3. Right after the `stats` container line add the worth line:
```ts
const worthText: Phaser.GameObjects.Text | undefined = game.run.wave > 0 ? this.add.text(0, -panelH / 2 + 96, `worth +${coins} coins`, lineStyle).setOrigin(0.5) : undefined;
```
(`lineStyle` is the run line's own `textStyle(13, PALETTE.muted)`; centered, same condition as the run line's 'Ready' word.)
4. Shift the items below the insertion down: heading `-panelH / 2 + 96` → `-panelH / 2 + 114`; keys `150` → `168`; resumeButton `234` → `252`; quitButton `302` → `320`; `actionLine` `122` → `131`; soundRow `374` → `392`.
5. Replace the one-line `box` with:
```ts
const boxKids: Phaser.GameObjects.GameObject[] = [panel, title, stats, heading, keys, actionLine, resumeButton.container, quitButton.container, soundRow.container];
if (worthText) boxKids.push(worthText);
const box = this.add.container(0, 0, boxKids);
```

### Pitfalls
- The panel is center-anchored: top-pinned items sit at `-panelH / 2 + c`, so growing panelH by 18 lifts the top items by 9 px — therefore only the step-4 constants change as listed (top-pinned ones +18; the absolute `actionLine` +9). Wrong constants break the 1280x720 / 412x915 card; the `layout()` scale math stays.
- Create the worth text only when `game.run.wave > 0`: before wave 1 the run line reads 'Ready' and the card shows no worth line at all (not an empty one).
- Do not touch `RewardsScene`, `GameOverScene` or anything in `core/`; no input, no sound, no new listener (`layout`/`onKey` unchanged).
- Mid-wave-3 with 2 cleared, 14 stopped, 1 clean must print `worth +4 coins` (`coinsForRun` = 2 + floor(14/10) + 1).

### Tests
none
