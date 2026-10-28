---
id: T0019
title: "Fast-forward: a 2x speed button for the wave phase"
assignee: narcissus
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T03:52:49Z
---

## Goal
Waves between builds can drag. A fast-forward button lets the player press 2x and burn through slow moments so a run stays in flow. It makes the game feel good from the first run and sets up the longer multi-level runs E3 will bring.

## Details
- A small round button in the HUD, next to the wave / lives card. It shows "2x".
- Tap / click to toggle between 1x and 2x. When 2x is active, the button is filled yellow and still reads "2x" so the player can see it is on. Tapping again returns to 1x and the button goes back to a plain white card.
- At 2x the whole wave phase runs twice as fast: enemy movement, tower firing, projectile flight, hit flashes and kill bursts. Apply it to the simulation step (delta time), so gold, lives, score and kills all accrue consistently — nothing desyncs or double-counts.
- Fast-forward only acts during the wave phase. When a build phase starts, it automatically resets to 1x and the button un-fills.
- A keyboard shortcut toggles it on desktop: **F**. If F is already taken, pick the nearest free key and use that same key everywhere it is shown.
- Discoverability: the button is visible in the HUD where it is used, and the pause screen lists it with the other controls: "F — fast-forward (2x) during waves."
- If the player opens the pause screen while at 2x, the game pauses as normal; on resume it stays at 2x.

## Acceptance criteria
- [ ] A "2x" button appears in the HUD during a wave; tapping it switches to 2x and the button fills yellow to show it is on; tapping again returns to 1x and it un-fills.
- [ ] At 2x, enemies move and towers fire at a clearly faster (2x) pace, and gold, lives, score and kills all accrue correctly with no desync or double-counting.
- [ ] The moment a build phase begins, fast-forward resets to 1x and the button un-fills.
- [ ] Pressing F on desktop toggles 2x exactly like tapping the button.
- [ ] The pause screen lists the fast-forward control (button + F key) alongside the other controls.
- [ ] The game is fully playable and passes the desktop and mobile smoke test at both 1x and 2x.
