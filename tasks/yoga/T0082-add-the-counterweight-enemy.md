---
id: T0082
title: Add the Counterweight enemy
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T06:15:12Z
claimed_at: 2026-10-27T06:38:28Z
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

## Design (architect, yoga)

### Files
- create `src/content/enemies/counterweight.ts` - the new enemy def (data only)
- edit `src/content/types.ts` - add optional `bandNear`/`bandFar` to the `shoot` tuning (task's "no code changes" is true except this: the band lives hard-coded in `Enemy.ts`, AC #2 needs it as data)
- edit `src/entities/Enemy.ts` - read the band from `def.shoot` with the existing 240/300 defaults
- edit `src/content/enemies/index.ts` - register in the roster

### Interfaces
`content/types.ts`, inside `EnemyDef.shoot` (keep `periodSec`/`speed`/`damage` first; change its doc line to `Omit for the defaults (2.4 s period, speed 150, damage 8, 240–300 band).`):
```ts
    /** Near end of the hold band; the enemy backs off inside it. Default 240. */
    bandNear?: number;
    /** Far end of the hold band; the enemy approaches outside it. Default 300. */
    bandFar?: number;
```
`Enemy.ts`, after the `shootPeriod` getter (line 55–57):
```ts
  private get shootBandNear(): number {
    return this.def.shoot?.bandNear ?? SHOOT_BAND_NEAR;
  }
  private get shootBandFar(): number {
    return this.def.shoot?.bandFar ?? SHOOT_BAND_FAR;
  }
```
and line 158 becomes: `const radial = dist < this.shootBandNear ? -1 : dist > this.shootBandFar ? 1 : 0; // back off / hold / approach`

### Steps
1. `types.ts`: add the two fields + doc-line change above.
2. `Enemy.ts`: add the two getters; change line 158 as above. (Sentry/Turret keep 240–300 via the `??` fallback — no regression.)
3. Create `counterweight.ts` = `sentry.ts` with exactly these changes:
```ts
export const counterweight: EnemyDef = {
  id: 'counterweight',
  name: 'Counterweight',
  note: 'SLOW AND HEAVY SHOTS',
  hp: 120,
  speed: 30,
  contactDamage: 14,
  xp: 6,
  threat: 4,
  spawnWeight: 3,
  unlockAtSec: 195,
  behavior: 'shoot',
  knockbackResist: 0.5,
  shoot: { periodSec: 3, speed: 130, damage: 12, bandNear: 200, bandFar: 260 },
  look: { shape: 'circle', radius: 32, body: PALETTE.orange, accent: PALETTE.paperLight, spin: 0.5 },
};
```
(header comment: `/** Heavy late-run shooter: a big slow orange circle that holds close and fires slow, heavy ink points. */`)
4. `index.ts`: add `import { counterweight } from './counterweight';` after the `boulder` import (keep alphabetical, lint checks it); append `counterweight` at the END of the `ENEMIES` array (after `frameWedge`).
5. `npm run check`, then `npm run smoke`.

### Pitfalls
- The registration step is load-bearing: a def missing from `ENEMIES` never gets a texture and the director never spawns it.
- Don't touch `SHOOT_BAND_NEAR/FAR` values or `SpawnSystem`'s `ENEMY_SHOT_*` consts (those serve The Frame's dart); enemy shots are already data-driven via `def.shoot?.speed/damage` in `fireShot()`.
- `spin: 0.5` on a circle is visually inert (center dot is centered) — keep it per the copy rule, don't "fix" it.
- `note` must stay all caps (`SLOW AND HEAVY SHOTS`) — the content test asserts it.
- No pooling/scene work: `Enemy.spawn()` already resets `shootTimer`; marginalia + textures come from `ENEMIES` automatically.

### Tests
- none — `tests/content.test.ts` validates every `ENEMIES` entry (ids, numbers, note caps, shoot tuning > 0) and picks the new def up automatically.
