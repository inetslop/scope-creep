---
id: T0093
title: "Frenzy's Nerve gets an attack of its own, not Gunner's straight shot"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T15:20:51Z
claimed_at: 2026-10-31T15:25:51Z
designer: desktop
---

## Goal
Every talent tree has its own identity, and its weapon is the heart of it. Today three trees fire the same thing: a straight dart at the nearest enemy every ~0.8 s (Gunner's Bolt, Frenzy's Nerve, Hive's Horn), and the Nerve and the Horn even look alike (a pale triangle). Frenzy is "thin and mean: the more hurt you are, the harder you hit"; its weapon should play like that.

## Details
- Redesign the Nerve (src/content/upgrades/nerve.ts, its projectile `jab`): how it reaches and hurts enemies is its own and expresses Frenzy's playstyle. Not a straight shot at the nearest enemy, and not a copy of another tree's way (Goo's homing drop, Lob's arcing splash, Maw's bite in front).
- Keep the upgrade id `nerve` and its talent line, so the tree's needs don't change. Talents built on the jab (Gore, T0079, pierce while below half hp) keep working, or the design says exactly how they change with it.
- Its look tells it apart from every other shot (shape and color), in the Critters style.
- The design carries the "Compared with what exists" table from planning/modules/upgrades.md, with a row for every weapon: Bolt, Cover, Nerve today, Horn, Goo, Scatter, Lob, Slush, Maw.

## Acceptance criteria
- [ ] The Nerve no longer fires a straight dart at the nearest enemy.
- [ ] A player of the Frenzy tree attacks in a way no other tree does, and its shot looks like no other.
- [ ] The Nerve's text says what it does and what each rank adds.
