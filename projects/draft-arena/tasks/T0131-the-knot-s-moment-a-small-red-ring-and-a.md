---
id: T0131
title: "The knot's moment: a small red ring and a soft pop where a grudge starts"
size: S
priority: 2
status: designing
depends_on: [T0130]
attempts: 0
created: 2026-10-31T22:29:04Z
claimed_at: 2026-10-31T22:39:05Z
epic: E30
designer: yoga
---

## Goal
Starting a feud is a pvp moment the field should feel — right now the red knot just appears on top of the knockout burst, so a player near the fight cannot tell a plain knockout from the start of a personal feud.

## Details
- In `src/content/directors/grudge.ts`, in the branch where a feud forms (the `else if` that calls `setGrudge`), play the moment once, at the killer's critter: a small ring and a soft pop. Add it in that branch, not inside `setGrudge` (which runs once per side), so it fires once per feud, on a first formation and on any repeat.
- The ring: a new effect `src/content/effects/knot-ring.ts`, registered in `src/content/effects/index.ts` — a small candy-red ring with an ink rim (the game's threat color, like the knot and the wound) that blooms from the killer's critter out to radius 30 over 0.4 s, no confetti (this is not a death). Modeled on `src/content/effects/splash-ring.ts` (a small ink-rimmed ring that blooms to its value).
- The pop: a new sound in `src/audio/sfx.ts`, modeled on `bloop(seed, age)` (T0103) — a soft low pop (about 240 to 160 Hz over 0.1 s, peak 0.06), deduped per effect seed, one per feud. Lower and softer than the knockout bonk so it sits under the burst, not on top of it.
- What a player sees and hears: at the moment the second mutual knockout happens, a small red ring blooms off the killer's critter and a soft pop lands under the knockout burst — the field knows a feud has started. The victim's knot still arrives with its 3 s respawn, with no second ring: the moment belongs to the knockout that started the feud.
- No HUD element: the moment is on the field and in the ear only.

## Acceptance criteria
- [ ] When a grudge forms, a small red ink-rimmed ring blooms from the killer's critter (out to about 30 units over 0.4 s) and a soft pop plays — once per feud, on a first formation and on a repeat.
- [ ] The pop is clearly lower and softer than the knockout bonk and the monster pop, and plays only when a grudge forms — not on a plain knockout, and not when a feud ends (the ending keeps its own burst and coin).
- [ ] The ring reads at a glance in candy red against the mint field and the knockout burst, and no HUD element is added.
