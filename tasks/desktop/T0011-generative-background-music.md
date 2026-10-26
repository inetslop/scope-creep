---
id: T0011
title: Generative background music
assignee: desktop
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T17:58:28Z
claimed_at: 2026-10-26T19:09:33Z
designer: desktop
---

## Goal
A quiet generative score under the action. Right now the only audio is SFX; a slow pulse that speeds up as the run goes on gives the game a heartbeat and a sense of escalation without any audio assets.

## Details
- New music system alongside `src/audio/Sfx.ts`, built the same way: pure WebAudio synthesis on the shared audio context (oscillators + filtered noise), no audio file assets.
- Style: Bauhaus minimal — a low ink pulse on the beat, sparse notes from a small 5-note set, an occasional soft noise swell. Texture and rhythm, not a hummable tune.
- Loudness: music mixed at roughly 25% of SFX volume; SFX must stay clearly on top.
- Escalation: 80 BPM at 0:00, +4 BPM per minute, capped at 120 BPM (reached at 20:00). At 100 BPM a second voice (higher notes on the off-beat) joins in.
- Lifecycle: starts after the first user input (same audio-unlock path as Sfx), plays during the Game scene, stops while paused and on game over, resumes when unpaused.
- No UI and no settings for this yet (the settings page is a later milestone).

## Acceptance criteria
- [ ] A quiet generative loop plays during a run, starting after the first input
- [ ] Music is synthesized (oscillators/noise); no audio file assets added
- [ ] Music is clearly quieter than SFX
- [ ] The loop is audibly faster at 10:00 than at 0:00, and a new layer is audible by ~5:00
- [ ] Music stops when paused and on game over; resumes when unpaused
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile
