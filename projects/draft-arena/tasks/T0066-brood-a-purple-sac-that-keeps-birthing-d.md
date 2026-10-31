---
id: T0066
title: "Brood: a purple sac that keeps birthing Dots while it lives"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T12:44:22Z
epic: E18
---

## Goal
The menagerie's 10th and final monster type: a big slow sac that keeps birthing Dots, so a crowd can grow itself and a player in its area has to choose — kill the sac early, or clear the Dots it drops.

## Details
- What it is: a big round sac, deep purple (Puff's purple, darker), the largest body on the field. Three small eyes in a row on top, one wide mouth across the bottom. Calm face (mouth o) while it shuffles; before each birth its mouth snaps to teeth and its belly bulges — a 0.8 s telegraph, synced in its slots like the other monsters' wind-ups — then the belly squashes flat for a beat as the Dot pops out.
- Numbers: hp 70, speed 25 u/s, radius 24, touch damage 8 per second, xp 6, weight 3, fromLevel 6.
- Behavior: chases the nearest player like a Dot, slower than a Popper. While a player is within 300, it runs a birth cycle: telegraph 0.8 s (teeth, bulged belly), then a Dot pops out of its flank with a small pop effect (the monster pop, scaled to a small radius) and the belly squashes. It births three Dots, 4 s apart, then rests 8 s (calm face, soft belly) and the cycle repeats. It never holds more than 3 of its Dots at once — the cycle's three births, then rest.
- The Dots it births are plain Dots (12 hp, 85 u/s, 12 damage per second on touch), so a player already knows what to dodge.
- Crowd math: one Brood adds at most itself plus 3 Dots — 4 more in a crowd of up to 60.
- What it punishes: a kiting build that leaves monsters in its wake (a Brood near your path drops Dots behind you), and a camp (a gem geyser or jackpot held beside one gets Dots walking into the holder).
- What counters it: it is slow and worth 6 xp plus 3 Dots avoided, so an early kill is cheap; a zone build (a Wide bubble, a Maw bite) eats the Dots where they land.
- It is the 10th monster type (weight 3, counting toward the cap of 10); nothing is removed.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Puff | turns into Dots | Puff's Dots come once, on its death; the Brood keeps birthing Dots across its whole life, with a telegraph before each |
| Dot | the Dots it makes, and a straight chase | a Dot is one small chaser; the Brood is a slow factory that adds a whole small crowd over time |
| Popper | a big slow blob you must kill carefully | a Popper hurts you when it dies; a Brood hurts you while it lives, by adding Dots to your path |
| Sleeper | a face state machine | a Sleeper switches between sleeping and chasing; a Brood's state changes produce new monsters on the field |
| Snail | slow, rare, high-xp | a Snail marks the ground behind it; a Brood marks the crowd ahead of you with new Dots |

## Acceptance criteria
- [ ] A level 6+ field gets the 10th monster type: a large deep-purple sac with three eyes and a wide mouth, the biggest body in the field, shuffling at 25 u/s.
- [ ] Within 300 of a player it telegraphs (teeth face, bulged belly) for 0.8 s, then a plain Dot pops from its flank with a small pop; three births, 4 s apart, then 8 s of calm rest, and the cycle repeats.
- [ ] It never has more than 3 of its Dots at once.
- [ ] The Dots it births are plain Dots (same look, same chase, same 12 touch damage) and drop their own gem when killed.
- [ ] It drops a gem worth 6 xp when killed, and its touch damage is 8 per second.
- [ ] It reads in a crowd: three eyes, the biggest body, a mouth that changes before it acts.
