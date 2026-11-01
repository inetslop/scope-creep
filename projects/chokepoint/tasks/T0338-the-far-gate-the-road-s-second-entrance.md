---
id: T0338
title: "The far gate: the road's second entrance"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T04:12:33Z
claimed_at: 2026-11-01T04:42:35Z
epic: E13
designer: inet-racing
---

## Goal
"Every board is different" goes past the rocks and the path's shape: on some boards the road grows a second gate partway along, and a share of every wave's enemies comes in through it — the player covers the road from two entry points, not just the entrance.

## Details
- **The board:** when a board's seed roll selects it (roughly one board in three; deterministic per seed, so the same seed always gives the same board, gate or not), the road grows a second gate — a gate token like the entrance gate — on a straight road cell about a third of the way from the entrance, away from the exit and away from the guaranteed choke cell. The island, the road and the build cells are otherwise unchanged; the gate is the road's own end, not a painted mark (the board bar in modules/board.md).
- **The wave:** on a far-gate board, in the wave's spawn schedule every 3rd spawn comes out of the far gate (so the far gate sends ⌊count ÷ 3⌋ enemies; a wave of 1 or 2 sends none). Those enemies start at the far gate and walk the remaining road to the exit — so they reach the exit sooner than a near-gate enemy spawned at the same moment. Boss waves (10, 20, 30, 40, 50) send their whole wave from the near gate — the far gate is silent on a boss wave. The rest of the wave (count, hp, mix, intervals, tags) is otherwise unchanged.
- **On screen (no new HUD element):** the board shows both gates; the board preview (the daily pick and the ghost run) picks both up from the board's own draw, with no change to that file; the next-wave preview wears one muted "far gate ×N" line under the counts while the board has the far gate and the wave sends through it (N the far gate's share; the line is absent otherwise, and absent on boss waves). The line must fit the preview card at 412×915 and 1280×720.
- **Why it makes placing towers more interesting:** a build that walls the entrance (the common early habit) is now exposed on the back half of the road, where the far gate feeds in; the guaranteed choke can sit on the wrong side of the far gate, so the player must cover the mid-road, not just the front.
- **What it punishes / what answers it:** it punishes an entrance-only build and a single-choke build. It is answered by spreading cover along the mid-road and by slows and roots on the far gate's short run (a root there holds an enemy that has little road left).
- New pure module (the seed roll, the far-gate cell, and the wave's per-gate split) with unit tests; the board generator, the wave plan and the spawn schedule all read from it. Spawning should read the far gate's road position from the board and the per-gate split from the wave plan, on the wave spawner's own path, so the enemy pool is left untouched.

## Acceptance criteria
- [ ] The far gate is decided deterministically from the seed (the same seed always gives the same answer); across a sweep of seeds roughly a third of boards carry it, on a straight road cell about a third of the way from the entrance, drawn like the entrance gate (unit test on the seed roll).
- [ ] On a far-gate board, a non-boss wave sends ⌊count ÷ 3⌋ enemies from the far gate (a wave of 1 or 2 sends none); those enemies start at the far gate and walk the remaining road to the exit; boss waves send everything from the near gate; the wave's count, hp, mix, intervals and tags are otherwise unchanged (unit tests on the per-gate split).
- [ ] The board and the board preview show both gates; the next-wave preview wears the muted "far gate ×N" line only when it applies (never on a boss wave, never on a board without the far gate), fitting at 412×915 and 1280×720.
- [ ] No new HUD element, input, sound or painted board mark beyond the gate token itself; a board without the far gate is byte-identical to today; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
