---
id: T0219
title: "The Mute shows its silence: a quiet ring under the Mute"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T16:16:13Z
claimed_at: 2026-10-29T16:16:34Z
designer: yoga
---

## Goal
The Mute holds every tower within 2 cells still, and nothing on the board says so — a first-time player sees towers go quiet and can't tell why, or how far the silence reaches. The Mute earns its telegraph: a quiet ring in its own color, in the language the game already uses for quiet work.

## Details
- What exists: the Mute (from wave 11) silences every tower within 2 cells while it lives; a jammed tower shows nothing, and the Mute's reach is drawn nowhere. The game already has the sign of quiet work: the working-aura ring (T0055) — a thin ring in the source's own color grows from the base and fades over 1 s each time the effect works — and the root's light-blue ground ring (T0192).
- The change: while a live Mute is holding at least one tower still, a thin ring in the Mute's own purple grows from the Mute's token out to its full 2-cell silence radius and fades over 1 s, once per second — the silence reads as a quiet steady pulse. Ground level, under the token (the root ring's placement), the working-aura's soft alpha. No ring while the Mute is alive but no tower is within its radius — the ring is the "working" sign, not a permanent marker — and it clears the instant the Mute dies.
- Display only: the Mute's numbers, its silence, its token and every other enemy, tower and HUD element are untouched; the ring reuses the check that already decides which towers are jammed (no new radius, no new metric). It is a draw, not a simulation timer — it reads the same at 1x and 2x.
- Closest examples: the working-aura ring (T0055) for the grow-and-fade once-per-second pulse; the root ground ring (T0192) for the ground-level placement; the enemy-hook pattern (T0099, T0138, the hooks index) for where the draw lives — the Mute's own hook, which owns its reaction, or a display-only sibling registered next to it.
- No sound, no input, no HUD element, no save field.

## Acceptance criteria
- [ ] While a live Mute holds at least one tower within its 2-cell radius still: a thin purple ring grows from the Mute out to 2 cells and fades over 1 s, repeating once a second, at 1x and 2x.
- [ ] A live Mute with no tower in range shows no ring; the moment the Mute dies its ring is gone.
- [ ] The ring sits at ground level in the Mute's own purple at the working-aura's soft alpha; the Mute's silence, numbers and token behave exactly as before, and no other enemy, tower or HUD element changes.
- [ ] No sound, no new input, no HUD element; the smoke test passes on desktop and mobile.
