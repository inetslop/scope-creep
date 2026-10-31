---
id: T0033
title: "Jackpot: one big gem in the middle of the field, worth 25 xp"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T06:30:37Z
epic: E10
---

## Goal
A 5th field event and a new kind of reason to move: one big gem, worth about a level and a half, lands in the middle of the field — a prize you go to, and a fight over it that shakes the scoreboard.

## Details
The closest examples are the Gem rush and Gem geyser directors (src/content/directors/). One new director file and one new pickup file, each registered in its index; it reuses the existing ring effect (the yellow ring with an ink rim) and the existing pop effect (confetti burst).
- When and where: at 45 s, and every 150 s after the last one landed, one big gem drops at a random spot in the central 1000x1000 of the field. It stays 20 s, then pops. At most one jackpot gem is on the field at a time; the director adds nothing else (no monsters, no fields).
- The gem: a new pickup, the normal gem's look scaled three times with a small star sparkle at one corner, yellow, ink outline, worth 25 xp (about six Puffs, or the geyser's whole 8-second burst in one grab — at mid-life that is a level and a half and a talent point). It is picked up like a gem: it flies to you inside your pickup range.
- What players see: on landing, a ring blooms out from the spot and a puff of confetti pops; while it lasts, the big gem sits on the field; when it expires, it pops into confetti where it is.
- With 6 players: one gem and half the field wants it — players cross the field for it, and a fight over it is a knockout worth the crown. With 60: a scramble to the middle; the gem usually goes to whoever is there first, and the rest fight over who gets the next one.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | drops gems | The rain is a windfall that lands around one player and is shared; the jackpot is one big prize you must go to, and whoever grabs it takes all |
| Gem geyser | a gem on the ground at one spot | The geyser is a slow drip you hold for 8 s; the jackpot is one instant prize that is gone in 20 s, so holding the spot is not enough — you have to be there at the moment |
| Gem rush | a race for gems | The rush is a line of small gems laid across the field, first touch takes all twelve; the jackpot is a single big gem in the middle that anyone can contest for 20 s |
| Swarm surge | runs on a timer | The surge is a threat you dodge; the jackpot is a prize you chase |
| The crown | turns the leaderboard into a target | The crown follows the top scorer; the jackpot is a spot players fight over, and grabbing it can steal the crown |

## Acceptance criteria
- [ ] At 45 s, and every 150 s after the last one landed, a yellow gem about three times the size of a normal gem lands in the central part of the field with a ring and a puff of confetti.
- [ ] Picking it up gives 25 xp — the xp bar jumps about a level and a half at mid-life.
- [ ] If nobody takes it within 20 s it pops into confetti; at most one jackpot gem is on the field at a time.
- [ ] Nothing else on the field changes because of it: no new monsters, no new fields, no HUD.
