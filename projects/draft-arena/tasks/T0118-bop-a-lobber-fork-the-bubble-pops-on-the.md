---
id: T0118
title: "Bop: a Lobber fork, the bubble pops on the critter it touches"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T19:30:37Z
claimed_at: 2026-10-31T19:38:26Z
epic: E27
designer: inet-racing
---

## Goal
Today the bubble only hits the ground, where it lands. Bop gives the Lobber a second aim: a bubble that pops on the critter it touches, a direct burst on the target instead of a splash on the floor — a kill-shot the Lobber can snipe through a crowd, and the Lobber's answer to the Flee, the critter that outruns the splash.

## Details
- **Bop is a projectile change for your bubble**, built the way Drift and Swoop rebuilt the bolt (a new projectile that keeps the bubble's arc flight and adds its behavior; the Lob's fire gives the bubble Bop when you have it).
  - **A Bop bubble that touches a critter (monster or player) pops on it:** a burst at the hit point — radius 35, 14 damage (rank 1); per rank: +5 damage, +5 radius (rank 2: 19 damage, 40; rank 3: 24 damage, 45). Players at half, as with all your hits. **No splash where it popped.**
  - **A Bop bubble that touches no critter splashes where it lands, exactly as a normal bubble does** (Wide, Fuse, Fizz and the rest apply to that splash as usual).
  - The burst scales with your damage stat (Might, Frenzy, Split's 12% cut), and the burst's strike counts as one of your hits: on-hit upgrades apply to it as to any of your hits (the ones that guard on a specific projectile simply don't fire).
  - A popped bubble dies on the first critter it touches, so pierce (Lance) does nothing for it.
  - **Kills:** a popped bubble's kill is your kill — every on-kill upgrade pays out on it (Chomp, Nest, Sting, Scavenge, Adrenaline, Fang). Fuse, Gush, Chew and Scatter are Goo/splash specific and do not fire on a pop.
  - If Fizz (T0116) has landed by build time: a popped bubble leaves no splash, and so nothing for Fizz to linger there.
- **Look:** a Bop bubble wears a **thin white band** around it in flight (a lollipop's band) so a player sees before it lands which bubbles pop and which splash; on pop, a small white burst ring (an ice ring with an ink rim, blooming to the burst radius) and teal confetti where it hit. A normal bubble is unchanged.
- **Talent line (Lobber tree, planning/modules/talents.md):** id `bop`, upgrade `bop`, max 3, needs `[["lob", 3]]` — the fork under Lob beside Wide: Wide grows the splash, Bop aims the bubble at the critter itself.
- **Text:** "Your bubble pops on the critter it touches: a burst (radius 35) for 14 damage where it hits, no splash there. Per rank: +5 damage, +5 radius. A bubble that touches nothing splashes where it lands."
- **Mods, for the bubble (the only weapon it touches):** Quick flies it faster, Haste fires it sooner, Split fans out extra bubbles and each of them pops on a critter (all 12% weaker), Wide sizes only the splash of a bubble that missed, and the damage stat scales the burst. It does nothing for any other weapon.

## Compared with what exists
Bop changes how a projectile flies (the same kind as Drift), so one row for that kind and for every similar upgrade named above. Swoop (T0112) and Fizz (T0116) are being built in the same window as this task: keep their rows even if either has not landed yet, and re-check the difference against the game if either has.

| Existing | What it shares | What Bop does that it can't (not numbers) |
| --- | --- | --- |
| Drift | rewrites how the tree's shot flies | slows your bolts along their line and lets them linger; Bop's bubble stops on the first critter it touches instead of the ground |
| Swoop | rewrites how the tree's shot flies | re-aims a bolt once at the end of its path and flies a second leg; Bop never re-aims — the bubble dies on the first critter it touches |
| Wide | sizes your splash | makes the splash where the bubble lands bigger; Bop removes the splash where the bubble pops |
| Fuse | a reaction to your bubble's kills | pops a ring where a bubble killed; Bop's kill comes from a burst on the critter, and a popped kill still fires Fuse |
| Slush | a Lobber shot that flies straight | leaves a slow puddle where it lands; Bop's burst is a one-shot on the critter it touches, with no zone |
| Fizz | makes the Lobber's ground last | lingers the splash and keeps striking it; Bop's popped bubble has no splash for Fizz to linger |
| Split | more, weaker shots for every weapon | fans out extra bubbles — with Bop, each of them pops on the critter it touches, so the fan becomes a pop-fan |

## Acceptance criteria
- [ ] A player with Bop: a bubble that touches a critter pops on it — a burst (radius 35, 14 damage at rank 1) at the hit point, no splash where it popped.
- [ ] Rank 2: 19 damage, radius 40; rank 3: 24 damage, radius 45.
- [ ] A Bop bubble that touches no critter splashes where it lands exactly as a normal bubble (Wide and Fuse apply to that splash).
- [ ] A Bop bubble wears a thin white band in flight; a player without Bop sees no banded bubbles.
- [ ] On pop: a white ice ring blooming to the burst radius and teal confetti at the hit point.
- [ ] A popped bubble's kill pays Chomp/Nest/Sting/Scavenge as your kill.
- [ ] With Split, every fanned bubble pops on the critter it touches, all 12% weaker.
- [ ] Bop is in the Lobber tab as a 3-rank fork under Lob (needs Lob 3), with the text above.
