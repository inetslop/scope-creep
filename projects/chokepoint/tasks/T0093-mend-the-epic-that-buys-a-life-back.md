---
id: T0093
title: "Mend: the Epic that buys a life back"
size: L
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T01:36:24Z
claimed_at: 2026-10-29T01:36:28Z
epic: E4
designer: desktop
---

## Goal
The Epic pool gets the survival axis no other Epic touches: a tower that turns the run's kills into lives, so a leaking run can still hold, and the last stand (T0054, in) becomes a comeback instead of a countdown.

## Details
- Epic-only roll, like Mark, Rally, Mint and Anchor (the same Epic flag). Both card lines:
  - First (as a new tower): "Every 12 kills this run, the run gets +1 life." A support with no attack of its own: it never fires, aims at nothing and deals no damage.
  - Added: "−2 kills per extra Mend (12, 10, 8, 6, 4 — no shorter). Copies in any towers count together."
- Copies count run-wide: the run's N Mend copies, in any towers, set the count to max(12 − 2×(N−1), 4). The target is read live from the run's copies, so a copy added mid-count shortens the current count; the kill progress since the last pay is kept.
- The count: kills by any source this run — exactly the kill the kills line (T0070) counts, by whatever source it happens (a shot, an Ember's killing tick). A leak is not a kill; the panic pulse's clear (T0063) is not a kill. The count restarts at the current target after each pay and after each hold.
- The pay: the run's lives go up by 1 — a small green "+1" on the lives number (the clean streak's green pop, T0045). If the pay brings the run from 1 to 2 lives, the last stand's red number clears the same moment (T0054's own rule).
- The cap: a pay never raises the run above the lives it started the run with (a resumed run keeps its saved starting value). A count that reaches its target at the cap is **held** — one at most — and pays at the next leak: the held "+1" lands on the lives number as the leak's loss is applied, green pop and chime included.
- The panel: one small muted line under the kills line (T0070) — "life in N" while counting (N counting down to the current target) and "life held" while a pay is held. Momentum's "Bonus +N%" panel line (T0064) is the pattern.
- Look: a low green disc at the tower's base with one tick per copy (Momentum's tick language, T0064); the disc is the tower's shape — a Mend-only tower has no barrel and never fires. No working-aura ring (T0055's scope stands: Anchor and Mint only); the lives-number pop is the tower's tell, at most 12 kills away.
- Sound: one soft two-note ascending chime, E4 (~330 Hz) then G4 (~392 Hz), 80 ms sines at the tier chime's quiet volume (T0032, 0.1) — the coin chime's shape (T0009) one octave down — when a Mend pays or a held pay clears at a leak. If that leak also starts the last stand, the sting (T0091) plays instead — the bad note wins. A new two-note method in the Sfx module beside the coin chime, the tier chime and the sting; procedural, no sound file. Silent when sound is off (T0035).
- State: the count and a held pay are run state — they survive a resume (the T0042 pattern) and a new run starts the count fresh.
- Closest existing augment: Mint (a passive Epic aura that touches the run's economy and never attacks); new is that it pays in **lives** — the first augment that restores lives — and its trigger is the run's total kills, not kills near a spot (Mint) or a wave's result (Momentum).

## Acceptance criteria
- [ ] Mend rolls only as an Epic card, and its draft and tower-panel cards read the two card lines above.
- [ ] A Mend-only tower never fires and deals no damage; its kills line (T0070) reads "kills 0"; it shows the low green disc with one tick per copy.
- [ ] With one Mend on the board, the 12th kill this run (any source, including an Ember killing tick) pays the run +1 life: a green "+1" on the lives number, the "life in N" line restarting at 12, and the chime playing.
- [ ] At the run's starting lives, reaching the count does not raise the lives: the panel line reads "life held", and the next leak pays the +1 back on the lives number (green pop, chime) — the lives never read above the starting number.
- [ ] A second Mend anywhere in the run changes the target to 10 (three → 8, four → 6, five or more → 4), and a copy added mid-count shortens the current count.
- [ ] The count and a held pay survive a resume (T0042) and are fresh on a new run.
- [ ] Sound off (T0035) keeps the pay visible and the chime silent; a leak that both starts the last stand and clears a held Mend plays the sting (T0091), not the chime.
