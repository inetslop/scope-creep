---
id: T0040
title: "Chime: a level-up chime"
size: S
priority: 2
status: design
depends_on: [T0039]
attempts: 0
created: 2026-10-31T07:44:39Z
epic: E11
---

## Goal
A level-up is the one moment of every life, and right now it is only a yellow ring. Give it a short bright chime, so the player hears their build grow even when the ring has already spread off-screen.

## Details
- The moment the player levels up, a short two-note chime plays (a bright "ding-ding," like a candy bell), at the same instant the yellow level-up ring spreads from them.
- One chime per level-up event, even if several levels land at once.
- Bright and short (under about 0.2 s), a touch higher and cleaner in pitch than the monster pops, so it reads as "you," not "the crowd."
- Uses the same audio layer the Pop set up (T0039). This task adds only the chime and hooks it to the moment the level-up ring plays.
- No engine change; works on desktop and mobile (audio already started by T0039).

## Acceptance criteria
- [ ] Level up once in a match: one bright chime plays at the same moment the yellow ring spreads.
- [ ] The chime is clearly brighter and higher than a monster pop, so it reads as the player's own moment.
- [ ] If a level-up and a monster pop happen at the same instant, both are heard and neither drowns the other.
- [ ] On a phone it plays with no extra tap and does not block the controls.
