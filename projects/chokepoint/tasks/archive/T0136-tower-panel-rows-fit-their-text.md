---
id: T0136
title: "Tower panel: augment rows grow to fit their text"
assignee: yoga
size: S
priority: 1
status: done
depends_on: []
attempts: 1
created: 2026-10-29T09:46:49Z
claimed_at: 2026-10-29T10:42:01Z
finished_at: 2026-10-29T11:50:52Z
---

## Goal
In the tower panel, an augment row's description spills out of the bottom of its white card when it wraps to two lines (seen on a Beam tower: "A second beam on the nearest enemy: 3 per second." ends below the card, over the next row's gap). Every row must hold its whole text inside its card.

## Details
- Where: `ui/hud/TowerPanel.ts`. Each row is a fixed `ROW_H` (64 px) card; the added line starts 12 px below the row's center and word-wraps, so a second line runs past the card's bottom edge.
- Fix: size each row to its content. Measure the wrapped line first; a row is 64 px when the line fits on one line, and grows by one line height (about 14 px at 11 px text) for every extra line, keeping the same 7 px top padding and at least 8 px between the last line's bottom and the card's bottom edge. The tier frame (`drawTierFrame`) and the icon follow the row's real height (icon vertically centered).
- Rows below a taller row move down by the extra height; the panel's total height (`H`) adds up the real row heights, so the kills line, the damage-per-second line and the slot row stay below the last row with their current spacing.
- Don't shorten the card lines or shrink the text: the fix is layout only.
- Check at 412x915 and 1280x720, with the longest card lines in the game (for example Beam, Anchor and Splash added to one tower).

## Acceptance criteria
- [ ] A tower holding Beam and Anchor shows every row's full text inside its card, on desktop (1280x720) and phone (412x915).
- [ ] A row whose line fits on one line is exactly as tall as today (64 px).
- [ ] Nothing below the rows overlaps: the kills line, the damage-per-second line and the slots keep their spacing; the panel's card encloses everything.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/TowerPanel.ts` — size each augment row to its wrapped added line instead of fixed `ROW_H`; rows below and the panel's `H` follow the real heights. No other file changes.
### Interfaces
None — no new exports; all constants stay file-local.
### Steps
1. In `build()`, after `const n = tower.augments.length;`, move `const RW = w - 36;` up from line 81 and measure the rows first (the draft cards' pass-1 pattern, `DraftScene.ts:109-116`):
```ts
    const rows = tower.augments.map((c) => {
      const addedLine = scene.add.text(0, 0, tierAddedLine(getAugment(c.id), c.tier), textStyle(11, PALETTE.muted, { wordWrap: { width: RW - 52 } })).setOrigin(0, 0);
      return { addedLine, rowH: Math.max(ROW_H, Math.round(addedLine.height) + 52) }; // 52 = 44 px from the row's top to the added line + 8 px under its last line
    });
```
2. Grow `H` by the rows' growth (keeps the kills line, the damage-per-second line and the slot row, which are all derived from `H`, at their current spacing):
```ts
    const H = (ROW_H + ROW_GAP) * n + 146 + 18 + DPS_LINE + rows.reduce((s, r) => s + r.rowH - ROW_H, 0); // room for the kills line and the damage per second under it
```
3. Replace the row `forEach` body with per-row `rowH`:
```ts
    let rowY = 104; // first row's center from the card's top; each next center is the last row's bottom plus ROW_GAP
    tower.augments.forEach((c, i) => {
      const a = getAugment(c.id);
      const { addedLine, rowH } = rows[i];
      const row = scene.add.container(0, top + rowY);
      rowY += rowH + ROW_GAP;
      addedLine.setPosition(-RW / 2 + 36, -rowH / 2 + 44);
      row.add([
        makeCard(scene, 0, 0, RW, rowH, 12),
        artScale(scene.add.image(-RW / 2 + 17, 0, augmentTexture(c.id)), 0.6),
        scene.add.text(-RW / 2 + 36, -rowH / 2 + 7, `${a.name} · ${tierName(c.tier)}`, textStyle(12, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0),
        gemRow(scene, c.tier, -RW / 2 + 41 + (tierGemCount(c.tier) - 1) * 6, -rowH / 2 + 33),
        addedLine,
      ]);
      const frame = drawTierFrame(scene, c.tier, RW, rowH, 12);
      if (frame) row.add(frame);
      items.push(row);
    });
```
Everything from the `n === 0` branch down (kills, dps, `slots`, `box`) stays exactly as is.
### Pitfalls
- `addedLine` is the real row text: it must go into `row.add([...])` — delete the old inline `scene.add.text(-RW / 2 + 36, 12, tierAddedLine(...))` or the text draws twice.
- `row.add()` re-parents without moving local coords, so `setPosition` before adding (the `DraftScene.ts` pattern: create at (0,0), measure `.height`, then `setPosition`).
- One-line rows must stay pixel-identical: `Math.max(ROW_H, ...)` guarantees 64, and the `-rowH/2 + 7 / +33 / +44` pins equal the old `-ROW_H/2 + 7`, `1` and `12` at `rowH = 64` (name, gems, added line, icon at `y = 0` — the icon is already centered and just stays).
- Keep `52 = 44 + 8` in sync with the added line's `-rowH/2 + 44` if either moves; the bottom padding is exactly 8 px (plus the round), so the text always fits.
- `w` is 340 at both 412x915 (412 − 2·EDGE) and 1280x720, so the wrap width is the same; check the panel still fits on the 915 px phone (`box` y is `height - HUD.bottom - 10 - H/2`).
- No unit tests: this is a HUD-part layout change, no `core/` rule.
### Tests
none

## Result (attempt 1, yoga)

In the tower panel (`ui/hud/TowerPanel.ts`), augment rows now size to their wrapped added line instead of a fixed 64px: the added lines are measured up front (DraftScene's pass-1 pattern), each row becomes `max(64, textHeight + 52)` — exactly 64px when the line fits on one line, and one text-height taller per extra wrapped line with 8px bottom padding — and the row's card, tier frame, icon, name, gems and added line all follow the real height. The panel height `H` grows by the rows' growth, so rows below a taller row move down and the kills line, damage-per-second line and slot row keep their spacing. Verified Beam/Anchor/Splash-style two-line rows now fit inside their cards on both 1280x720 and 412x915; `npm run check` and `npm run smoke` pass.

- Self-review: APPROVE
- Time: 68.9 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/ui/hud/TowerPanel.ts | 25 +++++++++++++++--------
 1 file changed, 17 insertions(+), 8 deletions(-)
```
