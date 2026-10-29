---
id: T0239
title: "Music: a quiet generative bed under the wave phase"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T23:53:23Z
claimed_at: 2026-10-29T23:53:26Z
designer: desktop
---

## Goal
The wave phase gets a heartbeat: a quiet generative music bed plays while enemies walk and quickens while a leak is imminent, so a wave's danger is heard as well as seen — the last missing piece of the game's "heard as well as seen" language (the tier chime T0032, the beam hum T0112, the last-stand sting T0091).

## Details
- A new system in a new file, `src/audio/music.ts` — the game's own procedural approach (oscillators, no samples; same ground as `src/audio/Sfx.ts`). One bed at a time; exactly two voices, never more.
- **When it plays:** only the wave phase of a real run. It fades in over ~0.5 s as the wave starts (the same moment the "Wave N" banner lands, T0067) and fades out over ~0.5 s when the wave ends. Silent in the build phase, the draft, the menu (including the menu's live demo, T0049 — the menu stays quiet), the pause and the game over. Silent while paused, like every SFX, and off with the sound toggle (T0035).
- **The bed:** an 8-step loop, 0.4 s per step (a 2 s loop), one note at a time, sine, each note decaying over 0.3 s, volume 0.04. The notes in order: E3, E3, G3, E3, C3, E3, G3, A3 — the run's own E–G–A shape (the coin chime's interval, an octave down) with the tier chime's C.
- **The danger voice:** while any living enemy is within 3 s of the exit — the ExitWarning's own state (T0014), not a new measurement — the loop's step halves to 0.2 s and a second voice plays the same 8-note pattern an octave up (E4…A4) at volume 0.03. Both revert the moment the warning clears, so the run's closest leak has a sound under the red pulse.
- **Speed:** the bed is driven by the wave's simulation clock, so the 2× fast-forward (T0019) runs it 2× too — everything in the wave phase runs twice as fast at once.
- **Volumes:** the bed never exceeds 0.04 per voice (0.07 at most, danger voice on); the hit blip (0.18) and the coin chime (0.18) stay clearly above it. No new HUD element, no new input, no change to any existing sound.

## Acceptance criteria
- [ ] In a wave, a quiet 8-note loop plays (E3, E3, G3, E3, C3, E3, G3, A3; sine; 0.4 s steps; 0.3 s decay; volume 0.04), fading in ~0.5 s at wave start and out ~0.5 s at wave end; it is silent in the build phase, the draft, the menu and its live demo, the pause and the game over.
- [ ] While the exit warning is live (an enemy within 3 s of the exit), the step halves to 0.2 s and an octave-up second voice (volume 0.03) joins; both revert when the warning clears.
- [ ] At 2× speed the loop runs 2×; with the sound off or while paused it is silent; the coin chime, tier chime, hit blip and beam hum are byte-identical to before.
- [ ] No new HUD element, no new input; check and smoke pass on desktop and mobile.
