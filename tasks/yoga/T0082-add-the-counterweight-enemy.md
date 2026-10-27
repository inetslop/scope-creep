---
id: T0082
title: Add the Counterweight enemy
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T06:15:12Z
claimed_at: 2026-10-27T06:16:49Z
designer: yoga
---

## Goal
A heavy late-run shooter: a big slow orange circle that crawls toward you while holding its distance and fires slow, heavy ink points — the Sentry's discipline with the Boulder's mass, so the late game has a tank to kite, not just a swarm.

## Details
- New data file `src/content/enemies/counterweight.ts`, copied line by line from `src/content/enemies/sentry.ts` (the orange pentagon shooter, T0007) with only the values below changed — same `shoot` behavior, same shot visual.
- Shape `circle`, orange (`PALETTE.orange`), radius = the Sentry's radius × 2 (a big circle, readable as heavy at a glance).
- hp 120, speed 30, contactDamage 14, xp 6, threat 4, spawnWeight 3, unlockAtSec 195, knockbackResist 0.5.
- Shoot parameters (the Sentry holds a 240–300 band, fires every 2.4 s at speed 150 / 8 damage): hold a 200–260 unit band, fire every 3.0 s, bullet speed 130, bullet damage 12 — slower, but hits harder, than the Sentry's shot.
- All-caps marginalia `note` field (same field the Sentry has): "SLOW AND HEAVY SHOTS".
- Register it in the enemy roster the same way the Sentry is registered (the content index; the existing content validation test picks new entries up automatically).
- No scene, system, or stat changes: the `shoot` behavior, circle shape and all stats already exist.

## Acceptance criteria
- [ ] After 195 s of a run a big orange circle can spawn; on its first appearance the marginalia "SLOW AND HEAVY SHOTS" fades in beside it.
- [ ] It keeps ~200–260 units from the player and strafes sideways, firing a heavy ink point (speed 130, 12 damage) every 3 s; the shot is visibly slower and deals visibly more damage than the Sentry's.
- [ ] It moves at speed 30, shrugs off knockback (barely flinches when hit), and dealing contact damage of 14.
- [ ] `npm run check` and `npm run smoke` (desktop + mobile) pass.
