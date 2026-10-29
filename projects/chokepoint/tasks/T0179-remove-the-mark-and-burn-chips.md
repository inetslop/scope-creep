---
id: T0179
title: "Remove the mark and burn chips over enemies"
size: S
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-29T12:21:52Z
---

## Goal
A marked enemy and a burning enemy each show their state twice. The Mark already puts a small ink down-chevron above the health bar, and a burn already has a small orange dash circling the enemy (both in `systems/enemyMarks.ts`). Then T0099 and T0113 added a chip over the token on top of those. Remove the two chips; the original markers stay.

## Details
- Remove the two chip hooks and nothing else:
  - `src/systems/enemyHooks/markTick.ts` (T0099) and `src/systems/enemyHooks/burnTick.ts` (T0113): delete both files;
  - their import and list lines in `src/systems/enemyHooks/index.ts`.
- Keep the Mark's ink down-chevron and the burn's orbiting orange dash exactly as they are.
- `src/systems/enemyHooks/slowTick.ts` places its chip after the mark and burn chips (its x offset counts them). With those gone, it sits where the first chip sat, with no offset for a mark or a burn.
- `src/systems/enemyHooks/rampTick.ts` only mentions the mark chip in a comment; update the comment.

## Acceptance criteria
- [ ] A marked enemy shows only the ink down-chevron above its health bar: no chip over the token.
- [ ] A burning enemy shows only the orange dash circling it: no chip over the token.
- [ ] A slowed enemy's chip sits in the first chip's place, also when the enemy is marked or burning.
- [ ] No `markTick` or the burn chip's `burnTick` hook is left in `src/` or `tests/` (the core `burnTick()` damage function in `src/core/burn.ts` stays).
