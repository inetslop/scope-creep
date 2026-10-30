---
id: T0293
title: "The shield breaks: the moment the Titan takes full damage"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T17:15:59Z
claimed_at: 2026-10-30T17:16:26Z
designer: yoga
---

## Goal
The wave-20 boss's trick changes state the instant the Guard dies — the Titan goes from halved to full — and right now that change is invisible. The player should see the shield break, at the Titan.

## Details
- The instant a Guard dies while the Titan it was shielding is still alive: one burst of 8 chips in the shield's own orange (the flat disc the Guard carried, T0259) at the Titan's token, and one small white chip — "shield down" (the name tag's look, T0085: bold 12 px muted ink on a rounded white chip) — riding over the Titan's token for ~1 s and fading.
- The Guard's own death feedback (the kill burst at the Guard's spot, its gold) is unchanged; this moment plays at the Titan, the one whose state changes.
- Once per run: wave 20 sends exactly one Guard and one Titan. A Guard that dies after its Titan plays nothing, as does any Guard on a board with no Titan; a resumed run whose Guard is already dead plays nothing.
- No sound, no input, no new HUD element. It teaches with what the game already shows: the bosses reference (T0277) already reads "kill the Guard to make the Titan take full damage" — the chip names the state change at the moment of change.
- One new enemy-hook file on the bossOut pattern (T0284), registered in the hooks' index: it fires on a Guard's death only while a Titan is alive.

## Acceptance criteria
- [ ] Killing the Guard while the Titan is alive plays the 8-chip orange burst at the Titan and the "shield down" chip over it for ~1 s.
- [ ] Killing the Titan first (or a Guard on a non-boss wave) plays nothing; the moment plays at most once per run, including across a resume.
- [ ] No sound, no new HUD card; the Guard's own death feedback is unchanged.
- [ ] npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
