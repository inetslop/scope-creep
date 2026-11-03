---
id: T0482
title: "The references wear the marks: the enemies reference and the codex match the board"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-03T08:12:52Z
claimed_at: 2026-11-03T08:39:44Z
finished_at: 2026-11-03T09:32:29Z
epic: E26
---

## Goal
A Patterns player opens the enemies reference (pause) or the codex (menu) to check what a shape means, but both show plain tokens while the board wears marks — the legend is missing. Make the two references wear the same marks the board wears, so the token on a card is the token on the board.

## Details
- The enemies reference (`src/scenes/EnemiesScene.ts`, T0252's rows, off the pause): each row's token wears the same muted-ink mark that enemy type wears on the board (T0465's marks) while the profile's Patterns toggle is on — the row's token becomes exactly the board token with its mark; with the toggle off the rows stay plain, as now.
- The augments codex (`src/scenes/CodexScene.ts`, T0221's entries, off the menu): each entry's token wears that augment's barrel mark (T0469's marks — the mark a tower built on that augment shows on its barrel) while Patterns is on; with it off the codex stays exactly as it is today.
- No new toggle, button, sound or line: the existing Patterns row on the pause drives both references; the cards, rows and their text are unchanged, only the tokens gain the mark, painted the same way as on the board.
- Closest examples: T0465 (the enemy marks and their toggle) and T0469 (the barrel marks). The bosses reference is out of scope here — its rows take the new boss marks from T0481.

## Acceptance criteria
- [ ] With Patterns on, every row of the enemies reference shows its token wearing the same muted-ink mark the type wears on the board; with it off the reference is unchanged.
- [ ] With Patterns on, every codex entry's token wears that augment's barrel mark; with it off the codex is unchanged.
- [ ] Both references still fit their card at 412x915 and 1280x720 — the mark sits inside the token, no row grows.

## Design (architect, yoga)

### Files
- edit `src/scenes/EnemiesScene.ts` - regular-enemy rows wear their type mark when Patterns is on
- edit `src/scenes/CodexScene.ts` - every entry's token wears its augment's barrel mark when Patterns is on

### Interfaces
No new or changed types or signatures. Both scenes read the existing global flag `this.registry.get('patterns') === true` (set by `BootScene`, flipped on the pause). Uses existing exports `markTexture(id)` and `barrelMarkTexture(id)` from `../art/textures`.

### Steps
1. `EnemiesScene.ts`: change the import to `import { artScale, enemyTexture, markTexture } from '../art/textures';`. In `build()`, before the `for (const row of rows)` loop add `const patterns = this.registry.get('patterns') === true;`. Right after the row's token `parts.push(...)` (the `artScale(..., 16 / (row.def.look.size * CELL))` image), add:
   ```ts
   if (row.def.spawnOnly === undefined && patterns) {
     // The type mark the board wears (the Patterns toggle): the same texture and scale as the token, so it overlays exactly.
     parts.push(artScale(this.add.image(-this.panelW / 2 + PAD + TOKEN / 2, rowTop + row.h / 2, markTexture(row.def.id)), 16 / (row.def.look.size * CELL)));
   }
   ```
2. `CodexScene.ts`: change the import to `import { artScale, augmentTexture, barrelMarkTexture } from '../art/textures';`. In `build()`, before `entries.forEach` add `const patterns = this.registry.get('patterns') === true;`. Right after the entry's token `parts.push(artScale(this.add.image(lx + 26, ty + 30, augmentTexture(def.id)), 1.3));` add:
   ```ts
   if (patterns) {
     // The first augment's barrel mark (the Patterns toggle): the board's own mark at its own size, centred on the token.
     parts.push(artScale(this.add.image(lx + 26, ty + 30, barrelMarkTexture(def.id))));
   }
   ```

The `markTexture` is painted the same size and face offset as `enemyTexture`, so step 1's mark sits exactly on the board token. `barrelMarkTexture` is painted for all 16 augments; at `artScale` default (the board's own scale, Tower.ts) it sits inside the codex token.

### Pitfalls
- Gate the enemy mark on `spawnOnly === undefined` — the mark texture is painted only for the 10 regular types; boss/spawn-only rows have no texture and must stay plain (they get T0481's boss marks in the separate bosses reference).
- Both marks are extra `parts` drawn after the token image, so they render on top; they share the token's centre so the enemy one aligns pixel-for-pixel and the codex one sits inside (sub-px off the raised face is invisible).
- No layout change: row/entry heights come from the text, not the images, so "no row grows" and the cards still fit at 412x915 and 1280x720. With Patterns off, nothing is added — references are byte-identical to today.
- Read `patterns` once per `build()` (the codex's `rebuild()` re-reads it on width-class flips); the toggle is unreachable while a reference is open, so this is stable.

### Tests
none

## Result (attempt 1, yoga)

The two pattern references now wear the board's marks: the enemies reference (from pause) shows each regular enemy type's muted-ink type mark on its row token, and the augments codex (from menu) shows each augment's barrel mark on its entry token — both driven by the existing Patterns toggle on the pause, reading the same global flag and the same mark textures the board uses. With the toggle off, both references are byte-identical to before; no layout, cards, text, buttons, or sounds changed. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 52.8 min

```
projects/chokepoint/game/src/scenes/CodexScene.ts   | 7 ++++++-
 projects/chokepoint/game/src/scenes/EnemiesScene.ts | 7 ++++++-
 2 files changed, 12 insertions(+), 2 deletions(-)
```
