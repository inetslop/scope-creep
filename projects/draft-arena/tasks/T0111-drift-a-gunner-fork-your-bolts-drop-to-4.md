---
id: T0111
title: "Drift: a Gunner fork, your bolts drop to 40% speed after 120 units and linger"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T18:10:25Z
epic: E24
---

## Goal
The Gunner's straight line becomes a hazard on the ground: with the fork, a bolt flies fast for a while, then drifts slowly for the rest of its flight, so a kiting Gunner leaves a lingering line of bolts in front of the swarm — the overshoot that used to be free is a line you have to cross again. First slice of the Gunner's growth (E24).

## Details
- A new weapon-behavior mod `drift` in the Gunner tree, a fork under Bolt 2, alongside Split.
- Text (shown on the talent's row): "After 120 units, your bolts fly at 40% speed and keep going until 0.8 s after launch. Rank 2: until 1.2 s."
- Talent line: id drift, upgrade drift, max 2, needs `[["bolt", 2]]`. No points commitment, no prestige gate.
- How a drifting bolt flies and looks: full speed for its first 120 units, then 40% of that speed until 0.8 s after launch (rank 2: 1.2 s), then it pops into a small ice ring (radius 30, ink rim). The drift is tuned so the slow part is faster than the fastest chasing monster and slower than a running player (210 u/s): the line stays ahead of the swarm and behind the kiter. A bolt that hits or dies before the drift ends is unchanged; the drift extends or trims the bolt's flight to that total.
- A drifting bolt is the same yellow spinning star with 3 short ice streaks trailing behind it (a slow-motion tail) — the streaks are how a player sees, at a glance, which bolts are still live and drifting.
- With every weapon that fires bolts: Bolt (every bolt of its volleys drifts), Haste (fires sooner, so more lines, no change to the drift), Quick (the stat applies as usual: the bolt reaches the drift point sooner and drifts faster), Split (the fanned extra bolts drift too), Lance (a bolt that goes through drifts on through), Ricochet (a bolt that has bounced drifts after it has flown 120 units), Cover (the fan of bolts behind you drifts too — cover becomes a line of bolts to stand outside of).
- Not bolts, no effect: the Goo keeps turning, the bubble keeps arcing, and the Nerve's jabs, the Horn's darts, the Maw's bite and the Bellow's ring are unchanged — their motion is their own.
- Players: a drifting bolt hits a player at half damage like every other bolt (the pvp damageMul) — a line laid on the field is a hazard to whoever walks into it, player or monster.
- look: shape triangle, color #99e9f2 — a slow bolt is an ice thing.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Goo | a shot that moves differently in flight | The Goo is its own weapon: a big slow drop that keeps turning to the nearest enemy for its whole flight; Drift is your Bolt: a fast star that goes straight, slows once, and keeps going on the line it was fired on |
| Quick | changes how bolts fly | Quick makes every shot faster, all the time, with every weapon; Drift changes the Bolt's flight in two phases (fast, then slow) and only for bolts |
| Lance | a mod for bolts | Lance adds a pierce to the bolt; Drift changes the bolt's speed over its flight — a bolt can go through and linger at once |
| Split | a mod for bolts (and every weapon) | Split adds shots; Drift changes how each shot flies — a fanned drift is a drifting fan |
| Ricochet | a Bolt capstone about its flight | Ricochet reacts to a hit (a bounce on to another enemy); Drift changes the flight before any hit, and a bounced bolt drifts too |
| Haste | a mod that changes the Bolt's rate | Haste fires sooner; Drift changes what each bolt does in the air |

The tree as the panel will draw it (Gunner after this task):
```
Haste (3)
  Bolt (5, start 1, needs Haste 1)
    Split (2, needs Bolt 2)
    Drift (2, needs Bolt 2)
    Ricochet (1, needs Bolt 4)
    Cover (3, needs Bolt 2, points 3, prestige 1)
Lance (2)
```
What a Gunner gets, and what it costs: a point at Bolt 2 (Bolt 1 is free), where those points could buy Split (one more bolt, fanned). Drift instead makes every bolt a line: kite past a crowd and the slow half of each bolt stays in front of it, so the swarm that chases the line gets hit as it follows, and a kiter who cuts back across their own line gets hit by it.

## Acceptance criteria
- [ ] The Talents panel's Gunner tab shows Drift under Bolt, beside Split, with its text and 2 ranks; it takes a point once Bolt 2 is bought.
- [ ] A rank-1 Gunner's bolt flies at full speed, slows to 40% after 120 units (3 ice streaks trailing), and pops into a small ice ring (radius 30) at 0.8 s after launch; rank 2 lingers until 1.2 s. Without the talent, the bolt is unchanged.
- [ ] Every bolt source drifts the same way (Bolt's volleys, Split's fan, after a Ricochet bounce, Cover's back fan), and the Goo, the bubble, the jabs, the darts, the bite and the ring are unchanged.
- [ ] A drifting bolt hits players at half damage like a normal bolt, and the game is working and playable otherwise.
