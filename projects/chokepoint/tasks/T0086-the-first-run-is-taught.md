---
id: T0086
title: The first run is taught
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T00:22:08Z
epic: E1
design_attempts: 1
---

## Goal
A first-time player's first run is taught by three short cards on the board — no tutorial scene, no input — so the board is read before the first placement (pillar 1) and the loop is named where it happens, and never again.

## Details
- Shown only on a new run on a device whose profile (T0001) has `runsPlayed = 0` — the device's very first run. Never on a second or later run, never in the menu demo, never on a ghost run (T0078: a ghost run is only offerable after a finished run, so `runsPlayed` is already ≥ 1). A resumed first run re-derives dismissal from the run's state (below); all other runs show nothing.
- Three cards, each a small white rounded card in the HUD card language at the name tag's (T0085) scale — one bold word ~14 px, one muted ~12 px line under it where named below, soft shadow, no buttons, no close control:
  1. "Pick a card" — above the draft cards when the pre-wave-1 draft opens (above the row at 1280x720, above the 2×2 grid at 412x915), slides in over ~200 ms; dismissed the moment a card is picked.
  2. "Build beside the road" — beside the first buildable cell: the open cell beside the road nearest the entrance (the same cell the smoke auto-build (T0078) uses), the card sitting just off that cell and readable at both sizes; shown at the start of the first build phase; dismissed the moment any tower is built.
  3. "Hold the road" — at top-center, just under the wave banner (T0067) when wave 1 starts (sharing its ~200 ms in / ~300 ms out motion); dismissed when wave 1 is cleared and the draft for wave 2 opens.
- Dismissal state is in-run only, never saved. A resumed first run re-derives it: a card in the hand or a tower on the board dismisses "Pick a card"; any tower dismisses "Build beside the road"; a wave number above 1 dismisses "Hold the road". A hint whose action is already done never shows.
- The cards float over the board like the name tag (T0085) and the wave banner (T0067) and never intercept input — a tap on a cell, a card or a button underneath works as if the hint were not there.
- No sound, no new keys or buttons, no rule change. One new system file holds the three hint states, the `runsPlayed` gate and the anchors; the scenes mount it where the wave banner is already mounted (a one-line registration per scene).
- Closest examples: the name tag (T0085) for a white board card with a one-shot lifecycle; the wave banner (T0067) for top-center slide-and-fade; the clean chip (T0005) for the motion family.

## Acceptance criteria
- [ ] On a fresh device, the pre-wave-1 draft shows "Pick a card" above the cards, gone the moment a card is picked.
- [ ] The first build phase shows "Build beside the road" beside the first buildable cell (the smoke auto-build's cell); building any tower dismisses it.
- [ ] Wave 1 shows "Hold the road" under the wave banner; it is gone when wave 1 is cleared.
- [ ] A second run, a ghost run and the menu demo show no hint cards; a resumed first run shows only the hints whose action is not yet done.
- [ ] The cards never intercept input; no sound, no new key; desktop 1280x720 and mobile 412x915 smoke pass.
