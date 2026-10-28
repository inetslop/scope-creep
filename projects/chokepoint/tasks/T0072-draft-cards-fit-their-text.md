---
id: T0072
title: Draft cards fit their text
size: S
priority: 1
status: todo
depends_on: [T0065]
attempts: 0
created: 2026-10-28T17:31:39Z
---

## Goal
Every draft card shows all of its text inside the card, with room to spare. Today the long cards spill: Anchor's added line ("Hits root for 0.5s (+0.25s per extra Anchor).") ends right on the card's bottom edge, and the card covers the "Reroll" button under it. Rally's text is longer still.

## Details
- The draft card is a fixed 220x206 (`CARD_H` in `scenes/DraftScene.ts`), and its two text lines start at the card's middle, so about 100 px are left for both lines. Two 3-line lines at 14 px do not fit.
- Fix it so the card always holds its text: for example, the card grows taller to fit its lines, all three cards in the offer take the tallest one's height so the row stays even, and the layout places the cards and the reroll button from that real height instead of the fixed `CARD_H`. Moving the text up a little, if the name and gem leave room, is fine too. Do not shrink the text below 14 px, and keep the card's look (white rounded card, tier frame, glyphs, key hint, owned dot).
- The longest cards today: Rally (both lines about 60 characters each, every tier), then Anchor (every tier) and Ember. The fix must hold for any augment's text, not just these.
- The reroll button keeps at least 16 px of clear space below the cards in both layouts.
- Both layouts: three cards in a row (1280x720), and three cards stacked (412x915). On a phone, the stacked cards with the reroll button must still fit on screen; if taller cards would push the reroll button off a 915 px tall screen, tighten the gaps instead.

## Acceptance criteria
- [ ] Rally, Anchor and Ember cards at every tier show all of their text inside the card, with at least 12 px between the last line and the card's bottom edge, at 1280x720 and 412x915.
- [ ] The three cards of an offer have the same height.
- [ ] The reroll button never overlaps a card, with at least 16 px between them, in both layouts.
- [ ] At 412x915, all three cards and the reroll button are fully on screen.
- [ ] Short cards (Bolt, Rapid) still look balanced: no big empty area at the bottom of the card when the offer's text is short.
- [ ] The flip reveal, the Epic shimmer, the tier frames and the key hints work as before.

## Design (architect, yoga)

### Files
- edit `src/scenes/DraftScene.ts` — cards grow to hold their text; all three take the tallest height; slots/reroll/`layout` use that height instead of `CARD_H`. No new files, no other files.
### Interfaces
No exported API. Only `epicShimmer(scene, x, y, h: number)` gains `h`.
### Steps
1. In `create()`, beside `let size`: `let H = CARD_H;` (offer's card height, set by `buildRow`).
2. `buildRow`: first pass — build each copy's `towerLine`/`addedLine` at (0,0) exactly as today (same wrap `{ width: CARD_W - 58 }`, sizes/colors) returning `{ copy, b, tier, towerLine, addedLine }`; then `H = Math.max(CARD_H, ...lines.map((l) => l.towerLine.height + 10 + l.addedLine.height + 117))` (117 = 101px top strip + 16px bottom pad).
3. Second pass (today's `cards.map`): `const t = -H / 2;` anchor all content to the card top: `makeButton(... { width: CARD_W, height: H, radius: 22, accent: ... })`; icon y `t + 31`; name `t + 66`; gems `t + 86`; key hint `t + 10`; owned dot `(CARD_W/2 - 14, t + 14)`; `towerLine.setPosition(textX, t + 101)` and `addedLine.setPosition(textX, towerLine.y + towerLine.height + 10)`; glyphs stay at x `-CARD_W/2 + 26`, y `towerLine.y + 9` / `addedLine.y + 9`; frame `strokeRoundedRect(-CARD_W/2 - 1, t - 1, CARD_W + 2, H + 2, 23)`; back gem stays at (0,0); flip untouched except `onComplete` calls `epicShimmer(this, p.x, p.y, H)` with `p = cardSlot(i, size.width, size.height, cards.length)`.
4. Replace `cardSlot`/`rerollSlot` (new param `n` = card count) with `const portrait = (h, n) => { let header = 84, gap = 16; const col = () => header + n*H + (n-1)*gap + 16 + 52; if (70 + col() > h - 8) { header = 76; gap = 12; } const c = col(); return { top: Math.min(Math.max(70, (h - c)/2), h - c - 8), header, gap }; };` Card i (w<740): `{ x: w/2, y: p.top + p.header + H/2 + i*(H + p.gap) }`; reroll y: `p.top + p.header + n*H + (n-1)*p.gap + 16 + 26`. Landscape: card `y: h/2 + 10`, x as today; reroll `y: h/2 + 10 + H/2 + 44`.
5. `layout()`: portrait title/subtitle/odds at `p.top` / `p.top + 34` / `p.top + 58` (`p = portrait(height, cards.length)`); landscape ones at `height/2 - H/2 - 74/-40/-18`; delete the old `const portrait = width < 740` boolean.
6. End of `reroll()`: after `buildRow(game.flow.offer)` add `layout(size.width, size.height);` (a reroll can change H).
7. `epicShimmer`: add `h: number`; band rects become `fillRect(bx, -h/2, 24, h)`; rest unchanged.
### Pitfalls
- Without step 6 the reroll button/title keep the previous offer's height after a reroll.
- Don't touch the wrap width, the 14 px size, or the hand cards in `Building`; texts are created scene-level in pass 1, added to `button.content` in pass 2, all in one frame — no flicker.
- Phone fit holds to H≈241 (title stays on screen); worst offer today is Rally (H≈229 → button bottom 907 at 412x915, 8 px spare). Beyond ~70-char lines is a content-bar breach, not a layout case.
- T0065 (4th card) lands first: count cards as `n = cards.length` everywhere, never a literal 3.
- Short offers must stay pixel-identical to today: H clamps at `CARD_H`, and every offset above was derived so H=206 reproduces the current y values exactly.
### Tests
- none
