---
id: T0101
title: "Spray: the shot that splits into needles"
assignee: desktop
size: L
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T02:55:25Z
claimed_at: 2026-10-29T08:21:17Z
epic: E4
---

## Goal
The pool gets its first aimed spread: a Spray shot that, on its first hit, splits into homing needles hunting separate enemies — one hit at range covers a line Splash's 1-cell burst can't.

## Details
- Both card lines (keep them inside the tier-line cap — T0093's rejection was a 91-char line against the 56-char cap in tests/content.test.ts; use these exact strings):
  - As a tower's first augment: "Fires a shot that splits into 3 homing needles on hit."
  - When added: "+1 needle per split per extra Spray."
- Numbers by tier (Common/Rare/Epic): 12/14/16 damage per shot, every 1.1/0.95/0.8 s, range 4.
- On its first hit the shot deals its full damage to the enemy it struck, then splits into N needles, N = 3 + the tower's extra Sprays: each needle carries a third of the shot's damage and homes to a different nearest enemy other than the one just struck — one shot therefore reaches up to 1 + N enemies in a line or cluster.
- The needles are the tower's damage: a needle kill is that tower's kill (gold pop, Mint's +1, the combo counter and the panel's kills line all credit it); Mark added to a Spray marks everything the needles find; Rally speeds the cadence; Momentum (T0064) multiplies the needles' damage.
- Pool, all tiers, offered from the opening draft, the normal tier roll and no-repeat rule.
- Look: a flat wide head on the tower with one tick per copy (Momentum's tick language); the needles a lighter tint of the tower's own color, thin tracers.
- Closest existing augment: Splash (damage across a cluster). New: the spread is aimed — the needles home to separate enemies, so the hit reaches beyond the burst's circle, and the spread grows with copies, which no added form does.
- The panel's "≈ N/s" line (T0084) gains the Spray's primary-strike term when this lands — the shot's damage × shots per second against one enemy; the needles are the spread, not the per-target estimate.
- Claim order: last in the documented order, after Mend (T0095) — the runner keeps the shared registration one at a time; the queue is deep on purpose, the pool is the epic.

## Acceptance criteria
- [ ] The draft offers Spray at all three tiers from the opening draft, with the two card lines above (inside the cap) and the usual frame, gem row and odds treatment.
- [ ] A lone Spray's shot strikes one enemy at full damage (12/14/16 by tier) and splits into three needles, each homing to a different nearest enemy other than the one struck, each dealing a third of the shot's damage.
- [ ] Each added Spray adds one needle per split (4, 5, 6, …), still to different nearest enemies.
- [ ] A Spray tower looks unlike every other tower: the flat wide head with one tick per copy; the needles a lighter tint of the tower's color.
- [ ] A needle kill is the tower's kill — gold pop, Mint's +1, combo counter and kills line — and Mark added to a Spray marks everything the needles find.
- [ ] The panel's DPS line (T0084) shows the shot term for a Spray tower (10.9/14.7/20 by tier against one enemy); desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, desktop)

### Files
- create `src/content/augments/spray.ts` — the augment data (exact def in Interfaces).
- create `src/systems/attacks/spray.ts` — the attack: aim at the enemy furthest along, fire one bolt.
- edit `src/content/types.ts` — `AttackKind`: add `| 'spray'` with its doc line after `'shot'`; `FirstForm`: `spray?: number` after `pierce?`; `AddedForm`: `spray?: number` after `pierce?`.
- edit `src/content/augments/index.ts` — `import { spray } from './spray';` after the splash import; one `spray,` line after `splash,` in `AUGMENTS`.
- edit `src/core/augments.ts` — `TowerSpec`: add `spray: number` and `sprayCount: number` after `splashCount` (mirror in `EMPTY`); base spec: `spray: f.spray ?? 0,` + `sprayCount: 0,`; added loop after the extraShots gate: `if (spec.kind === 'spray') spec.spray += e.spray ?? 0;`; after the splash-count loop: `for (const a of augments) if (a.id === 'spray') spec.sprayCount += 1;`; `describeSpec`: new branch between the `'shot'` and `'mark'` branches (code below).
- edit `src/core/towerDps.ts` — line 13 becomes `if (spec.kind === 'shot' || spec.kind === 'pulse' || spec.kind === 'spray') dps += spec.damage * spec.rate;` (the shot term only; needles are the spread).
- edit `src/content/palette.ts` — add `lightOf()` next to `deepOf()`: `export function lightOf(color: number): number { const m = (c: number): number => Math.round(c + (255 - c) * 0.4); return (m((color >> 16) & 255) << 16) | (m((color >> 8) & 255) << 8) | m(color & 255); }` with a doc comment (a lighter tint, mixed 40% toward white).
- edit `src/systems/EnemySystem.ts` — `HitPayload`: after `pierce`, required field `needles: number;` (homing needles the shot splits into on its first hit; 0 = none). The only object-literal construction is in TowerSystem; all others spread the payload.
- edit `src/systems/TowerSystem.ts` — payload literal: add `needles: spec.spray,` after `pierce: spec.pierce,`.
- edit `src/systems/ProjectileSystem.ts` — import `pickNearest` (core/targeting) and `lightOf` (content/palette); `land()` calls the split before the hit (code in Steps).
- edit `src/entities/Projectile.ts` — `fire()` gains optional 6th param `asTracer = false`; store `private tracer = false;` set in `fire()` to `asTracer || payload.pierce > 0`; `advance()` rotates with `if (this.tracer) this.setRotation(Math.atan2(dx, -dy));` replacing the `payload.pierce > 0` check (identical behavior for every existing caller).
- edit `src/entities/towerLook.ts` — `barrelCount`: after the gust line, `if (spec.kind === 'spray') return 1;`; `barrelLook`: after the gust branch, `if (spec.kind === 'spray') return { length: 1.2, width: 2.2, bulb: spec.splash > 0, bands: speedUps(spec), emberTicks: spec.burnCount, emberMuzzle: false, sprayTicks: spec.sprayCount };` (the flat wide head, like the gust mouth).
- edit `src/art/barrels.ts` — `BarrelLook`: add `sprayTicks?: number;` (short ticks in the tower's own color, one per Spray copy); in `barrelTexture`: `const sprayTicks = Math.max(0, Math.min(4, Math.round(look.sprayTicks ?? 0)));`, include `:${sprayTicks}` in the texture key after the emberTicks entry, and a draw loop after the ember-tick loop: for i < sprayTicks, `roundRectPath(ctx, c - w * 0.6, at - w * 0.19, w * 1.2, w * 0.38, w * 0.19)` with `at = c - len * (0.82 - 0.08 * i)`, filled `rgba(color ? PALETTE[color] : PALETTE.faint, 1)`.
- edit `tests/core/augments.test.ts` — new `describe('spray')` block (see Tests) and one line changed in the wave-1 dps test (see Pitfalls).

### Interfaces
```ts
// src/content/augments/spray.ts
import type { AugmentDef } from '../types';

/** The needles a lone Spray's shot splits into; each extra Spray adds one more. */
export const SPRAY_NEEDLES = 3;

export const spray: AugmentDef = {
  id: 'spray',
  name: 'Spray',
  description: 'Fires a shot that splits into 3 homing needles on hit. Added: +1 needle per split per extra Spray.',
  asTower: 'Fires a shot that splits into 3 homing needles on hit.',
  asAdded: '+1 needle per split per extra Spray.',
  look: { shape: 'chevron', color: 'green', size: 0.24 },
  first: { kind: 'spray', damage: 12, range: 4, rate: 1 / 1.1, spray: SPRAY_NEEDLES },
  added: { spray: 1 },
  tiers: {
    rare: { damageMul: 7 / 6, cooldownMul: 0.95 / 1.1, asAdded: '+1 needle per split per extra Spray.' },
    epic: { damageMul: 4 / 3, cooldownMul: 0.8 / 1.1, asAdded: '+1 needle per split per extra Spray.' },
  },
};
```
`7/6` and `4/3` give 14/16 damage; `0.95/1.1` and `0.8/1.1` as `cooldownMul` give rates `1/0.95` and `1/0.8` (Push writes its cadence the same way: `rate: 1 / 2.4`, `cooldownMul: 5 / 6`). No `projectileSpeed`: `towerSpec` falls back to Bolt's speed. No `tier`/`opening` fields: damage > 0 puts it in the opening draft, all tiers, normal roll and no-repeat — zero changes to draft code.

### Steps
1. Write `spray.ts` exactly as above; register it in `content/augments/index.ts`.
2. Add the three type fields, then the `TowerSpec`/`towerSpec`/`describeSpec` edits in `core/augments.ts`. The describeSpec branch (insert between the `'shot'` and `'mark'` branches; `slow`, `root`, `marked` are already in scope):
```ts
} else if (spec.kind === 'spray') {
  line = `Shoots the enemy furthest along, and its shot splits into ${spec.spray} needles${spec.pierce > 0 ? `, and each hits ${spec.pierce + 1} in a line` : ''}`;
  if (marked > 0) line += ', and its hits mark';
  if (slow) line += `, slowing them by ${slow}%`;
  line += root;
}
```
3. `core/towerDps.ts`, `palette.ts`, `EnemySystem.ts` (HitPayload.needles), `TowerSystem.ts` (payload line) — the one-liners in Files.
4. Write `systems/attacks/spray.ts`: model on `shot.ts` but `const i = pickTarget(tower.x, tower.y, range, enemies); if (i < 0) return false;` then `tower.aimAt(target.x, target.y); tower.kick(); fireBolt(0, target, payload); sfx?.shoot(); return true;`. Register `spray` in `systems/attacks/index.ts` (TS exhaustiveness of `ATTACKS` catches a miss).
5. `ProjectileSystem`: in `land()`, right after `const payload = p.payload!;` add `if (payload.needles > 0) this.spread(target, payload, p.speed);`, and in the pierce continuation change the new payload to `{ ...payload, pierce: payload.pierce - 1, needles: 0 }`. New private method:
```ts
/** The shot's first hit splits (Spray): up to `payload.needles` needles, one per different nearest enemy, each a third of the shot's damage. */
private spread(target: Enemy, payload: HitPayload, speed: number): void {
  const picks = pickNearest(target, Infinity, this.enemies.all, payload.needles);
  const needle: HitPayload = { ...payload, damage: payload.damage / 3, splash: 0, splashCap: 0, pierce: 0, push: 0, needles: 0, color: lightOf(payload.color) };
  for (const i of picks) this.fire(target.x, target.y, this.enemies.all[i]!, needle, speed, true);
}
```
6. Apply the `Projectile.ts` tracer changes (Files). Then tower look: `towerLook.ts`, `art/barrels.ts`.
7. Add the tests (Tests), then `npm run check` and `npm run smoke` (desktop 1280x720 + phone 412x915).

### Pitfalls
- The needle payload MUST set `needles: 0` — a forgotten field (or a reused non-zero value) makes needles split into needles forever. It must also keep the spread `...payload` so `source`, `mark`, `slow`, `burn` ride along: that is what credits the kill (gold pop, Mint's +1, combo, `source.kills`) and marks the needle's victims.
- The wave-1 test in `tests/core/augments.test.ts` ("every damaging first augment can hold wave 1") will fail as-is (12/1.1 = 10.9 < 12): change its map to `a.first.damage * a.first.rate * (1 + (a.first.spray ?? 0) / 3)` with a comment that a Spray's needles count against the wave's line. All bounds still pass.
- Tier numbers come out of multipliers (14.000…002-style float noise): assert with `toBeCloseTo(14)`, never `toBe(14)`.
- `pickNearest(target, Infinity, …)` is intentional and safe (`inRange` compares against `Infinity`): the needle hunts the different nearest enemies on the whole board, always skipping the struck one, distinct, nearest first. Split before `hit()` so the needles are already flying if the struck enemy dies to the strike.
- `Projectile.tracer` must be reset in `fire()` (pooled object); the default `asTracer = false` keeps every existing bolt exactly as it was, including pierce chains.
- `barrelCount` must return 1 for `'spray'` or the tower has no head, no `muzzle(0)` and no aim. Include `sprayTicks` in the barrel texture key or cached textures go stale.
- The added-loop line is gated on `spec.kind === 'spray'` (like the extraShots gate): a Spray added to a non-spray tower has no split to grow and does nothing — its card line says "per split", so that is honest.
- Momentum (T0064) is not yours: it will multiply the tower's damage before the shot is built, so the needles' one-third inherits it automatically. Do not wire it.
- Use only the two card strings given (54 and 36 chars — inside the 70/56 caps in tests/content.test.ts); the tier entries repeat the base `asAdded` line.

### Tests
In `tests/core/augments.test.ts` (add a `towerDps` import): `describe('spray')` — (1) `spec('spray')` is `{ kind: 'spray', damage: 12, range: 4, spray: 3, sprayCount: 1 }` and rate `toBeCloseTo(1 / 1.1)`; (2) `spec('spray','spray')` → `{ spray: 4, sprayCount: 2 }`, three copies → 5, and `spec('spray','bolt','spray')` → `{ spray: 4, sprayCount: 2 }`; (3) `spec('bolt','spray')` → `{ kind: 'shot', spray: 0 }`; (4) rare `damage toBeCloseTo(14)`, `rate toBeCloseTo(1/0.95)`, epic 16 and `1/0.8`; (5) `towerDps` → `toBeCloseTo(12/1.1)`, `14/0.95`, `20` per tier (the needles are not in the term); (6) `describeSpec(spec('spray'))` matches `/splits into 3 needles/`, with an extra copy `/splits into 4 needles/`, and `describeSpec(spec('bolt','spray'))` does not match `/needles/`.
