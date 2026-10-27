---
id: T0118
title: Boss tick — the bar shows what is left
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T15:11:35Z
---

## Goal
The boss health bar prints a small ink tick at each 25/50/75% mark as the boss first drops below it, so how much of the fight is left is visible without counting.

## Details
- Only the boss health bar is touched — the bar T0006 added; The Grid (T0044) and The Palette (T0097) reuse it through the boss system. Edit the bar's draw (in the Boss system or the scene that owns the bar — confirm which in the design) and add the ticks beside the existing fill draw.
- As the boss's HP first drops to 75% of max, then 50%, then 25%, a small flat ink tick is printed on the bar at the point where that fraction of max HP remains: a short vertical ink line, 2 u wide, ~6 u tall, flat ink with no outline and no shadow — the same flat-ink style as the platemark × (T0094).
- One tick per threshold per boss spawn: printed once and it stays for the rest of that boss's life; the ticks live and die with the bar, so a fresh boss spawn shows a clean bar and no ticks from a previous boss remain.
- Nothing else about the bar changes: its width, fill, position, the nameplate (T0064), the spawn warning (T0070), the sting (T0058) and the boss-music hold (T0108) are all untouched. No new sound, key, scene or HUD element beyond the ticks on the existing bar.

## Acceptance criteria
- [ ] As a boss's HP first crosses 75%, 50% and 25% of its max, a small flat ink tick (2 u wide, ~6 u tall) prints on the boss bar at the matching point of the bar and stays for the rest of that boss's life.
- [ ] A fresh boss spawn starts with a clean bar: no ticks from a previous boss are visible.
- [ ] The bar's fill, width and position, the nameplate, the warning, the sting and the boss music are all unchanged; no sound, key, scene or new HUD element is added.
- [ ] `npm run check` and `npm run smoke` pass.
