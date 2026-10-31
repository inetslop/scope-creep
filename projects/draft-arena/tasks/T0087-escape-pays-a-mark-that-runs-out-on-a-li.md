---
id: T0087
title: "Escape pays: a mark that runs out on a living player banks 5 coins"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T15:05:01Z
epic: E19
---

## Goal
Being marked is a risk either way: today the mark only pays the killer, so a marked player who simply survives gets 15 s of +35% speed for free. A mark that runs out on a living player should bank 5 coins, so escaping the hunt is worth something and the mark's two fates both pay out.

## Details
- In the mark event's own expiry path (where the 15 s run out and the mark is taken off, planning/modules/events.md, the `mark` director): if the marked player is still alive, the mark pays out 5 coins there.
- The pay is the existing `coin` pickup, the same shape Prestige pays uses: it drops at the marked player's feet and is collected at once, so the player sees the candy coin pop and rise, the coin chip ticks up, and the coin tick plays. Humans only: drop it only for human players (a marked bot that survives banks nothing, same as kill coins).
- The knock-out path is untouched: if the marked player is knocked out before the 15 s end, the killer takes the mark's kill bonus as today and nothing is banked when the mark expires.
- The rule is on the mark expiring on a living player, so it covers every mark — the event's mark today, and the killer's mark from T0082 when it lands (both end through the mark's own timer).
- No new HUD element, no new sound, no new effect: the coin pickup, the coin chip and the coin tick already say it.

## Acceptance criteria
- [ ] A human marked by the event who survives the full 15 s sees the candy coin pop at their feet, get collected at once, and their coin balance rise by exactly 5 (the coin chip ticks up, the coin tick plays).
- [ ] A marked player knocked out before the 15 s end banks nothing when the mark expires, and the killer still receives the mark's kill bonus.
- [ ] A bot that is marked and survives banks nothing.
- [ ] The mark is otherwise unchanged: same cadence, 15 s duration, +35% speed, the red target ring, and the kill bonus.
- [ ] No new HUD element, sound or effect is added; the pay reads through the existing coin pickup, chip and tick.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | both put a reward on the field | the rain drops a ring of gems to grab; the escape pays one player coins for surviving, with nothing to grab |
| Gem geyser | both make a spot worth being near | the geyser pays whoever holds the spot; the escape pays the marked player wherever they stand, with no spot to hold |
| Gem rush | both turn a moment into a race | the race is for a line of gems; the escape is one player's own survival, no race at all |
| Jackpot | both are a prize worth going for | the jackpot is one gem in the middle for everyone; the escape is coins for the one marked player, dropped where they stand |
| The mark | it is the mark's own payoff | the mark pays only the killer today; the escape adds the second fate — the marked player who outlives the 15 s banks 5 coins |
| The wound | both pay on a player's state | the wound shows hurt on the field; the escape pays out a survival, shown only by the coin |
| The crown | both mark a player and pay when the mark is lost | the crown pays on the leader's death; the escape pays on a mark expiring with the marked player alive |
| Kill coins | both pay coins on a player knockout | kill coins go to the killer; the escape goes to the survivor of a mark |
| Swarm surge | both add pressure near a payoff | the surge is a threat to dodge for nothing; the escape is pressure that pays the one who escapes it |
| Prestige pays | both drop the coin pickup at a player's feet | prestige pays on reaching level 18; the escape pays on outliving a 15 s mark |
| Prestige point | both bank something for a player | the point banks a talent point on a prestige; the escape banks coins on a survival |
| Prestige ring | both mark a life moment on the field | the ring is a spectacle for everyone; the escape is a quiet coin for the marked player alone |
| Prestige stars | both mark a life on the critter | the stars decorate a living player; the escape pays them out in coins |
