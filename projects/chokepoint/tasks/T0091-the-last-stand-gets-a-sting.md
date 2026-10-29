---
id: T0091
title: The last stand gets a sting
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T01:18:08Z
epic: E1
---

## Goal
The run's loudest state is heard as well as seen: the moment the last stand turns on, the banner's landing carries one soft low sting, so a player who is watching the board hears the comeback has started.

## Details
- The moment the last stand banner (T0060) slides in — a leak brings the lives to exactly 1 — one sting plays with the banner's landing: two sine notes, 80 ms each, back to back — a soft ascending minor third two octaves below the coin chime's notes (E5→G5, T0009): E3 (~165 Hz) then G3 (~196 Hz), at volume 0.1, the tier-chime's quiet class (T0032) — never louder than the hit blip.
- Once per entry into exactly 1 life — the banner's own trigger, so every re-entry to 1 life (T0060 shows the banner again) plays the sting again. Nothing plays when the last stand turns off (a life comes back, T0045's streak payback) and nothing plays at the run's start.
- A new two-note method in the Sfx module (`src/audio/Sfx.ts`), beside the coin chime (T0009) and the tier chime (T0032) — procedural like everything else, no sound file. Closest example: the coin chime for the two-note shape and the back-to-back timing; the tier chime for the quiet volume.
- Silent when sound is off (T0035's stored preference), like every other Sfx. No input, no new HUD element, no pause-screen line: a sound on a trigger that already exists, nothing new to teach (pillar 8).

## Acceptance criteria
- [ ] A leak that brings the lives to exactly 1 plays the sting once, with the last stand banner's slide-in (T0060); a later re-entry to 1 life plays it again.
- [ ] The sting is two 80 ms sines, E3 then G3, at volume 0.1 — never louder than the hit blip — and the pause sound-off (T0035) silences it.
- [ ] A life coming back to 2 (the clean streak's payback, T0045) plays no sting and shows no banner.
- [ ] Waves, gold, lives, the banner's motion and every other sound are byte-identical; no new key, button, HUD element or pause-screen line.
