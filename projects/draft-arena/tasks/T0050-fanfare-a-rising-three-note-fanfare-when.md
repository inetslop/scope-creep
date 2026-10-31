---
id: T0050
title: "Fanfare: a rising three-note fanfare when a player prestiges"
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-31T09:20:00Z
epic: E11
---

## Goal
A prestige is the rarest moment of a life — the big ring and confetti where the player reboots — and it is silent. Give it a short rising fanfare, so the field hears a veteran being reborn.

## Details
- The moment a player (you or another, including bots) prestiges, a short three-note fanfare plays — a bright rising arpeggio ("da-da-DA") — at the same instant the big prestige ring blooms.
- C5→E5→G5 (523, 659, 784 Hz), each note about 0.1 s with 0.1 s between the starts — about 0.35 s total. Longer and lower than the level-up chime (E6→G6), so a prestige reads bigger than a level-up.
- Prestiges are rare, so it may be a touch brighter than pops, but still under the action (peak about 0.09).
- At most one fanfare every 2 s, in case a player and a bot prestige at the same moment.
- Builds on T0039's audio layer (src/audio/sfx.ts): add the fanfare there and trigger it where the prestige ring effect plays, the same one-line way the pop hooks the monster-death effect.
- No new HUD element, no engine change. Works on desktop and mobile with the existing gesture unlock.

## Acceptance criteria
- [ ] Prestige, or watch a player or bot prestige: one rising three-note fanfare plays as the big ring blooms.
- [ ] The fanfare is clearly longer and lower than the level-up chime, so the two moments don't blend into one sound.
- [ ] Two prestiges in the same second: only one fanfare plays.
- [ ] On a phone it plays with no extra tap and does not block the controls.
