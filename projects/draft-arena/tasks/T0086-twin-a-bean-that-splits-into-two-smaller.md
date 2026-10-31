---
id: T0086
title: "Twin: a bean that splits into two smaller twins when it drops to half hp"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-31T14:39:38Z
claimed_at: 2026-10-31T14:43:54Z
finished_at: 2026-10-31T15:06:03Z
epic: E20
design_attempts: 1
---

## Goal
A kill that doesn't kill: a bean that chases like a Dot, but the first time it drops to half hp it splits into two smaller, faster twins — finishing a target before the threshold becomes a real choice, and a half-kill is a two-kill.

## Details
- A new monster "Twin" in src/content/monsters/ (closest examples: dot.ts — it chases the same way; puff.ts — it too makes more monsters on a trigger, but only on death). The parent is one file; the small twin is a second file with id "twinlet", weight 0 (weight-0 types don't count against the 10-type cap) and no think — it chases the nearest player on its own and can never split. One registry line for each in the monsters index.
- Look: a bean — an oval body tilted a little (its own draw, as the Flee's teardrop has one). Color: a bright warm palette color no monster and no Toss (T0085) uses once T0071 (in progress) has landed — first pick bright pink (#faa2c1), else bright purple (#e599f7), else any other bright warm palette color still unused; the architect records the final hex in the design. Face: mood angry (the default), 2 eyes, mouth frown; the small twins have the same face.
- Behavior (the parent's think): chase the nearest player, fanned out a little, like a Dot. The new part: when its hp first drops to 50% or below of its max hp, it stops for 0.4 s and shakes — eyes wide, mouth open (synced in its slots, so every client sees it) — then bursts (a small confetti pop, radius 30, reusing the existing pop effect, with the low pop sound) and becomes two small twins at its spot, one to each side.
- The small twin ("twinlet"): radius 11, hp 25, speed 100, damage 8 per second touching, xp 2, the same look; a plain chase; it never splits, not even below half hp.
- Numbers (parent): hp 50, speed 90, radius 16, damage 12 per second touching, xp 4, weight 4, fromLevel 5.
- What it adds to the crowd: a split replaces one with two — the crowd grows by at most one per parent bean, and small twins never split further.
- No gem on the split itself; each small twin drops its own 2 xp gem on death.
- What it punishes: the half-kill — chipping a bean down to half hp doubles it, so burst a big target before the threshold (a Lobber's splash, a Maw's bite) or accept two fast small ones. What counters it: focus one bean and kill it in one burst, or kill the pair quickly (the same total hp, two gems, two fast targets).

## Acceptance criteria
- [ ] From a level 5 player up, a bean (oval body, its color, angry frown) appears in the crowds and chases the nearest player like a Dot; no other monster shares its color.
- [ ] A hit that drops the parent to 50% or below of its max hp stops it for 0.4 s (eyes wide, mouth open, shaking — visible to every player), then a confetti pop and it becomes two small twins (radius 11, faster than the parent) at its spot; no gem on the split.
- [ ] Each small twin chases, takes damage and dies normally with its own 2 xp gem; a small twin below half hp never splits.
- [ ] The crowd grows by at most one per parent bean (two replace one; no further splitting).
- [ ] A level 1–4 player never spawns a bean; in a 60-player match the windup, the pop and the small twins read the same for every player.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Puff | bursts into more monsters on a trigger | the Puff pops on death, into three Dots, every time it dies; the Twin splits at half hp, into two smaller versions of itself, once — a half-kill multiplies it, not a kill |
| Brood | adds monsters to the crowd | the Brood keeps birthing Dots on a timer for as long as it lives; the Twin splits once, at a threshold of its own hp, and its twins can never split again |
| Dot | chases the nearest player | the Twin chases the same way, but its fight changes at half hp: what ends a Dot can double the Twin |
| Zippy | a face change before it acts | the Zippy's windup warns of a dash you can dodge by moving; the Twin's windup ends in a split you can't dodge — moving only helps you get out of the pop |

## Rejected by architect (cachyos-x8664)

the split must remove the parent and the only removal path is monster death, which unconditionally drops a gem worth def.xp (engine/sim/match.ts:766) — with xp 4 the split always drops a gem, so "no gem on the split" cannot be built without an engine change (a despawn/transform API or suppression of the death gem).
