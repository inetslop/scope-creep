---
id: T0314
title: The first clean wave says what the streak pays
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T00:11:52Z
claimed_at: 2026-10-31T00:12:23Z
designer: yoga
---

## Goal
A first-time player watches the exit's clean text count "1 of 3 in a row" and never learns what reaching 3 does; on the run's first clean wave, the line names the reward — in the game's teach-once pattern (T0107's first leak, T0272's early send, T0307's Hauler).

## Details
- On the run's first clean wave, one muted line under the exit's clean text (T0205's two-line green text at the exit gate): "3 in a row brings a life back · once per run".
- The teach lines' own look (T0107/T0272's muted line): muted ink, ~1.5 s, no sound, no input — nothing stays on the board after it fades.
- Once per run: the run's second, third and later clean waves show nothing new. Re-derived on resume (T0272's pattern): it shows only at the moment of the run's first clean wave — a resumed run whose ledger already holds a clean wave never shows it. No new run field: the first clean wave is the clear at which the ledger's clean count is still zero.
- The streak rule (T0045: three clean in a row, one life, once per run), the exit's clean text (T0205) and the streak's pay note (T0290) are untouched.
- Closest example for the build: the first-leak teach — a new file in `src/systems/fx/` (a sibling of `src/systems/fx/leakCost.ts`) fired from the one place the exit's clean text is spawned on a clean wave (T0205's site).

## Acceptance criteria
- [ ] In a fresh run, the first clean wave shows the muted line under the exit's clean text for ~1.5 s; later clean waves show only the existing text.
- [ ] A run that never holds a clean wave never sees the line; a resumed run never sees it.
- [ ] No sound plays with the line, and the streak rule, the exit's clean text and the streak's note behave exactly as before.
- [ ] The line fits the exit text's own size at 412x915 and 1280x720, and no mark remains on the board after it fades.
