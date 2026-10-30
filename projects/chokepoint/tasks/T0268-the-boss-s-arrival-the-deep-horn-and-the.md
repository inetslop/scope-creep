---
id: T0268
title: "The boss's arrival: the deep horn and the gate pulse"
size: M
priority: 2
status: design
depends_on: [T0253]
attempts: 0
created: 2026-10-30T08:43:10Z
epic: E5
---

## Goal
The run's peak should be felt the moment it begins, not after you have read the name: the instant the boss walks in, a deep horn plays and the entrance gate pulses, so the arrival is a moment the way the death already is (T0258) — E5's "the boss's arrival is a moment too (a deep horn and a pulse at the gate)".

## Details
- **Who triggers it:** the enemy the current boss wave's plan declares as its boss — T0253's `isBossWave` plan (today the Colossus, its only spawn; the second and third boss — T0259's Titan, T0266's Orb — ride the same plan rule with no change to this hook). Data-driven off the plan and the def, never a hard-coded id.
- **The horn (a new Sfx method, the sting/coin-blip class):** when the boss's token first spawns, one low two-note horn plays, rising — e.g. 65 Hz then 82 Hz, 180 ms each, ~90 ms apart, volume 0.12. It sits below the leak thud's 98 Hz (T0267), so it reads as "the big one is coming," not as a leak; it is distinct from the last-stand sting's E3→G3 (T0091) and from the wave-start (silent banner, T0067). Procedural, no sound file, silent when sound is off (T0035).
- **The gate pulse (transient, inert, display-only):** at the same instant a single wide ring blooms from the entrance gate in muted ink — grows from the gate out to ~2 cells over ~500 ms and fades (the wave's last-kill ring's transient language, T0229). It is muted ink, not the leak warning's red (ExitWarning, at the exit), not the last-kill road-white, and not the clean-wave green — a different place (the entrance, where the road begins) and a different color, so it marks the moment rather than repeating a readout.
- **Once per boss wave:** the horn and the pulse fire on the boss's first spawn only, never again that wave. A non-boss wave is byte-identical — no horn, no ring.
- **The split with what already shows:** the name tag (T0085) says *what* (a white "Colossus" chip over the spawn), the boss card (T0256) says *how much* (hp, phase), and this says *the peak is beginning* (a horn you hear, a bloom you see at the gate). No second card, no new readout, no input, no keys; the pause screen is unchanged.
- **Lockstep:** at 2× fast-forward (T019) the horn plays once and unstretched (WebAudio real time, the T0254 note); the ring is simulation-time and scales with the wave like the board.
- **Why it matters now:** the Colossus (wave 10) already spawns today, so the arrival happens in the game as it is; right now the run's biggest threat quietly appears as a shape, unannounced. No new content — a new enemy hook file (the bossDeath T0258 / leakEcho T0250 pattern, registered in the enemy-hooks index) plus the Sfx method and the transient ring.

## Acceptance criteria
- [ ] On a boss wave (a multiple of 10), the moment the boss's token first spawns, one rising two-note horn plays (~65→82 Hz, 180 ms each, ~90 ms apart, volume 0.12) and one muted-ink ring blooms from the entrance gate out to ~2 cells over ~500 ms and fades.
- [ ] The horn and the ring fire once per boss wave, on the boss's first spawn only; every other kill, leak and wave in the run is byte-identical (no horn, no ring on any non-boss wave).
- [ ] At 2× fast-forward the horn plays once and unstretched and the ring scales with the wave's simulation time.
- [ ] With sound off the horn is silent but the ring still plays; lives, gold, damage, waves, the boss's hp/phase and resume are byte-identical with it on.
- [ ] The horn's notes are below the leak thud's 98 Hz and distinct from the last-stand sting; the ring is muted ink, not red / road-white / green, and sits at the entrance gate, not the exit.
- [ ] The name tag, the boss card and the "boss" banner chip (T0257) are unchanged; no new HUD element, readout or key is added.
