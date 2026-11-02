---
id: T0397
title: "The menu's bed: a quiet beat under the menu"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T01:41:53Z
claimed_at: 2026-11-02T03:05:42Z
designer: desktop
---

## Goal
The menu — where the next run is planned (tech spending, the codex, the mode pick, the board pick) — is the only space of the run without a beat: the wave has its heartbeat (T0239), the build its calmer beat (T0365), the draft its sparsest (T0372). A quiet fourth bed under the menu closes the audio design, so the run's loop gets its rest before the first build.

## Details
- A new quiet generative bed in a new file beside `src/audio/buildBed.ts` and `src/audio/draftBed.ts` (the closest examples — the same shape: a small class on Sfx's WebAudio context, sine notes, fades, nothing else): a 3-note sine loop **E2, B2, E3** at **1.6 s steps, volume 0.02** — the calmest of the four beds (the draft bed is 0.025, the build bed 0.03) — with **0.6 s fades** in and out. No forms: the menu has no run state to form from.
- Owned by the menu scene exactly like the draft bed is owned by the draft scene (T0372): created when the menu scene starts, destroyed on its shutdown. Whatever the menu scene does when an overlay card opens over it (Tech, How, the codex, the board pick), the bed follows the scene — no extra wiring, no per-card logic.
- The bed plays only in the menu's own space: it stops the moment a run starts (Play, Ghost or Iron) and never plays during a run, in a pause reference, or on the game-over or rewards screens. The run's beds keep their own phases (the build bed is already silent in the menu).
- Silent when the profile's sound is off (the same remembered preference the pause's Sound toggle writes, T0035) — the other beds' own guard.
- The live menu demo is untouched: whatever it sounds like today, it is unchanged, and the bed is the menu's only new sound.
- No new key, button, HUD element or toggle; the pause screen is untouched. T0398 (the Iron card's third clause) edits the same menu scene; the same-file edits serialize, either order.

## Acceptance criteria
- [ ] Opening the menu (fresh or back from a run) fades the quiet 3-note bed in over 0.6 s; starting a run (Play, Ghost or Iron) fades it out, and no run, draft, wave, pause or end screen ever plays it.
- [ ] While an overlay card (Tech, How, codex or the board pick) is open, the bed does whatever the menu scene does — it is never a second, competing sound in any scene.
- [ ] Sound off in the profile → the menu is silent; sound on → the bed is audible at 0.02, quieter than the draft bed's 0.025.
- [ ] The menu's layout, cards, demo and profile are byte-identical; the desktop + mobile smoke run passes.
