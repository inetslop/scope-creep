---
id: T0333
title: "The claim card's last page: the run's story, one mark per wave"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T02:32:15Z
epic: E12
---

## Goal
The end of a run shows the run's shape, not just its numbers: under the claim card, a second small card marks every wave faced — green where it was clean, muted gray where it was held, red where the run ended — so a player sees at a glance which waves broke.

## Details
- The run's ledger gains a per-wave record, written as the run goes: when a wave ends, one record — the wave number and how many enemies leaked on it; when the run dies mid-wave, the death wave is recorded with the leaks it had taken so far. The record is carried through the resume save, so a resumed run's story is whole.
- The rewards screen grows a second white card under the claim card: centered, a small gap below the first. Top to bottom:
  - a bold ink "Waves" title (the claim card's title style, scaled down);
  - the marks: one small rounded square (~6 px, ~3 px gap) per wave faced, in run order, wrapping at 14 per row — green (the clean wave's own green) if the wave ended with 0 leaks, muted gray if it ended with one or more, red on the wave the run ended on (red wins over gray);
  - a muted legend naming the three marks, each preceded by a mini mark of its own color (clean, held, lost);
  - a muted line "loudest · wave N · M leaks" — N the wave with the most leaks (the earliest if tied), M that count.
- The card is sized from its content; a 60-wave run still fits both cards at 412x915 and 1280x720 (the marks wrap, nothing scrolls). A run that ended without facing a wave shows just the title and the legend.
- No sound, no input, nothing else on the screen changes. The claim card's own lines (waves, clean count, score, coins) are untouched — the story card shows the sequence and the loudest wave, which nothing shows today.

## Acceptance criteria
- [ ] After any run, the rewards screen shows the second card under the claim card with one mark per wave faced, in order: green for 0-leak waves, muted gray for held waves, red on the death wave.
- [ ] A resumed run's story is whole: marks for waves before the resume are present and correct after resuming and finishing.
- [ ] The legend and the "loudest · wave N · M leaks" line are present and match the run (most leaks, earliest wins ties).
- [ ] The per-wave record is written as the run goes (not recomputed at the end from wave numbers) and is present in the resume save.
- [ ] Both cards fit at 412x915 and 1280x720 on a long run; the smoke test's layout check passes.
- [ ] No new sound or input; the claim card's existing lines are unchanged.
