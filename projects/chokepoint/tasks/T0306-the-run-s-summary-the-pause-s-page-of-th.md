---
id: T0306
title: "The run's summary: the pause's page of the run so far (the T0304 re-file)"
assignee: inet-racing
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T20:35:44Z
claimed_at: 2026-10-30T22:28:32Z
---

## Goal
A page of the run so far, off the pause: the claim card's own reads while the run is still going, plus which towers are paying — the check a player wants while deciding what to sell (E7) or where to aim (T0114). Re-filed from T0304 without the "richest minute" line: per-minute gold has no data source, and this task adds no run fields.

## Details
- A "Summary" row on the pause card, in the same row pattern as the Enemies / Waves / Bosses reference rows (T0252, T0264, T0277), with a matching line in the controls list (pillar 8). The pause card already carries the three reference rows; Summary joins them as a fourth in the same pattern — the card grows one row and the layout check verifies the fit.
- Tapping it opens a full-screen white card over the dimmed pause, in the references' pattern; the same back affordance the other references use returns to the pause with its state intact.
- The card's lines, top to bottom — the claim card's own reads, reusing its labels and values, none of which the pause card's run line or "worth +N coins" line already shows:
  - the claim card's first line (waves held)
  - Clean, in the claim card's green, only when the run held at least one clean wave (the claim card's own condition, T0033)
  - Stopped
  - Score with its muted recipe line (the score's own formula, T0083)
  - Best combo ×N — yellow at ×10 and up (the milestone color, T034)
  - the board seed line (T0056, muted)
  - Flawless with the record star, when the claim card's own rule holds so far (every held wave clean, at least one held; T0076)
- Below them, a "By tower" section: one row per tower built this run — the end card's by-tower chip (first augment's icon, tier pip, "×N" kills; T0216, T0228) with the panel's muted "≈ N/s" line (T0084) under it — sorted by kills, highest first; a run with no towers hides the section.
- Every value is read from an existing read (the run ledger, the combo max the claim card reads, the per-tower kills and ≈N/s the panel reads) — no new fields on the run, profile or ledger (T0304's bar, kept). The page is built from the claim card's line data, so when T0291 adds its level-multiplier line to the claim card, the page shows it too as one more line.
- The card grows to its content like the reference cards (a long run's by-tower rows wrap in a column); the longest realistic values fit at 412x915 and 1280x720 (the layout check, T0226, runs in the smoke test).

## Acceptance criteria
- [ ] The pause card shows a "Summary" row in the references' row pattern with a matching line in the controls list; tapping opens the page, and back returns to the pause with its state intact.
- [ ] The page's lines, top to bottom, read the same values with the same labels as the claim card (waves held, clean, stopped, score + recipe, best combo, board seed, flawless-when-earned); no line repeats the pause card's run line (wave, lives, gold, coins) or its worth line.
- [ ] The "By tower" section lists every tower built this run with its chip, kills and "≈ N/s", sorted by kills descending; a run with no towers shows no section.
- [ ] No new fields on the run, profile or ledger: every value comes from an existing read.
- [ ] The page and the pause card with its new row fit at 412x915 and 1280x720 — the layout check passes.
- [ ] The gate (typecheck, lint, unit tests, smoke on desktop and mobile) passes.

## Design (architect, desktop)

### Files
- create `src/scenes/SummaryScene.ts` - the run-so-far page: a full-screen white card over the dimmed pause, in the EnemiesScene/WavesScene/BossesScene reference pattern
- edit `src/scenes/keys.ts` - add `summary: 'Summary',` to `SCENES`, directly after `bosses: 'Bosses',`
- edit `src/main.ts` - import `SummaryScene` (after the `RewardsScene` import) and add it to the `scene:` array after `BossesScene,`
- edit `src/scenes/PauseScene.ts` - one CONTROLS line, the fourth reference button row, the +1 row in the card height, its placement, and its boxKids entry

### Interfaces
No new types. `SummaryScene extends Phaser.Scene`, `constructor() { super(SCENES.summary); }`, private `panelW = 340`, `panelH = 0`, `box`, `shade`, `back`, `closed` (copy the field set from `EnemiesScene.ts`).

### Steps
1. **`keys.ts`**: one line in `SCENES` after `bosses: 'Bosses',`: `summary: 'Summary',`.
2. **`main.ts`**: `import { SummaryScene } from './scenes/SummaryScene';` after the RewardsScene import; in the `scene:` array add `SummaryScene,` after `BossesScene,`.
3. **`PauseScene.ts`** (four small changes, all next to the existing reference-row code):
   - `CONTROLS`: after `'Bosses — the bosses and their trick',` add `'Summary — the run so far: score, combo, by tower',`.
   - After the `bossesButton` block: `const showSummary = (): void => { if (closed) return; this.scene.launch(SCENES.summary); this.scene.pause(); /* the pause card's Escape key must not fire under the reference */ };` and `const summaryButton = makeButton(this, 0, 0, 'Summary', showSummary, { width: 240, height: 52, radius: 26 });`.
   - Height line: append `+ GAP_S + 52` to the existing `h += GAP_B + 56 + ... + PAD;`.
   - After `y += GAP_S; bossesButton.container.setY(cy(52));` add `y += GAP_S; summaryButton.container.setY(cy(52));`, and add `summaryButton.container` to `boxKids` after `bossesButton.container` (forgetting boxKids leaves the button un-scaled/un-moved).
4. **`SummaryScene.ts`**: copy `EnemiesScene.ts`'s `create()` skeleton exactly (shade `PALETTE.ground` 0.78 origin 0 interactive, `hook.overlay = SCENES.summary`, `doBack` = blip + `hook.overlay = SCENES.pause` + `this.scene.start(SCENES.pause)`, the 48px round ink back button with the white arrow graphic, `layout` = shade setSize + `box.setPosition(w/2, h/2).setScale(Math.min(1, (w-24)/panelW, (h-24)/panelH))` + `back.container.setPosition(width - EDGE - 24, 40)`, `onResize`, and `if (flags.smoke) this.time.delayedCall(1000, doBack);`). `build()`:
   - Reads (all existing, from `const run = getGameScene(this).run` and `getGameScene(this).towers.towers`): title `'Summary'` `titleStyle(28)`; then the claim card's own reads, labels/values/colors from `RewardsScene.ts`: `Waves held ${run.wavesCleared}` `titleStyle(22)`; `Clean ${run.cleanWaves}` `titleStyle(22, PALETTE.greenDeep)` only when `run.cleanWaves > 0`; `Stopped ${run.kills}`; `Score ${run.score}`; muted recipe `waves +${run.wavesCleared * 100} · stopped +${run.kills}` `titleStyle(16, PALETTE.muted)`; `Best combo ×${run.bestCombo}` only when `run.bestCombo >= 2`, `titleStyle(22, run.bestCombo >= 10 ? PALETTE.yellow : PALETTE.muted)`; `Board ${boardCode(run.seed)}` `titleStyle(22, PALETTE.muted)`; `Flawless` `titleStyle(22, PALETTE.muted)` + `artScale(star image, 1.5)` at `width/2 + 13, y + 1` only when `run.wavesCleared === run.cleanWaves && run.wavesCleared > 0`. (No coins/coin-recipe lines — the pause's worth line already pays.)
   - By tower: `entries = towers.map((t) => ({ first: t.augments[0]?.id, tier: t.augments[0]?.tier, kills: t.kills, perSec: Math.floor(towerDps(t.spec, t.rallyRateMul)) })).sort((a, b) => b.kills - a.kills || (a.first ?? '').localeCompare(b.first ?? ''))` (imports: `towerDps` from `../core/towerDps`, `boardCode` from `../core/boardCode`, `augmentTexture, STAR_TEXTURE, artScale` from `../art/textures`, `pipColor` from `../entities/towerLook`).
   - Layout, top-down like the pause card: `PAD 28, GAP 10, GAP_BIG 20, CHIP_W 64, CHIP_H 34, GAP_X 8, PER_ROW 4, ROW_GAP_Y 10, LINE_H 14, ENTRY_H = CHIP_H + 4 + LINE_H`. `h = PAD + title.height + GAP + Σ(line.height + GAP except last) + (entries.length ? GAP_BIG + heading.height + GAP + entryRows * ENTRY_H + (entryRows - 1) * ROW_GAP_Y : 0) + PAD`. Card `makeCard(…, this.panelW, panelH, 28)`; place with a `y` cursor and `cy()` exactly in that order. The 'By tower' heading (`textStyle(13, PALETTE.ink, { fontStyle: 'bold' })`, origin 0.5) is created **only when `entries.length > 0`** (an unused text left at 0,0 would float on screen). Entry row: chip copied from `ui/byTower.ts` (64×34 card radius 12, `augmentTexture` at `(-CHIP_W/2+14, 0)` artScale 0.7, tier pip `fillCircle(-10, 8, 4)` `pipColor(t.tier)`, `×${t.kills}` `textStyle(12, PALETTE.ink, { fontStyle: 'bold' })` at x 8) plus, only when `t.perSec >= 1` (the panel's condition), `≈ ${t.perSec}/s` `textStyle(11, PALETTE.muted)` centered under the chip. Push every created object to `parts`.

### Pitfalls
- Every text/image (incl. the flawless star) must go into `box`'s `parts`, or it stays at the scene origin and the scaled card leaves it behind.
- The height formula and the placement cursor must use identical gaps — recompute `h` from the same constants, don't hand-pick a y.
- No towers → no 'By tower' heading and no section, and no trailing gap (`entries.length ? … : 0`).
- Back restarts the pause with `this.scene.start(SCENES.pause)` (GameScene stays paused, so the run stays put) and restores `hook.overlay = SCENES.pause`.
- Values are read once in `create()`: while open, GameScene is paused, so nothing changes — no `update()`, no `dt`.
- A sold tower is gone from `towers.towers`; that is the same live read the end card uses — do not invent a run-level per-tower ledger.
- Fullest state: all 8 read lines + 6 rows of 4 towers ≈ 740px card; it scales like the references, so 412×915 and 1280×720 both fit.

### Tests
- none (UI only; no core logic added)
