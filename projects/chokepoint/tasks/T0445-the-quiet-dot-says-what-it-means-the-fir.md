---
id: T0445
title: "The quiet dot says what it means: the first idle tower's one-time chip"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T20:49:14Z
---

## Goal
The quiet dot (T0233) marks an idle tower, but nothing in the game ever explains it: the first time it appears, a one-time chip above the tower says what it means, so a first-time player connects "dot" with "this tower is not fighting" and goes to check its reach.

## Details
- Trigger: the moment the quiet dot first appears on an attack-first tower in this scene — the dot's own rule, untouched (T0233: no attack event for 4 s while enemies are alive, wave phase only).
- The chip: the first-leak chip's own look — `src/systems/fx/leakCost.ts` is the closest example (small white rounded card chip, ~12 px bold muted ink, holds ~1.5 s, then fades). It reads **quiet: nothing in reach** and pops just above the idle tower's token (the name tag's anchor above the token, T0085). No sound.
- New file `src/systems/fx/quietTell.ts` holds the tell and its own once-per-scene flag (a plain field on the tell itself). The hook is one line in the towerIdle system (the system that owns the quiet dot) where the dot's state first turns on. No run-state field and no run-save change: a resumed run may teach once more, the last-stand banner's re-show pattern.
- Only the first idle tower teaches: later idle towers, and later idles of the same tower, show nothing. Never in the build phase, never on the menu demo. Support towers and still-attacking towers never trigger it.
- The dot's rule, look and timing stay exactly as T0233 left them.

## Acceptance criteria
- [ ] The first time in a run that an attack-first tower goes quiet (its quiet dot appears under T0233's rule), a white rounded chip reading "quiet: nothing in reach" pops above that tower and fades after ~1.5 s, with no sound.
- [ ] No second chip: the run's later idle towers and later idles of the first show nothing; the chip never appears during the build phase or in the menu demo.
- [ ] The quiet dot itself is unchanged (same 4 s rule, same look, same clearing), and the run state and the run save are untouched.
