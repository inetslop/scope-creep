---
id: T0106
title: "The feast: a prestige lays a ring of gems where the player prestiges"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T17:29:12Z
claimed_at: 2026-10-31T17:29:15Z
designer: desktop
---

## Goal
Prestige is the biggest moment on the field (the biggest ring, the fanfare) and today it pays nothing to anyone but the player: when a player prestiges, 8 gems land in a ring around them — the fresh level-1 critter becomes the feast and every nearby player a guest, so prestiging stays worth it and the prestiger is a target worth hunting.

## Details
- One new permanent-rule director in a new file, registered like the others (a new src/content/directors/prestige-feast.ts plus one import and one registry line in src/content/directors/index.ts). It is a prestige rule like the prestige ring and the prestige pays, not one of the 6 timed field events.
- On every prestige, human or bot (exactly when the prestige ring plays), 8 gems land in an even ring — one every 45 degrees — radius 120 from the player's spot. Each gem is the game's event-gem pickup (the one gem rain and the geyser drop), worth 4 xp each, so a human collector gets 1 coin with each, the same as any event gem.
- The gems last 20 s and are then gone, the way the jackpot's gem does. At most 8 gems exist from one prestige, and prestiges are rare, so the field never swamps.
- Nothing new on the HUD and no new sound: the feast is read on the field as the gems themselves, under the existing ring and fanfare. Every other prestige reward stays exactly as it is (the coins, the banked point, the stars, the ring, the fanfare).
- The same 8 x 4 xp ring on the 1st, the 2nd and the 3rd prestige of a life — the reward is per prestige, so a second life's first prestige pays it again.
- Right after the prestige the player is at level 1 with no talents but their hp, score and kills: the whole ring is 32 xp, about 4 levels if nobody contests it — a head start, not the 17 levels and a full build the reset took. A new player has nothing at their feet; a level-17 player has a whole build.
- With 6 players the nearest one is usually far: the prestiger walks out and eats the ring, which is the reward. With 60 players the ring is contested in seconds and the star-marked level-1 critter in its middle is the field's most wanted target for the 20 s it lasts.

## Acceptance criteria
- [ ] When any player (human or bot) prestiges, 8 green event-gems appear in an even ring of radius 120 around them, on top of the existing prestige ring, fanfare, coins and banked point, all unchanged.
- [ ] Collecting a feast gem gives a human player 4 xp and 1 coin, like any event gem; a bot's prestige lays the same ring.
- [ ] Feast gems last 20 s and are then gone; a second prestige of the same life lays a fresh ring of the same 8 gems.
- [ ] Nothing new appears on the HUD or in the shop; the field shows the feast only as the gems.

## Compared with what exists
The feast is not a field event (it has no timer and no fixed spot, like the crown and the corpse pays), but against the six events:

| Existing | What it shares | What the feast does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | a ring of gems around a player | a ring laid by a timer around a random player; the feast is laid by the player's own prestige, at their exact spot, on their own schedule |
| Gem geyser | 8 gems worth 4 xp | a spot that drips gems over 8 s to be camped and held; the feast lays all its gems at once around a player who is the prey, not a neutral spot |
| Gem rush | gems on the field to race for | one line where the first touch takes all twelve; the feast is 8 separate gems, first come first served, in a ring around a target |
| Jackpot | a prize in a fixed place | one 25-xp gem in the middle of the field; the feast is small gems scattered where a player chooses to be |
| The mark | makes one player the field's target | a bonus paid to the killer of a marked player; the feast lays a visible prize on the field at the target's feet that anyone can take even without a kill |
| Swarm surge | a field moment that makes everyone move | a threat of twelve Dots walking in from an edge; the feast adds no monsters — only a prize and a reason to converge |
