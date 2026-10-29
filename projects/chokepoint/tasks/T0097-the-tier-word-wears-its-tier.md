---
id: T0097
title: The tier word wears its tier
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T02:55:25Z
epic: E4
---

## Goal
Rarity is read before the name is finished: on the draft cards the tier word (T0026) is drawn in the tier's own color — the same blue and purple the frame and gems already use.

## Details
- On a draft card, the "· Rare" / "· Epic" word on the name line (T0026) is drawn in the tier's own color: blue for Rare, purple for Epic — the exact colors of that tier's frame and gem row (T0002) and of the tower's slot pips (T0010). Common cards are unchanged: plain name, no word.
- The word keeps T0026's style and position (the name line's bold name style); only its ink changes per tier. The card's size and text fit (T0072) are untouched — this is a color change, not a layout change.
- Draft cards only: the hand cards and the tower-panel cards are not touched by this task (the hand's own word is T0100).
- No new line, no input, no sound, no rule change.
- Closest examples: the draft card's tier word (T0026) for the text and placement; the frame/gem/pip tier colors (T0002, T0010) for the blue and purple.

## Acceptance criteria
- [ ] A Rare draft card reads "Name · Rare" with "· Rare" in blue (the Rare frame's blue); an Epic card reads "· Epic" in purple (the Epic frame's purple); a Common card shows the plain name with no word.
- [ ] The word's size, weight and position are exactly T0026's — only its color differs by tier.
- [ ] A Common card renders byte-identically to today; the card's growth and text fit (T0072) are unchanged.
- [ ] The hand cards and the tower panel are untouched by this task; desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, yoga)

### Files
- edit `src/scenes/DraftScene.ts` - the draft card's name line: split the single name text into the name (ink) plus, for Rare/Epic only, the " · Tier" word in the tier's color; Common keeps today's single text exactly.

No other file changes. `tierName` and `tierGemColor` already exist in `src/ui/tierLook.ts` (lines 29 and 17) — import them, do not add new functions. Do not touch `src/ui/hud/TowerPanel.ts` (its line-88 word is T0100's), the hand, or the fit code at line 97.

### Interfaces
None. No new types or signatures.

### Steps
1. In the import block (after `import { textStyle, titleStyle } from '../ui/text';`), add: `import { tierGemColor, tierName } from '../ui/tierLook';`
2. Replace lines 102–104 (the comment, `nameText`, and `name`) with exactly:
```ts
        // Rare and Epic say their tier on the name line in the tier's color; Common keeps the plain name, like its plain frame.
        const name = this.add.text(0, 0, b.name, titleStyle(20)).setOrigin(0.5);
        const tierWord = copy.tier === 'common'
          ? undefined
          : this.add.text(0, 0, ` · ${tierName(copy.tier)}`, titleStyle(20, tierGemColor(copy.tier))).setOrigin(0.5);
        if (tierWord) {
          // The pair spans exactly today's one centered text: name the left part, word the right part.
          name.setPosition(-tierWord.width / 2, t + 66);
          tierWord.setPosition(name.width / 2, t + 66);
        } else {
          name.setPosition(0, t + 66);
        }
```
3. Change line 116 to: `button.content.add([icon, name, ...(tierWord ? [tierWord] : []), ...gems, glyphs, towerLine, addedLine, key]);`
4. Run `npm run check` and `npm run smoke`.

Geometry check (why the formula is right): today's single text of width W = nameW + wordW centered at 0 spans [-W/2, W/2], name = left nameW, word = right wordW. With name.x = -wordW/2 and word.x = nameW/2 (both origin 0.5), the pair spans the same [-W/2, W/2] — every glyph lands where it lands today; only the word's ink changes.

### Pitfalls
- Common must create no second text at all: keep the `undefined` branch so it renders byte-identically (one text at (0, t+66), `titleStyle(20)`).
- Do not center the word at its own width (`tierWord.width / 2`) — that is wrong; it must be `name.width / 2`.
- Do not touch the H measurement (line 97), card size, or y (`t + 66`) — this is a color change, not a layout change (T0072).
- `tierWord` must go in `button.content` (line 116) so it is destroyed with the card on reroll (line 86); never a scene-level orphan.
- `titleStyle(20)` = the name line's bold 20px style; `titleStyle(20, tierGemColor(tier))` gives blue for Rare, purple for Epic, exactly the frame/gem/pip colors.

### Tests
none
