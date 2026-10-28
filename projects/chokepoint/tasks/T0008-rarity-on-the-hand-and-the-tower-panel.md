---
id: T0008
title: Rarity on the hand and the tower panel
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: [T0002]
attempts: 1
created: 2026-10-28T01:07:07Z
claimed_at: 2026-10-28T08:16:09Z
epic: E4
---

## Goal
The tier is visible everywhere an augment is visible: the hand cards and the tower panel match the draft cards from T0002.

## Details
- The hand cards (the augment picked, before placement) and the tower-panel cards (the list of a selected tower's augments) get the same look as the draft cards (T0002):
  - frame: Common plain white, Rare a 2px blue frame, Epic a 2px purple frame
  - gem row under the title: 1 light gray gem (Common), 2 blue gems (Rare), 3 purple gems (Epic)
- Each tower-panel line also shows the tier name: "Rapid · Rare".
- Card text shows the tier's numbers, exactly as the draft does for the same augment and tier.

## Acceptance criteria
- [ ] A Rare augment in the hand shows a blue frame and 2 blue gems; the same augment in the tower panel shows the same frame, gems and "Rapid · Rare"-style line.
- [ ] A tower-panel card's numbers match the draft card for the same augment and tier (same text).
- [ ] Common cards in the hand and panel look exactly as they do today.
- [ ] The hand strip fits its cards at 412x915 and the tower panel fits at 1280x720 without overlapping other elements.

## Design (architect, desktop)

### Files
- create `src/ui/tierLook.ts` - the tier card look shared by hand and tower panel: frame/gem colors, `drawTierFrame()`, `gemRow()`, `tierName()`, `tierGemCount()`
- edit `src/ui/hud/HandBar.ts` - in `build()`: per-card tier frame + gem row; icon/name repositioned; new import
- edit `src/ui/hud/TowerPanel.ts` - replace the joined-names title with one row card per augment (frame, icon, "Name · Tier", gems, the tier's added line); panel height grows with the row count; `slots()` takes the new height

### Interfaces
```ts
// src/ui/tierLook.ts (new). Tier / AugmentCopy / tierAddedLine / GEM_TEXTURE all come from T0002 - verify they exist before starting.
export function tierFrameColor(tier: Tier): number | undefined;  // rare -> PALETTE.blue, epic -> PALETTE.purple, common -> undefined (no frame)
export function tierGemColor(tier: Tier): number;                // rare -> blue, epic -> purple, common -> PALETTE.faint
export function tierGemCount(tier: Tier): number;                // 1 / 2 / 3
export function tierName(tier: Tier): string;                    // 'rare' -> 'Rare'
export function drawTierFrame(scene: Phaser.Scene, tier: Tier, w: number, h: number, radius: number): Phaser.GameObjects.Graphics | undefined;
//   2px line, strokeRoundedRect(-w/2-1, -h/2-1, w+2, h+2, radius+1); common returns undefined
export function gemRow(scene: Phaser.Scene, tier: Tier, x: number, y: number): Phaser.GameObjects.Container;
//   tierGemCount GEM_TEXTURE images at artScale 1 (10px), setTint(tierGemColor), 12px apart center-to-center, centered on (x, y)
```
`tierAddedLine` is imported by TowerPanel from `src/core/tiers.ts` (T0002) — it is the draft's exact added-line string for a tier.

### Steps
1. Write `src/ui/tierLook.ts` (imports: `PALETTE`, `Tier`, `GEM_TEXTURE` + `artScale` from `art/textures`).
2. HandBar `build()`: for each copy `c` (`const a = getAugment(c.id)`), `b.content` gets: icon `artScale(scene.add.image(0, -13, augmentTexture(c.id)), Math.min(1.1, w / 75))`, name at `(0, 12)` (13px bold, origin 0.5), `gemRow(scene, c.tier, 0, 29)`, the key line unchanged, and `drawTierFrame(scene, c.tier, w, CARD, 20)` added last (only when not undefined).
3. TowerPanel: remove `PANEL_H` and the `title` text; add `const ROW_H = 64; const ROW_GAP = 6;`. In `build()`: `const n = tower.augments.length; const H = 70 * n + 146; const top = -H / 2;` — card `makeCard(scene, 0, 0, w, H, 22).setInteractive()`, desc at `(left, top + 12)`, stats at `(left, top + 54)` (both 13px, origin `(0, 0)`, wrap `w - 36`), close at `(w / 2 - 26, top + 26)`. Each row for copy `c` at index `i` is one container at `(0, top + 104 + i * 70)`, `RW = w - 36`, children in order:
   - `makeCard(scene, 0, 0, RW, ROW_H, 12)`
   - icon `artScale(scene.add.image(-RW / 2 + 17, 0, augmentTexture(c.id)), 0.6)`
   - name `scene.add.text(-RW / 2 + 36, -ROW_H / 2 + 7, \`${a.name} · ${tierName(c.tier)}\`, textStyle(12, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0)`
   - `gemRow(scene, c.tier, -RW / 2 + 41 + (tierGemCount(c.tier) - 1) * 6, 1)`
   - line `scene.add.text(-RW / 2 + 36, 12, tierAddedLine(a, c.tier), textStyle(11, PALETTE.muted, { wordWrap: { width: RW - 52 } })).setOrigin(0, 0)`
   - `drawTierFrame(scene, c.tier, RW, ROW_H, 12)` last (only when not undefined)
   - if `n === 0`: a 13px muted 'Put an augment in a slot' at `(left, top + 80)` instead of rows (defensive; towers always hold >= 1).
4. `slots(game, tower, left, w, H)`: `const y = H / 2 - 16 - SLOT / 2;` — the slot squares, unlock button and hint lines stay exactly as they are.
5. Panel container position: `scene.add.container(x, height - HUD.bottom - 10 - H / 2, items)` (`x` as today). Update the class doc comment to describe the rows.
6. `npm run check`, then `npm run smoke`.

### Pitfalls
- **Run strictly after T0002 is merged**: `Tier`, `AugmentCopy` (hand/towers hold `{id, tier}`), `tierAddedLine`, `GEM_TEXTURE` don't exist before it, and T0002 rewrites these same two HUD files for type conformance — build against the post-T0002 code (`c.id`), not the current `string[]` code.
- The frame must be the LAST child (the card image would cover it), and in the hand it belongs in `b.content` so it lifts with the card on hover/select/press.
- Selected Rare/Epic hand card: makeButton's 3px accent ring sits under the 2px tier frame, leaving a ~0.5px sliver plus the lift as the selection cue — intended, don't "fix" it or skip `setSelected`.
- Common tier: `drawTierFrame` returns undefined — never push undefined into container children.
- Dynamic `H` must be used everywhere (container y, `slots` y, close button); offsets assume desc wraps at most 2 lines and the stats line is 1 line (longest ≈ 40 chars < `w - 36`) — don't reflow.
- The panel numbers must be exactly `tierAddedLine(a, c.tier)` — the draft's string for the same augment and tier; don't reformat or hardcode.
- Don't touch DraftScene (T0002 owns the draft's frame/gems; the duplication in `tierLook.ts` is deliberate). Don't change the hand width formula, the panel anchor, or slot/hint geometry — layout verified: panel top stays below the top HUD (y >= 98 at 1280x720 even with 5 rows) and above the hand (26px gap at 412x915); hand cards keep their current size and the gems fit inside the 84px card.
- Row sub-containers are children of `this.box`, destroyed by the existing `box?.destroy()`; hold no references across rebuilds.

### Tests
none (UI only; the tier data and `tierAddedLine` rules are tested by T0002)
