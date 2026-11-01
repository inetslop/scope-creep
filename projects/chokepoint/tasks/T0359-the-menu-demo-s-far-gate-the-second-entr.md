---
id: T0359
title: "The menu demo's far gate: the second entrance before the first run"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T12:52:50Z
claimed_at: 2026-11-01T12:52:54Z
designer: desktop
---

## Goal
The far gate's read (T0338) is seen before the first run: the menu's live demo plays on a road with two gates, and a third of its walkers come in through the far gate.

## Details
- The menu's live demo (MenuDemo's fixed road, the real planWave plan it already plays — T0049) gets a far gate partway down the road, drawn with the in-game far gate's look (T0338).
- The demo wave routes its walkers the way a real far-gate board does (T0338): a third of each non-boss wave's walkers spawn at the far gate and walk from there to the exit; the rest still spawn at the entrance. A boss demo wave sends none through the gate, as in a real run.
- Nothing else changes: the demo keeps its show behavior and its speed; no new HUD element, sound, or text. The demo board stays purely for show — never saved, never a run board.
- The gate and its walkers are visible without zoom at 412x915 and 1280x720.

## Acceptance criteria
- [ ] The menu demo shows a road with two gates (the entrance and the far gate), the far gate wearing the in-game far-gate look.
- [ ] A third of the demo wave's walkers spawn at the far gate and walk from there to the exit; the rest spawn at the entrance — the same split rule a real far-gate wave uses, and a boss demo wave sends none through the gate.
- [ ] The demo otherwise behaves as before: same speed and loop, no new sound, no new HUD element, and no board mark beyond the gate itself.
- [ ] A player with a fresh profile sees the far gate in the menu before their first run; at 412x915 and 1280x720 the gate is visible without zoom.
