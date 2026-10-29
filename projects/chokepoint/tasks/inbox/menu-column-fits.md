---
title: "The start screen: one column that fits, the profile card without repeats"
size: M
priority: 2
---

## Goal
Seen at about 515x660 after a single lost run: the profile card touches the title above it; the Recent line ("Recent W13 +64") sits on the card's bottom edge and over the first how-to line; the "spend your coins" caption under Tech runs into the Ghost button; the card's coin and number sit top-left while every other line is centered. The card also says the same thing twice: after one run "Last: wave 13 · +64 coins" and "Recent W13 +64" are the same run, and "avg 13" repeats the best wave. Make the start screen one even column that fits, and show each fact once.

## Details
- **Why it broke:** in `src/scenes/MenuScene.ts` every part has a hand-placed y offset from the title (+104, +213, +290, +366, +410, +442, +486, +510) and a separate `room` formula for the height. The Recent line is placed from the card's edge, so it overlaps whatever is below. `src/scenes/menu/ProfileCard.ts` places its lines the same way.
- **Lay the screen out as one column, built from its parts in order:** the demo road, the title, the profile card, the how-to text, Resume (when there is a saved run), Play, Tech and its caption, Ghost and its caption (once there is a best run), the "Enter or Space" hint. Each part's y comes from the part above it (its height plus a gap). Use one gap between parts, and a smaller one between a button and its caption.
- **When the column is taller than the screen:** the demo road shrinks first (as it does now); if it still doesn't fit, the column scales down as a whole. Nothing may overlap or leave the screen.
- **The profile card as a centered column:** the coin icon beside the coin number (a small fixed gap) as a centered pair, then Best wave (with its star), then the runs line, then the Recent runs. Its height comes from its lines, with the same padding at the top and the bottom.
- **Each fact once:**
  - The Recent runs move inside the card, as its last line, in place of "Last: wave … · +… coins". The first Recent entry is the last run.
  - "avg" shows only once there are at least two recent runs.
  - The Recent line shrinks to fit the card's width (never below 11 px), as it now does for the screen.
- **Keep:** the entrances (the title drops in, the rest fades up), Play's breathing, the Tech button's yellow dot, the drifting shapes, Enter/Space to play, the `?smoke` auto-start.

## Acceptance criteria
- [ ] At 412x915, 1280x720 and 515x660, nothing overlaps and nothing leaves the screen. Check a fresh profile (no runs), one run, four or more runs with a saved run (so Resume shows), and a best run (so Ghost shows).
- [ ] The profile card's lines are centered, the coin sits beside its number, and the top and bottom padding match.
- [ ] After one run, the card shows that run once. "avg" appears only from two runs.
- [ ] Each caption sits under its own button, clear of the next button.
