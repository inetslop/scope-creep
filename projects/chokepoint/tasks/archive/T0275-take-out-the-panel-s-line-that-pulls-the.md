---
id: T0275
title: "Take out: the panel's line that pulls the last augment back into the hand"
size: M
priority: 2
status: failed
depends_on: [T0274]
attempts: 0
created: 2026-10-30T09:46:01Z
epic: E7
---

## Goal
The second way to change your mind (E7): a wrong added augment is pulled back into the hand for 5 gold — the card returns, the tower stays, and its attack reverts to what the rest of its augments make it. Selling (T0274) refunds the whole tower; taking out keeps the tower and fixes one card.

## Details
- **The line (the tower panel, beside the sell line T0274 adds):** while a tower holding **at least two augments** is selected in the build phase, the panel wears a second bottom line, "Take out · 5": 5 gold pulls the tower's last augment (the highest filled slot) back into the hand. A tower with one augment in it shows only the sell line (taking its last augment out would leave an empty tower). No line in the wave phase or the draft.
- **The take-out:** tap the line and the 5 gold spends with the buy-slot's own spend feedback (the stats card's gold number falling by 5), the last augment's barrel, ring or tick vanishes from the tower's look, and the tower's attack reverts to what the remaining augments make it (a Beam that loses its Bolt ray is a plain beam again; a Bolt that loses its Rapid returns to the Bolt's own rate). The card lands in the hand with the hand's own placement — the same card: its name, its tier and its copies intact (an Epic stays an Epic, the owned-dot count, T0094, moves with it). The panel stays open on the (now shorter) tower.
- **The slot stays the tower's:** the vacated slot is simply free again — refitting it costs no slot price, and the next *unbought* slot's price is unchanged. The panel's slot row shows the taken-out slot as free, as it already does for any free slot.
- **The hand cap:** the returned card counts toward the hand's cap like any hand card (keys 1-9); with the hand full, or the gold under 5, the line is dimmed with a red 5 and does nothing on tap (the buy-slot's quiet language).
- **The books:** the tower's kills, its identity and its other augments are untouched; the end card's by-tower list still shows the tower (T0216). A take-out is part of the current build phase, like a sell: the phase-boundary save covers it (in the wave-phase save with the card in the hand; undone on resume from the build-phase save).
- **The pause screen (Pillar 8):** the controls line gains "Take out — the panel's line, build phase only" next to the sell's line.
- **Nothing shown twice:** the line says what it takes (the panel already shows the tower's last augment as its own card) and the price; no new readout, mark or chip.

## Acceptance criteria
- [ ] In the build phase, a selected tower holding at least two augments wears a "Take out · 5" line beside the sell line; a one-augment tower shows only the sell line; no line in the wave phase or the draft.
- [ ] Tapping it spends 5 gold (the gold number falling), removes the tower's last augment from its look and its attack — a Beam + Bolt reads as a plain beam again, a Bolt + Rapid fires at the Bolt's own rate again — and lands that card in the hand with its name, tier and copies intact; the panel stays open and shows one fewer augment row.
- [ ] The vacated slot stays the tower's: it is free to refit at no slot price, the next unbought slot's price is unchanged, and the slot row shows it as free.
- [ ] With the hand full or the gold under 5, the line is dimmed with a red 5 and a tap does nothing.
- [ ] The tower's kills, identity and remaining augments are untouched; the end card's by-tower list still shows the tower.
- [ ] The pause screen's controls line lists both lines; the panel with both lines and the pause card fit at 412x915 and 1280x720.
- [ ] A take-out during the build phase survives to the wave (in the wave-phase save, card in the hand) and is undone on resume from the build-phase save.

## Design (architect, inet-racing)

### Files
- edit `src/config.ts` - add two constants next to `REROLL_COST`: `export const TAKE_OUT_COST = 5;` (gold the panel's take-out line spends) and `export const MAX_HAND = 9;` (the hand's cap: keys 1-9, as drawn by `HandBar`).
- edit `src/entities/Tower.ts` - new public method `takeOutLast()` right after `unlockSlot()`.
- edit `src/systems/Building.ts` - new public method `takeOutAugment()` right after `unlockSlot()`; import `MAX_HAND, TAKE_OUT_COST` from `../config`.
- edit `src/ui/hud/TowerPanel.ts` - the "Take out · 5" button, in the same bottom line T0274's sell button sits in; its dim/red-5 state in `update()`.
- edit `src/scenes/PauseScene.ts` - one line in `CONTROLS`, next to T0274's sell line.
- edit `src/debug/runChecks.ts` - one invariant line next to `towers.valid`.
### Interfaces
```ts
// config.ts
export const TAKE_OUT_COST = 5;
export const MAX_HAND = 9;

// entities/Tower.ts  (after unlockSlot())
/** The panel's "Take out": the last (highest filled slot) augment leaves the tower; it reverts
 * to what its remaining augments make it. Returns the copy (undefined only if it held none). */
takeOutLast(): AugmentCopy | undefined {
  const copy = this.augments.pop();
  if (!copy) return undefined;
  this.refresh();
  return copy;
}

// systems/Building.ts  (after unlockSlot())
/** The panel's take-out line: spend TAKE_OUT_COST, the tower's last augment goes back into the hand. */
takeOutAugment(): void {
  const tower = this.selectedTower;
  if (!tower || this.run.phase !== 'build') return;
  if (tower.augments.length < 2) return;
  if (this.run.hand.length >= MAX_HAND || !this.run.spend(TAKE_OUT_COST)) return;
  const copy = tower.takeOutLast();
  if (!copy) return;
  this.run.takeAugment(copy);
  this.uiVersion += 1;
  this.refreshGhosts();
}

// ui/hud/TowerPanel.ts — new field, reset to undefined at the top of build() like this.unlock:
private takeOut: { button: Button; price: Phaser.GameObjects.Text } | undefined;
```
### Steps
1. `config.ts`: add the two constants next to `REROLL_COST` (line 30), one per line, with a one-line comment each.
2. `Tower.ts`: add `takeOutLast()` after `unlockSlot()` exactly as above. Do not touch `poppingSlot`, `refresh()` or the pips — `refresh()` recomputes the spec (the attack reverts) and repaints barrels, decorations and pips; the vacated pip draws as the free-slot ring because `augments.length` dropped while `slots` is unchanged.
3. `Building.ts`: add `takeOutAugment()` after `unlockSlot()` exactly as above. Note the hand grows via `run.takeAugment(copy)` (push, the hand's own placement); do not call `afterHandChange()` (it clamps the selection, which never shifts when the hand grows).
4. `TowerPanel.ts` — read first the sell line T0274 added (search `Sell` in the file) and keep it working:
   - In `build()`, when `game.run.phase === 'build' && tower.augments.length >= 2`, add a second button in the same line as the sell button: `makeButton(scene, x, y, 'Take out', () => game.building.takeOutAugment(), { width: 150, height: 44, radius: 22, fontSize: 14 })` with `artScale(scene.add.image(..., COIN_TEXTURE), 0.8)` and a price text `String(TAKE_OUT_COST)` in `textStyle(13, PALETTE.ink, { fontStyle: 'bold' })` added to `button.content` — the same coin-plus-price pairing as the slot-unlock button (lines 141-144). Put it left of the sell button with an 8 px gap (take-out center `left + 75`, sell button shifted so the two span the line's width `w - 36`); reuse the line's y and the height T0274 gave the line — do not add any card height (`H` stays as T0274 left it).
   - Store it in `this.takeOut = { button, price }` and add `button.container` to `items`, exactly like `this.unlock`.
   - The line must exist in the built card even when the phase is not build, and be shown only in build: put the whole bottom line (take-out button + T0274's sell button) into one `Phaser.GameObjects.Container` added to `items`, and in `update()` do `this.actionRow?.setVisible(game.run.phase === 'build')` (add the `private actionRow` field, reset in `build()`). If T0274 already show/hides the sell line on phase, extend that mechanism to cover both buttons instead of adding a second.
   - In `update()`, after the `this.unlock` block, add the quiet-language refresh, mirroring it:
     ```ts
     if (this.takeOut) {
       const ok = game.run.canAfford(TAKE_OUT_COST) && game.run.hand.length < MAX_HAND;
       this.takeOut.price.setColor(cssColor(ok ? PALETTE.ink : PALETTE.red));
       this.takeOut.button.content.setAlpha(ok ? 1 : 0.6);
     }
     ```
     The button stays enabled; the tap is a no-op because `takeOutAugment()`'s guards return (no hint, no sound — the buy-slot's quiet language).
5. `PauseScene.ts`: in `CONTROLS`, next to T0274's sell line, add one line: `'Take out — the panel's line, build phase only'`. The card lays itself out from its lines and scales to fit in `layout()`, so no other change.
6. `runChecks.ts`: after the `towers.valid` line add: `['towers.first', (g) => (g.towers.towers.every((t) => t.augments.length >= 1) ? null : 'a tower holds no augment')],`
### Pitfalls
- Never pop below one augment: the `tower.augments.length < 2` guard is what keeps every tower holding its first augment (the new invariant); `takeOutLast()` itself may return undefined, so keep the `if (!copy) return;` in Building.
- The pip pop-in tween (`popPip`) may still be running when a take-out lands: its `onComplete` calls `drawPips()` again, which then draws the vacated slot as a free ring — correct as-is, don't "fix" it.
- The panel can be open during the wave phase (a tap selects a tower then too): the line is hidden by the `actionRow` visibility, and `takeOutAugment()` re-checks `phase === 'build'` so a stale tap can't spend.
- The gold "falling" is just `StatsCard.update()` repainting `run.gold` after `spend()` — add no effect. The returned card's tier/copies ride with the `AugmentCopy` object itself; nothing else to copy.
- Do not change `Tower.slots`: the vacated slot stays unlocked (`freeSlots` grows, the panel's slot row shows the plus, the next unbought slot's price is unchanged). Do not touch `tower.kills`.
- Saves: `RunSave.persist()` serializes `run.hand` and `tower.augments` — the take-out is covered automatically, no change.
- Layout: 412x915 centers the 340 px panel; with both buttons (150 + 8 + sell ≤ 146) the line stays inside `w - 36`. The pause card grows by one line and scales down; verify both sizes in the smoke run.
### Tests
none (the rule lives in `Building`/`Tower`/`TowerPanel`, not `src/core`; the new invariant covers the smoke run).

## Dropped (by hand, 2026-10-30)

Cancelled by the player: E7 keeps only the sell (T0274). There is no take-out; do not re-task it.
