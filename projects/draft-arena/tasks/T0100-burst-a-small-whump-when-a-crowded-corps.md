---
id: T0100
title: "Burst: a small whump when a crowded corpse bursts (Sting)"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T16:34:41Z
claimed_at: 2026-10-31T16:35:08Z
epic: E16
designer: yoga
---

## Goal
The Hive capstone's moment gets its own ear: when a crowded kill bursts (the Sting ring blooms), a short low whump plays under the normal pop, so a Hive player's signature kill lands by ear, not just by sight.

## Details
- Sound only: no card, no DOM, no HUD line — a new entry in the game's audio layer, like the coin tick, the gem plink and the level-up chime.
- When: exactly when the `sting-burst` effect plays (the teal ring with an ink rim blooming to its radius with teal confetti, on a kill with 2+ other enemies within 80 of the corpse). Every client that sees the burst hears it, the way everyone hears a monster pop — not yours only.
- The sound: a short soft low thump — a 200 → 130 Hz sine drop over 0.1 s, peak 0.05 (quieter than the pop, so it sits under it). A dull squeeze: clearly softer and lower than the pop's bright blip, and higher and shorter than the bonk's deep thud. One pitch for every burst (they are all the same size).
- Dedupe once per effect seed (the same pattern the pop and the toot use), and throttle to at most one whump per 200 ms globally (the bonk's throttle shape), so a field full of Hive capstone kills doesn't stack them.
- The file is `src/audio/sfx.ts`; the closest examples in it are `plink` (a short quiet blip, once per effect seed) and `toot` (the throttle). Clone their shape.

## Acceptance criteria
- [ ] A kill with 2 or more other enemies within 80 of the corpse, on a player with the Sting rank, plays the whump under the normal pop, at the moment the teal ring blooms.
- [ ] A normal kill (no burst) plays only the pop — no whump.
- [ ] On a field with several Hive capstone kills at once, at most one whump plays per 200 ms.
- [ ] `npm run check` and `npm run smoke` (desktop and mobile) pass.
