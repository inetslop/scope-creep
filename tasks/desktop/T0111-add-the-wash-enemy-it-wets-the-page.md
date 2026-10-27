---
id: T0111
title: Add the Wash enemy — it wets the page
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T13:24:32Z
claimed_at: 2026-10-27T13:48:14Z
designer: desktop
---

## Goal
A new enemy that changes the page, not just the swarm: the Wash wets the paper behind it, so you choose between shooting it and routing around the patches it leaves — the first enemy to leave a persistent effect on the arena.

## Details
- Content file: new enemy in the same content-file shape as the others — the Platen (T0091) is the closest example: `id: 'wash'`, a pale blue circle (PALETTE.blue at a light tint), radius 14, 35 hp, speed 55, contact damage 6, 2 XP, threat 2, spawn weight 4, `unlockAtSec: 120`, knockbackResist 0.3, behavior `chase` (like Wedge).
- Closest existing enemy: Wedge (plain chaser). What is new: the puddle. Every 2.0 s the Wash drops a flat pale blue puddle at its own position — 120 units across, flat fill (blue at about 0.25 alpha), a thin 2 u ink outline, no hard paper-cut shadow, drawn under the entities like the platemark decals (T0094). Each puddle lasts 2.0 s and fades out over its final 0.5 s.
- Puddle cap: at most 3 of a single Wash's own puddles exist at once; when it would drop a fourth, its oldest puddle is removed first and the new one lands.
- Effect: while the player's center is inside a puddle, the player's move speed is 20% slower (multiplicative with the existing move-speed stat); full speed returns the moment the player leaves or the puddle expires. Puddles slow the player only — enemies, enemy shots and shards are unaffected. A puddle deals no damage, is not targetable and has no physics body you can shoot.
- If the Wash dies, its puddles stay until their natural 2.0 s expiry.
- Marginalia note for the first sighting (T0027 style): "LEAVES THE PAGE WET".
- No new SFX, no new HUD element, no new input, no new scene.
- The spawn-unlock test pattern (T0030) must cover the Wash: absent before 120 s, present at/after.

## Acceptance criteria
- [ ] The Wash does not spawn before 2:00 and does spawn after; the spawn-unlock tests cover it
- [ ] The Wash is a pale blue circle (radius 14) that chases at 55 u/s, 35 hp, 6 contact damage
- [ ] Every 2.0 s a flat pale blue circle 120 u across appears under the Wash's position, lasts 2.0 s and fades over the last 0.5 s; at most 3 of its puddles exist at once
- [ ] Standing inside a puddle moves the player at exactly 80% of normal speed; leaving or expiry restores full speed; enemies and their shots are unaffected
- [ ] Killing a Wash leaves its puddles until their natural expiry
- [ ] "LEAVES THE PAGE WET" prints as marginalia on the Wash's first sighting in a run
- [ ] No new sound; `npm run check` and `npm run smoke` pass
