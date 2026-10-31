---
id: T0124
title: "Snap: a Frenzy fork under Nerve 2, a red burst on a player knockout while below half"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T20:44:19Z
claimed_at: 2026-10-31T20:50:18Z
epic: E28
designer: desktop
---

## Goal
The Frenzy's player kill becomes a moment: with the fork, knocking out a player while below half hp bursts the spot red — the wound that already makes the Frenzy hit harder now makes its kills punish whatever stands around the corpse. The Frenzy's slice of E28 (the Goober's is T0123).

## Details
- A new on-kill `snap` in the Frenzy tree, a fork under Nerve 2 alongside Adrenaline and Fang — the third kill-while-hurt payoff: a kill while hurt can pay speed (Adrenaline), coins (Fang) or the burst.
- Text (shown on the talent's row): "On a player knockout while below half your hp: a burst (radius 110) for 15 damage. Rank 2: 25."
- Talent line: id snap, upgrade snap, max 2, needs `[["nerve", 2]]`. No points commitment, no prestige gate.
- How it fires: when the player knocks out another player (human or bot, any level) while below half their own max hp, a burst strikes everything within 110 of the corpse (monsters and players alike) except the killer: 15 damage at rank 1, 25 at rank 2. A monster kill never bursts, and a knockout while at half hp or above never bursts.
- The burst is its own damage: it is a payoff, not a hit — Might, Reap and the other damage mods do not scale it (a rank-1 burst deals 15 even on a half-dead target).
- What it does to a player inside: half damage, like every other strike on a player (7 at rank 1, 12 at rank 2) — the burst is how a Frenzy trades one knockout for a second, and a hurt Frenzy is the one to fear at the crown's fall, the mark's end or a corpse gem.
- How it looks: a new effect `snap-burst` at the corpse — a red ring with an ink rim blooming out to 110 over 0.4 s, with about 20 red confetti pieces off it. The closest example is `src/content/effects/sting-burst.ts` (the same shape, teal to red); register the new effect in `src/content/effects/index.ts`.
- look: shape star, color #ff6b6b.

## Compared with what exists
One row for every on-kill:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Chomp | a kill payoff | heals the killer (5 hp, 25 on a player); Snap hurts whatever stands around the corpse — the Frenzy trades its wound for a strike, not a heal |
| Adrenaline | a kill while below half your hp | gives speed to leave (a 20% sprint for 1.5 s); Snap stays put and strikes a 110 circle, so the kill is a doorway, not an exit |
| Fang | a kill while below half your hp | banks coins from any kill (a long save); Snap is a burst in the moment, and only on a player knockout |
| Fuse | a kill by your own weapon | pops only when the bubble kills (Lobber-guarded, a 50 ring); Snap fires on any player knockout while you are below half, whatever weapon got the kill |
| Scatter | a kill by your own weapon | pops only when the Goo kills, into four seekers; Snap is a single red burst that strikes once and is gone |
| Gush | a kill by your own weapon | lays a slow puddle where a Goo kills (a zone that lingers); Snap's burst strikes once and leaves nothing on the ground |
| Chew | a kill by your own weapon | the Gush puddle it guards ticks for as long as it lasts; Snap is one instant 15/25 with no zone |
| Nest | a kill payoff | heals the killer per critter near a monster corpse (sustain); Snap strikes per critter inside 110 (offense), on a player kill |
| Sting | a kill burst | bursts only when the kill is crowded (2+ critters within 80, a radius-80 burst); Snap bursts on any player knockout while you are below half — the crowd is not the trigger, your wound is |
| Scavenge | a kill payoff | pays xp per critter near a monster corpse (the draft); Snap pays damage to whatever stands in the burst (the fight) |

The tree as the panel will draw it (Frenzy after this task):
```
Frenzy (3)
  Nerve (3, needs Frenzy 1)
    Adrenaline (2, needs Nerve 2)
    Fang (2, needs Nerve 2)
    Gore (2, needs Nerve 2, points 3, prestige 1)
    Snap (2, needs Nerve 2)
    Mend (3, needs Nerve 3)
    Reckless (1, needs Nerve 3 and Frenzy 3)
```
What a Frenzy gets, and what it costs: a point at Nerve 2, where it could buy Adrenaline (the escape sprint) or Fang (the coin branch) instead. Snap instead makes the dive pay in the moment: a Frenzy that takes a marked or crowned player while below half bursts the pursuers around the corpse, so the kill that ends a life can start a double.

## Acceptance criteria
- [ ] The Talents panel's Frenzy tab shows Snap under Nerve, beside Adrenaline and Fang, with its text and 2 ranks; it takes a point once Nerve 2 is bought.
- [ ] A Frenzy below half hp that knocks out a player sees a red ring with an ink rim bloom out to 110 with red confetti at the corpse, and everything inside takes 15 damage (rank 2: 25), the killer unaffected; a player inside takes half (7/12).
- [ ] A monster kill never bursts and a knockout while at half hp or above never bursts; the burst is not scaled by Might or Reap (a rank-1 burst still deals 15 on a half-dead target).
- [ ] The game is working and playable otherwise.
