---
id: T0419
title: "The Mute's silence gets its note"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T10:55:36Z
---

## Goal
The Mute is the only enemy that holds the player's towers still, and its silence currently shows only as a quiet ring under the token (T0219) — a player looking at the hand or the panel misses it entirely. One soft held tone plays while any Mute holds a tower, the sky note's own pattern (T0376), so the silence is heard where the eye is not.

## Details
- One held tone, shared by the state: the moment any live Mute first holds a tower within its 2-cell reach, the note fades in over ~250 ms; the moment the last holding Mute stops — it dies, or walks out of every tower's reach — it fades out over ~250 ms. Not one tone per Mute: one tone for "a Mute is holding towers", the sky note's "any Flyer in the air" rule.
- The tone: one held sine at C3 (130.81 Hz), volume 0.05 — the beam hum's own quiet class (T0112), a step above the beam hum's A2 and out of the wave bed's E–G–A loop, so it reads as its own calm held note and never nears the leak thud's class. A new method in Sfx, the sky note's own start/stop-with-fade pattern.
- The trigger is a new enemy hook that reconciles every frame during a wave (the sky note's own hook shape), reading the silence the same way the Mute's own ring does (T0219's per-frame read); the hook drives only the tone.
- The Mute's own data, its ring, the towers' behavior and the wave bed are untouched — this adds a listener, not a change. Silent with sound off (Sfx's own guard); no Mute in reach, no note.
- No new key, button, HUD element or board mark; the pause screen is untouched.

## Acceptance criteria
- [ ] The moment a Mute first holds a tower within its 2-cell reach, a soft held tone (C3, volume 0.05) fades in over ~250 ms, and it stays continuous for as long as any Mute holds any tower (no gap while a Mute walks from one tower's reach into another's)
- [ ] The moment the last holding Mute stops, the tone fades out over ~250 ms; it is gone by the wave's end, and a Mute that never reaches a tower never starts it
- [ ] With sound off, nothing plays; the Mute's ring, the beam hum, the wave bed and the Mute's data are byte-identical to before
- [ ] No new key, button, HUD element or board mark; `npm run check` and the desktop + mobile smoke pass
