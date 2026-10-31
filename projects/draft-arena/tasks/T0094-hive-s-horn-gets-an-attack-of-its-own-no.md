---
id: T0094
title: "Hive's Horn gets an attack of its own, not Gunner's straight shot"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T15:20:51Z
claimed_at: 2026-10-31T15:31:01Z
designer: desktop
---

## Goal
Every talent tree has its own identity, and its weapon is the heart of it. Today three trees fire the same thing: a straight dart at the nearest enemy every ~0.8 s (Gunner's Bolt, Frenzy's Nerve, Hive's Horn), and the Horn and the Nerve even look alike (a teal or pale triangle). Hive is "the crowd is your weapon: the more around, the harder you hit"; its weapon should play like that.

## Details
- Redesign the Horn (src/content/upgrades/horn.ts, its projectile `horn`): how it reaches and hurts enemies is its own and expresses Hive's playstyle (it is about crowds). Not a straight shot at the nearest enemy, and not a copy of another tree's way (Goo's homing drop, Lob's arcing splash, Maw's bite in front).
- Keep the upgrade id `horn` and its talent line, so the tree's needs don't change. Hive talents built on it keep working, or the design says exactly how they change with it.
- Its look tells it apart from every other shot (shape and color), in the Critters style.
- The design carries the "Compared with what exists" table from planning/modules/upgrades.md, with a row for every weapon: Bolt, Cover, Nerve, Horn today, Goo, Scatter, Lob, Slush, Maw.

## Acceptance criteria
- [ ] The Horn no longer fires a straight dart at the nearest enemy.
- [ ] A player of the Hive tree attacks in a way no other tree does, and its shot looks like no other.
- [ ] The Horn's text says what it does and what each rank adds.
