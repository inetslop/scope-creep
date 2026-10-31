---
id: T0073
title: Remove the Snail, the Popper and the Boing
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T12:51:01Z
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

## Design (architect, inet-racing)

### Files
- delete `src/content/monsters/snail.ts` — the Snail monster
- delete `src/content/monsters/popper.ts` — the Popper monster
- delete `src/content/monsters/boing.ts` — the Boing monster
- delete `src/content/areas/sticky.ts` — area used only by Snail
- delete `src/content/areas/pop-puff.ts` — area used only by Popper
- delete `src/content/effects/puff-burst.ts` — effect used only by Popper
- delete `src/content/statuses/mired.ts` — status applied only by sticky.ts line 41 (`ctx.addStatus(u, 'mired', 0.5)`); the task's "delete what only they use" rule covers it (grep-verified: no other `addStatus(..., 'mired', ...)` exists)
- edit `src/content/monsters/index.ts` — delete these 6 lines exactly: `import { snail } from './snail.ts';` `import { popper } from './popper.ts';` `import { boing } from './boing.ts';` and the array lines `  boing,` `  snail,` `  popper,`
- edit `src/content/areas/index.ts` — delete lines `import { sticky } from './sticky.ts';` `import { popPuff } from './pop-puff.ts';` `  sticky,` `  popPuff,`
- edit `src/content/effects/index.ts` — delete lines `import { puffBurst } from './puff-burst.ts';` `  puffBurst,`
- edit `src/content/statuses/index.ts` — delete lines `import { mired } from './mired.ts';` `  mired,`

### Interfaces
None. No types or signatures change.

### Steps
1. Re-verify scope with one grep before deleting anything: search `src/` for `snail|popper|boing|sticky|pop-puff|puff-burst|mired`. Expected hits are exactly: the 7 files above plus their 4 registry lines. Anything else means stop and report.
2. Delete the 7 files.
3. Make the 15 line deletions in the 4 index files. Delete only those lines — keep every other line byte-for-byte (no reordering, no reformatting). After the edits, `monsters/index.ts` must read:
```ts
import type { MonsterDef } from '../../../engine/api.ts';
import { dot } from './dot.ts';
import { flee } from './flee.ts';
import { puff } from './puff.ts';
import { brood } from './brood.ts';
import { zippy } from './zippy.ts';
import { sleeper } from './sleeper.ts';
import { spitter } from './spitter.ts';

/** Every monster. One per line; the order is the wire order (keep new ones next to related ones). */
export const MONSTERS: readonly MonsterDef[] = [
  dot,
  puff,
  brood,
  flee,
  zippy,
  sleeper,
  spitter,
];
```
4. Grep `src/` again for the same pattern — zero matches expected.
5. Run `npm run check`, then `npm run smoke`. Both must pass.

### Pitfalls
- `brood.ts` is a real registered monster (the menagerie's 10th type) that the task text doesn't name — leave it and its registry line alone. After this task the roster is dot, puff, brood, flee, zippy, sleeper, spitter.
- Near-miss names that must survive: the monster `puff` (id `'puff'`) and effect `slow-pop` (slowPop), areas `puddle`, `slush-puddle`, `chew-puddle`, status `gooSlow`. Delete only the exact ids listed.
- `mired` is the one deletion the task list forgot; if you keep it, a dead status with a comment about a removed monster stays in the game.
- Removing entries shifts MONSTERS' wire order — that's fine (server and clients run the same bundle); do not pad or reorder to preserve indices.
- T0071 (monster colors) may also touch `boing.ts`; the runner serializes same-file work, so just delete the file regardless of its current color.
- No file in `engine/` or `tests/` references these ids (grep-verified) — nothing else to edit.

### Tests
None — pure deletion; engine/tests/ re-validates the surviving content automatically.
