---
id: T0007
title: Add the Sentry enemy
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-26T17:40:33Z
claimed_at: 2026-10-26T17:50:08Z
designer: desktop
---

## Goal
A ranged enemy that keeps its distance and fires slow ink points, so the player must close in or dodge — the first enemy that attacks from afar.

## Details
- New enemy "Sentry": orange pentagon, radius 16, body `PALETTE.orange`, accent `PALETTE.paperLight`, spin 0.5.
- New behavior `shoot`: keeps a distance of 240–300 units from the player — backs away if closer, approaches if farther, and always drifts slowly sideways (perpendicular to the player). Speed 85.
- Every 2.4 s it fires one ink point (circle, radius 6, speed 150) at the player's current position. Telegraph: 0.4 s before the shot, its center accent flashes `PALETTE.paperLight`.
- Enemy projectiles are a new kind: they damage the player (8 damage, normal hit feedback), pass through other enemies, and despawn at the arena edge.
- Values: hp 30, contactDamage 8, xp 3, threat 3, spawnWeight 3, unlockAtSec 60, knockbackResist 0.3.
- Create `src/content/enemies/sentry.ts` (start from a copy of `src/content/enemies/wedge.ts`) and register it in `ENEMIES` in `src/content/enemies/index.ts`.

## Acceptance criteria
- [ ] After 60 s, orange pentagons appear; they hold their distance and strafe instead of just chasing
- [ ] Every ~2.4 s, after a 0.4 s flash, one fires a slow ink point at the player; the point damages the player on contact
- [ ] Sentry points pass through other enemies and despawn at the arena edge
- [ ] `npm run check` and `npm run smoke` pass
