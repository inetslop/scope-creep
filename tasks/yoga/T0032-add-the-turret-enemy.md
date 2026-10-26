---
id: T0032
title: Add the Turret enemy
assignee: yoga
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-26T21:23:27Z
---

## Goal
A new enemy archetype — something that holds its ground and punishes you for walking up to it — adding a static shooter to a roster that is otherwise all chasers and one mobile shooter.

## Details
- This is a data-file task modeled on the Sentry. Create `src/content/enemies/turret.ts` by copying `src/content/enemies/sentry.ts` and changing the values. Register it in `ENEMIES` in `src/content/enemies/index.ts` (import in alphabetical position, entry appended in unlock order), exactly like the other enemies.
- Look: a small orange square — `shape: 'square'`, `radius: 18`, `body: PALETTE.orange`, `accent: PALETTE.ink`, `spin: 0.5`. Thick ink outline and the hard paper-cut shadow like every other shape.
- It never moves: it stays exactly where it spawns, does not travel toward the player and does not strafe — it only turns and fires. Reuse the Sentry's shooter behavior configured to hold its ground (a zero/empty distance band and no strafe); if that behavior needs a small data flag or option to be stationary, set or add it as part of this task.
- Fires a fast ink point straight at the player every 1.2 s (the Sentry fires every 2.4 s). Projectile speed 220 (Sentry is 150), projectile damage 10 (Sentry is 8).
- Values: `id: 'turret'`, `name: 'Turret'`, `hp: 50`, `speed: 0`, `contactDamage: 10`, `xp: 4`, `threat: 3`, `spawnWeight: 3`, `unlockAtSec: 150`, `knockbackResist: 0.9` (it barely slides when hit, reinforcing that it holds its ground).
- First-encounter marginalia note (all caps, dry): `HOLDS STILL, SHOTS FAST`.

## Acceptance criteria
- [ ] `src/content/enemies/turret.ts` exists with the values above and `turret` is registered in `ENEMIES`
- [ ] From ~150 s into a run, small orange squares can spawn; before 150 s they never appear
- [ ] A Turret stays in place (no chasing, no strafing) and fires a fast ink point straight at the player roughly every 1.2 s
- [ ] Its projectile is faster and hits harder than the Sentry's (speed 220 vs 150, 10 vs 8 damage)
- [ ] On its first appearance in a run, the marginalia label "HOLDS STILL, SHOTS FAST" fades in above it for 2 s
- [ ] `npm run check` and `npm run smoke` pass
