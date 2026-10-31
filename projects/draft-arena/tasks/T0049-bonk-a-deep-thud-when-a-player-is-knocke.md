---
id: T0049
title: "Bonk: a deep thud when a player is knocked out"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T09:20:00Z
claimed_at: 2026-10-31T09:33:46Z
epic: E11
designer: yoga
---

## Goal
A player knockout is the biggest fight moment of the match, and right now it is only confetti. Give it a short deep thud, so a player falling reads by ear as "a player," not "a monster."

## Details
- The moment a player is knocked out (you or another), a short deep "bonk" plays — a soft low thud, like a marshmallow landing — at the same instant the knockout's confetti burst plays.
- Lower than any monster pop (the pops sit at 180–900 Hz): the bonk starts around 130 Hz and drops to about 60 Hz, so it reads as "someone fell," not "something popped."
- One bonk per knockout. In a busy match several players can fall in the same second — at most one bonk every 0.5 s, and it still sits under the existing 6-voice cap.
- Short (under 0.2 s) and a touch quieter than a pop (peak about 0.1), so a crowd of pops plus bonks stays clean.
- Builds on T0039's audio layer (src/audio/sfx.ts): add the bonk sound there and trigger it where the player-knockout burst effect plays, the same one-line way the pop hooks the monster-death effect.
- No new HUD element, no engine change. Works on desktop and mobile with the existing gesture unlock.

## Acceptance criteria
- [ ] Knock out a player, or get knocked out: one deep thud plays at the same moment the confetti burst plays.
- [ ] The thud is clearly lower than a monster pop, so a player falling reads differently from a monster dying.
- [ ] Three players knocked out in the same second: the thuds are at least 0.5 s apart and the mix stays clean (no buzz).
- [ ] A monster pop and a bonk in the same instant are both heard.
- [ ] On a phone it plays with no extra tap and does not block the controls.
