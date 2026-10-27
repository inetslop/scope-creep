---
id: T0087
title: Add the Divider enemy
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T07:13:18Z
claimed_at: 2026-10-27T07:19:41Z
designer: yoga
---

## Goal
A new late-run harasser: the **Divider**, a small ink hexagon that never closes the distance — it strafes at close range and picks you off with fast, light shots. The kiting-shooter niche now has a fast, fragile version to pair with the Sentry (medium) and the Counterweight (heavy).

## Details
- New data file `src/content/enemies/divider.ts`, copied line by line from `src/content/enemies/sentry.ts` (the prototype kiting shooter) with only the values below changed — same `shoot` behavior, same shot visual.
- `id: 'divider'`, name "Divider".
- All-caps marginalia `note` field (same field the Sentry has): "IT HOLDS ITS DISTANCE".
- hp 16, speed 170, contactDamage 8, xp 2, threat 2, spawnWeight 4, unlockAtSec 200, knockbackResist 0.2.
- Shoot parameters (the Sentry holds a 240–300 band and fires every 2.4 s at speed 150 / 8 damage): hold a 140–190 unit band, fire every 1.4 s, bullet speed 260, bullet damage 6 — closer in, much faster-firing, but each shot does less.
- `look`: shape `hexagon` (the same shape `src/content/enemies/hex.ts` uses), radius 13, body `PALETTE.ink`, accent `PALETTE.paperLight` (the small paper-light dot Mote and Counterweight show), spin 0.8.
- Register it in the enemy roster the same way the Sentry and Counterweight are registered (the content index; imports stay alphabetical, the def appends at the end of the array) — `tests/content.test.ts` picks the new entry up automatically.
- No scene, system, or stat changes: the `shoot` behavior, the hexagon shape and all stats already exist.

## Acceptance criteria
- [ ] After 200 s of a run a small ink hexagon can spawn; on its first appearance the marginalia "IT HOLDS ITS DISTANCE" fades in beside it.
- [ ] It keeps ~140–190 units from the player and strafes sideways, firing a fast ink point (speed 260, 6 damage) every 1.4 s — noticeably closer in and faster-firing than the Sentry, with visibly lighter shots.
- [ ] It moves at speed 170, has 16 hp, and deals 8 contact damage.
- [ ] `npm run check` and `npm run smoke` (desktop + mobile) pass.
