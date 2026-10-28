---
id: T010
title: Tier pips on the tower
assignee: yoga
size: S
priority: 3
status: todo
depends_on: [T0002]
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E4
---

## Goal
You can tell a tower's tier at a glance from the board: each augment slot shows a small pip in its tier color.

## Details
- Every augment slot on a tower shows a small rounded pip (a circle, about 25% of the tower base's width) on the front edge of the tower base, in slot order (first slot left, next slots to the right):
  - Common: light gray
  - Rare: blue
  - Epic: purple
- The pips sit below the existing augment display (barrel/ring/ticks) so they never cover it (closest example: the existing per-augment tower markings).
- When a new augment is added to a tower, its pip appears with the same pop-in the existing augment display uses.

## Acceptance criteria
- [ ] A 1-slot tower shows 1 pip; a 3-slot tower shows 3 pips in slot order.
- [ ] Pips are light gray (Common), blue (Rare), purple (Epic) to match the card frames.
- [ ] Pips are visible at 1x zoom on 412x915 (not smaller than ~6px on screen) and do not cover the barrel or the road.
- [ ] Adding an augment to a tower makes its pip appear with the pop-in.

## Design (architect, narcissus)

### Files
- edit `src/entities/towerLook.ts` - one rule: a slot's tier → its pip color (next to the barrel look)
- edit `src/entities/Tower.ts` - filled pips get tier color; a newly added augment's pip pops in with the drop-in bounce

### Interfaces
In `towerLook.ts`: add `import type { Tier } from '../content/types';` and `export function pipColor(tier: Tier): number`. `Tower` gains no public API, only private members.

### Steps
1. `Tower.ts`: add `pipColor` to the existing `./towerLook` import (line 9). Add fields after `pips` (line 31):
```ts
private poppingSlot = -1; // slot mid pop-in; drawPips skips it until its tween lands
private pipPop: Phaser.GameObjects.Graphics | undefined;
```
2. Replace the `addAugment` body:
```ts
if (this.freeSlots <= 0) return false;
this.augments.push(id);
const slot = this.augments.length - 1;
this.poppingSlot = slot; // set before refresh(), so drawPips leaves room for the pop-in
this.refresh();
this.popPip(slot);
return true;
```
3. Replace `drawPips` with these two methods (r=4, gap=10, y=22: 4 pips span ±19 inside the plinth's ±25.6, below barrel root y+10 and Frost ring bottom y+17.9; diameter 8 board units ≈ 6.1px at 1x zoom on 412x915):
```ts
private pipX(i: number): number {
  const gap = 10;
  return -((this.slots - 1) * gap) / 2 + i * gap;
}

private drawPips(): void {
  const g = this.pips;
  g.clear();
  for (let i = 0; i < this.slots; i++) {
    if (i === this.poppingSlot) continue; // its temp pip sits on top until the tween lands
    const x = this.pipX(i);
    const id = this.augments[i];
    if (id) g.fillStyle(pipColor(getAugment(id).tier), 1).fillCircle(x, 22, 4);
    else { g.lineStyle(1.5, PALETTE.faint, 1); g.strokeCircle(x, 22, 4); }
  }
}
```
4. Add before `destroy`:
```ts
/** The new pip grows in on the plinth with the same bounce as the tower's drop-in. */
private popPip(slot: number): void {
  if (this.pipPop) { this.scene.tweens.killTweensOf(this.pipPop); this.pipPop.destroy(); }
  const g = this.scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(this.x + this.pipX(slot), this.y + 22);
  g.fillStyle(pipColor(getAugment(this.augments[slot]!).tier), 1);
  g.fillCircle(0, 0, 4);
  g.setScale(0.4);
  this.pipPop = g;
  this.scene.tweens.add({ targets: g, scale: 1, duration: 260, ease: 'Back.easeOut', onComplete: () => {
    if (this.pipPop !== g) return; // superseded by a newer addAugment, or the tower is gone
    g.destroy();
    this.pipPop = undefined;
    this.poppingSlot = -1;
    this.drawPips();
  } });
}
```
5. In `destroy`, before `super.destroy`: `if (this.pipPop) { this.scene.tweens.killTweensOf(this.pipPop); this.pipPop.destroy(); this.pipPop = undefined; }`

### Pitfalls
- T0002 must land first: it adds `tier` to `AugmentDef` (type `Tier` = `'common' | 'rare' | 'epic'` in `content/types.ts`). If it ships a different name, follow its export — only `pipColor`'s parameter and the two `.tier` reads adapt.
- Do not re-size or move pips: r=4/gap=10/y=22 already meets every size rule (≥6px at 1x on phone, fits 4 slots, below barrel/ring, off the road); growing them toward "25% of base width" makes 4 pips overlap.
- The `poppingSlot` skip is load-bearing: without it, `drawPips` paints the full-size pip and the pop-in copy on top is invisible.
- The `onComplete` guard plus the `destroy()` cleanup cover a second `addAugment` within 260ms (the old temp pip is killed; `refresh()` already settled that slot permanently) and tower death mid-pop.
- Do not touch `TowerPanel.ts` (HUD shows its own card art, T0008's territory), do not pop empty slots (`unlockSlot` keeps today's faint ring). No new file, registry line or invariant needed.

### Tests
none (`npm run check`, then smoke at 412x915: a 3-slot tower shows 3 pips in slot order with tier colors, and an added augment's pip pops in)
