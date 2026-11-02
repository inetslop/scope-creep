---
id: T0408
title: "The claim's bed: a quiet beat under the rewards card"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T05:22:32Z
claimed_at: 2026-11-02T06:19:06Z
designer: desktop
---

## Goal
The claim — the moment the run's story is told — plays in its own quiet register: a fifth audio bed under the rewards card, the run's coda, handing off to the menu's bed when the player leaves.

## Details
- A new quiet generative bed in the same shape as the existing beds (buildBed, draftBed, menuBed): a 2–3 note beat on the menu bed's (T0397) note set at a slightly faster tempo, sparser than the draft bed (T0372) — the run's coda settling into the menu's calm. Same low volume as the other beds.
- It starts the moment the claim (rewards) card lands — after the game-over card and its fall (T0367) have played — and loops quietly under the claim card's count-up.
- When the player returns to the menu, the claim bed fades over ~300 ms as the menu's bed (T0397) takes over — the same hand-off the other beds already do between phases.
- The sound on/off toggle (pause's, remembered in the profile) silences it like every other bed.
- Nothing else changes: the wave bed still stops with the wave, the game-over card keeps its fall, and the menu, draft and build beds keep their own timing and volume.

## Acceptance criteria
- [ ] After the game-over card, a quiet bed plays under the claim card — sparser and calmer than the draft bed, a touch livelier than the menu bed.
- [ ] Returning to the menu, the claim bed fades over ~300 ms with no gap and no double-bed overlap as the menu's bed takes over.
- [ ] With sound toggled off, no bed plays on the claim; the toggle's remembered state behaves as on every other screen.
- [ ] The claim card's count-up lines and their blips stay clearly on top of the bed (the bed at the beds' own low volume).
- [ ] No other scene's audio changes: the menu, draft, build and wave beds and the game-over fall are unchanged.
