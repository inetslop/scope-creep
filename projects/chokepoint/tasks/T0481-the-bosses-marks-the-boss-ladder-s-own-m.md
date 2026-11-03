---
id: T0481
title: "The bosses' marks: the boss ladder's own marks under Patterns"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T08:12:52Z
claimed_at: 2026-11-03T08:53:35Z
epic: E26
designer: desktop
---

## Goal
Patterns (the pause's toggle, T0465) makes the board readable by shape alone, but its vocabulary covers only the 10 regular enemies and the towers' barrels: the boss ladder has no marks of its own, so a Patterns player still reads the bosses by color. Give every boss its own mark, and every split child its parent's mark in miniature.

## Details
- A new mark vocabulary for the boss ladder, beside the barrel-marks file (T0469's pattern): one flat muted-ink shape per boss id the wave plans declare — today nine: the Colossus, the Titan, the Orb, the Hive, the crosser (the wave-50 Flyer), the Blinker, the Mender, the Leech and the Gorge; if the Fracture (T0435) has landed by build time it is in the same list. Each shape is distinct from the other bosses' and from all 10 regular-enemy marks and all 16 barrel marks — one shape means one thing across the whole vocabulary.
- While Patterns is on, every boss token wears its own mark on its face, painted the same way a regular enemy token wears its mark (T0465's draw path, the same registry flag; no new toggle — still off by default and remembered in the profile).
- The split children wear their parent's mark smaller: a Shard (the Orb's split) wears the Orb's mark, a Splinter (the Splitter's split) the Splitter's, at about 60% of the parent mark's size, same muted ink, same toggle. The Hive's popped Dots, the Mender's Ward escorts and the Leech's Hauler escorts are regular types and keep their own regular marks, unchanged.
- The bosses reference off the pause (T0277's rows) wears the same marks on its row tokens while Patterns is on, so the reference doubles as the legend; with Patterns off the rows stay plain.
- The marks are display-only: flat muted-ink shapes on the token face — no new rings, colors, HUD, sound or text.

## Acceptance criteria
- [ ] With Patterns on, each boss that spawns (wave 10 and up) wears a flat muted-ink mark on its token face, distinct from every regular-enemy mark and every barrel mark; with Patterns off the boss tokens are exactly as before.
- [ ] A Shard wears the Orb's mark and a Splinter the Splitter's, at about 60% of the size, while Patterns is on; the Hive's Dots, the Mender's Wards and the Leech's Haulers wear their own regular marks.
- [ ] The bosses reference shows marked row tokens while Patterns is on and plain tokens while it is off.
- [ ] A unit test asserts the bijection: every boss id in the ladder has exactly one mark, all distinct, and none equal to a regular-enemy mark or a barrel mark.
