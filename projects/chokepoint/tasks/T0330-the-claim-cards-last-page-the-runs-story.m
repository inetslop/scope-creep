---
id: T0330
title: The claim card's last page: the run's story in a line of marks
size: L
priority: 2
status: design
depends_on: []
epic: E12
---

## Goal
The claim card grows a small second card under the first — the run's story: one small mark per wave faced, and the run's loudest wave — so the end of a run shows where it went, not just how it went.

## Details
- The run ledger grows a per-wave record, written as the run goes: one small record per wave the run faced, holding that wave's leaks (lives lost on it). A wave is clean when its record says 0 leaks. The death wave's record is written the moment the run ends: its leaks up to that point.
- The records ride the resume save: a run closed mid-run and resumed keeps them, so a resumed run's story on the claim card is the whole run's.
- The claim card (the rewards screen) shows a small second white card under the first: one small mark per wave faced in a wrapping row — ~8 px rounded squares, 3 px apart: green (the clean chip's own green) for a clean wave, muted gray (muted ink) for a held wave with leaks, red (the lives red) for the wave the run ended on (always the last mark). Under the row, one muted legend line: "clean · held · fell". Under that, one muted line: "loudest · wave N · X leaks" — N the wave that leaked the most (a tie goes to the earlier wave). The run always ends on a wave that leaked, so the line is always present.
- The marks ride the run's own colors: the green the clean chip already wears at the exit, the muted ink the held chip wears on the wave card, the red the lives number wears at one life — the story reads in colors the run has already used, so the legend is one line, not a card.
- Nothing on the second card repeats the first: no "Waves held", no "Clean N", no "Best combo" — those lines stay where they are. The first card, its count-ups and the Menu button are untouched, as is the game-over card.
- A new file holds the story card (the by-tower chip's file is the closest example of a small sub-card). The per-wave record is written where a wave ends and where the run dies; the save's round-trip keeps it.
- The row wraps to fit the card at 412x915 and 1280x720: a 60-wave run wraps to at most three rows and the whole second card still fits the screen with the first card and the button.

## Acceptance criteria
- [ ] A finished run's claim card shows a second card under the first: one mark per wave faced, wrapping — green for clean waves, muted gray for held waves with leaks, red on the last (the wave the run ended on).
- [ ] The legend line "clean · held · fell" and the "loudest · wave N · X leaks" line show under the marks; a unit test: a five-wave run with per-wave leaks [0, 2, 0, 1, 4] reads loudest wave 5 · 4, and [2, 0, 2] reads loudest wave 1 · 2.
- [ ] A run closed mid-run and resumed shows the whole line of marks on its claim card: a unit test round-trips a save carrying at least three per-wave records through the save and back, records intact.
- [ ] The first claim card is unchanged (same lines, same count-ups, same order) and the game-over card is unchanged.
- [ ] The second card fits at 412x915 and 1280x720 with a 60-wave run (marks wrapped), no line clipped.
