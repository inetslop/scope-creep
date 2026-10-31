---
id: T0134
title: "Retire the Body tree: Maw and Chomp to Frenzy, Bellow and Hide to Hive, Chill to Lobber"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T22:41:05Z
---

## Goal
The owner doesn't want the Body tree: it is a pile of plain stats with a few good talents stuck in it, not a playstyle. (The first try, T0074, failed in design for a reason unrelated to the task, and Body has since grown a talent; it goes now.) Its good talents move to the trees whose playstyle they serve; the plain stats go.

## Details
- Remove the Body tree: src/content/talents/body.ts and its line in TREES.
- Move these talents, one line each, into the tree named (keep each talent's id, upgrade and max ranks; its needs point only at talents of its new tree; hang it where it fits that tree's shape):
  - Maw (a bite in front) -> Frenzy: up close and mean.
  - Chomp (heal on kill, maxLevel 1) -> Frenzy: staying alive while hurt; deep in the tree, after a commitment.
  - Bellow (a ring around you that strikes what is near, after 1 prestige) -> Hive: the crowd around you is the target. Keep `prestige: 1`.
  - Hide (take less damage) -> Hive: built to stand in the crowd.
  - Chill (hits slow) -> Lobber: holding the crowd where the bubbles land.
- Delete Swift, Vigor, Might and Magnet: their upgrade files and lines in UPGRADES (the tests require every upgrade to be in a tree). Check that no other content uses their ids first.
- Each moved talent's text still says what it does; if a description names Body, fix it.
- Frenzy ends at 9 talents, Hive at 9, Lobber at 6 (the cap is 10).

## Acceptance criteria
- [ ] There is no Body tab in the talents panel.
- [ ] Maw and Chomp are in Frenzy, Bellow and Hide in Hive, Chill in Lobber, each reachable.
- [ ] Swift, Vigor, Might and Magnet are gone.
- [ ] `npm run check` and `npm run smoke` pass.
