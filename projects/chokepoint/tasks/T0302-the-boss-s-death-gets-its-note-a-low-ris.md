---
id: T0302
title: "The boss's death gets its note: a low rising horn under the burst"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T19:42:22Z
claimed_at: 2026-10-30T19:42:44Z
designer: yoga
---

## Goal
The run's loudest kill gets its own note: the moment the run's boss dies, one low rising horn answers the arrival's deep horn (T0268), so the wave-10/20/30 peak is heard, not just seen (pillar 5).

## Details
- One new method in `src/audio/Sfx.ts`, next to the boss's own notes (the arrival horn and `bossOut()`): `bossDown()` — three 120 ms sine notes rising G2→B2→D3 (98 → 123 → 147 Hz), 60 ms apart, volume 0.15, sequenced with `tone()`'s existing delay parameter (the sting's pattern, T0091).
- The low register is the boss horns' own (the arrival and the boss-leak horn, T0268/T0269, sit at 62–82 Hz). The small two-note E5→G5 rise — the coin chime (T0009), the wave sweep (T0240), the streak pay (T0290), the record note (T0296) — stays for small payouts; three low notes mark this as the run's biggest moment.
- One line in `src/systems/enemyHooks/bossDeath.ts`: the horn plays at the exact moment that hook already fires — the same beat as the 24-chip burst and the name card (T0273). For the Orb (wave 30) that beat is its half-hp split; for the Colossus (wave 10) and the Titan (wave 20) it is their kill.
- No HUD, no board mark, no pause-screen line: a note, not a control (the T0255 and T0284 precedent). Silent with the sound toggle off (T0035), like every Sfx note.
- Real time, not the simulation clock: at 2× fast-forward (WaveSpeed) the horn plays once per boss death, never stretched.
- Iron runs wear the same horn (the muted star, T0249, is visual only).
- The arrival horn (T0268), the out-of-reach note (T0284), the boss-leak horn (T0269) and the wave sweep (T0240) are untouched. Future bosses (the wave-40 Hive, T0292) inherit the note through the same hook.
- No unit test: Sfx is a browser output, verified by the smoke test and by ear (the T0296 precedent).

## Acceptance criteria
- [ ] Killing the Colossus (wave 10), the Titan (wave 20) or the Orb (wave 30, at its split) plays one low rising horn — three ~120 ms notes G2→B2→D3 (98/123/147 Hz), 60 ms apart, volume 0.15 — at the same moment as the 24-chip burst and the name card, once per boss death.
- [ ] Ordinary enemy deaths — Dots, Blocks, a Guard dying while the Titan lives, the Orb's two Shards, a Splitter's splinters — play no new sound.
- [ ] The arrival horn, the out-of-reach note, the boss-leak horn and the wave sweep are unchanged, and with the sound toggle off the boss death is silent.
- [ ] At 2× fast-forward the horn plays exactly once per boss death, in real time.
