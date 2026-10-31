---
id: T0123
title: "Reach: a Goober fork under Goo 2, a thin ice needle at the farthest enemy within 400"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T20:44:19Z
claimed_at: 2026-10-31T20:44:23Z
epic: E28
designer: desktop
---

## Goal
The Goober gets the enemy it can never catch: with the fork, the Goo grows a long arm — a thin ice needle that flies straight at the farthest enemy within 400 — so a Toss holding 400, a Spitter past the Goo's 260, and the dash a 110 u/s Goo never catches are no longer out of reach. First slice of E28.

## Details
- A new weapon `reach` in the Goober tree, a fork under Goo 2, alongside Cling.
- Text (shown on the talent's row): "Every 4.0 s, a thin ice needle at the farthest enemy within 400. 24 damage. Rank 2: two needles at the two farthest, 20 each."
- Talent line: id reach, upgrade reach, max 2, needs `[["goo", 2]]`. No points commitment, no prestige gate.
- How it aims: every 4.0 s, if any enemy (monster or player) is within 400, it fires at the **farthest** one — the opposite of every other weapon, which takes the nearest. Rank 2 fires a second needle at the next-farthest. With no enemy within 400, nothing fires.
- How its shot flies and looks: a new projectile `needle` — a thin elongated drop, a slim teardrop about 14 units long pointed along its flight, ice with an ink outline and a small white glint. Straight, 500 u/s, gone on hit or after 0.8 s. It never turns and never homes: a `path` shot computed at launch (cheap); at rank 2 at most 2 needles per player are alive at once.
- It hits like a normal shot: 24 damage at rank 1 (20 each at rank 2), players at half damage (12/10) like every other weapon — the needle is the Goober's pvp poke, a far first hit on a player before the Goo can close.
- The Goo is unchanged: still the slow homing drop at the nearest within 260. Reach is its long arm, not a second Goo.
- Which mods apply to it, as with any shot: Haste (8% sooner per rank), Quick (15% faster flight per rank), Might (+12% damage per rank), Split (a fanned extra needle at the same farthest target, 12% weaker, as usual), Lance (goes through 1 more enemy per rank). On-hit and on-kill effects run on its hits and kills like on any shot — Reap, Chill, Reckless, Swarm, Leech, and on a kill Chomp, Fang, Adrenaline, Nest, Scavenge and Sting. Guarded to another weapon, they do not touch it: Cling (Goo hits only), Gore and Mend (Nerve jabs only), Drift and Ricochet (bolts only), Fizz and Fuse (the bubble), and Scatter, Gush and Chew fire only when the Goo itself kills — a needle kill lays no puddle and pops nothing.
- look: shape triangle, color #99e9f2.

## Compared with what exists
One row for every weapon:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a straight shot at an enemy | fires a fast stream at the nearest; the needle goes alone, on a slow cadence, at the farthest within 400 — the target that holds its distance |
| Cover | a self-firing shot | a fan of 3 behind you at whatever chases (defensive, prestige-gated, bolts); the needle is a single front line at the farthest, no gate |
| Maw | a self-firing attack | bites everything in front within 85; the needle reaches 400 without touching anything |
| Bellow | a self-firing strike | a ring around you within 80, prestige-gated; the needle is a far single target, no gate |
| Lob | a projectile at the nearest | an arcing bubble that splashes where it lands (a ground zone); the needle is a straight contact hit with no zone, out to 400 |
| Goo | a drop from the same tree | homes at 110 u/s to the nearest within 260 and never reaches a Toss at 400 or a dashing Zippy; the needle flies straight at 500 u/s at the farthest within 400 |
| Nerve | a needle-shaped shot | a close 360° ring of jabs that scales with your missing hp; the needle is a single far-target shot with no ring and no hurt scaling |
| Horn | darts at enemies | darts at every enemy within 150+ (up to 4+, a crowd of close targets); the needle is a single shot at the farthest, out to 400 |
| Slush | flies straight at an enemy | flies past everything and hurts only with its landing puddle, out to 240; the needle hurts on contact, out to 400 |

The tree as the panel will draw it (Goober after this task):
```
Reap (3)
  Goo (3, needs Reap 1)
    Gush (3, needs Goo 1)
      Snare (3, needs Gush 1, points 3, prestige 1)
      Chew (3, needs Gush 3)
    Cling (3, needs Goo 2)
    Reach (2, needs Goo 2)
    Scatter (1, needs Goo 3)
```
What a Goober gets, and what it costs: a point at Goo 2, where it could buy Cling (the splat that rides) instead. Reach instead makes the far enemy reachable — a Toss or Spitter can no longer hold its band for free, and a needle at a player is a first hit the Goo never lands, so the Goober can start the fights it was always too slow for.

## Acceptance criteria
- [ ] The Talents panel's Goober tab shows Reach under Goo, beside Cling, with its text and 2 ranks; it takes a point once Goo 2 is bought.
- [ ] Every 4.0 s, if an enemy is within 400, a thin ice needle flies straight at the farthest one (24 damage) at 500 u/s, gone on hit or after 0.8 s; at rank 2 two needles fly at the two farthest, 20 damage each; with no enemy within 400 nothing fires.
- [ ] A Toss holding 400 and a Spitter past 260 take the needle where the Goo never lands, and a needle at a player deals half damage like every other shot.
- [ ] Haste shortens the needle's cadence, Quick speeds its flight, Might scales its damage, Split fans a third needle at the same farthest (all 12% weaker), and the Goo, the Gush puddle and the Scatter pop are unchanged — a needle kill lays no puddle and pops nothing.
- [ ] The game is working and playable otherwise.
