---
id: T0296
title: "The record pass: the wave card says it once"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T17:56:06Z
---

## Goal
Passing your own record is the run's biggest personal moment, and today it is celebrated nowhere in-run (only the pause line's star, the end card and the menu). The moment the run's wave number reaches the saved best wave, the wave card says so once — a star and a quiet note — so the player feels the record fall where they are looking, not at the end.

## Details
- **The moment:** the instant the wave card's own number first becomes the saved best wave this session, one small yellow star (the record star's look and texture, T0016/T0069, ~14 px) pops in to the right of the number: ~150 ms scale-in, holds ~0.7 s, ~150 ms fade. No residue — the wave card never keeps the star; the pause line (T0069) keeps the state, this marks the moment.
- **The note:** one quiet two-note rise, G5 then B5, 80 ms sines 90 ms apart, volume 0.1 — the wave sweep's shape (T0240) in the sting's quiet class (T0091); silent with the sound off.
- **Once per run, per session:** a resumed run that starts at or above its best does not replay the moment (it belongs to the session that earned it). No saved best (a first device) — no moment.
- **Iron:** an Iron run reads the saved iron best wave (T0249) and wears the muted star (its texture, T0249) for the same moment; a normal run reads the normal best.
- **Layout:** the star sits in the wave card's existing padding, to the right of the number; the card's size and the number's position are unchanged at 412×915 and 1280×720 (the star is transient — no reflow).
- **No new input, no new readout, no board mark**, and the pause's controls line is unchanged.
- Closest pattern: the near miss's one-shot chip (T0271) — a transient mark that pops, holds and fades. The wave card is src/ui/hud/WaveCard.ts; the note is one new method in src/audio/Sfx.ts beside waveSweep() (T0240).

## Acceptance criteria
- [ ] A run with saved best 12 shows the star and hears the note exactly when the wave card's number becomes 12 — once, never again that run; a run with no saved best never shows it.
- [ ] Closing and resuming a run already at or above its best does not replay the moment; the pause line's star (T0069) is untouched either way.
- [ ] An Iron run with saved iron best 8 shows the muted star at wave 8; the normal best is not read.
- [ ] After ~1 s the star is gone and the wave card is otherwise byte-identical to today; both viewports pass the layout check (T0226).
- [ ] npm run check and the desktop/mobile smoke pass.
