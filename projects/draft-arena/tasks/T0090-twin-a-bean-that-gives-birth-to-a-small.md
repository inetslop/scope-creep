---
id: T0090
title: "Twin: a bean that gives birth to a small fast twin the first time it drops to half hp"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T15:16:30Z
epic: E20
---

## Goal
A kill that doesn't end: a bean that chases like a Dot, but the first time a hit drops it to half hp it shakes and gives birth to one small, fast twin — and keeps living. Finishing a target before the threshold is a real choice: burst it for one gem, or chip it down and face two targets, one of them faster than the parent.

## Details
- A new monster "Twin" in src/content/monsters/ (closest examples: dot.ts — it chases the same way; brood.ts — it too adds monsters to the crowd, but on a timer, not on a hit). The parent is one file; the small twin is a second file with id "twinlet", weight 0 (weight-0 types don't count against the 10-type cap) and no think — a plain chase, it never gives birth. One registry line for each in the monsters index.
- Look: a bean — an oval body tilted a little (its own draw, as the Flee's teardrop has one). Color: bright pink (#faa2c1) if that palette entry is free (check the palette and every monster look, including the Toss's once T0085 has landed), else any other bright warm palette color no monster uses, adding one to the palette if none is left; the architect records the final hex in the design; no two monsters share a color. Face: mood angry (the default), 2 eyes, mouth frown; the small twin has the same face.
- Behavior (the parent's think): chase the nearest player, fanned out a little, like a Dot. The new part: the first time its hp drops to 50% or below of its own max hp, it stops and shakes for 0.4 s — eyes wide, mouth open (synced in its slots, so every client sees it) — then it gives birth to one small twin beside it, pushed a few units to its side so it doesn't sit inside the parent. The parent does not die on the birth: it stays at half hp, the same size and speed, and resumes chasing. If a monster's think can spawn a client effect (the closest example: the geyser director's bubbles), a small confetti pop (reusing the existing pop effect, value 30) marks the birth; if it can't, the birth reads on the shake and the twin appearing.
- The small twin ("twinlet"): radius 11, hp 25, speed 100, damage 8 per second touching, xp 2, the same look; a plain chase; it never gives birth, not even below half hp.
- Numbers (parent): hp 50, speed 90, radius 16, damage 12 per second touching, xp 4, weight 4, fromLevel 5.
- What it adds to the crowd: at most one small twin per parent bean, born once; no further births of any kind.
- What it punishes: the chip-kill — chipping a bean to half hp earns you a fast small twin on top of the half-dead parent, so a build that shreds targets slowly (a Gunner kiting at range) pays for it. What counters it: a burst that finishes a bean before half hp (a Maw bite, a bubble splash, a full Horn volley), or quick focus on the pair once the birth has happened.

## Acceptance criteria
- [ ] From a level 5 player up, a bean (oval body, its color, angry two-eyed frown) appears in the spawn crowds and chases the nearest player like a Dot; no other monster shares its color.
- [ ] The first hit that drops the parent to 50% or below of its max hp stops it for 0.4 s (eyes wide, mouth open, shaking — visible to every player), then one small twin (radius 11, faster than the parent) appears beside it; the parent keeps living at half hp, the same size and speed, and resumes chasing; no gem on the birth.
- [ ] The parent gives birth at most once in its life: later hits below half hp do nothing new.
- [ ] Each small twin chases, takes damage and dies normally with its own 2 xp gem; a small twin never gives birth, even below half hp.
- [ ] A level 1–4 player never spawns a bean; in a 60-player match the shake and the birth read the same for every player, and the crowd grows by at most one per bean.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Puff | bursts into more monsters on a trigger | the Puff pops on death, into three Dots, every time it dies; the Twin births at half hp, once, into one small fast version of itself, and keeps living |
| Brood | adds monsters to the crowd while it lives | the Brood keeps birthing Dots on a timer for as long as it lives; the Twin gives birth once, at a threshold of its own hp — a reaction to a hit, not a clock |
| Dot | chases the nearest player | a hit ends a Dot; a hit that drops the Twin to half hp changes the fight — one target becomes two, one of them faster than the parent |
| Zippy | a face change before it acts | the Zippy's windup ends in a dash you can dodge by moving; the Twin's shake ends in a birth you can't dodge — moving only helps you escape the fast small twin |
| Flee | a small fast chaser in the crowd | the Flee sprints away from you; the small twin runs at you, and it is born from the player's own hits |
