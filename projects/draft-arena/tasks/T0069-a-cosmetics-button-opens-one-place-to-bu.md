---
id: T0069
title: A Cosmetics button opens one place to buy and wear every look
assignee: asus
size: M
priority: 1
status: done
depends_on: []
attempts: 1
created: 2026-10-31T12:51:01Z
claimed_at: 2026-10-31T13:25:38Z
finished_at: 2026-10-31T13:41:37Z
---

## Goal
Players can't tell there is a shop: it only opens when the coin count on the start card is tapped. And hats are worn from a separate Hats card, while everything else is worn from the shop. One clearly named button, one place for every look.

## Details
- Start card: the tappable coin line becomes a button labelled "Cosmetics" with the coin balance on it (the coin icon and the number, e.g. "Cosmetics · 120"). It opens the panel. It uses the menu's button look (`menu-button`, not `primary`) and is at least 44 px tall.
- The panel (today the Shop overlay) is titled "Cosmetics" and lists every accessory, free ones included, by slot (Head, Face, Back), and every pattern. Free items say "Free". The player tries an item on in the preview, buys it if it isn't owned, and wears it or takes it off right there.
- Remove the Hats card from the start screen (src/menu/hats.ts, hats.css and its line in MENU_PARTS): hats are worn from Cosmetics only.
- The color picker stays as it is.
- Fits 412x915 and 1280x720 in its fullest state: every accessory and pattern listed, a 6-digit coin balance.

## Acceptance criteria
- [ ] The start card has a "Cosmetics" button showing the coin balance; it opens the panel.
- [ ] Every hat, other accessory and pattern can be worn and taken off from Cosmetics; free ones need no buying.
- [ ] There is no Hats card on the start screen.
- [ ] What is worn in Cosmetics shows on the critter in the match.

## Design (architect, desktop)

### Files
- edit `src/menu/coins.ts` - the tappable coin line becomes the "Cosmetics" button (`menu-button` class), label `Cosmetics · <coins>`
- edit `src/menu/coins.css` - drop the old flat-line styling (it fights `.menu-button`); keep flex layout + coin icon only
- edit `src/menu/shop.ts` - title "Cosmetics", list every accessory (no `price > 0` filter) under Head/Face/Back, then Patterns; "Free" chip for price-0 items; doc comment
- edit `src/menu/index.ts` - remove the `hats` import and its `MENU_PARTS` line
- delete `src/menu/hats.ts` - Hats card goes away (hats are worn from Cosmetics)
- delete `src/menu/hats.css` - its styles

### Interfaces
No new types or signatures. Everything uses existing `MenuView` (`owns`, `cantBuy`, `buy`, `wear(slot, id | undefined)`, `preview`, `profile`), `ACCESSORY_SLOTS` = `['head','face','back']` (engine/api.ts:537), and the existing `critter-shop-open` CustomEvent. `view.owns(id)` already returns true for price-0 items ("Free, or bought", engine/client/profile.ts:54) — free items never need a buy step.

### Steps
1. Replace all of `src/menu/coins.ts` with: same structure as today, but `line.className = 'menu-button coins-line'` and in `update`: `label.textContent = \`Cosmetics · ${n}\`;` (drop the singular/plural "coin(s)" logic). Keep the `coins-coin` span, the `critter-shop-open` dispatch, and the `shown` guard.
2. Replace all of `src/menu/coins.css` with: `.coins-line { display: flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; }` and the existing `.coins-coin` / `.coins-coin::after` rules unchanged (16px yellow circle, ink border, white shine). Nothing else — `.menu-button` (engine/client/menu.css:88) supplies the look: 3px ink border, `#ffd43b` background, `min-height: 52px` (≥ 44 px), full width (it stretches in `.menu-parts`' flex column, like Play).
3. In `src/menu/shop.ts`: (a) line 26 `title.textContent = 'Cosmetics';` (b) doc comment: "Opens when the Cosmetics button is tapped"; (c) replace the chip block in `addSection` (lines 137-146) with:
   ```ts
   if (def.price === 0 || !owned) {
     const price = document.createElement('span');
     price.className = 'price';
     if (def.price === 0) {
       price.textContent = 'Free';
     } else {
       const priceCoin = document.createElement('span');
       priceCoin.className = 'coin';
       const priceValue = document.createElement('span');
       priceValue.textContent = `${def.price}`;
       price.append(priceCoin, priceValue);
     }
     swatch.append(price);
   }
   ```
   (d) replace `renderAll`'s section lines (161-165) with:
   ```ts
   for (const slot of ACCESSORY_SLOTS) {
     const label = slot === 'head' ? 'Head' : slot === 'face' ? 'Face' : 'Back';
     addSection(label, view.accessories.filter((a) => a.slot === slot));
   }
   addSection('Patterns', view.patterns);
   ```
   Nothing else in shop.ts changes: the footer already shows "Wear"/"Wearing" for free items via `owns`, and buy/wear/preview/Esc-to-close/MutationObserver logic all stay.
4. Replace all of `src/menu/index.ts`: imports of `color`, `coins`, `shop` only; `MENU_PARTS = [coins, color, shop]` (keep the existing comment).
5. Delete `src/menu/hats.ts` and `src/menu/hats.css`. Do not touch `color.ts`/`color.css` or `shop.css`.
6. Run `npm run check`.

Fullest state (verify by eye, no code): start card 380 px wide on both viewports — h1, tagline, name, Cosmetics button reading `Cosmetics · 999999` (one line at 20 px, fits 326 px content width), color picker, Play, help. Panel (card `min(560px, 94vw)`, `max-height` 92 vh): head row "Cosmetics" + coin + "999999" + 44 px close fits one line at 412 px (≈280 px needed in 355 px); 150 px preview; swatch rows Head (4: beanie, cone, bloom, chef-hat), Face (4), Back (3), Patterns (6) — 5 swatches (64 px) per row at 412 px, rows scroll in `.shop-rows`; beanie and cone carry a "Free" chip; footer: name (≤18 chars), description, state, full-width button ("Buy · 400" / "Costs 400 coins" / "Wearing").

### Pitfalls
- Never keep old `.coins-line` rules (border, background, font-size, radius) — same-specificity CSS load order vs `.menu-button` is not guaranteed; the css file is a full replacement.
- Do not rename `critter-shop-open` or `#shop-overlay`; coins.ts dispatches, shop.ts listens.
- Don't add a buy path for free items: `owns` is already true for them; the "Free" chip is display-only and the footer button already says Wear/Wearing.
- Don't rebuild swatch rows inside `select()` (the existing comment explains why); only `renderAll` rebuilds.
- The external smoke script (loop/smoke/smoke.ts) can't be read here; if it still taps `.hats-card` or `.coins-line`, report that instead of keeping the removed elements.

### Tests
- none (DOM menu parts are exercised by check + smoke; no pure helpers added).

## Result (attempt 1, asus)

The start card's tappable coin line is now a "Cosmetics" button (menu-button look, 52 px) labelled "Cosmetics · <coins>" with the coin icon, opening the renamed Cosmetics panel. The panel lists every accessory under Head/Face/Back and every pattern (free ones included, with a "Free" chip instead of a price), where players try, buy, wear and take off looks; free items need no purchase since `owns` is already true for them. The separate Hats card is removed from the start screen (hats are worn from Cosmetics); the color picker is untouched. Note: I couldn't read the external smoke script (`loop/smoke/smoke.ts` is outside my working directory) — smoke passed with the old files still present, but if it still taps `.hats-card`, it will need updating now that the card is gone.

- Self-review: APPROVE
- Time: 16.0 min
- Deleted src/menu/hats.ts, as the agent asked.
- Deleted src/menu/hats.css, as the agent asked.

```
projects/draft-arena/game/src/menu/coins.css | 19 +--------
 projects/draft-arena/game/src/menu/coins.ts  |  8 ++--
 projects/draft-arena/game/src/menu/hats.css  | 19 ---------
 projects/draft-arena/game/src/menu/hats.ts   | 64 ----------------------------
 projects/draft-arena/game/src/menu/index.ts  |  2 -
 projects/draft-arena/game/src/menu/shop.ts   | 30 +++++++------
 6 files changed, 23 insertions(+), 119 deletions(-)
```
