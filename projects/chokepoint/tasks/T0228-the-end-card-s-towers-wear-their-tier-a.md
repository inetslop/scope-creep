---
id: T0228
title: "The end card's towers wear their tier: a pip on the by-tower chips"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T18:07:31Z
epic: E4
---

## Goal
The game-over screen's "By tower" card (T0216) names the run's towers but hides their tier — the one surface where rarity does not show. E4's promise is that rarity shows everywhere the augment does (draft, hand, tower panel, the tower's slot pips); the end card completes it.

## Details
- Every chip in the "By tower" card — one per tower built, the first augment's icon plus its "×N" kill count — wears one small tier pip beside its icon: T0010's own pip (small rounded pip, r=4; light gray Common, blue Rare, purple Epic), the same size the towers' slot pips use.
- The tier is the tower's first augment's tier — the same value its slot pip and its tower panel already show.
- Chips stay small: the pip adds a few pixels; the chip row wraps as it already does and the card still fits 412x915 and 1280x720 (the card's fit language, T0136/T0225).
- No new sound, no new input. The pip says "tier" the way the player already reads it off every tower; nothing needs teaching.
- Only the game-over screen's "By tower" card changes. The claim card (RewardsScene) is left alone — it is being re-laid out (T0224).
- Closest examples: the tier pip (T0010, on the tower's slots) and the by-tower chips (T0216, the end card).

## Acceptance criteria
- [ ] On the game-over screen, every chip in the "By tower" card wears a small tier pip beside its icon, in the tower's first-augment tier color (light gray Common, blue Rare, purple Epic), T0010's pip shape.
- [ ] The "By tower" card still fits both layouts (412x915 and 1280x720), chips wrapping as before; the chip order and counts are unchanged.
- [ ] Nothing else on the end card changes (score line, breakdown, kill counts untouched), and the claim card is byte-identical.

## Design (architect, yoga)

### Files
- edit `src/ui/byTower.ts` - add an optional `tier` to `ByTowerEntry`; draw one T0010 tier pip (filled circle r=4, `pipColor`) at the bottom-right of each chip's icon.
- edit `src/systems/RunFlow.ts` - `endRun()` (line 159): add the first augment's `tier` to each `towerKills` entry so it flows into the card. (No GameOverScene change: it already passes the registry entries straight to `makeByTowerCard`.)

### Interfaces
In `src/ui/byTower.ts`:
```ts
import type { Tier } from '../content/types';      // next to the existing content/palette import
import { pipColor } from '../entities/towerLook'; // T0010's pip color (light gray/blue/purple)

export interface ByTowerEntry {
  first: string | undefined;
  kills: number;
  /** The tower's first-augment tier — colors the pip beside the chip's icon. */
  tier?: Tier;
}
```
In the chip loop of `makeByTowerCard`, immediately after the icon line (`chip.add(artScale(...))`):
```ts
if (t.first && t.tier) {
  const g = scene.add.graphics();
  g.fillStyle(pipColor(t.tier), 1);
  g.fillCircle(-10, 8, 4); // tier pip at the icon's bottom right, same r=4 circle as the slot pips
  chip.add(g);
}
```
In `src/systems/RunFlow.ts` `endRun()`:
```ts
this.scene.registry.set('towerKills', this.s.towers.towers.map((t) => ({ first: t.augments[0]?.id, tier: t.augments[0]?.tier, kills: t.kills })));
```

### Steps
1. Add `tier?: Tier` to `ByTowerEntry` and the two imports in `src/ui/byTower.ts`.
2. Add the 5-line pip block inside the `sorted.forEach` loop, right after the `chip.add(artScale(...))` icon line; pip position `(-10, 8)` is chip-local (icon is at `(-18, 0)`, kills text at `(8, 0)`).
3. Add `tier: t.augments[0]?.tier` to the `towerKills` map in `RunFlow.endRun()`.

### Pitfalls
- Do not change `CHIP_W`/`CHIP_H`/`PER_ROW`/`GAP_X` or the sort order: chip row wrapping and card height are unchanged, so the card still fits 412x915 and 1280x720 exactly as today.
- Pip is UI space (CSS px) — a plain `scene.add.graphics()` circle, no `artScale`, no board units, no new texture.
- Guard on `t.first && t.tier`: if a tower somehow never got an augment, no icon and no pip (never a floating pip); `t.augments[0]?.tier` is `Tier | undefined`, so `tier?: Tier` typechecks.
- Leave `src/scenes/GameOverScene.ts` and `src/scenes/RewardsScene.ts` untouched (claim card is T0224's).

### Tests
- none (UI-only change; run `npm run check` + `npm run smoke` as the gate).
