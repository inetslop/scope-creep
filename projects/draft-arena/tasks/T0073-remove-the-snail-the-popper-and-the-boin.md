---
id: T0073
title: Remove the Snail, the Popper and the Boing
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T12:51:01Z
claimed_at: 2026-10-31T13:20:28Z
designer: inet-racing
---

## Goal
Fewer monsters, each playing differently. The owner doesn't like the Snail at all, and two others are too close to monsters that stay: the Popper is a slow red circle like the Dot whose only twist is a puff when it dies (the Puff already owns "something happens when it dies"), and the Boing stops, telegraphs and lunges at you like the Zippy (both are answered by stepping aside), in a dark red that doesn't fit the palette.

## Details
- Delete the monsters `snail`, `popper` and `boing` (src/content/monsters/) and their lines in MONSTERS.
- Delete what only they use: the area `sticky` (Snail), the area `pop-puff` and the effect `puff-burst` (Popper), with their registry lines. Check with grep that nothing else uses an id before deleting it.
- The monsters left: Dot, Puff, Flee, Zippy, Sleeper, Spitter. Nothing else changes.

## Acceptance criteria
- [ ] No Snail, Popper or Boing in a match; their files and registry lines are gone.
- [ ] No content refers to the ids 'snail', 'popper', 'boing', 'sticky', 'pop-puff' or 'puff-burst'.
- [ ] `npm run check` and `npm run smoke` pass.
