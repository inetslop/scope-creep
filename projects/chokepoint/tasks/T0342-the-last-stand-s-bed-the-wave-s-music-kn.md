---
id: T0342
title: "The last stand's bed: the wave's music knows the run is at one life"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T05:50:54Z
claimed_at: 2026-11-01T06:11:40Z
designer: inet-racing
---

## Goal
The last stand (exactly one life left, kills paying double) is the run's loudest state on screen — the red lives, the banner, the entry sting — but the wave's bed (T0239) never changes under it. Give the bed its own last-stand form so the run's climax is heard the whole time it lasts, not only at its door.

## Details
- While the run's last stand is on — the same state that gates the double kill gold (exactly 1 life; off in Iron, as that rule is) — and the wave bed is playing, the bed wears the last-stand form:
  - the 8-note heartbeat plays the same pattern one octave lower, same 0.4 s step, same 0.04 volume;
  - one quiet held note sits under the heartbeat: the loop's root (E), one octave below the transposed heartbeat, at half the heartbeat's volume (0.02), held for as long as the form lasts;
  - the exit warning's quicken (the bed's existing state, T0239) still applies on top, unchanged — a quickened last stand is the quickened steps in the lower register with the drone.
- Entry: the moment the last stand turns on (the same trigger the sting, T0091, plays on), the bed crossfades from whatever it is playing to the last-stand form over ~1 s — no hard cut, no second sting, no new one-shot sound.
- Exit: the moment the last stand turns off (a life comes back to 2 — the streak's payback, or a later Mend), the bed crossfades back to the normal form over ~1 s during the current wave. If the wave ends while the form is on, the bed's existing 0.5 s wave-end fade applies and the next wave starts in the last-stand form.
- The normal-state bed stays byte-identical to today: same notes, step, volume, fades, quicken. The last-stand form is a new pattern defined next to it (a new file is fine), selected by the run's last-stand state.
- The bed reads the last-stand state on its own clock, the way it already reads the exit warning's state: the change stays inside the audio module and its tests — no new scene wiring, no new input, nothing new on screen, and the build phase is untouched.
- The form follows the rule's state and is unaffected by the 2x fast-forward (audio time, not sim time). Sound off stays silent as everything else.

## Acceptance criteria
- [ ] A leak to 1 life during a wave: from the last-stand banner, the bed is crossfading to the lower form with the held root note, complete ~1 s later; the moment before the trigger the bed is byte-identical to today.
- [ ] While the form is on, the exit warning still quickens on top (today's quicken, lower register plus drone), and lifts again when the warning clears.
- [ ] A life restored to 2 (the streak's payback) crossfades the bed back to the normal form over ~1 s, still within the current wave.
- [ ] An Iron run never hears the last-stand form.
- [ ] At 2x the form's sound and its crossfade timing are unchanged (real audio time).
- [ ] The variant selection is a pure function — (last stand on/off, quicken on/off) to form and step — with unit tests covering all four combinations; `npm run check` and `npm run smoke` pass.
