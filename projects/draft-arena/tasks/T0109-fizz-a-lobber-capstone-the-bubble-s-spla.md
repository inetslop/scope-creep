---
id: T0109
title: "Fizz: a Lobber capstone, the bubble's splash lingers and keeps striking"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T17:49:52Z
epic: E23
---

## Goal
The Lobber's zone capstone beside Fuse: the committed Lobber's base splash stops being a one-shot — every bubble lingers where it lands and keeps popping, so kiting leaves a trail of ice that the crowd has to thread.

## Details
- Name "Fizz", a capstone (`maxLevel: 1`) in the Lobber tree. New file `src/content/upgrades/fizz.ts`, registered in `src/content/upgrades/index.ts`.
- Talent line in `src/content/talents/lobber.ts`: id `fizz`, upgrade `fizz`, max 1, needs `[["lob", 4]]`, no points requirement (the same depth as Fuse, beside it). The tree as the panel draws it:
  ```
  Quick (3)
    Lob (5, needs Quick 1)
      Wide (3, needs Lob 2)
      Fuse (1, needs Lob 4)
      Fizz (1, needs Lob 4)
      Slush (3, needs Lob 1, points 2, prestige 1)
  ```
- Text on the panel: "Your bubble's splash lingers 2.5 s and strikes everything inside every 0.5 s for 3 damage."
- Exact numbers: the splash's initial damage is unchanged (Lob's). Where the bubble's splash lands, a fizz-field is laid in place of the one-shot splash: radius the same as the splash (so Wide makes it bigger), lasting 2.5 s, striking everything inside every 0.5 s for 3 damage (monsters and players alike; like every weapon of yours, half damage to other players). No slow — a critter in the fizz-field is not slowed (that is Slush's puddle).
- How it is laid: the fizz-field goes where the splash already lands, the way the chew-puddle is laid in the same spot as the plain Gush puddle (the Goober tree's Chew, in the changelog): the same trigger, a different field. New field `src/content/areas/fizz-field.ts` (and its registration); the one-shot splash stays exactly as it is for players without Fizz.
- Look: a short ice field like the splash (`src/content/areas/splash.ts` is the closest example) that keeps popping: on each strike, a small ice bubble pops off it (a small new effect in the style of `src/content/effects/slow-pop.ts`, which is a small ice pop). Cool colors only (ice/teal), candy look, ink rim, no glow — a player reads "still popping" at a glance, and tells it apart from a Slush puddle by the pops and the lack of slow.
- A mod for every weapon: Fizz changes only Lob's bubble, the way Chew changes only the Gush puddle and Mend only a Nerve hit; it does nothing with every other weapon, and that is fine — it is the Lobber's zone branch.
- What a player of Lobber gets: a second capstone under Lob 4 to choose against Fuse — a kill reward (a ring where your bubble kills) or a standing zone (every splash lingers). With Haste and Quick the lobbies come faster and the fizz-fields overlap, so a kiting Lobber leaves a trail of popping ice behind them.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Fuse | a Lobber capstone that changes the bubble's end | Fuse's ring comes only from a bubble kill and strikes once; Fizz's field comes from every splash that lands and strikes every 0.5 s for its whole 2.5 s |
| Ricochet | a capstone that changes how a shot ends | Ricochet bounces the bolt on to a second enemy; Fizz changes the ground, not the shot |
| Reckless | a capstone that changes how hits land | Reckless doubles your damage while you are hurt; Fizz changes what your splash does, always |
| Chomp | a capstone | Chomp heals you on a kill; Fizz is a zone, not a reward on a kill |
| Scatter | a capstone that changes what a kill leaves | Scatter's mini-Goo come from a Goo kill and home; Fizz's field comes from every splash, no kill needed |
| Sting | a capstone that changes what a kill leaves | Sting's burst comes from a kill in a crowd; Fizz's field comes from the splash itself |
| Lob | the splash comes from your bubble | Lob's splash strikes once where the bubble lands; Fizz makes every splash linger and strike again |
| Wide | scales the same splash | makes the splash bigger, still one strike; Fizz's field takes the splash's size (Wide applies) and adds the linger |
| Slush | a lingering field that strikes on a tick | Slush is a separate prestige-gated weapon that flies past the enemy and its puddle slows; Fizz is the base splash itself, an arc at the enemy, damage only |
| Chew | a puddle that strikes every 0.5 s | Chew's puddle is laid by a Goo kill in the Goober tree; Fizz's field is laid by every Lob splash |
| Gush | a puddle where a kill happens | Gush's puddle slows and is laid by a Goo kill; Fizz's field is a damage zone laid by a splash, no kill needed |

## Acceptance criteria
- [ ] Fizz shows in the Lobber tab beside Fuse with the text above, 1 rank, needing Lob 4.
- [ ] With Fizz, a bubble that lands leaves a fizz-field the size of the splash that strikes everything inside every 0.5 s for 3 damage for 2.5 s, on top of the normal splash damage.
- [ ] A monster standing in the fizz-field takes the repeated strikes (its hp drops in ticks while it stands still); a critter in it is not slowed.
- [ ] Wide makes the fizz-field as much bigger as it makes the splash; other weapons are unaffected by Fizz.
- [ ] The fizz-field reads as a popping ice patch (a small ice pop on each strike), distinct from the one-shot splash and from a Slush puddle.
- [ ] A player without Fizz has the unchanged one-shot splash, and the game stays playable with a fresh nomad build.
