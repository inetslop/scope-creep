---
id: T0377
title: "The loop: the board whose road circles the island once"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T20:21:14Z
claimed_at: 2026-11-01T20:21:18Z
designer: desktop
---

## Goal
Some boards grow a loop: the road makes one closed circle mid-island, and the cells inside it cover more road than any other cell on the board — a build that held a straight island fails here for a new reason (the center of the loop is the prize, and it does not cover the loop's mouth).

## Details
- **What the player sees:** on roughly 1 in 4 boards (a seeded draw, next to the fork's draw; exclusive with the fork — a board has at most one of the two road shapes), the road makes one closed loop in the middle of the island: an irregular rounded ring of ~14 road cells (12–16, never a perfect rectangle), 4–6 build cells inside it, at least 1 cell of clearance to the island's edge and to the rest of the road, no self-intersection. The road enters the ring, travels the full loop once — each ring cell exactly once — and leaves; every enemy walks the loop once on its way to the exit.
- **Why placement changes:** the build cells inside the loop are the strongest cover on the board — a tower at the loop's center reaches 3–4 ring segments at once, more than the guaranteed choke (T0217) and more than a switchback corridor (T0310). But the loop is large enough that no single cell, inside or out, has every loop cell in range 2: taking the center still leaves the loop's mouth — where the road enters and leaves the ring — to cover. The road is also longer, so enemies are exposed longer and a build that spends on the loop pays.
- **Composes with everything, changes nothing else:** the far gate (T0338) stays on a straight segment, never on the ring; the marked cell (T0340), the choke, the rocks and the waves are untouched (a loop board's waves are the ordinary plan on a longer road — the wave budget never reads the road); the Flyer's straight edge-to-exit crossing (T0353) and targeting are untouched (the sky flies over the board).
- **Named, not explained:** the board's facts (core/boardFacts.ts) carry the loop; the PickScene preview paints it from the map like every other feature; the boards reference (T0350) names it with its siblings — "The loop — the road circles the island once; the cells inside cover the most road", from "some boards". No new board mark, no HUD element, no new key.
- **The menu demo's road is unchanged** — it stays the fixed two-gate road (T0359).

## Acceptance criteria
- [ ] The loop is deterministic per seed; over 500 seeds, 18–32% of boards grow it (roughly 1 in 4).
- [ ] A loop board never has the fork, and a fork board never has the loop; boards without a loop are byte-identical to today.
- [ ] On a loop board the road is one continuous path from entrance to exit, each ring cell walked exactly once; the ring is a closed loop of 12–16 road cells with 4–6 build cells inside, at least 1 cell of clearance to the island's edge and to the rest of the road, no self-intersection.
- [ ] No build cell on a loop board — inside the loop or not — has every loop cell in range 2: the center is the best cover on the board, not a total one.
- [ ] A far gate on a loop board sits on a straight segment, never on the ring; the marked cell, the choke, the rocks, the wave plans, the Flyer's crossing and targeting are unchanged.
- [ ] The PickScene preview and the board painter show the loop; the boards reference names it with its dry line and "some boards" origin; the menu demo's road is unchanged.
- [ ] Playable menu to game over on a loop board on desktop and mobile; typecheck, lint, unit tests and the smoke pass.
