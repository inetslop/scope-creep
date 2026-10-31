---
id: T0092
title: "Cosmetics: an item is picked by clicking it, not by hovering"
size: S
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T15:20:51Z
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
