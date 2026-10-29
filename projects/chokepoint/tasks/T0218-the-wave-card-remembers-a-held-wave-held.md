---
id: T0218
title: "The wave card remembers a held wave: held · N"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T16:16:13Z
---

## Goal
A wave that let lives through costs the run, and its only trace is the lives number falling (a leaked Block costs 2, so even the count doesn't match). The wave card — where the wave number lives — wears the finished wave's cost, so "how did that wave go" is answered at a glance.

## Details
- What exists: the wave card (top right, left of the pause button) shows the wave number, "Ready" before the first wave. A wave's leaks are shown nowhere: the stats card shows the lives total, the exit's green chip celebrates the no-leak waves (T0005), the claim card shows run totals. A player who missed a leak while zoomed on a corner has no record of what the wave cost.
- The change: when a wave ends with one or more lives lost, the wave card wears a small tag under the number: "held · N", where N is the lives at the start of the wave minus the lives at its end (a leaked Block counts 2; a leaked Hauler counts its 1 life — its 5-gold cost keeps its own red "−5" pop, T0057). The wave's system, which tracks the wave's remaining enemies, records the lives lost the moment the wave ends and exposes it to the HUD; the card wears the tag from that moment until the next wave starts, so it is read in the build phase that follows.
- The tag wears the muted-gray chip look of the wave tags (T0080's banner chip, T00108's "tight" chip): a small rounded chip in muted ink on the white card, one ~150 ms scale-in, no sound. The card grows to fit it (the T0136 pattern), tag and line inside the card, staying clear of the pause button and the zoom buttons at 412x915 and 1280x720.
- A wave that lost no lives wears no tag — the green clean chip at the exit already celebrates those. The wave's own tag chips (quiet, tight) are untouched: a quiet wave that leaked shows its chip and the held tag together.
- The run's first held wave teaches the tag once (T0092's pattern): a small muted line under the number in the same card — "held: lives lost this wave" — shown with the first held tag and never again in the run; taught from the run's counters (a held wave is a cleared wave not in the clean count), so a resumed run past its first held wave never re-teaches.
- Resume: the tag is session state — a resumed run starts without it (the save keeps board, towers, wave and gold as today; no save field). No new input; the pause screen is untouched.

## Acceptance criteria
- [ ] A wave that ends with lives lost: the wave card shows a muted-gray "held · N" chip under the number, N = the lives that wave cost (a leaked Block counts 2), from the moment the wave ends until the next wave starts.
- [ ] A clean wave: the card wears no tag, and the green clean chip at the exit is unchanged.
- [ ] The first held wave of a run shows the muted line "held: lives lost this wave" in the card, once; it never shows again in the run, and a resumed run past its first held wave does not show it.
- [ ] A quiet or tight wave that leaked shows its usual tag chips and the held tag together; "Ready" before the first wave is unchanged.
- [ ] The tag and line fit the white card at 412x915 and 1280x720 with no overlap of the pause button or the zoom buttons; no new sound, no new input, no save field.
