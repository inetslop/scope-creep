---
id: T0012
title: "Gem geyser: a spot that bubbles gems, a position to hold"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T03:16:43Z
claimed_at: 2026-10-31T03:51:37Z
epic: E3
designer: desktop
---

## Goal
The first position event: a spot on the field marks itself, then bubbles a gem every second for 8 s — a place worth standing on, defending, and baiting a fight over. The only event that gives a place to hold, rather than a prize to grab or a threat to dodge.

## Details
- New director file `src/content/directors/gem-geyser.ts` (closest example: `src/content/directors/gem-rain.ts`, the only director). No new pickup: it drops the existing gem, each worth 4 xp — the same value a Puff's gem is worth.
- When it comes: 90 s in, and every 120 s after. Where: a random point at least 300 units inside the field's edges; a different spot each time.
- What it adds, in order: a 2 s warning — a ring of bubbles rising up at the spot (new effect file `src/content/effects/geyser-bubble.ts`, closest example: `src/content/effects/pop.ts`) — then the geyser itself: a yellow-green ring pulses on the ground at the spot for 8 s, and every 1 s a gem worth 4 xp drops in the middle of it. 8 gems, 32 xp total — worth a fight at any point in a life.
- What players see: the bubbles, then a pulsing ring marking the spot for 8 s — each next gem lands in the middle of the ring, so the spot is readable from the edge of the screen and a player can plan a path to it, or an ambush on whoever stands there.
- Holding it: a player who stands at the spot (within pickup range 90) collects each gem as it lands. The spot itself does not hurt; the only thing between you and all 32 xp is whoever else is there. A fight over the geyser pays the usual pvp stakes: a knockout gives 25 score and 4 xp per level of the victim.
- With 6 players: one player or a bot usually takes most of the eight gems; a player who spots the warning can camp the spot or gank the camper. With 60: the spot becomes a rally point — players gather around it, fights break out over it, and its 32 xp is usually split or stolen.
- It doesn't swamp the field: 8 gems per geyser, every 120 s, one spot at a time — if the timer lands while a geyser is still running, it simply waits for the next 120 s.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | drops gems for players to collect | Rain is an instant windfall around one player — grab it fast and move on; the geyser holds one marked spot for 8 s, a position a player can stand on, defend and bait a fight over — a reason to be somewhere, not just to grab something |
| Gem rush (T0011, in the pool) | gems that make players run across the field | The rush's line is a race — first touch takes all and it is over in a moment; the geyser's spot lasts 8 s, so it can be held, camped and defended, and the fight over it can outlast the geyser |

## Acceptance criteria
- [ ] At 90 s (and every 120 s after), a spot at least 300 units inside the edges shows a 2 s ring of bubbles, then a yellow-green ring pulses there for 8 s.
- [ ] During the 8 s, a gem worth 4 xp drops in the middle of the ring every 1 s — 8 gems, 32 xp total; a player standing within pickup range collects them as they land.
- [ ] One player holding the spot takes all eight gems; an enemy player who knocks them out there gets the usual 25 score and 4 xp per level of the victim, and can collect the remaining gems.
- [ ] The geyser never overlaps itself: while one is running, the timer waits for the next 120 s.
- [ ] When the 8 s end, the ring stops and no more gems drop; the next geyser comes at a different spot.
- [ ] Gem rain still runs unchanged; the match starts and plays normally with 6 and with 60 players.
