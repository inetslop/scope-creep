---
id: T0082
title: "The price: killing a player marks you for 15 s"
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-31T14:05:22Z
epic: E19
---

## Goal
A player kill isn't free: the killer wears the mark for 15 s, so every knockout starts a short revenge hunt on the one who did it — the real threat gets a cost, and escaping after a kill is a decision.

## Details
- A new permanent-rule director in src/content/directors/ (one new file, registered in the directors index), in the same class as the crown and kill coins — not one of the 6 timed field events, so the event cap is untouched. It gets a `name` and a `description` for planning (players never read them), e.g. "Whoever knocks out a player wears the mark for 15 s; the mark pays out as usual."
- On a player knockout (a player kills a player): apply the existing `marked` status to the killer for 15 s. If the killer is already marked (the event's mark or an earlier kill's), the kill refreshes the 15 s instead of stacking.
- The mark behaves exactly as it does today for whoever wears it: +35% move speed while marked, the red target ring (the `mark` area) 12 units above the marked player's head, and the mark bonus — 20 xp and 5 coins — for whoever knocks out the marked player. The bonus must pay for any marked player, whether the mark came from the event or from a kill, and one knockout pays it at most once. If the mark director's payout only covers the mark it placed itself, share the payout so marks from both directors pay it once.
- Bots count: a bot that knocks out a player is marked the same way, and knocking out a marked bot pays the bonus.
- What the player sees: no new look — the existing red ring and the speed. The player feels it the moment they land a kill: their critter gets a ring, gets faster, and is worth 20 xp + 5 coins extra to everyone for 15 s. A personal alert sound is a separate task (T0084).
- At 6 players (mostly bots): the mark is mostly the +35% speed, and a risk only when another human is around. At 60: every kill opens a 15 s window in which anyone can trade a plain knockout for the bonus one.

## Acceptance criteria
- [ ] A player who knocks out another player gets the red target ring above their head and +35% move speed, and both end 15 s later.
- [ ] A kill while already marked refreshes the 15 s; the mark never stacks (no second ring, no extra speed).
- [ ] Whoever knocks out a marked player gets the mark bonus (20 xp + 5 coins), whether the mark came from the event or from a kill; one knockout pays the bonus at most once.
- [ ] A bot that knocks out a player is marked the same way, and knocking out a marked bot pays the bonus.
- [ ] The director is a new file in src/content/directors/ with a name and description, registered in the directors index; the mark director still marks a random player every 90 s, unchanged otherwise.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | both put something on the field that players react to | the rain drops gems around a player; the price marks the killer themselves as the target |
| Prestige ring | both are a field spectacle of a moment | the ring shows where a prestige happened; the price makes a player worth hunting for 15 s |
| Prestige stars | both are a mark on a critter | the stars are a passive record of past prestiges; the price is a temporary, payoff-carrying target |
| Gem geyser | both create something worth fighting over | the geyser is a spot to hold; the price is a person to chase |
| Jackpot | both make players converge on one thing | the jackpot is a gem in the middle of the field; the price is the killer, wherever they run |
| Kill coins | both pay on a kill | kill coins pay the killer of the first kill; the price puts a risk on the killer and pays the second kill |
| The crown | both make one player a target that pays more | the crown is a permanent rank marker only the leader can wear; the price is a temporary kill marker anyone can wear |
| The mark | same status, same ring, same bonus | the mark is random and falls on a victim; the price is triggered by a kill and falls on the killer — the one who just gained becomes the one who risks |
| The wound | both are a ring on a critter | the wound shows damage taken; the price shows a kill made |
| Prestige pays | both pay a player after a life event | prestige pays coins for reaching level 18; the price pays for knocking out whoever just killed |
| Prestige point | both grant a player something after an event | prestige banks a talent point; the price grants a target ring and a bounty window |
| Swarm surge | both change where players want to be | the surge sends a line of Dots in; the price sends players after the killer |
| Gem rush | both start a race | the race is for a line of gems; the price's race is for a marked player |
