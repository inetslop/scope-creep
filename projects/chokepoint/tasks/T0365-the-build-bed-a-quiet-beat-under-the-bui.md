---
id: T0365
title: "The build bed: a quiet beat under the build phase"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-01T16:18:26Z
---

## Goal
The run's loop stops having a dead silence during the build phase: a quiet, calm bed plays under the build phase only, so planning feels continuous and the wave's start lands as a real shift — calm build, the wave's heartbeat, the draft's pick.

## Details
- A new quiet generative bed plays during the BUILD phase only (the planning between a draft and the wave). It never plays during the wave phase (the wave's own heartbeat bed, T0239, owns that), in the menu, on the draft, or over any overlay.
- Character: calmer and lower than the wave bed. A slow 4-note loop (E2, B2, E3, G3) on sine, 0.8 s per step (half the wave bed's tempo), volume 0.03 (just under the wave bed's 0.04), on the same WebAudio context the wave bed uses and respecting the same sound on/off toggle.
- It fades in over 0.6 s the moment the build phase opens (the countdown starts) and fades out over 0.6 s the moment the wave starts. For pause and run-end it behaves exactly like the wave bed does today (same silence / resume rules).
- Last stand: while the run is at exactly one life the build bed plays one octave lower (E1, B1, E2, G2) — the same last-stand form the wave bed wears (T0342) — so the planning still carries the danger.
- Nothing on screen changes: no HUD element, no button, no text, no mark, no toggle. The pause's existing Sound row is the only control that touches it.

## Acceptance criteria
- [ ] During the build phase (countdown running, before the wave) the build bed is audible; during the wave phase, the draft, the menu and the pause it is silent.
- [ ] The build bed is slower and lower than the wave bed (4 notes E2–B2–E3–G3, 0.8 s steps, volume 0.03) and fades in/out over 0.6 s at the build↔wave boundary.
- [ ] Turning sound off (pause) silences the build bed; turning it back on resumes it during a build phase.
- [ ] At exactly one life the build bed plays its one-octave-lower form; the wave bed's form and the exit quicken are unchanged.
- [ ] The screen is byte-identical to before: no new HUD element, button, text or mark; only the sound differs.
