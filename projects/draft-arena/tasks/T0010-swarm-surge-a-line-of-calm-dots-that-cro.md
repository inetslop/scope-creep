---
id: T0010
title: "Swarm surge: a line of calm Dots that crosses the field"
size: M
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T03:16:43Z
claimed_at: 2026-10-31T04:17:30Z
epic: E3
design_attempts: 1
designer: desktop
---

## Goal
The first threat event: a line of twelve red Dots walks across the field in a straight line toward the centre, and the reason to move is to get out of its way — or to fight through it for the gems it drops. The field gets a moving danger that no player can hide from.

## Details
- New director file `src/content/directors/swarm-surge.ts` (closest example: `src/content/directors/gem-rain.ts`, the only director). No new monster: it spawns Dots (`src/content/monsters/dot.ts`) with a temporary march state — a status on an existing unit, like the slow status T0004 puts on one, not a new kind of critter.
- When it comes: 60 s in, and every 90 s after. Where: 12 Dots spawn just off a random edge of the field, evenly spaced 30 units along about 330 units of boundary, facing in.
- What it adds: the 12 Dots walk in a single file (one behind the other, 30 apart), in a straight line from where they spawned toward the field's centre (2000, 2000), at 85 u/s (the Dot's normal speed). Each keeps its normal Dot numbers, no level scaling: hp 12, 85 u/s, radius 14, 12 damage per second on touch, a 1-xp gem on death.
- The march ends two ways: a Dot turns on a player when one is within 60 and becomes a normal Dot (chases the nearest player); or it reaches within 40 of the field's centre, where it also becomes a normal Dot. Two surges may overlap: at most 24 surge Dots on the field at once.
- What players see: a red line of twelve critters walking across the field. While marching each wears a calm face (mood calm, one eye, mouth o — the Puff's look on a red circle): a red Dot that is not chasing you reads as "walking, not hunting". The line is the warning — visible from the edge of the screen, seconds ahead — and the moment one Dot turns on you its face goes angry (the normal Dot face) and it is already on you.
- With 6 players (bots fill to 6): the line usually crosses open ground; a player who stands in its way can clear it (12 Dots, twelve 1-xp gems — a good share of a level — a bonus for a prepared build like Maw or a splash) or simply step aside.
- With 60 players: the line ploughs into a crowd; it separates groups and becomes a wall players fight through or around, and the gems it drops are contested.
- It doesn't swamp the field: 12 Dots per surge, every 90 s, and every one of them either dies or becomes a normal Dot that the existing spawn rules already manage.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a timed director that puts something on the field for players | Rain brings a reward to one player's spot to grab; the surge moves a threat across the whole field — the reason to move is to get out of a line's way or clear it, not to collect what lands near you |

## Acceptance criteria
- [ ] At 60 s (and every 90 s after), 12 red Dots spawn along about 330 units of one edge of the field, 30 apart, and walk in a single file in a straight line toward the field's centre at 85 u/s — readable as a red line crossing the mint field.
- [ ] While marching, each Dot wears a calm face (mood calm, one eye, mouth o, like the Puff's); a player can tell a marching Dot from a chasing one at a glance.
- [ ] A marching Dot within 60 of a player turns angry and chases that player like a normal Dot (85 u/s, 12 damage per second on touch); one that reaches within 40 of the centre stops marching and becomes a normal Dot.
- [ ] A player standing still where the line crosses gets touched (12 damage per second per Dot touching them); a player who runs perpendicular at 210 u/s easily gets out of the line's way.
- [ ] A killed surge Dot drops a 1-xp gem like any Dot.
- [ ] Gem rain still runs unchanged; the match starts and plays normally with 6 and with 60 players.
