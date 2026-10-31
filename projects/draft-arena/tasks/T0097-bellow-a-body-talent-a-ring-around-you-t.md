---
id: T0097
title: "Bellow: a Body talent, a ring around you that strikes everything close, open after a prestige"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T16:11:39Z
claimed_at: 2026-10-31T16:11:42Z
epic: E17
designer: desktop
---

## Goal
A second-life Body gets a weapon beside Maw: a bellow ring that strikes everything around the player, so a second-life tank can stand still in the middle of the swarm instead of turning to keep every threat in front of the bite.

## Details
- A new upgrade in the Body tree and the next prestige-gated talent after Slush, Cover, Gore and Snare. The Body's answer is stand-still defense: Cover guards a kiting Gunner's back, Slush zones a Lobber's ground, Bellow makes a tank that can face nothing at all.
- Talent line: id `bellow`, upgrade `bellow`, max 3, needs `[["maw", 3]]`, points 3, prestige 1. In the Body tree's file it goes after the Maw line; the Body tab draws it under Maw.
- Weapon: every 1.4 s, if any critter (monster or player) is within 60, the critter bellows — its mouth opens wide for 0.3 s — and an ice ring with an ink rim (a line that blooms out, not a filled field) spreads from the player to radius 80 over 0.3 s and strikes everything inside it once (everything but the player). With no critter within 60 it does not fire and waits.
- Damage: rank 1: 10, rank 2: 14, rank 3: 18. Players take half, as with every weapon.
- The ring is a new area in the same class as Maw's bite area: it strikes each critter inside once and is gone (fades 0.2 s after the bloom).
- Which mods apply: it is an area strike, so the general on-hit effects run on its hits — Chill slows whatever it strikes, Reap adds damage to a below-half target, Swarm scales with the crowd around each target, Reckless doubles the hit while the player is below half hp. Might and Frenzy raise its damage +12% per rank; Haste fires it 8% sooner per rank. It is not a projectile: Lance, Split and Quick do nothing to it, and the weapon-gated ones (Gore, Mend, Cling) do not.
- Look: shape star, ice (#99e9f2, Maw's color), so the tree's two weapons read as a pair.
- Text on the talent row: "After 1 prestige this life. Every 1.4 s, if a critter is within 60, a ring (radius 80) around you strikes everything inside. 10 damage. Per rank: +4."

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a weapon that fires by itself | aims one star at a time at one enemy; Bellow strikes every direction around the player at once, unaimed |
| Cover | a defensive weapon for a build that takes chase | a 3-bolt fan aimed at what chases from behind, for a kiting build; Bellow covers every direction and lets the player stand still |
| Maw | a Body weapon at close range | bites in front of the player only; Bellow is a full circle, so it covers the flanks and behind |
| Lob | a self-aimed weapon | an arcing bubble that must lead a target and splash where it lands; Bellow has no flight and no target, it is already around the player |
| Goo | a self-aimed weapon | a homing drop that chases the nearest enemy; Bellow chases nothing |
| Nerve | a short-range weapon | a jab that scales with the player's own wound; Bellow is a fixed ring that hits the same at full hp |
| Horn | a dart at the nearest enemy | an aimed single dart at one enemy; Bellow is an unaimed ring in every direction at once |
| Slush | a weapon whose strike leaves a ring-shaped zone | a thrown blob that leaves a lingering slow puddle; Bellow strikes once, slows nothing and leaves nothing on the ground |
| Sting | a burst ring on the field | a kill-triggered burst at a corpse that needs 2+ neighbors; Bellow is on a timer around the player, with or without a kill |
| Fuse | a damage ring | a ring where a bubble kills something, Lobber's only; Bellow is a ring around the player on a timer |
| Scatter | a kill-triggered pop | a Goo kill pops into 4 homing minis; Bellow is not triggered by a kill and sends nothing out |

The Body tree as the panel draws it:
```
Swift (5)
Vigor (3)
  Chill (3)
  Hide (3)
  Chomp (1, needs Vigor 3 + Swift 3)
Might (5)
  Maw (5, needs Might 2)
    Bellow (3, needs Maw 3, 3 points, 1 prestige)
Magnet (3)
```

What a Body player gets and what it costs: Bellow 1 costs Might 2, Maw 3 and 3 points in Body, plus 1 prestige this life — 6 points a second-life Body reaches mid-life with the points prestiging banks. The same 3 points instead buy Swift (a faster kiting tank), Might (a harder bite) or the road to the Chomp capstone (Vigor 3 + Swift 3). A first-life Body keeps kiting so threats stay in front of the bite; a second-life Body can stand in the middle of the swarm and bellow — and in a player fight the ring is the first thing a chaser learns to respect.

## Acceptance criteria
- [ ] The Body tab in the talents panel shows Bellow under Maw; before this life's first prestige it reads locked with the prestige need, after 1 prestige it reads "Needs Maw 3", and after Maw 3 it buys at 3 points.
- [ ] With Bellow 1 and a monster within 60: every 1.4 s an ice ring with an ink rim blooms from the player to radius 80, the mouth opens wide for 0.3 s, and every critter inside but the player takes 10 damage once (a player 5); monsters pop as usual.
- [ ] With no critter within 60, no ring blooms and the weapon waits for the next enemy.
- [ ] Ranks 2 and 3 strike for 14 and 18.
- [ ] Haste fires it sooner and Might and Frenzy raise its damage; Chill slows what it strikes, Reap adds damage on a below-half target, and Reckless doubles it below half hp.
- [ ] The ring reads as a ring line, not a filled field: in a crowd a Gush puddle and a bubble splash still read different from it, and Bellow's text fits its row in the panel at 412x915.
