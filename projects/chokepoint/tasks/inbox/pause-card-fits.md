---
title: "The pause card: one tidy column that fits, and a Sound row like the other buttons"
size: M
priority: 2
---

## Goal
The pause card has outgrown its layout. Seen at about 510x480:
- the controls lines run past both sides of the card ("Space or the big button — start the wave early, +2 gold per second left" is wider than it);
- the stats line crowds the "Paused" title, and "worth +N coins" and "Controls" crowd it in turn;
- there's a big gap between "Controls" and its lines, and another above Resume;
- the Sound row is wider than the buttons above it, with "Sound" and "On" far apart.

Make it one even column that always fits inside its card, whatever controls are listed.

## Details
- **Why it broke:** in `src/scenes/PauseScene.ts` the card is a fixed 360x460, and every part is placed at a hand-picked offset from its top (+54, +78, +96, +114, +176, +276, +344, +406). Other tasks keep adding and removing control lines.
- **Lay the card out as one column, built from its parts in order:** each part's y comes from the part above it (its height plus a gap), and the card's height is the content plus the same padding at the top and the bottom. Use two gap sizes only: a small one inside a group, a bigger one between groups.
- **The groups, top to bottom:**
  1. "Paused", the stats line (wave, star, lives, gold) and "worth +N coins";
  2. "Controls" and its lines;
  3. Resume, Quit run and Sound.
- **The controls lines fit:** each one is never wider than the card minus its padding. A line too wide wraps (centered), or shrinks to fit, never below 11 px. Build them from a list of lines so adding or removing one needs no other change.
- **The Sound row matches the buttons:** the same width and height as Quit run. The speaker glyph sits beside "Sound on" or "Sound off" as one centered pair, muted when off, as now.
- **Keep:**
  - what each line says and when it shows (worth only after wave 1, the star at the best wave);
  - Resume, Quit and the sound toggle as they are;
  - the scaling that keeps the card on screen;
  - the `?smoke` auto-resume.

## Acceptance criteria
- [ ] At 412x915, 1280x720 and 510x480, no text crosses the card's edges (at least 16 px inside), with a 5-digit gold count and every control line listed.
- [ ] The padding above "Paused" equals the padding below the Sound row; the gaps inside each group match, and so do the gaps between groups.
- [ ] Resume, Quit run and Sound are the same width; the Sound row reads "Sound on" or "Sound off" beside its glyph.
- [ ] Adding a line to the controls list needs no other change to stay inside the card.
