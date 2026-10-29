---
id: T0103
title: "Rally reaches as far as its ring: Reach grows it"
size: S
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-29T07:01:07Z
---

## Goal
Bug: a Rally tower with Reach added shows a bigger range ring, but its speed-up still reaches only 2 cells. Rally's reach becomes the tower's own range, the ring it shows, so Reach makes a Rally tower speed up towers further away.

## Details
- Each Rally tower (Rally as its first augment) speeds up the towers whose centers are inside **its own range circle**: the tower's range with everything added (2 cells for a plain Rally; with one Common Reach added, 2.7 cells), instead of the fixed 2 cells every Rally tower uses today. Two Rally towers with different reach each use their own.
- Where it goes wrong today: `RALLY_RANGE` in `src/core/rally.ts` (the Rally augment's base range) is used for every Rally tower in `src/systems/RallySystem.ts`, both for which towers are sped up and for the teal ring it pulses; the tower's range ring shows its real range.
- The teal rally ring uses the same reach as the speed-up.
- The tower panel line says the tower's own reach, e.g. "Towers within 2.7 cells attack 10% faster" (one decimal when it isn't whole). The draft card's line stays "Towers within 2 cells".
- Rally added to another tower (it joins its own rally: only that tower is sped up) is unchanged.

## Acceptance criteria
- [ ] A Rally tower with one Common Reach added speeds up a tower 2.5 cells away (inside its 2.7-cell ring); one 3 cells away is not sped up.
- [ ] A plain Rally tower still reaches exactly 2 cells.
- [ ] The range ring, the teal rally ring and the towers that show the speed-up chevron all agree.
- [ ] Unit tests cover the reach with and without Reach.
