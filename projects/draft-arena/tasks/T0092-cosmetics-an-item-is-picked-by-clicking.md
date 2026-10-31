---
id: T0092
title: "Cosmetics: an item is picked by clicking it, not by hovering"
assignee: yoga
size: S
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T15:20:51Z
claimed_at: 2026-10-31T15:38:45Z
design_attempts: 1
---

## Goal
On a desktop the Cosmetics panel is awkward: you click an item to buy it, and on the way to the Buy button the mouse passes over other items, which get selected instead, so Buy buys the wrong thing (or not the one you wanted).

## Details
- In src/menu/shop.ts an item is selected on `pointerenter` as well as on click (`swatch.addEventListener('pointerenter', tryOn)`). Selection happens on click (or tap) only.
- Hovering may still show the item on the preview critter while the pointer is over it, but it never changes the selected item, the name, text and state lines, or what the Buy / Wear button does; when the pointer leaves, the preview goes back to the selected item.
- The selected item stays marked (a ring or highlight) so the player can see what Buy will buy.
- Touch works as today: a tap selects.

## Acceptance criteria
- [ ] Click an item, move the mouse across other items to the Buy button, click Buy: the clicked item is bought.
- [ ] Hovering never changes the footer or the button.
- [ ] Tapping an item on a phone selects it, as before.

## Design (architect, yoga)

### Files
- edit `src/menu/shop.ts` — hover only previews; selection stays on click/tap

### Interfaces
No new or changed types. Changes to `shop.ts` closures: new module-scoped `let hoverId: string | null = null;` beside `selectedId`; `paintPreview()` reads `hoverId ?? selectedId`; swatch listeners split into enter/leave/click.

### Steps
1. In the state block (line 14), after `let selectedId: string | null = null;` add `let hoverId: string | null = null;`.
2. Rewrite `paintPreview` (lines 66-70) to:
```ts
  const paintPreview = (): void => {
    // The player's own look, with the swatch under the pointer (or the selected one) tried on.
    const id = hoverId ?? selectedId;
    const wearing: Wearing | undefined = id ? { ...view.profile.wearing, [slotOf(id)]: id } : undefined;
    view.preview(previewCanvas, wearing);
  };
```
3. In `renderFooter` change line 74's string `'Point at a swatch to try it on.'` to `'Pick a swatch to try it on.'` (the footer itself is untouched by hover).
4. In `addSection`, replace the `tryOn` block (lines 152-155) with:
```ts
      // A click (or a tap) selects; hovering only shows the item on the preview while the pointer is on it.
      swatch.addEventListener('pointerenter', () => { hoverId = def.id; paintPreview(); });
      swatch.addEventListener('pointerleave', () => { if (hoverId === def.id) { hoverId = null; paintPreview(); } });
      swatch.addEventListener('click', () => select(def.id));
```
5. In `openShop` (after `selectedId = null;`) add `hoverId = null;`.

Do not touch `select` (its `.selected` class toggle is the existing ring mark), `renderFooter`'s button logic, or `shop.css`.

### Pitfalls
- Enter/leave ordering: the guard `if (hoverId === def.id)` in `pointerleave` must stay, or leaving swatch A after entering B would paint A's preview.
- Hover must only ever set `hoverId` and call `paintPreview()` — never `select()`, so footer, button and ring cannot change on hover.
- Touch: a tap fires pointerenter → click → pointerleave in that order; the guard makes the final preview the selected item.
- Desktop: after a click the pointerenter has already set `hoverId` to the same id, so the preview shows what is selected.

### Tests
- none (menu part, no pure helpers; smoke must pass).
