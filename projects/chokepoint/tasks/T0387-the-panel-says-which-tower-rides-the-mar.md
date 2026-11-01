---
id: T0387
title: The panel says which tower rides the marked cell
assignee: desktop-4070
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T23:16:36Z
claimed_at: 2026-11-01T23:37:09Z
epic: E16
---

## Goal
The tower panel shows the marked cell's buff on the tower that stands on it: the cell's painted dot hides under a built tower and nothing on screen today says a selected tower is buffed, so a first-time player cannot tell a 1.25× tower from a plain one mid-run.

## Details
- A new muted line in the tower panel (the selected tower's white card above the hand, `src/ui/hud/TowerPanel.ts`), in the panel's own muted-read style (the kills line and the ≈N/s DPS line are the closest examples): shown only while the selected tower stands on the board's marked cell (the tower's own cell multiplier, the `cellMul` the tower already carries, is above 1).
- The line reads "marked · +25% damage" — the +N derived from the tower's live buff ((cellMul − 1) × 100, rounded: 25 at the plain 1.25×, 50 once The rich cell's node raises the cell to 1.5×, T0386) — never a hard-coded number, so the node's effect shows on the tower without any further task.
- No other change: the cell's painted dot, the pick screen's "one cell · +N% damage" line and the boards reference are untouched; a tower off the marked cell shows no line; the panel's rows grow to fit their text as they already do.
- Nothing shown twice: the dot marks the cell on the board and the pick screen says it before the run; this line is the first place the number rides on the tower itself, next to the tower's own stats.

## Acceptance criteria
- [ ] Selecting a tower that stands on the marked cell shows exactly one new muted line, "marked · +25% damage" (plain board, node unbought), in the kills/DPS lines' own style; selecting any other tower or closing the panel shows nothing new.
- [ ] With The rich cell owned (T0386), the same line on a marked-cell tower reads "marked · +50% damage" — read from the tower's live buff, nothing hard-coded.
- [ ] Every other panel line (augment cards, stats, kills and DPS lines, slots, the sell line and its price) and the cell's painted dot are byte-identical to before; the card fits at 412x915 and 1280x720 with the line showing.
- [ ] The game is playable menu to game over on desktop and mobile, including a resumed run with a tower on the marked cell.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/TowerPanel.ts` — one new muted line in the tower panel for a selected tower standing on the board's marked cell, read from the tower's live `cellMul` (`src/entities/Tower.ts:52`); no other file touched (PickScene's "one cell · +N% damage" and the painted dot stay untouched).

### Interfaces
No new types or exports. One module-level function added to `TowerPanel.ts` (next to `statsLine` at the end of the file):

```ts
/** The marked line: "marked · +N% damage", N from the tower's live cell multiplier, never hard-coded. */
function markedLine(tower: Tower): string {
  return `marked · +${Math.round((tower.cellMul - 1) * 100)}% damage`;
}
```

### Steps
1. Next to `DPS_LINE` (line 26) add: `const MARKED_LINE = 14; // one muted line, like DPS_LINE`.
2. Add a private field next to `killsText` (line 40): `private markedText: Phaser.GameObjects.Text | undefined;`, and add `this.markedText = undefined;` next to the `this.killsText = undefined;` reset in `build()` (line 74).
3. In `build()`, next to `const sell = ...` (line 83) add `const marked = tower.cellMul > 1; // stands on the board's marked cell`. Grow the card: in the `H` line (line 90) insert `+ (marked ? MARKED_LINE : 0)` after the `DPS_LINE` term, and reword its comment to "room for the marked, kills and damage-per-second lines".
4. In `build()`, immediately above the kills line (line 144) add:
```ts
if (marked) {
  this.markedText = scene.add.text(left, H / 2 - 79 - below - 2 * DPS_LINE, markedLine(tower), textStyle(11, PALETTE.muted)).setOrigin(0, 0);
  items.push(this.markedText);
}
```
5. In `update()`, right after the existing uiVersion/phase rebuild block, add:
```ts
const tower = game.building.selectedTower;
if (this.markedText !== undefined !== (tower !== undefined && tower.cellMul > 1)) {
  // the cell's multiplier flipped without a selection or phase change: rebuild so the line appears or clears
  this.builtVersion = game.building.uiVersion;
  this.builtPhase = game.run.phase;
  this.build(game);
}
```
(then delete the later duplicate `const tower = ...` line, keeping just this one) and, after the existing `killsText.setText` line add:
```ts
if (this.markedText && tower) this.markedText.setText(markedLine(tower)); // no-op while unchanged
```
6. Keep the line exactly 14px above the kills line (`H / 2 - 79 - below - 2 * DPS_LINE`), same `textStyle(11, PALETTE.muted)` and `left` x as kills/DPS — it fits: "marked · +25% damage" is ≈105px inside the 286px card row, no wordWrap, no numbers wide enough to grow.

### Pitfalls
- The card is anchored at its bottom (`height - HUD.bottom - 10 - H / 2`), so the +14 of `H` grows the card upward and the other lines' y (all measured from `H/2`) shift up 7px only while the line is shown; off-marked towers keep `H` and every line exactly as before. Fullest state (4 grown rows + sell line, 412x915) tops out ~219px from screen top, clear of HUD.top (72).
- `cellMul` is 1.25/1.5 exactly representable, so `Math.round((cellMul − 1) × 100)` is 25/50, no float fuzz; the `setText` no-op pattern (like `killsText`) keeps the update free of churn.
- The presence test is `tower !== undefined && tower.cellMul > 1` in both `build()` and the flip check — if you write them differently the flip check can loop or strand a line.
- Push the text into `items` before the slot row so z-order matches the kills line; never `destroy()` the text separately (the whole box is rebuilt on `uiVersion`).

### Tests
none
