---
id: T0014
title: "Leader's gem: knocking out the crown drops a gem worth its level"
size: S
priority: 2
status: designing
depends_on: [T0013]
attempts: 0
created: 2026-10-31T03:34:39Z
claimed_at: 2026-10-31T04:06:19Z
epic: E4
designer: cachyos-x8664
---

## Goal
The crown's moment belongs to whoever wins it: when the crowned player is knocked out by another player, they drop a big gem worth their level, so a crown death turns into a scramble everyone can see.

## Details
- Extend the crown director from T0013 with its onKill hook (directors run after each death; gem-rain.ts is the closest example of a director dropping pickups). The pickup is the same gem monsters drop (rules.gem).
- When the crowned player is knocked out by another player (not by a monster), drop one gem at the death spot worth the leader's level in xp: a level-10 crown drops a 10-xp gem. A crowned player who dies to monsters drops nothing.
- The gem is the same green gem pickup monsters drop, drawn at the size of a Puff's gem (the biggest monster gem today) so it reads as worth fighting for. It obeys the normal pickup rules (flies to a player within pickup range; Magnet reaches it); nothing else is special.
- It is on top of the normal knockout rewards (bounty xp and score for the killer) — the gem is extra, for whoever picks it up.
- With 6 players: a player can knock out a crowned bot and take its gem. With 60: after a crown death, players usually race across each other for the gem while the killer stands exposed.

## Acceptance criteria
- [ ] When a crowned player is knocked out by another player, a green gem worth their level in xp drops at the death spot (check with a level-12 crown: a 12-xp gem).
- [ ] When a crowned player dies to monsters, no gem drops.
- [ ] The gem is picked up by the normal gem rules: it flies to a player within pickup range, and Magnet reaches it.
- [ ] A bot that knocks out the crown leaves a gem any player can take.
