---
id: T0126
title: "The streak's green tier: a third knockout in the chain turns the sash green and pays +2"
assignee: yoga
size: S
priority: 2
status: done
depends_on: [T0125]
attempts: 1
created: 2026-10-31T21:05:07Z
claimed_at: 2026-10-31T22:46:52Z
finished_at: 2026-10-31T23:42:41Z
epic: E29
---

## Goal
A deeper streak reads deeper: a third player knockout in the chain turns the sash green and doubles its pay, so a hot streak is worth more and looks different at a glance.

## Details
- In The streak's director: when the chain reaches three counted knockouts (a third within 20 s of the second), the tier becomes 2 — the sash area's `slots[0]` is set to 2, and the band and chest star are drawn in green (the rewards green, as the feast gems) instead of gold, same shape, same position, same ink outline.
- While the sash is green, each kill by its wearer pays +2 coins instead of +1 (same `ctx.giveCoins`, same coin chip and coin tick). A fourth and further knockout in the chain keeps the sash green; there is no tier past 2.
- A chain that stops at two knockouts stays a golden sash paying +1. A chain that is broken and restarted (two fresh knockouts) comes back golden; only a third in the new chain turns it green.
- The 20 s window, the 15 s sash timer, the chain rules and the sash's shape and position are unchanged; this task changes only the tier, its color and its pay.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a director putting things on the field | drops gems around a player; the streak puts nothing on the ground — its marker rides on the body and its pay is a coin |
| Prestige ring | plays a field effect at a player | plays once per prestige; the streak's moment comes from a chain of kills and then pays coins |
| Prestige stars | a marker on the body, synced by a tick | a record of the life that grows per prestige and never moves; the sash is a live state that appears, refreshes and dies with the chain, deepens to a second color, and it pays |
| Gem geyser | gives a place to hold | a spot on the ground worth defending; the streak is a state of the wearer (a chain of kills) worth holding, with no spot at all |
| Jackpot | a prize in the field | a prize you go to; the streak is a prize that comes to the one who just earned it and is worn by them |
| Kill coins | pays coins per kill, humans only | pays every kill the same; the streak pays a bonus only while the killer is on a chain, with a deeper chain paying more, and wears a badge while it does |
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
- [ ] A third player knockout within 20 s of the second turns the sash green (same band and chest star, green instead of gold); while it is green, each kill pays +2 coins instead of +1.
- [ ] A fourth and further knockout in the chain keeps the sash green and does not raise the pay above +2.
- [ ] A chain that ends at two knockouts stays a golden sash paying +1.
- [ ] A broken chain that restarts with two fresh knockouts comes back golden; only a third in the new chain turns it green.
- [ ] The sash's shape, position and timers are unchanged; only its color and its coin pay differ by tier.

## Design (architect, yoga)

### Files
- edit `src/content/directors/streak.ts` - T0125's director: tier becomes 2 at a third counted knockout, capped at 2; the coin pay doubles to 2 while the sash is green
- edit `src/content/areas/sash.ts` - the sash area's `look.draw`: band and chest star fill green when `e.slots[0] >= 2` (T0125's file: one area file named after its id; if T0125 named it otherwise, use that file — check `AREAS` in `src/content/areas/index.ts`)

### Interfaces
None — no new types or signatures. All changes are data/logic inside T0125's existing `DirectorDef` hooks and the sash's `AreaDef`/`look.draw(g, e)`.

### Steps
1. Read T0125's `src/content/directors/streak.ts` first. Find the `onKill` where a counted player knockout updates the chain (count, the 20 s window) and where the sash ('sash' area, 15 s life) is fired/refreshed and the +1 coin is paid (`ctx.giveCoins(killer, 1)` and the `ctx.effect('coin', …, 1)` line).
2. Tier: at the sash fire/refresh, set the tier the sash carries to `const tier = count >= 3 ? 2 : 1;` (`count` = knockouts in the current chain; the sash only exists from `count >= 2`). Derive it from the count on every refresh — do not keep a separate tier that a broken chain could forget to reset. Store it wherever T0125 already puts it so the sash area's `slots[0]` gets it (a `pulse` reading the wearer is the codebase's pattern, `areas/bite.ts`); change the value, not the wiring.
3. Pay: where the +1 is paid, `const pay = tier === 2 ? 2 : 1;` then `ctx.giveCoins(killer, pay)` and `ctx.effect('coin', spot, undefined, pay)` — same trigger, same bot guard as T0125; only the number moves.
4. In the sash's `look.draw(g, e)`: `const green = (e.slots[0] ?? 0) >= 2;` and the band and chest star fills become `green ? PALETTE.green : <T0125's gold>` (check the file; expect `PALETTE.yellow`). Nothing else changes: same shape, same position, same ink outline.
5. `npm run check`.

### Pitfalls
- Fourth and further knockouts must not raise the pay: `count >= 3 ? 2 : 1` (never `count - 1` or an increment); the tier has no value past 2.
- A restarted chain (two fresh knockouts) must be tier 1: deriving the tier from the current count on every refresh gives this for free; if T0125 keeps a separate tier, reset it exactly where the count resets.
- `slots[0]` is a whole number: 1 = gold, 2 = green; no fractions.
- Colors only from `PALETTE`: green is `PALETTE.green` (the feast-gem green); keep T0125's gold untouched.
- Color branch only — no geometry edits, so the sash's tests pass unchanged; the coin effect's `value` is the coin count (1..20), so 2 pops two coins.

### Tests
none — no new pure helpers; the streak director and the sash area are content items, auto-tested by `engine/tests/`.

## Result (attempt 1, yoga)

Added the streak's green tier. New status `src/content/statuses/streak-green.ts` (registered in `STATUSES`) draws the sash exactly like the gold one but with the band and chest star in `PALETTE.green`; `directors/streak.ts` now picks the status from the chain count each tick (green from a third knockout, `n >= 3`) and pays `n >= 3 ? 2 : 1` coins with the same trigger and bot guard, so 4th+ knockouts cap at +2 and a broken-and-restarted chain comes back golden. Deviations from the design: T0125's sash is a status, not an area (`areas/sash.ts` doesn't exist; I checked `AREAS`), and the gold status's own docstring says the tier is the status id — so I made tier 2 the second status instead of editing an area's `slots[0]`; the design's `ctx.effect('coin', …)` line does not exist in T0125's file (the coin chip/tick HUD reacts to `giveCoins` automatically), so I changed only the existing `giveCoins` number and restructured `onKill` minimally so the pay is derived from the post-update count.

- Self-review: APPROVE
- Time: 55.8 min

```
.../game/src/content/directors/streak.ts           | 36 +++++++++++++---------
 .../draft-arena/game/src/content/statuses/index.ts |  2 ++
 .../game/src/content/statuses/streak-gold.ts       |  4 +--
 .../game/src/content/statuses/streak-green.ts      | 36 ++++++++++++++++++++++
 4 files changed, 62 insertions(+), 16 deletions(-)
```
