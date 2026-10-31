---
id: T0087
title: "Escape pays: a mark that runs out on a living player banks 5 coins"
size: S
priority: 2
status: todo
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

## Design (architect, yoga)

### Files
- edit `src/content/directors/mark.ts` - the mark's expiry path banks 5 coins for a marked player who is still alive (humans only), as a `coin` pickup at their feet

### Interfaces
None. No new types, defs, files or registries. The pay reuses the existing `coin` pickup (`src/content/pickups/coin.ts`, already registered, already collects at the collector's feet via `ctx.giveCoins`).

### Steps
1. In `src/content/directors/mark.ts`, add one line after `const BONUS_COINS = 5;` (line 9): `const ESCAPE_COINS = 5;` — do not reuse `BONUS_COINS`, the kill bonus may be tuned separately.
2. Replace the expired branch in `tick` (lines 28–33):
   ```ts
   if (mem.until) {
     const gone = ctx.playerById(mem.mark); // expired: they are still alive (a kill clears mem first)
     mem.mark = 0;
     mem.until = 0;
     if (gone) {
       ctx.effect('pop', spot(gone), undefined, RING);
       if (!gone.bot) ctx.dropPickup('coin', gone.x, gone.y, ESCAPE_COINS);
     }
   }
   ```
   `!gone.bot` is the human check (`Player.bot`, `engine/api.ts` line 118). `dropPickup` is on `ctx` (api.ts line 281); the drop is at the feet, exactly like `src/content/directors/prestige-coins.ts` line 23. Do not defer it through `mem` the way prestige-coins does — `gone` is right here in the tick.
3. Fix the doc comment (lines 14–16) which will now be false: change "a monster kill or an expired mark pops the ring into confetti and pays nothing" to "a monster kill pops the ring into confetti and pays nothing; an expired mark banks 5 coins for the marked player if they are still alive (humans only)".
4. Touch nothing else: no change to `onKill`, no new effect, sound, HUD or file.

### Pitfalls
- Drop for humans only: a marked bot that survives must bank nothing (`!gone.bot` guard), same rule as kill coins.
- Drop at `gone.x, gone.y` (the feet), not `spot(gone)` — that is 12 units above the head and is the ring's spot, not the feet.
- The knockout path is safe as-is: `onKill` clears `mem.mark`/`mem.until`, so `if (mem.until)` never runs for a killed mark and the killer's bonus is untouched.
- The pickup (`life: 2`, `radius: 7`) collects at once because the player is standing on it — that is also how the candy pop, the coin chip and the coin tick show, so add no visual of your own.

### Tests
- none (the mark director is exercised in a real match by engine/tests/ automatically)
