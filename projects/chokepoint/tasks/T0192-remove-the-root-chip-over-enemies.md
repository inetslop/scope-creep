---
id: T0192
title: "Remove the root chip over enemies"
size: S
priority: 2
status: design
depends_on: [T0139]
attempts: 0
created: 2026-10-29T12:23:58Z
---

## Goal
T0139 is adding a chip over a rooted enemy, but rooting already shows: a flat light-blue ring on the ground under the enemy for as long as the stop lasts (`systems/enemyMarks.ts`). Once T0139 lands, remove its chip, the same way T0179 removes the mark, burn, slow and ramp chips.

## Details
- Delete the root chip's enemy hook that T0139 adds (in `src/systems/enemyHooks/`) and its import and list lines in `src/systems/enemyHooks/index.ts`.
- Undo anything else T0139 changed only for its chip, and nothing more.
- Keep the light-blue ground ring under a rooted enemy exactly as it is.

## Acceptance criteria
- [ ] A rooted enemy shows only the light-blue ground ring: no chip over the token.
- [ ] Nothing of T0139's chip is left in `src/` or `tests/`.
