---
id: T0070
title: "The panel says who is working: a kills line per tower"
size: S
priority: 3
status: designing
depends_on: [T0054]
attempts: 0
created: 2026-10-28T13:54:28Z
claimed_at: 2026-10-28T15:28:34Z
epic: E1
designer: desktop
---

## Goal
A player can see which towers are doing the work this run: every tower's panel gains a small "kills N" line — the first step toward a run summary.

## Details
- The tower panel (the card that opens when a tower is selected, with its row of augment cards, T0008) gains one small muted-gray line at the bottom, under the augment rows: "kills N" — N is the number of enemies this particular tower killed this run with damage the tower itself dealt (its shots, its Beam, its Ember ticks, its Trap springs).
- **Attribution** follows the existing source-of-kill rule: the tower whose damage dealt the killing blow counts it (an Ember killing tick counts for the source tower, T0028; Mark's amplification does not move the kill).
- A pure support tower (Rally, Mint, a Momentum with no attack, T0064) shows "kills 0" — Rally's boost never lends kills to the boosted tower.
- "kills 0" is shown (an idle tower reads as idle). N resets on a new run and on a resumed run (T0042) — the line is a display stat, not part of the save.
- No rule change: gold, combo, score, coins and "stopped" are all untouched by this task.
- Chained behind T0054 on purpose: it hooks the kill flow, so it lands after the kill flow's in-flight edits settle.

## Acceptance criteria
- [ ] Selecting a tower shows a small muted-gray "kills N" line at the bottom of its panel; a freshly built tower shows "kills 0".
- [ ] N grows by 1 for each enemy the tower's own damage kills, including Beam kills and Ember killing ticks (counted for the source tower); a kill by another tower does not grow it.
- [ ] A pure support tower (Rally, Mint, Momentum) shows "kills 0" even while it works; a tower boosted by Rally counts the kills it lands itself.
- [ ] A new run and a resumed run start every tower at "kills 0"; no other number on the panel, the HUD or the rewards card changes.
