---
id: T0277
title: "The bosses reference: the boss encounters, off the pause"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T10:09:05Z
epic: E5
---

## Goal
A first-time player should know what walks in at wave 10, 20 and 30 before it does: off the pause, a "Bosses" row (with the Enemies and Waves references, T0252 / T0264) opens a scene that lists the boss encounters in wave order — each with its on-board token, its name, its wave and its trick in the preview's own teach language (T0092) — so the run's peaks are read where every other "what is this" is read.

## Details
- **The row (the pause card):** a "Bosses" button row styled exactly like the existing "Enemies" (T0252) and "Waves" (T0264) rows — same size, same tap target, a matching line on the controls list. It opens the scene over the dimmed pause (their pattern); the back control returns to the pause. Nothing else on the pause changes.
- **The scene (a new file, the EnemiesScene / WavesScene pattern):** one white card, the boss encounters in wave order, one row each: the boss's on-board token (its def's own shape / color / size, T0252's rendering), its name, its wave number, and its trick as one plain line in the preview's teach wording. Read from the boss defs and the every-10 wave rule (core/waves), never hard-coded ids, so the list stays honest as the bosses grow.
- **The bosses, today:** the Colossus (wave 10) — "at half health it is out of reach for a beat, again every 8 s"; the Orb (wave 30) — "at half health it splits into two Shards that keep walking." The scene lists only the bosses that have a def, so today it shows two rows; the second boss (T0259's Titan and its Guard, wave 20) has no def yet and joins as a third row with no change to this file when T0259 lands.
- **The split with what already shows:** the Enemies reference is a flat index of all 14 (a "what walks" list); the Waves reference says a boss comes every 10th (timing, no name, no trick). This is the encounter-prep view — only the bosses, in order, each with its trick — the "what am I walking into at wave 10 / 20 / 30" a first-time player looks for. It is a reference card like the three that already are, not a new on-board readout.
- **Why it matters now:** the Colossus (wave 10) and the Orb (wave 30) already send today, so both rows are live in the game as it is; right now a player meets the run's biggest shapes knowing only the name chip (T0085) and the "boss" tag (T0257), and has to dig through the 14-row Enemies index to learn the trick.

## Acceptance criteria
- [ ] The pause card has a "Bosses" row styled like the Enemies and Waves rows, with a matching line on the controls list; tapping it opens a dimmed-pause white card and the back control returns to the pause.
- [ ] The scene lists, in wave order, one row per boss that has a def — today the Colossus (wave 10) and the Orb (wave 30) — each showing its on-board token, its name, its wave, and its trick as one plain line ("out of reach at half health, again every 8 s" / "splits into two Shards at half health").
- [ ] The rows are read from the boss defs and the every-10 rule (no hard-coded ids): a new boss def gains a row with no edit to this scene, and the not-yet-built second boss adds no broken row.
- [ ] No in-game HUD element, key, sound or on-board readout is added; the Enemies and Waves references, the boss card (T0256), the "boss" preview chip (T0257) and the pause card's other rows are unchanged.
- [ ] The new card and the pause card with the new row fit at 412x915 and 1280x720.
