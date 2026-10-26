---
id: T0027
title: "Marginalia: first-encounter annotations"
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T20:55:07Z
---

## Goal
When an enemy type appears in a run for the first time, a small dry ink annotation fades in beside it for 2 s — the page teaches you what each shape is, in the game's art-school voice.

## Details
- The first time an enemy of a given type spawns in a run, a small all-caps ink text label appears just above that enemy (~24 units above its center), follows the enemy, and is clamped so the text stays inside the arena.
- The label fades in over 200 ms, holds, and fades out over the last 500 ms of its 2 s lifetime. If the enemy dies before 2 s, the label dies with it.
- Style: small (~13 px, the same clean geometric type as the HUD), ink color, no background box — like a dry handwritten note on the paper. No sound.
- One label per enemy type per run; if two new types appear close together, both labels show at once.
- Notes per enemy:
  - Wedge: "RED RUSHES"
  - Dart: "BLACK AND QUICK"
  - Block: "HEAVY HITS HARD"
  - Hex: "GREEN CLOSING IN"
  - Mote: "THEY COME IN FLOCKS"
  - Sentry: "THE PENTAGON SHOTS"
  - Splitter: "IT SPLITS WHEN IT DIES"
  - Splinter: "BORN ALREADY FAST"
  - Boulder: "SLOW BUT HEAVY"
  - Tile: "PLAIN AND PERSISTENT"
  - Slab: "A WALL THAT CRAWLS"
- Enemies added later without a note get the fallback "IT'S NEW."

## Acceptance criteria
- [ ] In a fresh run, the first Wedge to spawn shows "RED RUSHES" above it for ~2 s; later Wedges show nothing
- [ ] The first Sentry shows "THE PENTAGON SHOTS" and the first Slab shows "A WALL THAT CRAWLS"
- [ ] The label is small ink text with no background box, follows its enemy, stays inside the arena, and disappears if the enemy dies early
- [ ] At most one label per enemy type per run; works on desktop and mobile
- [ ] `npm run check` and `npm run smoke` pass
