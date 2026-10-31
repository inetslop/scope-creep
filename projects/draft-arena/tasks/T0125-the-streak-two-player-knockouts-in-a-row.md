---
id: T0125
title: "The streak: two player knockouts in a row wear a golden sash that pays +1 coin per kill"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T21:05:07Z
claimed_at: 2026-10-31T21:05:10Z
epic: E29
designer: desktop
---

## Goal
Momentum pays: a player who knocks out two players within 20 s wears a golden sash, and every kill pays +1 coin for 15 s — winning a duel in a row is a visible badge, a coin engine, and a target the whole field can see.

## Details
- A new permanent-rule director, "The streak" (crown/price class, not one of the 6 field events), watching player knockouts in `onKill`, with per-killer state in its `mem`.
- The chain, per killer: a knockout whose victim is a player (human or bot) counts for the killer. The first counted knockout starts the chain; a second within 20 s of the first puts the killer on the streak; each further knockout within 20 s of the last counted one keeps the chain alive. A knockout of the killer ends their chain and removes the sash at once; a prestige does the same (the life is over).
- The sash: a diagonal golden band about 0.18 r wide from the left shoulder to the right hip, with a small golden five-point star (like the level-up ring's stars) at the middle of the band, ink-outlined, drawn on the body the way the prestige-stars are drawn on the critter — a new critter-riding area, with the tier in `slots[0]` (0 = none, 1 = gold now, 2 = green, used by a later task). It shows on every player, human and bot alike, synced on a 1-second pulse the way the prestige-stars refresh. Not a collar: it is a band across the body, clear of the crown (head), the mark (ring) and the wound (collar arc).
- The pay: while a killer's sash shows, every kill by that killer — monster or player — pays +1 coin on top of Kill coins' own pay, via `ctx.giveCoins`; humans only, bots wear the sash but earn nothing, exactly like Kill coins. The pay is read by the existing coin chip and coin tick; no new HUD, no new sound in this task.
- Timers: a 20 s chain window measured from the last counted knockout; a 15 s sash timer refreshed by each counted knockout. When the sash timer runs out the sash is removed; the chain still lives if the next counted knockout comes within 20 s of the last one.
- With 6 (a human among bots): a solo player who knocks out two bots in a row wears the sash and banks a few bonus coins while farming — a gentle moment in a quiet match. With 60: a real duel chain makes the sash a visible "go after this one" target, and breaking a streaker's chain is a reason of its own to hunt.
- Coin math: a new player +1–5 coins per match; a good player in a full match +10–25 coins across two to four streaks — a bonus on top of Kill coins, never the main source.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a director putting things on the field | drops gems around a player; the streak puts nothing on the ground — its marker rides on the body and its pay is a coin |
| Prestige ring | plays a field effect at a player | plays once per prestige; the streak's moment comes from a chain of kills and then pays coins |
| Prestige stars | a marker on the body, synced by a tick | a record of the life that grows per prestige and never moves; the sash is a live state that appears, refreshes and dies with the chain, and it pays |
| Gem geyser | gives a place to hold | a spot on the ground worth defending; the streak is a state of the wearer (a chain of kills) worth holding, with no spot at all |
| Jackpot | a prize in the field | a prize you go to; the streak is a prize that comes to the one who just earned it and is worn by them |
| Kill coins | pays coins per kill, humans only | pays every kill the same; the streak pays a bonus only while the killer is on a chain and wears a badge while it does |
| The corpse pays | reacts to a player's death | drops a gem at the death spot for anyone to take; the streak ends the dead player's chain and counts the kill toward the killer's |
| The crown | a marker on a player, moved by a tick | marks a position (the top scorer), moves on overtake, and pays the one who takes it; the streak marks an action (your kills in a row), stays on its earner, and pays them |
| The mark | a status on a player for 15 s from onKill | picked by chance, makes the wearer faster, and pays whoever breaks them; the streak is earned by the wearer, changes no body, and pays the wearer |
| The price | onKill, reacts to a player knockout | turns the killer into a target for everyone via the mark; the streak turns a chained killer into a payer for themselves, with the target being whoever breaks the chain |
| Growth | a per-player body change on a tick | passive with level, pays nothing; the streak is reactive to kills and pays a coin |
| Prestige pays | gives coins per player | once per prestige, scaled by the life number; the streak pays per kill, scaled by the chain, mid-life only |
| Prestige point | banks a reward per prestige | banks the draft currency (a talent point); the streak pays the shop's currency (a coin) |
| Prestige feast | lays pickups where a player is | lays a ring of gems on the ground; the streak lays nothing on the ground |
| Swarm surge | a director on a tick | spawns a crowd of monsters; the streak spawns nothing and only changes who pays what |
| Gem rush | lays a line of pickups to race | a race against other players for a pickup; the streak's race is against the wearer's own last-kill clock |

## Acceptance criteria
- [ ] A second player knockout within 20 s of the first puts a golden sash on the killer — a diagonal gold band with a chest star, ink-outlined — and it stays 15 s, refreshed on each further knockout within 20 s of the last.
- [ ] A first knockout alone shows no sash; a knockout after the 20 s window starts a new chain instead of extending one.
- [ ] While the sash shows, every monster kill and player knockout by that player pays +1 coin on top of the normal Kill coins; the coin chip ticks and the coin tick plays on your own kills.
- [ ] Being knocked out (or prestiging) removes the sash and breaks the chain: the next streak needs two fresh player knockouts.
- [ ] A bot on a streak wears the sash visibly and earns nothing; the sash never appears on a monster.
