---
id: T0358
title: "The wave branch and its first node, The door: the far gate on every board"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T12:34:19Z
claimed_at: 2026-11-01T12:34:21Z
epic: E14
designer: desktop
---

## Goal
The tech tree gets its fifth branch, "The wave" — between-run coins buy how a run plays (E14) — and its first node, The door (30 coins): once owned, every board carries the far gate (T0338), so every run's build plan covers two entrances from the first placement.

## Details
- **The branch:** a fifth branch on the tech screen, "The wave", beside the four existing branches, in the branches' own card language (a name with its nodes under it). This task brings the branch and exactly one node; the branch's other two nodes (The thin road, The breather) are later E14 tasks and are not stubbed, greyed or named here.
- **The node:** "The door", 30 coins, bought once, on for every run after (Iron included), kept on the profile like every other node. The card's dry line: "the far gate on every board".
- **The effect:** while the node is owned, every generated board carries the far gate exactly as today's far-gate boards do — a second gate partway down the road, a third of each non-boss wave coming in through it (boss waves unchanged), shown on the board, the pick screen's previews and the next-wave preview. The gate's position, look and wave behavior are T0338's, untouched: the node changes where the gate appears (some boards → every board), not what it is. No new save field for the board: the gate is part of the board, and a resumed run's board already has it.
- **While not owned:** board generation is byte-identical to today — the far gate still rolls onto only the boards it rolls onto today.
- **The boards reference:** the pause screen's boards reference (T0350) already names the far gate and where it comes from; while the node is owned that line reads "tech · The door", while it is not owned it reads as today.
- **Not here:** the menu's live demo is a fixed one-entrance road and stays one-entrance — the demo's own gate is a separate parked idea in IDEAS (that clause is why T0357 was rejected). No HUD element, no sound, no new readout: the node card says the same things every existing node card says (name, dry line, price, owned mark), and nothing the screen already shows is shown twice.
- **Why the screen has room (screen bar):** the branch and the node reuse the tech screen's existing card language — the 13 current node cards already fit; all five branches with their nodes must still fit the tech screen at 412×915 and 1280×720.
- **Why placement is more interesting (board bar):** today a build plan is made for the road it is dealt; with The door the plan is always for a road with two entrances — the far gate's shorter run-in shifts where the pressure lands, so cover chosen for the main gate no longer guarantees the second one.

## Acceptance criteria
- [ ] The tech screen shows a fifth branch, "The wave", with one node, "The door" at 30 coins, in the existing card language; all five branches and their nodes fit the tech screen at 412×915 and 1280×720.
- [ ] Buying The door spends 30 coins and wears the owned mark; the purchase survives closing and reopening the tab and is on for every run after.
- [ ] With the node owned, every fresh run's board carries the far gate: a second gate partway down the road, a third of each non-boss wave coming in through it (boss waves unchanged), shown on the board, the pick screen's previews and the next-wave preview exactly as on today's far-gate boards.
- [ ] Without the node, the same seed produces today's board — the far gate on only the boards it rolls onto today.
- [ ] The pause screen's boards reference reads the far gate's source as "tech · The door" while the node is owned, and as today while it is not.
- [ ] The menu's live demo is byte-identical: one entrance, no gate.
- [ ] Unit tests: the far-gate rule as a pure function of the node's ownership (owned → the gate on every generated board; not owned → today's seeded roll), and the gate's wave behavior (a third of non-boss waves) unchanged either way.
