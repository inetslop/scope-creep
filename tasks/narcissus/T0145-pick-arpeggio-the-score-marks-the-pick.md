---
id: T0145
title: Pick arpeggio — the score marks the pick
assignee: narcissus
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T21:17:36Z
---

## Goal
A level-up is the run's biggest decision, and today it is marked by the card flip and the tempo nudge — but the score itself stays silent. The moment a card is picked, the score plays a short rising two-note motif, so the pick is felt in the music as well as on the cards (the audio sibling of the level-up pulse, T0102).

## Details
- The moment a level-up card is picked — the same moment the level-up pulse (T0102) and the Index line (T0104) are recorded — the score plays a short rising two-note motif on the existing pulse voice's timbre (no new tone, no new SFX, no new instrument):
  - note 1: the pulse's root, at the pick;
  - note 2: a perfect fifth above the root (root frequency × 2^(7/12)), exactly one beat later at the tempo in effect at that moment;
  - each note at about half the pulse's gain, so the motif sits under the score, not over it.
- The tempo is whatever the score is playing at the pick: the run tempo curve (T0111) including the Tempo nudge (T0115) if this pick just landed one — a pick that raises the tempo plays its motif at the new, faster tempo — and the 64 BPM boss hold (T0108) if a boss is alive at the pick.
- One motif per pick; two consecutive picks (a double level-up) play two motifs.
- The motif is part of the score: it follows the music mute (the existing M key) and is unaffected by the SFX mute. The card-flip SFX (T0059) and everything else in the score are unchanged.
- No new key, HUD element, scene or gameplay number change.

## Acceptance criteria
- [ ] Picking any level-up card plays a two-note motif — the pulse root, then a perfect fifth, one beat apart at the current tempo — on the existing pulse voice at about half the pulse's gain; the card-flip SFX (T0059) still plays exactly as before.
- [ ] A pick that lands the Tempo nudge (T0115) plays its motif at the new (faster) tempo; a pick while the boss hold (T0108) is active plays at 64 BPM.
- [ ] Two consecutive picks (a double level-up) play two motifs.
- [ ] The motif is silent when the music is muted (M key) and plays regardless of the SFX mute state.
- [ ] No new key, HUD element, scene or gameplay number change; the score's existing behavior (tempo curve, boss hold, second voice) is untouched outside the added motif.
