---
id: T0135
title: "The Miner tree: a mine drops where you stand, and whatever steps on it pops"
size: M
priority: 1
status: designing
depends_on: [T0134]
attempts: 0
created: 2026-10-31T23:01:32Z
claimed_at: 2026-10-31T23:03:58Z
epic: E31
designer: desktop
---

## Goal
A seventh playstyle for the talents panel, filling the slot the Body tree vacates: the Miner. Its weapon is the path itself — every 2.5 s a candy mine drops where you stand, and whatever walks into your trail pops. Cheap zone-time mods first, the Mine deeper, so kiting, camping and running all end in a trail of traps.

## Details

Tree (a new file in src/content/talents/, one line in TREES):
- name Miner, description "Your Mine: it drops where you stand, and whatever steps on it pops.", look: shape pentagon, color teal #3bc9db.
- Talents, in file order:
  - id last, upgrade last, max 3
  - id mine, upgrade mine, max 5, needs [["last",1]]
- The panel draws:
  ```
  Last (3)
    Mine (5, needs Last 1)
  ```
- What a Miner player gets and what it costs: 1 point buys a zone-time mod that works with every tree's zones; 4 points buy Mine 3 (the weapon's first real power) — the same 4 points a Gunner would spend on Bolt ranks and Split.

Last (new upgrade, src/content/upgrades/last.ts):
- Name "Last", maxLevel 3, look: shape diamond, color #3bc9db.
- Text: "Your lingering zones and marks last 25% longer, per rank."
- It extends the lifetime of every lingering zone and mark your own weapons and talents lay or refresh, by 25% per rank: Slush's puddle (2.5 s), Gush's puddle (1.5 s), Fizz's splash (2.5 s), Cling's splat (2 s), Chill's slow (1 s), Sapped's mark, and your own mine's 8 s life. Single-strike fields (Lob's splash, Maw's bite, Bellow's ring, a mine's blast) are not extended, a monster's own puddle is never extended, and the mine's 0.5 s arming is never extended — only the life after it.
- What it does with every weapon: Bolt, Cover, Nerve, Horn, Maw, Bellow and Reach — nothing of theirs lingers, no effect; Lob — the splash is a single strike, no effect, but a Fizz splash lingers longer; Goo — the Gush puddle, Chew's ticks and Cling's splat last longer; Slush — the puddle lasts longer; Mine — the 8 s life becomes 10 / 12.5 / 15 s at ranks 1-3.

Mine (new weapon upgrade, src/content/upgrades/mine.ts):
- Name "Mine", maxLevel 5, look: shape circle, color #3bc9db, cooldown 2.5 s.
- Text: "Every 2.5 s, drops a candy mine where you stand. 0.5 s after it lands it arms, and whatever steps on it pops: a 60-radius blast, 14 damage, monsters and players alike, never you. An untouched mine pops empty after 8 s. Per rank: +5 damage, +10 blast radius."
- Fire: unconditional, at the player's own position. It lays a new area (src/content/areas/mine.ts):
  - The mine is a small candy ball (radius 12) that sits still. For its first 0.5 s it is disarmed (dull teal, a gray star at the fuse tip) and strikes nothing.
  - Armed, the ball brightens to vivid teal and a small pink star at the fuse tip pulses on a 0.4 s beat (the star's size grows and shrinks; no glow).
  - The first critter that touches an armed mine — a monster or another player — detonates it: one strike for the blast radius (60, +10 per rank), 14 damage (+5 per rank), monsters and players alike (a player takes the normal half), never the owner. The mine is gone after the strike.
  - An untouched mine pops empty after 8 s (extended by Last): a small puff of pale confetti, no ring, no damage.
  - A mine takes no damage and cannot be destroyed any other way; only contact or expiry ends it.
- Which mods apply: Haste (the drop is 8% sooner per rank), Split (one more mine per drop, the extras landing 40 units out fanned ±30° around your facing; each mine's blast 12% weaker per Split rank), Wide (the blast radius +20% per rank), the player's damage stat (the blast is a hit, as with Slush's puddle and Bop's burst). Quick and Lance do nothing (a mine does not fly).
- The blast's strike is a normal area hit: every non-weapon-conditional on-hit upgrade runs on it (Chill slows the survivors of a pop, Reap pops a half-dead critter harder, Swarm pops harder in a crowd, Snare's sapped critter takes more, Reckless doubles it below half hp, Leech and Glide pay if their own conditions are on you). The weapon-conditional ones do not (Ricochet on Bolt, Mend and Gore on Nerve, Lash on Horn, Fizz and Bop on the bubble).
- A kill by the blast is a normal kill: the gem drops, the kill coin pays, a level-4+ player's corpse gem drops, and every non-weapon-conditional on-kill runs (Chomp, Adrenaline, Fang, Snap, Nest, Sting, Scavenge). The weapon-conditional ones do not (Fuse on a bubble kill, Gush, Chew and Scatter on a Goo kill).
- What the player sees: a small still teal ball with a pulsing pink star — nothing else on the field sits still and sparks (a Goo is a big blue drop that flies, a puddle is a flat rimmed field, a gem is a yellow-green star that rises). On detonation it pops like a bubble's splash: an ice ring with an ink rim blooms out to the blast radius, with a burst of teal and pink confetti.
- In a crowd of monsters: a line of mines thins the chasers (Dots, a Zippy's dash, a Flee's retreat) before they reach you, and a Brood's newborn Dots spawn straight into the trail. Against other players: a mine on the road to the geyser or the jackpot is a toll, and a kiting loop lays a ring of mines you run through and your pursuer does not. With 6 players the trail mostly fights monsters and bots; with 60 it becomes the field's most visible hazard, and the geyser toll is contested.

## Compared with what exists

The tree, one row per existing tree (after T0134 retires the Body tree):

| Existing | What it shares | What the Miner gives that it can't |
| --- | --- | --- |
| Gunner | a mods-first tree around one weapon (Haste, Lance) | the bolt is aimed at the enemy and flies at it; the mine is laid where you stand and waits — the weapon is your path, not your aim, and it hurts whoever walks in, even the crowd behind you |
| Lobber | a zone weapon with zone mods (Quick, Wide) | a Lobber's zone lands where a thrown bubble lands, and strikes on landing or ticks; the mine is laid where you walk, waits up to 8 s, and detonates on first touch — the zone follows your movement, not a projectile |
| Goober | zones that cling to enemies (Gush, Cling, Snare) | Goober's zones come from a hit you land; the mine needs no hit — a trap laid ahead works on whatever wanders in, including a Flee you never touch |
| Frenzy | a tree around one weapon (Nerve), hurt-scaled | Nerve bursts around you every 0.6 s while an enemy is close; the mine is patient — it pops once, at the feet, on contact, and a whole trail of them is the attack |
| Hive | crowd-scaling damage (Swarm, Scavenge) | the Hive is stronger the more enemies are around you now; the Miner is stronger the more enemies walk where you have been — the crowd is your ammo, not your buff |

The Mine, one row per weapon and per upgrade it is close to:

| Existing | What it shares | What the Mine does that it can't |
| --- | --- | --- |
| Bolt | a weapon on a cooldown that aims at the nearest | the bolt flies now, at the nearest enemy; the mine waits where you stand for up to 8 s and pops on touch — it can hit an enemy that is not the nearest, and one you have already passed |
| Cover | a weapon on a cooldown, behind you | Cover shoots at whatever chases you, right now; the mine is laid where you were and pops later, on the thing that walks in |
| Maw | a short-range strike around you | Maw bites in front of you every 0.9 s while an enemy is close; the mine is behind you on your path, one pop, on contact |
| Bellow | a timer-spawned ring around you | Bellow's ring is cast around you, strikes once and is gone; the mine is cast where you stand, lives up to 8 s, and detonates wherever a critter touches it — a trail, not a pulse |
| Lob | lays an ice field on the ground | Lob's splash lands where a thrown bubble lands and strikes on landing; the mine is placed by your movement, not a throw, waits for a touch, and can pop long after you have left |
| Goo | a cool drop weapon | the Goo flies and turns after the enemy; the mine never moves — it is a still trap the enemy comes to |
| Reach | a thin needle at the farthest | Reach fires at the farthest enemy every 4 s; the mine is close-range and patient, trading range for an ambush |
| Nerve | a burst around you | Nerve is a ring of needles around your body every 0.6 s; the mine is a single pop at a point on the ground, triggered by contact, not by proximity to you |
| Horn | darts at the nearest | Horn's darts fly at up to 4 of the nearest enemies now; the mine pops at its own spot later, on the one that touches it |
| Slush | lays a lingering zone | Slush's puddle is thrown at an enemy and ticks a slow where the blob lands; the mine is laid by your walk and does not tick — it detonates once on first touch, and can sit 8 s |
| Bop | a pop-on-touch burst | Bop's bubble flies at the critter and pops where it touches it; the mine sits where you stood and pops on the critter that comes to it — the aim is your feet, not a target |
| Fizz | a lingering zone from your weapon | Fizz's zone is the splash of a bubble you threw, ticking every 0.5 s; the mine is a trap placed by movement, one pop on contact, and its 8 s life is what Last extends |

Last, one row per upgrade that lengthens a zone or mark:

| Existing | What it shares | What Last does that it can't |
| --- | --- | --- |
| Slush | its ranks lengthen a zone | Slush's rank lengthens only its own puddle (+0.5 s per rank); Last lengthens every lingering zone and mark a player lays, whichever tree it came from |
| Chill | its ranks lengthen a mark | Chill's rank lengthens only its own slow (+0.5 s per rank); Last adds 25% per rank to whatever of a player's weapons lingers |
| Fizz | a fixed 2.5 s lingering zone | Fizz's splash stays 2.5 s no matter what; Last's 25% per rank reaches it (3.1, 3.9, 4.9 s) and every other lingering zone and mark a player makes |

## Acceptance criteria
- [ ] The talents panel has a seventh tab, the Miner (pentagon, teal), with Last and Mine drawn as above; spending 1 point on Last and 4 on Mine 3 works end to end.
- [ ] A Miner drops a candy mine where they stand every 2.5 s; it sits dull for 0.5 s, then a pink star pulses on its fuse; a monster or another player that touches it pops it (14 damage, radius 60, half to players, never the owner), and an untouched one pops empty after 8 s.
- [ ] Last's ranks visibly extend the mine's life and other trees' lingering zones and marks; Split fans the drop, Wide grows the blast, Haste speeds the drop, and the blast's kills pay the normal gem, coin and on-kill upgrades.
- [ ] The mine reads in a crowd: a small still teal ball with a pulsing star, an ink-rimmed ice ring and confetti on the pop; no glow anywhere.
- [ ] `npm run check` and `npm run smoke` pass.
