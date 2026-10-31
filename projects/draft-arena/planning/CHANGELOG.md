# Changelog

What has been built, newest last. The runner appends a line for every finished task;
the PO reads this instead of the code.
- T0001 Lance: bolts that go straight through a line of monsters (desktop-4070, 2026-10-31): Added the Lance upgrade (`src/content/upgrades/lance.ts`), a pure stat mod giving pierce +1 per rank (maxLevel 2) so a Gunner's Bolt passes straight through 1 more enemy per rank at full damage — registered in `src/conte
- T0002 Puff: a purple pentagon that pops into three Dots (yoga, 2026-10-31): Added the Puff monster (src/content/monsters/puff.ts): a slow (50 u/s), tanky (hp 45) purple pentagon with a calm one-eyed face that spawns from player level 3 (weight 4 vs the Dot's 10) and pops into three Dots on death
- T0006 Chomp: a Body capstone, heal on kill (yoga, 2026-10-31): The Body tree gets its capstone, Chomp: killing a monster heals the killer 5 hp (up to max) and knocking out a player heals 25, on top of the knockout's xp and score, so a tank that stands in the crowd eats its way back.
- T0005 Zippy: a pink triangle that winds up and dashes (cachyos-x8664, 2026-10-31): Added the Zippy monster — a pink triangle that crawls at 60 u/s, then within 260 of a player stops for a 0.8 s wind-up (squashed flat, angry face, a 30-unit pink lane line) before dashing straight along that fixed lane a
- T0007 Maw: a bite that eats everything in front of you (desktop, 2026-10-31): The Body tree gets its weapon Maw: a new `maw` weapon upgrade (hexagon/ice, 0.9 s cooldown, 5 ranks, needs Might 2) that lays a new `bite` ground area (75-unit ice crescent, 0.2 s, single strike) 55 units in front of the
- T0009 Hide: take less damage, a second fork under Vigor (yoga, 2026-10-31): Added the Hide upgrade (`src/content/upgrades/hide.ts`), a defensive stats mod giving +10 armor per rank (max 3, "Take 10% less damage, per rank.", green hexagon), registered it in `UPGRADES`, and added its talent line u
