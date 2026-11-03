---
id: T0482
title: "The references wear the marks: the enemies reference and the codex match the board"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T08:12:52Z
claimed_at: 2026-11-03T08:13:41Z
epic: E26
designer: yoga
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
