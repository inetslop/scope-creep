---
id: T0023
title: "Prestige ring: a big confetti ring where a player prestiges"
size: S
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T04:59:35Z
claimed_at: 2026-10-31T05:29:00Z
epic: E7
designer: yoga
---

## Goal
A prestige is a moment you can see: when a player reaches level 18 and goes back to level 1, everyone around them sees a big ring and confetti where they are, so a reset reads on the field instead of a quiet level-up.

## Details
- Two small files, both modeled on existing ones: a new effect in src/content/effects/ (one file, next to the level-up ring, `ring`, modeled on it but bigger), and a small director in src/content/directors/ (modeled on the gem-rain director) whose onPrestige hook plays it at the player's position.
- The effect: a yellow ring with an ink rim that blooms out to radius 220 over 0.8 s, with 24 yellow confetti stars flying off it. It plays 0.2 s after the level-up ring of the level-18 goes off, so the beat reads as "level up, then something bigger". The level-up ring itself stays exactly as it is.
- At a glance in a crowd, the prestige ring must read as clearly bigger than a level-up: it is the field's biggest ring.
- It plays for any player, including bots. No HUD element, card or text announces it: an effect on the field, no sound.
- One-off: it leaves no field, pickup, status or score behind.

## Acceptance criteria
- [ ] When a player (including a bot) reaches level 18 and prestiges, a yellow ring with an ink rim blooms to radius 220 over 0.8 s at their position, 0.2 s after the level-up ring, with 24 yellow confetti stars, clearly bigger than the level-up ring.
- [ ] Every player in the match can see it where it happens; no HUD element, card or text appears.
- [ ] The effect is one-off: nothing stays on the field after the 0.8 s.
- [ ] Leveling up below level 18 plays only the normal level-up ring, no prestige ring.
