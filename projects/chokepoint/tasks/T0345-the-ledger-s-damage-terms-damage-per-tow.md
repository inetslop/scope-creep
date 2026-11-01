---
id: T0345
title: "The ledger's damage terms: damage per tower on the Summary's rows"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T07:03:24Z
claimed_at: 2026-11-01T07:03:27Z
epic: E12
designer: desktop
---

## Goal
The pause's Summary page (T0306's run page) shows each standing tower's kills and ≈N/s — but kills only count the finishing blow, so a tower that does the work and not the kill (an Ember that burns, a Mark that marks) reads smaller than it is. The run ledger records the damage each tower deals, and the row shows it.

## Details
- The run ledger grows a per-tower damage tally next to the existing per-tower kills, with the same lifecycle as the kills term (a new run starts at 0; a resumed run does to it exactly what a resume does to the row's kills term).
- Attribution: every point of damage counts for the tower that dealt it, as it was dealt (not clamped to the enemy's remaining hp) and after the Bulwark's plate and the Titan's shield halving, so a halved hit counts halved:
  - a Bolt's hit, a Splash's burst, a Spray's pellet (a crit counts the doubled amount), a Reach's heavy shot and a Lance's pierce each count for the firing tower, per enemy struck;
  - a Beam's tick counts for the Beam tower; an Ember's burn tick counts for the tower that ignited.
  - A support that deals no damage (a Mark, a Mint, a Rally, an Anchor or a Push) reads 0, exactly like its kills line — a Mark's +25% is not damage it dealt.
- The Summary's per-tower rows (the page's existing rows, kept sorted by kills as they are) gain one muted damage term — the damage dealt this run, a plain integer in the row's existing style, placed wherever the row's layout fits it at 412x915 and 1280x720 with a five-digit number (a "· dmg N" on the kills line, or its own line under the row); the kills and ≈N/s reads stay where they are.
- The end card's and the claim card's by-tower chips are unchanged (their space); no new HUD element, no sound.

## Acceptance criteria
- [ ] The pause's Summary shows each standing tower's damage dealt this run as a muted term on its row, beside the existing kills and ≈N/s reads; an Ember tower shows the damage its burn ticks dealt even when another tower takes the kill.
- [ ] A support tower (a Mark, a Mint, a Rally, an Anchor or a Push) reads 0 on its damage term, like its kills line.
- [ ] The term is written as the run goes: pausing mid-run shows what has been dealt so far, and the term has the same lifecycle as the row's kills term across new and resumed runs.
- [ ] A halved hit (a Bulwark's plate, a shielded Titan) counts halved; a crit pellet counts the doubled amount.
- [ ] The end card's and the claim card's by-tower chips are unchanged; nothing else on screen changes; the rows fit both layout widths with a five-digit number.
