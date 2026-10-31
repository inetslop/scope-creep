---
id: T0096
title: "Twin: a bean that shudders at half hp, births a fast twin, and keeps living"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T15:53:22Z
epic: E20
---

## Goal
The menagerie's kill that doesn't kill: a bean that, the first time its hp drops to half, shudders and gives birth to a small fast twinling and keeps living — a half-kill is a two-kill, and killing it before the threshold (or during the shudder) is a real choice.

## Details
- Two new monsters in src/content/monsters/, each with one import and one registry line in the monsters index. No new projectile, no new area. Closest examples: brood.ts (it too births while alive), puff.ts (it too splits into little critters), and dot.ts for the twinling (a plain chaser with no behavior of its own).
- The bean ("Twin"): a squishy bean — a vertical oval with a small notch at its top, its own draw as the Brood's sac has one. Color: berry — a deep red-pink (#e64980); if T0071 or T0085 has claimed it for a monster, use the one remaining bright warm palette color no other monster uses and record the final hex in a design comment; no two monsters share a color. Rest face: mood calm, 2 eyes, mouth smile.
- The bean's behavior (its think): it chases the nearest player like a Dot. The first time its hp drops to half or below of its max, it stops for a 0.4 s shudder: its face turns scared (2 wide eyes, mouth o) and its body jitters, synced in a slot so every client sees it. If it is still alive after the 0.4 s, it gives birth; a bean killed during the shudder dies normally, with its gem and no twinling. The birth happens at most once per bean.
- The birth: the twinling appears 20 units beside the bean (perpendicular to the bean's line to its nearest player); the bean keeps living with whatever hp it has — the birth costs it nothing.
- The twinling ("Twinling", weight 0 — it only ever comes from a bean's birth): a small bean, the same shape, the bean's color lightened the way the Flee's light red is light, mood angry, 1 eye, mouth o. It chases the nearest player with no behavior of its own (the Dot's default) and can never give birth.
- Numbers — bean: hp 40, speed 70, radius 16, damage 10 per second while touching a player, xp 3, weight 4, fromLevel 4. Twinling: hp 8, speed 110, radius 10, damage 8 per second, xp 1, weight 0, fromLevel 1.
- What it adds to the crowd: at most one twinling per bean, ever — a crowd of beans chipped past half adds one small chaser per bean to the crowd of up to 60.
- What it punishes: the chip — a zone or tick (a Gush puddle, a Goo tick, a bubble splash) that drops a bean past half spawns a second chaser in the middle of the fight. What counters it: the burst — a Maw bite or a focused volley that kills a bean above half never births, and a twinling is 8 hp: any weapon finishes it in a hit or two.

## Acceptance criteria
- [ ] From a level 4 player up, a squishy bean (radius 16, its own warm color, a calm two-eyed smile) appears in the spawn crowds; no other monster shares its color.
- [ ] The bean chases the nearest player; the first time its hp hits half or below of its max it stops for a 0.4 s shudder (scared face, jittering body, visible to every player), then gives birth once and keeps the hp it has.
- [ ] A bean killed during the shudder dies with its normal gem and no twinling; a bean killed above half hp never shudders or births.
- [ ] The twinling appears 20 units beside the bean: a small bean, its color lightened, one angry eye, chasing the nearest player at 110 u/s — faster than any other chaser — and it never gives birth.
- [ ] The twinling is weight 0: it never spawns from the field, only from a bean's birth; a level 1–3 player never sees a bean.
- [ ] In a 60-player match, a crowd of chipped beans adds at most one twinling each, and bean and twinling still drop their gems and pop like any other monster.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | chases the nearest player | the Dot chases until it dies; the Twin keeps living when its own hp hits half — it gives birth once to a fast twin, so a half-kill is a two-kill and a burst before the threshold is a free choice |
| Puff | splits into little critters | the Puff splits into three Dots on its own death and is gone; the Twin's twin is born at half hp, the bean keeps living, and the child is one fast chaser that can never give birth |
| Brood | births while alive | the Brood's births are triggered by you staying close and repeat while you stay (up to 3 Dots); the Twin's birth is triggered by its own damage, happens exactly once, and the twin chases faster than a Dot |
| Sleeper | a face change before it acts | the Sleeper's face change is waking to chase, and it can doze back off; the Twin's shudder is a birth — it cannot be put back to sleep, only aborted by killing the bean in the 0.4 s |
| Zippy | a windup before it acts | the Zippy's windup ends with its own body dashing at you; the Twin does not move during its shudder — what arrives is a second critter beside it, not the bean |
