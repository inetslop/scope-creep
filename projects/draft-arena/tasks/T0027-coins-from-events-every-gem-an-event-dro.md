---
id: T0027
title: "Coins from events: every gem an event drops pays 1 coin"
size: S
priority: 2
status: design
depends_on: [T0019, T0011, T0012]
attempts: 0
created: 2026-10-31T05:24:06Z
epic: E6
---

## Goal
The positions and races the field events make pay in the long game too: a gem dropped by a field event pays 1 coin when collected, on top of its xp, so moving for the events is worth more than standing still.

## Details
- What pays: every gem a director drops — Gem rain's 24-gem ring, the Gem rush's line of 12 (first touch takes all), the Gem geyser's 8 bubbling gems — and, if it exists by design time, the crown's leader's gem (T0014): 1 coin per gem collected, in addition to the gem's xp, which stays exactly what it is today. Monster drops pay no coins (the kills already pay, T0019).
- Mechanism (the architect picks): if the event gem keeps the shared gem pickup, the pickup must know it came from a director; the cleanest is a second pickup for the event gem in src/content/pickups/, a candy look in the reward family (yellow or green) that tells apart from the monster's gem at a glance, worth the same xp as the gem it replaces. Whatever the mechanism, no event gem's xp changes and no monster gem starts paying.
- Seen where it happens: T0019's coin pop plays at the gem's spot, one coin per gem. When a Gem rush winner takes the whole line, one coin pop with value 12 at the first gem — the short fountain the coin effect already does.
- Pace in a 5-minute match: a player who fights for the events (a gem rain they reach, a geyser they hold, a rush they win) earns roughly 10–40 more coins than one who ignores the events — on top of the 60–120 kill pay, a bonus for the players who move, not a second salary. Bots collect gems and get no coins and no coin pop, like every other coin source.
- 6 players and 60: the pay is per gem collected, so a full match only splits the same gems across more players; nothing scales.

## Acceptance criteria
- [ ] Collect a gem from a gem rain ring: a coin pop plays at the gem's spot and the player's coins go up by 1 (visible on the start card on the next visit); the gem's xp is unchanged.
- [ ] Win a gem rush: the winner collects the whole line and gets 12 coins, one 12-coin fountain at the first gem.
- [ ] Kill a Dot: its gem pays no coin (the kill itself still pays 1, T0019).
- [ ] A bot collecting an event gem gets no coins and no coin pop.
- [ ] Event gems tell apart from the monster's gems at a glance, and the xp of every event gem is the same as before this change.
- [ ] No new HUD element: the coin pop is the readout, the balance stays on the start card.
