---
id: T0085
title: "Toss: a big slow melon that lobs a high-arcing blob that splashes where it lands"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T14:39:38Z
epic: E20
---

## Goal
The menagerie's next way to threaten: a big slow critter that holds a wide band and lobs a high-arcing blob that splashes an area where it lands — the first monster whose attack is a zone you dodge by moving during the flight, not a line you cross.

## Details
- A new monster "Toss" in src/content/monsters/ (closest examples: spitter.ts — it too holds a distance band and shoots from it; zippy.ts — it too shows a windup in its face before it acts). One new monster file plus one registry line in the monsters index, one new projectile file (closest example: the Spitter's glob, a straight monster shot) and one new area file for the splash (closest example: the bubble's splash ring — a ring that blooms out and strikes once, then is gone).
- Look: a big squishy melon — a round body with a squashed flat bottom (its own draw, as the Brood's sac has one), the biggest body in the menagerie. Color: peach (#ffc078), a light orange — if T0071 (in progress) has assigned it to an existing monster, use the one remaining bright warm palette color no other monster uses and record the final hex in the design; no two monsters share a color. Face: mood calm, 2 eyes, mouth smile at rest.
- Behavior (its think): find the nearest player and hold a 220–420 unit band around it. Inside 220: stop and back away at 40 u/s, and do not lob. Past 420: close at 55 u/s. In the band: hold position, fanned out a little so Tosses don't stack.
- The lob cycle: while a player is in the band, every 2.2 s the Toss winds up 0.6 s — the face turns angry, the mouth opens wide with teeth, and a purple blob (radius 10, the palette purple, used as it is) inflates in its mouth (synced in its slots, so every client sees the inflate) — then it lobs one plop.
- The plop projectile: a big purple drop (radius 12) that arcs high — its apex about 140 units above the middle of the flight — at 240 u/s ground speed (about 1.25 s of flight at the typical 300 u band), aimed at where the target was at launch; it does not turn and it is gone on landing. At most one plop in flight per Toss (the 2.2 s cycle is longer than the flight).
- The splash: where the plop lands, a purple ring with an ink rim blooms out to radius 60 over 0.2 s and strikes once for 12 damage — players and monsters alike — then vanishes; it leaves no ground behind. Because it hits monsters too, a Toss in a thick crowd sometimes splashes its own neighbors, and a player can use that.
- Numbers: hp 60, speed 55, radius 26, damage 16 per second while touching a player, xp 5, weight 3, fromLevel 6.
- What it punishes: the mid-range camper (a Gunner at 300 has to keep moving through every lob). What counters it: the close-in (inside 220 it stops and cannot lob — a Body with Maw or a Hive with Horn can reach it) and the wide kite (past 420 it walks at 55 and a 210 u/s player drops it).

## Acceptance criteria
- [ ] From a level 6 player up, a big round melon (radius 26, its color, calm two-eyed smile) appears in the spawn crowds; no other monster shares its color.
- [ ] It holds a 220–420 band around the nearest player: inside 220 it stops, backs away at 40 u/s and never lobs; past 420 it closes slowly; in the band it holds position.
- [ ] With a player in the band, every 2.2 s: a 0.6 s windup (angry face, wide toothy mouth, purple blob inflating in it — visible to every player) then a high arc (apex ~140 u up, ~1.25 s flight) aimed at where the target was at launch; at most one plop in flight at a time.
- [ ] Where the plop lands, a purple ink-rimmed ring blooms to radius 60 and strikes once for 12 (a player standing in it takes 12; a monster in it takes 12 or pops); the ring vanishes and leaves no ground.
- [ ] On death: its normal gem (5 xp) and a pop, like every other monster; a level 1–5 player never spawns one.
- [ ] In a 60-player match its band, lobs and splashes work per player with no extra cost, and a splash can pop its own neighbors in a thick crowd.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Spitter | holds a distance band around a player and shoots from it | the Spitter's glob is a straight point shot you can cross; the Toss's plop arcs high and splashes an area where it lands — the dodge is moving during the flight, and the splash can catch you off the line |
| Zippy | a face change before it acts (a windup) | the Zippy's windup ends in a dash of its own body; the Toss never leaves its band — its threat is a lob that flies far from its own body |
| Puff | a pop with a radius | the Puff's pop happens on its own death, centered on itself; the Toss's splash lands wherever the arc goes, far from the Toss |
| Dot | attacks a player in the crowd | the Dot's attack is contact; the Toss never touches you — it punishes from 220 out, and its splash hits whatever stands where it lands |
| Brood | a big slow body that holds position | the Brood keeps birthing Dots while you stay close; the Toss throws at you while you stay in its band — a position you can leave by moving |
