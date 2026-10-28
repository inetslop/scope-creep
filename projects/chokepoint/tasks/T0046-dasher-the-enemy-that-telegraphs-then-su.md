---
id: T0046
title: "Dasher: the enemy that telegraphs, then surges"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T12:01:28Z
claimed_at: 2026-10-28T12:01:49Z
designer: desktop-4070
---

## Goal
A new enemy with a movement no other enemy has — it crawls, pauses with a clear tell, then surges — so a build that only slows can't pin it, and the predictive shot (Lead, T0040) has a real reason to exist.

## Details
- A new enemy, the **Dasher**: a small diamond in purple, clearly distinct from Dot, Dart, Block and Sprinter. Same small size as Dot.
- Behavior (a cycle, on every Dasher): crawl along the road at 50% of Dart's speed for 2.5 s, then stop for 0.5 s to telegraph (its purple shape flashes white twice, 250 ms on / 250 ms off, so the surge is readable coming), then dash 3 cells forward in about 0.3 s, then crawl again. The dash is far faster than any walk (about 10 cells per second).
- hp equal to Dot's hp; kill gold equal to Dot's; leaking one costs 1 life, like everything.
- The telegraph is on the enemy itself (no new HUD element); the surge is a fast slide along the road and it still flashes when struck mid-dash.
- In waves: Dashers start at wave 5 — 1 on wave 5, 2 on wave 6, then +1 every 3 waves after that, capped at 5 in a wave — mixed in with the usual walkers; no wave is made of only Dashers.
- Closest existing enemy: Dart (a fast, constant walker). What is new: the stop-telegraph-dash cycle — burst movement on a timer — which no current enemy does (Sprinter only speeds up when hit and never stops).

## Acceptance criteria
- [ ] A new "Dasher" enemy exists (a small purple diamond, distinct from the other four) and walks the road.
- [ ] From wave 5, a Dasher appears and visibly cycles: a slow crawl, a 0.5 s stop with a white-flash telegraph, then a fast 3-cell surge, repeating.
- [ ] A Dasher has Dot's hp and Dot's kill gold, and leaking it costs exactly 1 life.
- [ ] The surge is faster than Dart's constant walk, and the telegraph always finishes before the surge starts.
- [ ] Waves from wave 5 mix Dashers in (1, then 2, then +1 every 3 waves, cap 5); no wave is all Dashers.
- [ ] A first-time player can read the tell and the surge without any explanation.
