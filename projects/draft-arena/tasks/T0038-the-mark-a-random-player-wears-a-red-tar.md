---
id: T0038
title: "The mark: a random player wears a red target for 15 s, and knocking them out pays"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T07:27:49Z
epic: E10
---

## Goal
The 6th field event (the cap): a 15-second window in which one random player becomes the target of everyone — the field turns from a farm into a hunt, and the marked player gets a speed boost to run.

## Details
- When and who: the first mark at 60 s, then a new mark every 90 s. It picks a random living player (human or bot); never the same player twice in a row when two or more are alive. Each mark lasts 15 s.
- What it is: the marked player wears a red target ring (a red ring with an ink rim, radius 26) 12 units above their head — the crown's height, but a red ring, not the yellow crown — pulsing once per second. The marked player gets a status, "Marked": +35% move speed for 15 s (283 u/s at the base 210); nothing else — the mark never slows or damages them.
- What it pays: a player who knocks out the marked player within the 15 s gets 20 bonus xp and 5 coins on top of the normal knockout bounty, score and coins; a burst plays where the mark was, plus the kill's normal coin pop. If the marked player is knocked out by a monster, or the 15 s expire, the ring pops into confetti and nothing is paid.
- What players see: a small pop where the ring appears, a pulse once per second while it lasts, and at the end either a burst (the kill) or a confetti pop (expired or lost to monsters).
- With 6 players: up to five hunters — the humans plus the bots, who fight players as usual — against one marked player; the +35% speed outruns a single pursuer but not two. With 60 players: the mark draws the whole field to one player; the first seconds are a melee and the mark is a reason sixty players converge on one spot.
- It swamps nothing: it adds no monsters and no pickups — only a status and a ring.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a windfall placed around one player | the rain is a place worth standing in; the mark is a moving target worth killing, and it runs from you |
| Gem geyser | a spot that pays while you hold it | the geyser pays its holder for as long as they stay; the mark pays exactly once, to the killer, and moves with its victim |
| Gem rush | a line to race across the field | the rush is a race for a pickup; the mark is a race for a player, and the prize is the kill itself, not what it drops |
| Swarm surge | a threat that comes at players | the surge comes from the edge and players dodge it; the mark is one of the players, and anyone can be it |
| The crown | a mark on a player that makes them a target | the crown is earned and stays until a strict overtake, so the leader can wear it a whole life; the mark is a 15-second lottery on any player, even a level-1 nobody, so the target is random and temporary |
| Kill coins | a standing coin payout on every kill | the mark adds a bonus to exactly one kill, on one random victim, for 15 s at a time |
| Prestige ring | a ring that plays where a prestige happens | the prestige ring reacts to something a player did; the mark is scheduled, and it is a threat, not a celebration |

## Acceptance criteria
- [ ] At 60 s and every 90 s after, a random living player (never the same player twice in a row) gets a red target ring (ink rim, radius 26) 12 units above their head; it pulses once per second and lasts 15 s.
- [ ] While marked, the player moves 35% faster (283 u/s at the base speed); the mark adds no damage or slow, and it is removed when the 15 s end or the player dies.
- [ ] A player who knocks out the marked player within the 15 s gets 20 bonus xp and 5 coins on top of the normal knockout payout; a burst plays where the mark was, plus the kill's normal coin pop.
- [ ] If the marked player is knocked out by a monster, or the 15 s expire, the ring pops into confetti and no bonus is paid.
- [ ] The mark adds no monsters and no pickups; it runs the same with 6 players (a few hunters; the marked one outruns a single pursuer) and with 60 (the field converges on one player).
- [ ] The ring reads as "danger is here": a red ring in the threat color, distinct from the yellow crown and from the yellow and green rewards.
