---
id: T0274
title: "Sell: the panel's line that sells a misplaced tower back"
assignee: baby-mama
size: M
priority: 2
status: todo
depends_on: []
attempts: 1
created: 2026-10-30T09:46:01Z
epic: E7
design_attempts: 1
---

## Goal
A mistake can be fixed mid-run (E7): in the build phase the tower panel wears a "Sell · +N" line that lifts the tower out and pays 70% of what its slots cost — a misplaced tower is not permanent, and selling costs 30% of the tower, so it is a fix, not a free repick. (Re-file of T0263, whose failure was an architect context overflow before any design; the line stands as written, tightened below.)

## Details
- **The line (the tower panel, the buy-slot line's own pattern — read that line first):** while a tower is selected **in the build phase**, the panel wears a bottom line, "Sell · +N": N is 70% of what the tower's slots cost, floored — the same slot prices the buy-slot line pays. No line in the wave phase or the draft. The line is always active while shown (selling pays gold; it never runs short).
- **The sell:** tap the line and the tower lifts out of the board with a short rise-and-fade (~200 ms, the drop-in bounce's tempo, T0022's board juice), its cell frees, and the gold pays at the plinth: the gold pop (T0039's shape) and one coin sliding to the stats card's gold number (T0061's trail). The augments are gone — selling is a refund, not a retrieve; nothing returns to the hand. The panel closes (no tower left to select).
- **Supports stop working the same frame:** a sold Rally stops speeding its neighbors, a sold Anchor stops rooting, a sold Mint stops paying, a sold Toll stops collecting — the auras read the towers standing, and a sold tower is gone from them.
- **The books:** the run's gold grows by N (the stats card's gold number reacts as on any gold gain; the run's coin tally is untouched — selling is neither a wave nor a kill). The tower's kills stay in the run's totals (the score's stopped count, the combo history) and the end card's by-tower list shows only towers standing at run end — a sold tower is not in it (T0216).
- **The pause screen (Pillar 8):** the controls line gains "Sell — the panel's line, build phase only", listed like the other build actions (T0245's tidy column absorbs it).
- **Resume:** a sell is part of the current build phase, like a placement; the run's phase-boundary save already covers it — a sell before the wave starts is in the wave-phase save, and a sell after the tab closed is undone on resume, exactly like an unsaved placement.
- **What it is for:** the sunk-cost habit — a tower placed beside the wrong bend costs 30% of its slots to move on from, and its augments do not come back, so selling is the last resort, not the plan.

## Acceptance criteria
- [ ] In the build phase, a selected tower's panel wears a bottom line "Sell · +N" with N = 70% of its slots' cost, floored (a fresh one-slot tower sells for 70% of the first slot's price); the line is absent in the wave phase and in the draft.
- [ ] Tapping it lifts the tower out, frees its cell (buildable again in the same phase), and pays N gold: the gold pop at the plinth, one coin sliding to the stats card's gold number, the gold number growing by N, the coin tally unchanged.
- [ ] The tower's augments do not return to the hand and the panel closes.
- [ ] A sold support stops working immediately: a sold Rally's neighbors attack at their own rate the same frame, a sold Mint pays nothing on the next kill, a sold Toll collects nothing on the next leak.
- [ ] The tower's kills stay in the run totals; the end card's by-tower list omits the sold tower.
- [ ] The pause screen's controls line lists the sell; the pause card with the new line fits at 412x915 and 1280x720.
- [ ] A sell during the build phase survives to the wave (it is in the wave-phase save) and is undone on resume from the build-phase save, like an unsaved placement.

## Design (architect, baby-mama)

### Files
- edit `src/core/techEffects.ts` - add `sellPrice(slots, discount)`: 70% of the tower's unlocked slots' `slotPrice(i, discount)`, floored
- edit `src/systems/Board.ts` - `place()` accepts `Tower | undefined`; passing `undefined` frees the cell
- edit `src/entities/Tower.ts` - add `sellAway()`: rise + fade ~200ms in the drop-in's bounce tempo, then `destroy()`
- edit `src/systems/TowerSystem.ts` - add `sell(tower): number` (pays gold, frees cell, splices, returns gold)
- edit `src/systems/Building.ts` - add `sellTower()`: build-phase gate, gold pop + coin, close panel
- edit `src/ui/hud/TowerPanel.ts` - add "Sell · +N" bottom line (build phase only) + `builtPhase` so a phase change rebuilds it
- edit `src/scenes/PauseScene.ts` - one CONTROLS line: `Sell — the panel's line, build phase only`
- edit `tests/core/techEffects.test.ts` - unit test for `sellPrice`

### Interfaces
```ts
// src/core/techEffects.ts
export function sellPrice(slots: number, discount: number): number;

// src/systems/Board.ts
place(cell: Cell, tower: Tower | undefined): void;

// src/entities/Tower.ts
sellAway(): void;

// src/systems/TowerSystem.ts
sell(tower: Tower): number;

// src/systems/Building.ts
sellTower(): void;
```

### Steps
1. `core/techEffects.ts` — add: `export function sellPrice(slots: number, discount: number): number { let paid = 0; for (let i = 0; i < slots; i++) paid += slotPrice(i, discount)!; return Math.floor(paid * 0.7); }`
2. `Board.ts` — change `place`'s param to `tower: Tower | undefined` and note in the doc comment that `undefined` frees the cell (sell). Body unchanged.
3. `Tower.ts` — add near `kick()`: `sellAway(): void` tweening `y: '-=12'`, `alpha: 0`, `duration: 200`, `ease: 'Back.easeOut'`, `onComplete: () => this.destroy()`.
4. `TowerSystem.ts` — add `sell(tower: Tower): number`: `this.run.gold += sellPrice(tower.slots, this.run.slotDiscount)`; `this.board.place(tower.cell, undefined)`; `this.towers.splice(this.towers.indexOf(tower), 1)`; `tower.sellAway()`; return the gold.
5. `Building.ts` — add `sellTower()`: return unless `this.selectedTower && this.run.phase === 'build'`; pay via `this.towers.sell(...)`; `this.fx.popText(c.x, c.y - 20, \`+${paid}\`)` at the plinth; fire one gold coin to the stats gold registry point (`'statsGold'`) with the killCoin `px` zoom math; `this.sfx?.coinBlip()`; clear the ghost and pointer, `this.closePanel()`, `this.refreshGhosts()`.
6. `TowerPanel.ts` — track `private builtPhase: RunPhase`; in `build()` compute `const sell = game.run.phase === 'build'`, add `const SELL_H = 44;`, extend `H += sell ? SELL_H : 0`, and after the buy-slot line push `makeButton(... 'Sell · +${sellPrice(...)}', () => game.building.sellTower(), { height: SELL_H, radius: 12 })` at `y = H/2 - 16 - SELL_H/2`. Rebuild also when `this.builtPhase !== game.run.phase`.
7. `PauseScene.ts` — add `'Sell — the panel's line, build phase only',` to `CONTROLS` next to the related pick-up line; the card's `fitTo` + scale already fit 412x915 and 1280x720.
8. `tests/core/techEffects.test.ts` — assert `sellPrice` for 1 and 2 slots, discount 0 and >0.

### Pitfalls
- The line must vanish in wave/draft: TowerPanel rebuilds only on `building.uiVersion`, which does NOT bump on a phase change — the `builtPhase` comparison is required.
- Sell must free the cell and splice from `TowerSystem.towers` immediately (before/while the tween runs) so `canBuild` sees an open cell the same phase and the auras (Rally/Anchor/Mint/Toll read `towers.towers`) stop the same frame; the sold tower then drops out of the end card's by-tower list and `brokenTower` stays green.
- Pay `run.gold += paid` ONLY: do not touch `run.goldEarned` or the coin tally (not a kill, not a wave).
- Price is 70% floored of the sum of the slots' `slotPrice(i, discount)`; the discount applies only to slot index 1.
- The coin needs the `'statsGold'` registry point and killCoin's `px = board.toScreen({x:1,y:0}).x - board.toScreen({x:0,y:0}).x` zoom math; skip the coin if the registry point is undefined.
- Augments are gone (a refund), not returned to the hand; close the panel after selling.
- `SELL_H = 44` keeps the touch target at least 44 px; lay the whole card out from its lines (no hand-picked y offsets).

### Tests
- Unit test in `tests/core/techEffects.test.ts` for `sellPrice` (core rule change); `npm run check` (typecheck + lint + tests) and `npm run smoke` must pass.

## Attempt 1 released (baby-mama)

Put back in the pool by the owner: baby-mama is paused and had held this task for six hours without pushing.
