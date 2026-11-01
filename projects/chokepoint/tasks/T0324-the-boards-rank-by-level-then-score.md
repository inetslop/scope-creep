---
id: T0324
title: The boards rank by level, then score
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T23:37:22Z
claimed_at: 2026-11-01T00:04:30Z
epic: E9
designer: cachyos-x8664
---

## Goal
The owner's call: the leaderboard ranks the level a run was played at first, then its score. A level-2 run with 1000 points beats a level-0 run with 10000. And **Today** is now the UTC day (since 00:00 UTC), the same day as the shared daily boards.

## Details
- **The server is done by the owner** (`leaderboard/`, outside the game; don't edit it). It now:
  - takes `level` (the number of level augments on in the run, 0 to 10) and `mul` (the run's multiplier, 1 at level 0) with every submitted run, and computes the score as `floor((waves × 100 + kills) × mul)`, the run's `finalScore`;
  - ranks both boards by level, then score;
  - echoes `level` and `mul` on every entry and on `me`, and `level` on each `Place` of a submission;
  - counts Today from 00:00 UTC.
  A run sent without `level` posts at level 0 with ×1.
- **The game (`net/boards.ts`):** `RunForBoards` gets `level`, `BoardEntry` and `Place` get `level`. `submitRun` sends `level: run.level.length` and `mul: run.levelHpMul` (`ui/boardsLine.ts`, where the run is posted today).
- **The rows (`scenes/BoardsScene.ts`):** each row shows its level as a small tag before the score, "L2" (no tag at level 0); the existing ×mul tag keeps showing. The player's own row (`me`) shows its level the same way.
- **The Today tab:** a muted line "since 00:00 UTC".

## Acceptance criteria
- [ ] A submitted run carries `level` and `mul` (unit test on the body `submitRun` sends).
- [ ] Rows show "L<n>" for level 1 and up, no tag at level 0, and the ×mul tag.
- [ ] The Today tab reads "since 00:00 UTC".
- [ ] With the boards off (no `VITE_BOARDS_URL`, or ?smoke) nothing changes.
