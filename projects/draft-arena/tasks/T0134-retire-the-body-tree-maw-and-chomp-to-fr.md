---
id: T0134
title: "Retire the Body tree: Maw and Chomp to Frenzy, Bellow and Hide to Hive, Chill to Lobber"
size: M
priority: 1
status: todo
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
- Frenzy and Hive end at 10 talents (the cap), Lobber at 8.

## Acceptance criteria
- [ ] There is no Body tab in the talents panel.
- [ ] Maw and Chomp are in Frenzy, Bellow and Hide in Hive, Chill in Lobber, each reachable.
- [ ] Swift, Vigor, Might and Magnet are gone.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- delete `src/content/talents/body.ts` - the Body tree
- edit `src/content/talents/index.ts` - remove the body import and list line
- edit `src/content/talents/frenzy.ts` - add the Maw and Chomp talent lines
- edit `src/content/talents/hive.ts` - add the Hide and Bellow talent lines
- edit `src/content/talents/lobber.ts` - add the Chill talent line
- delete `src/content/upgrades/swift.ts` - retired stat
- delete `src/content/upgrades/vigor.ts` - retired stat
- delete `src/content/upgrades/might.ts` - retired stat
- delete `src/content/upgrades/magnet.ts` - retired stat
- edit `src/content/upgrades/index.ts` - remove the four imports and four list lines
- edit `src/content/upgrades/maw.ts` - fix its doc comment (says "The Body's weapon")
- edit `src/content/upgrades/chomp.ts` - fix its doc comment (says "Body capstone")
- edit `src/content/upgrades/bellow.ts` - fix its doc comment (says "The Body's ... weapon")
- edit `src/content/upgrades/chill.ts` - fix its doc comment (says "Body mod")

No new types or signatures: this task only moves existing `TalentTreeDef` talent lines and deletes items.

### Steps
1. `src/content/talents/frenzy.ts` — in `talents:`, insert `{ id: 'maw', upgrade: 'maw', max: 5, needs: [['nerve', 2]] },` after the `fang` line, and `{ id: 'chomp', upgrade: 'chomp', max: 1, needs: [['nerve', 3], ['frenzy', 3]] },` after the `reckless` line. Result: 10 talents.
2. `src/content/talents/hive.ts` — insert `{ id: 'hide', upgrade: 'hide', max: 3, needs: [['swarm', 1]] },` after the `glide` line, and `{ id: 'bellow', upgrade: 'bellow', max: 3, needs: [['horn', 2]], points: 3, prestige: 1 },` after the `lash` line. Result: 10 talents. Keep `points: 3` and `prestige: 1` exactly as they were; the old need `['maw', 3]` is replaced by `['horn', 2]` (maw is no longer in this tree).
3. `src/content/talents/lobber.ts` — insert `{ id: 'chill', upgrade: 'chill', max: 3, needs: [['lob', 2]] },` after the `wide` line. Result: 8 talents.
4. `src/content/upgrades/index.ts` — delete import lines `import { magnet } from './magnet.ts';`, `import { might } from './might.ts';`, `import { swift } from './swift.ts';`, `import { vigor } from './vigor.ts';` and list lines `swift,`, `might,`, `vigor,`, `magnet,`. Touch nothing else.
5. Delete `src/content/upgrades/swift.ts`, `vigor.ts`, `might.ts`, `magnet.ts` (verified: their ids are referenced nowhere else in `src/`).
6. `src/content/talents/index.ts` — delete `import { body } from './body.ts';` and the `body,` line.
7. Delete `src/content/talents/body.ts`.
8. Fix the four doc comments (line 4 of each file; do not change any code or the player-facing `description` fields, which name no tree):
   - maw.ts: `/** Frenzy's weapon: a bite zone in front of the player (area 'bite'). */`
   - chomp.ts: `/** Frenzy capstone: kills heal, so staying alive while hurt pays. */`
   - bellow.ts: `/** Hive's second-life weapon: an unaimed bellow ring that strikes everything around the player. */`
   - chill.ts: `/** Lobber mod: every hit slows the target (rank 1: 30% for 1 s; +10% and +0.5 s per rank). */`
9. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Bellow's old need `['maw', 3]` points at a talent in another tree now — the content test "needs point at talents in the same tree" fails if you keep it. Use `['horn', 2]`.
- Keep each moved talent's `max` exactly (maw 5, chomp 1, bellow 3, hide 3, chill 3): a talent rank may never exceed the upgrade's `maxLevel` (5, 1, 3, 3, 3).
- Bellow must keep `prestige: 1` and `points: 3` (points = spent in its tree, now Hive).
- Do not delete or touch `haste`, `frenzy`, `nerve`, `swarm`, `quick`, or any other upgrade — only swift, vigor, might, magnet.
- The talents panel is built from `TREES` (src/content/index.ts); removing the tree file and its line is what deletes the Body tab — no HUD or menu file needs a change.
- No reordering of existing lines, no reformatting; one talent per line, in the positions given.

### Tests
- none (content is tested automatically by engine/tests/: every upgrade in a tree, every talent reachable, 10-talent cap, and each moved upgrade is exercised in a real match).
