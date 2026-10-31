---
id: T0051
title: "Toot: a party-horn toot when the crown flies off"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T10:32:35Z
epic: E11
---

## Goal
The crown falling is the loudest moment of a player's life and it is silent: give it a sound, so knocking out the leader is heard, not just seen.

## Details
- When the crown lifts off the fallen leader's head (the start of the crown-fall effect), play a short party-horn toot: a two-note descending blip, ~500 Hz falling to ~300 Hz over 0.25 s, peak 0.15 — a candy "bwoot", not an alarm.
- When the crown pops into its 20 stars at the top of its spin (0.9 s into the effect), play one small soft tick: ~1500 Hz, 0.05 s, peak 0.08.
- No DOM, no card: sound only, the same shape as the coin tick and the bonk. Add the sound to the audio layer and hook it into the crown-fall effect's draw, exactly the way the pop and the bonk are hooked in.
- Dedupe per effect seed, under the shared voice cap, quiet enough to sit under a crowd of pops; on a phone it starts with the audio layer on the first gesture, like the other sounds.

## Acceptance criteria
- [ ] When a crowned player is knocked out, every client in the match hears the toot as the crown lifts off and the tick as it pops, at the same instant on desktop and phone.
- [ ] One toot and one tick per crown fall (not per frame, not per client), and never without a crown fall.
- [ ] The pop, chime, coin, bonk and fanfare sounds are unchanged.
