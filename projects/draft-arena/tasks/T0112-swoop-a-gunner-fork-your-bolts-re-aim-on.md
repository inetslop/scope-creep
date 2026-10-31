---
id: T0112
title: "Swoop: a Gunner fork, your bolts re-aim once at 200 units and fly a second leg"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T18:10:25Z
claimed_at: 2026-10-31T18:26:32Z
epic: E24
designer: desktop
---

## Goal
A Gunner's miss still finds its target: with the fork, a bolt that has flown 200 units re-aims once at the enemy it was fired at and flies a straight second leg — the target that moved during the first leg is still caught, and the kite's hard cut is the dodge. Second slice of the Gunner's growth (E24), the other fork under Bolt 2.

## Details
- A new weapon-behavior mod `swoop` in the Gunner tree, a fork under Bolt 2, alongside Split and Drift.
- Text (shown on the talent's row): "At 200 units, your bolt re-aims at the enemy it was fired at and flies a straight second leg of 160 units. Rank 2: 240 units."
- Talent line: id swoop, upgrade swoop, max 2, needs `[["bolt", 2]]`. No points commitment, no prestige gate.
- How a swooping bolt flies and looks: straight at full speed for 200 units; if its target is still alive, the star stops spinning for 0.15 s and points nose-down (the telegraph — a player sees the bolt about to turn), then it flies a straight second leg of 160 units (rank 2: 240) at full speed toward where the target is at the moment of the turn. It never turns again: the dodge is a sharp cut right as the bolt nose-dips. A bolt that hits, dies, or whose target is already dead before 200 units never swoops.
- Many bolts are alive at once: at most ~12 per player (Bolt 6 with Split 2 at Haste 3); the re-aim happens once per bolt, so it stays cheap.
- With every weapon that fires bolts: Bolt (every bolt of its volleys swoops at its own target), Split (the fanned bolts each swoop at the enemy they were aimed at), Lance (a swooping bolt still goes through on its legs), Ricochet (a bolt that bounces flies its full 200 units before it swoops, on its new line), Cover (the back fan swoops at whatever chases — the rear line finds the kiter that cut).
- Not bolts, no effect: the Goo, the bubble, the Nerve's jabs, the Horn's darts, the Maw's bite and the Bellow's ring are unchanged — their motion is their own.
- With Drift (a life can buy both): a bolt flies fast for 120 units, drifts to 200, then swoops at full speed for its second leg — the committed line: slow, then fast, on target.
- Players: a swooping bolt hits a player at half damage like every other bolt (the pvp damageMul) — it finds players that cut back across the line too.
- look: shape diamond, color #ffd43b.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Goo | a shot that turns toward its target in flight | The Goo is its own weapon: a big slow drop that keeps turning to the nearest enemy until it dies; Swoop is your Bolt: a fast star that turns once, at 200 units, at the enemy it was fired at, and keeps straight after |
| Drift (T0111, this epic) | a Gunner bolt mod that changes the flight | Drift slows the bolt on its line; Swoop turns it toward a target that moved — and the two stack into a drift-then-swoop bolt |
| Quick | changes how bolts fly | Quick makes every shot faster, all the time, with every weapon; Swoop adds a turn to the Bolt's flight, at one point of it, and only for bolts |
| Lance | a mod for bolts | Lance adds a pierce to the bolt; Swoop adds a turn to the flight — a bolt can go through and swoop at once |
| Split | a mod for bolts (and every weapon) | Split adds shots; Swoop changes how each shot flies — a fanned swoop is a fan that still finds its targets |
| Ricochet | a Bolt capstone about its flight | Ricochet reacts to a hit (a bounce on to another enemy); Swoop changes the flight with no hit at all |

The tree as the panel will draw it (Gunner after this task):
```
Haste (3)
  Bolt (5, start 1, needs Haste 1)
    Split (2, needs Bolt 2)
    Drift (2, needs Bolt 2)
    Swoop (2, needs Bolt 2)
    Ricochet (1, needs Bolt 4)
    Cover (3, needs Bolt 2, points 3, prestige 1)
Lance (2)
```
What a Gunner gets, and what it costs: a point at Bolt 2, where it could buy Split (one more bolt) or Drift (the lingering line). Swoop instead makes the aimed shot find a moving target — the kite's hard cut is the only dodge, and a player who sees the nose-dip turns with it, so a Gunner's volleys stop being free to sidestep.

## Acceptance criteria
- [ ] The Talents panel's Gunner tab shows Swoop under Bolt, beside Split and Drift, with its text and 2 ranks; it takes a point once Bolt 2 is bought.
- [ ] A rank-1 Gunner's bolt flies straight for 200 units, its star stops spinning and points nose-down for 0.15 s, then flies a straight second leg of 160 units toward where the target was at the turn (rank 2: 240); it never turns again, and a bolt with no live target at 200 units never swoops.
- [ ] Every bolt source swoops the same way (volleys, the Split fan, after a Ricochet bounce, the Cover back fan), the Goo, the bubble, the jabs, the darts, the bite and the ring are unchanged, and a life with both forks fires a bolt that drifts to 200 and then swoops.
- [ ] A swooping bolt hits players at half damage like a normal bolt, and the game is working and playable otherwise.
