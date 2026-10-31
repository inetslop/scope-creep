---
id: T0022
title: "The shop: a panel over the start screen that sells looks"
assignee: asus
size: M
priority: 1
status: in-progress
depends_on: [T0019, T0021]
attempts: 1
created: 2026-10-31T04:59:35Z
claimed_at: 2026-10-31T06:59:19Z
epic: E6
---

## Goal
The coin line on the start card opens the shop: patterns on top, accessories in rows by slot, a preview critter that wears what you point at, and a Buy button that spends coins — what a player buys is theirs to wear, kept for their next visit.

## Details
- Where it opens and closes: tapping the coin line on the start card (T0019) opens the shop panel over the start card; a close button in the panel's top right (at least 44 px tall on a phone) or Esc on a keyboard closes it. The panel is a white sticker card; the match keeps playing behind it, and Play is one close away.
- The panel, top to bottom: a header with "Shop" and the coin balance (the coin line behind the panel is what opened it, so while the panel is open the balance lives in the header, not twice); a big preview critter in the player's color wearing their current pattern, hat and the selected item; a row of pattern swatches; then one row per accessory slot that has priced stock — today Face and Back, and a Hat row appears when a priced hat exists. Each swatch is a mini critter (about 64 px) in the player's color wearing the item; an unowned swatch carries a small coin price stamp, an owned one does not.
- Trying on: hovering a swatch on a desktop, tapping it on a phone, selects it (an ink outline on the swatch): the preview critter wears it and a footer line shows its name (at most 18 characters), its one-line description (wraps) and its state.
- One button in the footer, one control per action:
  - "Buy · 40" — unowned and affordable: spends the coins (the header balance and the start card's coin line both come down), the item is owned and kept for the next visit, the button becomes "Wear", and a confetti pop plays on the preview critter.
  - "Wear" — owned, not worn: puts the item on for the next match (visible on the player's critter for everyone in it) and on the preview; wearing an item in a taken slot replaces what the player had there.
  - "Wearing" — owned and worn: tapping it takes the item off.
  - "Costs 40 coins" — disabled, when the player has fewer coins than the price.
  - "Needs 2 prestiges" — disabled, when the item's prestige gate is higher than the player's prestiges in all, even with enough coins.
- The shop sells looks only: nothing bought changes how anyone plays.
- Fullest state: 12 patterns, 10 Face, 10 Back, 10 Hat, 9999 coins, an 18-character name and a long wrapped description — the swatch rows wrap and everything fits its card at 412x915 and 1280x720.

## Acceptance criteria
- [ ] Tapping the coin line on the start card opens the shop panel over the start card; the close button or Esc closes it; Play still works from the closed start card.
- [ ] The panel shows the header with the balance, the preview critter, the pattern row and a row for Face and for Back; each swatch is a mini critter in the player's color wearing the item, and owned and unowned swatches read differently at a glance.
- [ ] Hovering (desktop) or tapping (phone) a swatch: the preview critter wears it on top of the player's current pattern and hat, and the footer shows its name, description and state; an 18-character name and a wrapped description fit.
- [ ] "Buy · N" spends the coins — the header balance and the start card's coin line both come down — and the item is owned, kept for the next visit, with the button now "Wear".
- [ ] "Wear" puts the item on for the next match (seen on the player's critter by everyone in it) and on the preview; wearing an item in a taken slot replaces the old one; "Wearing" takes it off.
- [ ] An item the player cannot afford shows a disabled "Costs N coins"; an item above the player's prestiges in all shows a disabled "Needs N prestiges" even with enough coins.
- [ ] The fullest state above fits at 412x915 and 1280x720 as a white sticker card.

## Design (architect, desktop)

### Files
- create `src/menu/shop.ts` - the shop: a `MakeMenuPart` that builds a full-viewport overlay with the sticker card (header + preview canvas + swatch rows + footer), opens on a `'critter-shop-open'` CustomEvent, sells via `MenuView`
- create `src/menu/shop.css` - all shop styles (imported at the top of shop.ts); never touches base.css/menu.css
- edit `src/menu/index.ts` - `import { shop } from './shop.ts';` + `shop,` as the last element of `MENU_PARTS`
- edit `src/menu/coins.ts` - make the coin line a `<button type="button">` if it isn't one, and add `line.addEventListener('click', () => line.dispatchEvent(new CustomEvent('critter-shop-open', { bubbles: true })));` with a comment naming shop.ts as the listener (T0019 owns this file; this task runs after it)
- edit `src/menu/coins.css` - `cursor: pointer` + hover/press on the coin line so it reads as tappable

### Interfaces
No new shared types. `shop.ts` exports `export const shop: MakeMenuPart = (root: HTMLElement): MenuPart => { ... }`. Internal state only: `let view: MenuView; let open = false; let selectedId: string | null = null`. All profile access through `view.profile`, `view.owns(id)`, `view.cantBuy(id)`, `view.buy(id)`, `view.wear(slot, id | undefined)`, `view.preview(canvas, wearing?, color?)`. `view.cantBuy` already returns the exact disabled labels with the right priority: `''`, `"Costs 40 coins"`, `"Needs 2 prestiges"`, `"Owned"` — use its string verbatim.

DOM skeleton, built once in the factory and appended to `document.body` (NOT to `root`; `root` is the shared `.menu-parts` slot the shop only listens on):
```html
<div id="shop-overlay" hidden>
  <div class="shop-card hud-card">
    <header class="shop-head">
      <h2>Shop</h2>
      <span class="shop-balance"><span class="coin"></span><span class="shop-coins"></span></span>
      <button class="menu-button shop-close" aria-label="Close the shop">✕</button>
    </header>
    <canvas class="shop-preview" width="200" height="200"></canvas>
    <div class="shop-rows"></div>
    <footer class="shop-foot">
      <p class="shop-name"></p>
      <p class="shop-desc"></p>
      <p class="shop-state"></p>
      <button class="menu-button shop-buy"></button>
    </footer>
  </div>
</div>
```
Rows are data-driven: one "Patterns" section from `view.patterns.filter(p => p.price > 0)` and one section per slot in `ACCESSORY_SLOTS` order from `view.accessories.filter(a => a.slot === slot && a.price > 0)`; a section renders only when its list is non-empty (labels: `head`→"Hat", `face`→"Face", `back`→"Back"). Each swatch: `<button class="swatch" data-id="..." aria-label="<name>">` containing a `<canvas width="96" height="96">` painted with `view.preview(c, worn)` where `worn: Wearing` is `{ pattern: id }` for a pattern or `{ [def.slot]: id }` for an accessory (build the object explicitly, one key); unowned swatches add `<span class="price"><span class="coin"></span>40</span>`, currently-worn swatches get class `worn`.

Key behavior, exact logic:
- `renderAll()` (called from `update(view)` only when `open`, and on open): set `.shop-coins` text to `view.profile.coins`; rebuild `.shop-rows` (fresh section/`h3`/swatch buttons); then `paintPreview()` + `renderFooter()`.
- `paintPreview()`: `view.preview(previewCanvas, selectedId ? { ...view.profile.wearing, [slotOf(selectedId)]: selectedId } : undefined)` — the preview keeps the player's current pattern/hats and only overrides the selected item's slot.
- `select(id)` (bound per swatch to BOTH `click` AND `pointerenter`, so hover selects on desktop and tap selects on a phone): set `selectedId`, toggle class `selected` on the matching `.swatch` only, then `paintPreview()` + `renderFooter()`. Never rebuild the row DOM here — rebuilding would cancel the hover.
- `renderFooter()`: no selection → name "Point at a swatch to try it on.", empty desc/state, buy button `hidden`. With a selection: name = `def.name`, desc = `def.description`, state = worn ? "Wearing it" : owned ? "Owned" : "Not owned". Button, one per action: owned & worn → "Wearing", action `view.wear(slot, undefined)`; owned & not worn → "Wear", action `view.wear(slot, id)`; not owned → `const cant = view.cantBuy(id)`: if `cant` non-empty the button is `disabled` with `textContent = cant`, else label `Buy · ${def.price}`, action `if (view.buy(id)) popConfetti()`.
- `popConfetti()`: on the stable preview canvas, 24 bits `{angle, speed: 40+Math.random()*70, size: 4+Math.random()*5, color}` with color from `[PALETTE.yellow, PALETTE.pink, PALETTE.blue, PALETTE.green, PALETTE.orange, PALETTE.purple]`; a `requestAnimationFrame` loop that first calls `view.preview(previewCanvas, ...)` (redraw the critter under the confetti) then draws each bit as a rotating filled rect at `center + dir*speed*p` with a gravity term `30*p*p`, where `p` goes 0→1 over 700 ms measured from the FIRST rAF timestamp (initialize a `start` var to 0 in the loop — never `performance.now`); after `p >= 1` one final clean `view.preview` and stop. `Math.random` is fine here: it is client-only `src/menu` juice, the lint ban is `src/content` only.
- open/close: `open()` sets `open = true`, `selectedId = null`, `renderAll()`, `overlay.hidden = false`, adds a `window` `keydown` listener that closes on `e.key === 'Escape'`; `close()` reverses it. The factory binds `root.addEventListener('critter-shop-open', open)` and the close button's `click` → `close()`.
- `update(view)`: store it; `if (open) renderAll()`. The engine already re-calls `update` in a microtask after every `buy`/`wear`, so buy/wear handlers do nothing after calling the view method.

CSS (`shop.css`), complete rules:
```css
#shop-overlay { --ink: #3b3355; --muted: #7a7193; position: fixed; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; background: rgba(59, 51, 85, 0.4); font-family: Fredoka, system-ui, sans-serif; }
#shop-overlay[hidden] { display: none; }
#shop-overlay .shop-card { width: min(560px, 94vw); max-height: min(860px, 92vh); display: flex; flex-direction: column; box-sizing: border-box; padding: 14px 16px; }
#shop-overlay .shop-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
#shop-overlay .shop-head h2 { margin: 0; font-size: 26px; flex: 1 1 auto; }
#shop-overlay .shop-balance { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
#shop-overlay .coin { width: 14px; height: 14px; border-radius: 50%; background: #ffd43b; border: 2px solid var(--ink); display: inline-block; }
#shop-overlay .shop-close { width: 44px; height: 44px; min-height: 0; padding: 0; font-size: 20px; line-height: 1; border-radius: 12px; }
#shop-overlay .shop-preview { display: block; width: 150px; height: 150px; margin: 0 auto 10px; }
#shop-overlay .shop-rows { overflow-y: auto; min-height: 40px; flex: 1 1 auto; }
#shop-overlay .shop-row + .shop-row { margin-top: 10px; }
#shop-overlay .shop-row h3 { margin: 0 0 6px; font-size: 14px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; text-align: center; }
#shop-overlay .swatches { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
#shop-overlay .swatch { position: relative; width: 64px; height: 64px; padding: 0; border: 2px solid transparent; border-radius: 12px; background: #fff; cursor: pointer; }
#shop-overlay .swatch canvas { width: 100%; height: 100%; display: block; border-radius: 10px; }
#shop-overlay .swatch.selected { outline: 3px solid var(--ink); outline-offset: 1px; }
#shop-overlay .swatch.worn::after { content: ''; position: absolute; left: -4px; top: -4px; width: 12px; height: 12px; border-radius: 50%; background: #51cf66; border: 2px solid var(--ink); }
#shop-overlay .price { position: absolute; right: -4px; bottom: -4px; background: #fff; border: 2px solid var(--ink); border-radius: 999px; font-size: 11px; font-weight: 700; padding: 1px 5px; display: flex; align-items: center; gap: 3px; }
#shop-overlay .price .coin { width: 9px; height: 9px; border-width: 1.5px; }
#shop-overlay .shop-foot { border-top: 3px solid var(--ink); margin-top: 10px; padding-top: 10px; }
#shop-overlay .shop-name { margin: 0; font-size: 20px; font-weight: 700; }
#shop-overlay .shop-desc { margin: 2px 0 4px; font-size: 14px; color: var(--muted); line-height: 1.3; }
#shop-overlay .shop-state { margin: 0 0 8px; font-size: 14px; font-weight: 700; }
#shop-overlay .shop-buy { width: 100%; }
```
Fullest state (12 patterns, 10 Face, 10 Back, 10 Hat, 9999 coins, 18-character name, long wrapped description): header line "Shop · ◉ 9999 · ✕"; 150 px preview; four centered wrap rows of 64 px swatches (5 per row on the 412-wide card, 7 on the 560-wide card) — the `.shop-rows` area scrolls inside the card when the rows overflow, the card itself never does; footer: one 18-char name line, a wrapped description (max two lines), a state line, and the 52 px "Buy · N" button. At 412x915 the card is 387x842; at 1280x720 it is 560x662 — both fit, and the full-viewport overlay sits above `#menu` and `#hud` (both `position: fixed`, no z-index), so Play is unreachable until the panel is closed.

### Steps
1. Create `src/menu/shop.ts` (import `./shop.css` first, then types from `../../engine/api.ts` and `PALETTE` from `../../content/palette.ts`): build the skeleton once in the factory, append to `document.body`, wire `root`'s `critter-shop-open` listener, the close button, and implement `open`, `close`, `renderAll`, `select`, `paintPreview`, `renderFooter`, `popConfetti`, `slotOf` exactly as specified.
2. Create `src/menu/shop.css` with the rules above.
3. Edit `src/menu/index.ts`: add the import and `shop,` as the last `MENU_PARTS` entry.
4. Edit `src/menu/coins.ts` / `coins.css` for the tappable coin line that dispatches `'critter-shop-open'` (bubbling), as specified.

### Pitfalls
- The `hidden` attribute is overridden by `display: flex` — keep `#shop-overlay[hidden] { display: none; }` (same pattern the engine's own css uses).
- `--ink`/`--muted` are defined only on `#hud` and `#menu`; the overlay lives on `document.body`, so define them on `#shop-overlay` (done above). Scope every override with `#shop-overlay` so it beats `.hud-card`/`.menu-button` regardless of CSS load order.
- Do not rebuild `.shop-rows` inside `select()` (hover): it replaces the element under the cursor and re-triggers `pointerenter` loops.
- The preview `<canvas>` must survive `renderAll()` (buy triggers an engine microtask re-render mid-confetti): create it in the skeleton, repaint it in place.
- Measure confetti time from the first rAF callback's timestamp; no `performance.now`, no `Date`.
- `buy()` returns `false` when `cantBuy` is non-empty — only confetti on `true`; the re-render comes from the engine's queued `update`, never synchronously from the handler.
- Wearing an item in a taken slot replaces the old one automatically (`view.wear`); passing `undefined` takes the slot off — do not special-case it.
- The overlay's full-viewport background absorbs clicks, so a start-card edge peeking out from behind the card is harmless (nothing behind is clickable while open).

### Tests
- none (no pure helpers; the engine's content tests and the browser smoke test, which shows the start screen on desktop and phone, cover it)
