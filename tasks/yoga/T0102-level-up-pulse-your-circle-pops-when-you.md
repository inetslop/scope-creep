---
id: T0102
title: Level-up pulse — your circle pops when you pick
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T10:32:47Z
claimed_at: 2026-10-27T10:52:45Z
designer: yoga
---

## Goal
The moment a level-up card is picked, your blue circle swells 25% for 300 ms — the level-up is felt in your own shape, not just in the cards flipping away.

## Details
- The instant a level-up card is confirmed and play resumes, the player's circle scales 1.0 → 1.25 → 1.0 over 300 ms with a fast ease-out — a quick pop that settles.
- Visual only: the physics body / hitbox stays at its normal size the whole time; no damage, no pickup change, no stat or speed change (nearest example: the black hit-flash on enemies, which is also visual-only).
- The existing level-up sound (T0003) plays exactly as it does today — no new sound. The card-flip deal (T0059) is unchanged; the pulse starts as the LevelUp scene closes.
- One pulse per card picked; it does not delay spawns, pickups, the Orbit weapon or anything else.
- No new HUD element, no input, no scene, no content file. Identical on desktop and mobile.

## Acceptance criteria
- [ ] The moment a level-up card is picked, the player's circle swells to 1.25× and settles back to 1.0× over 300 ms.
- [ ] The swell is visual only — the hitbox, movement and all stats are unchanged, and no new sound plays.
- [ ] The card-flip level-up animation (T0059) and the existing level-up sound are unchanged.
- [ ] `npm run check` and `npm run smoke` pass.
