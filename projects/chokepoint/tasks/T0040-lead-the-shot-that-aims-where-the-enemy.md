---
id: T0040
title: "Lead: the shot that aims where the enemy will be"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T10:05:34Z
epic: E4
---

## Goal
The game's first predictive attack: Lead fires a heavy shot at where the enemy is going, not where it is. Added to any tower, its shots bank a longer lead — the counter to Sprinters, and a new way any first augment's attack can combine.

## Details
- New pool augment (all tiers; offered from the opening draft, like the other pool augments). **Closest existing:** Reach (slow, heavy, long range). **What is new:** the aim — the shot lands where the enemy will be, using the enemy's current speed. No existing augment predicts, and no added form changes where an attack aims.
- **As a tower's first augment (its own attack):** shoots the enemy furthest along, like Bolt, with a slow heavy green dart: 16/20/24 damage by tier (Common/Rare/Epic) every 1.2/1.05/0.9 s, range 4.5 cells.
- **The intercept:** the shot aims at the point the enemy will occupy when the shot arrives — lead = the shot's travel time × the enemy's current speed. Sprinter's ramped speed and Frost's slow both count (a hit-ramped Sprinter is led more, a slowed one less). The lead is capped at 1.2 cells ahead of the enemy's current position, so against a still or slow enemy the lead is small or zero and the shot lands on it — a Lead tower never whiffs at a Block or Dot.
- **When added to a tower (any first augment, including a second Lead):** each Lead beyond the first in the tower raises the lead cap by +0.6 cells (1.2 → 1.8 → 2.4). A Bolt tower with one Lead added gains the full intercept: its shots lead by travel time up to the 1.2 cap. The added form applies to the tower's aimed shots only — a first augment with no aimed shot (Splash's burst, Frost's aura) is unaffected by an added Lead.
- **The fizzle:** against a full-ramp Sprinter, a single-Lead tower's 1.2 cap can be shorter than the true lead: the shot lands ahead of the enemy, fizzles (a small quiet gray puff at the impact point, no damage, no sound), and stops missing once enough Leads are added that the cap covers the lead — stacking Lead is the visible answer.
- **Card lines:** asTower: "Aims where the enemy will be: heavy shot." (Rare and Epic show their own damage, 20 and 24, in the same line). asAdded: "Shots lead +0.6 cells per extra Lead." (same at every tier).
- **Look on the tower:** Lead's color is green everywhere (check the content folder; if the obvious pair is taken by an in-flight augment, take the next free one). Lead first: a long slim barrel — the thinnest, longest barrel in the game, like a Reach barrel in Lead's green — tipped with a small chevron, the Sprinter's chevron shape, so the tower reads "chases runners". Each added Lead: one small green chevron tick on the barrel face, the existing tick style. The shot itself is a small heavy green dart, visibly slower than a Bolt shot.
- **Sound:** the Lead shot reuses the existing heavy-shot sound (Reach's). The fizzle is silent. No new Sfx method.
- **Spec-test coverage** closest to Ember's (`tests/core/lead.test.ts`): the lead formula (still enemy → 0; constant-speed enemy → travel time × speed; over the cap → the cap), the tier specs, the added form through a Bolt tower (cap 1.2) and a two-Lead tower (cap 1.8), and the card lines per tier.
- No new input, no new HUD element; the pause screen is unchanged.

## Acceptance criteria
- [ ] The draft can roll Lead as Common, Rare and Epic (frame and gem row per T0002); the card shows the tier's damage and the added line "Shots lead +0.6 cells per extra Lead."
- [ ] A lone Common Lead tower shoots the enemy furthest along within 4.5 cells: 16 damage every 1.2 s (20/1.05 s and 24/0.9 s for Rare and Epic), and the tower shows the long slim green barrel with the chevron tip.
- [ ] Against a still enemy (Block) and steady enemies (Dart, Dot) the shot always lands on the enemy — the lead is small or zero and no shot ever flies past a still or steady target.
- [ ] Against a moving enemy the shot visibly lands ahead of where the enemy is and still connects (hit flash on the enemy); a hit-ramped Sprinter is led more than an unhurried Dart.
- [ ] A Bolt tower with one Lead added leads its shots the same way (shots on a moving Dart land ahead and connect), and its barrel gains one green chevron tick per Lead.
- [ ] A full-ramp Sprinter that outruns the 1.2 cap makes a single-Lead tower's shots fizzle ahead of it (small gray puff, no damage); adding Leads until the cap covers the lead makes them connect again.
- [ ] Every other augment, enemy and scene is unchanged; a run with a Lead in the pool passes the desktop and mobile smoke tests.

## Design (architect, desktop)

### Files
- create `src/core/lead.ts` - pure lead math: `leadCells()`, `leadAim()`, `LEAD_HIT_RADIUS` (no Phaser)
- create `src/content/augments/lead.ts` - the Lead augment (data only, model on `reach.ts`)
- create `tests/core/lead.test.ts` - spec tests (model on `tests/core/mark.test.ts`)
- edit `src/content/types.ts` - 3 one-line fields: `FirstForm.lead?`, `AddedForm.lead?`, `TierValues.asTower?`
- edit `src/content/augments/index.ts` - import line after `lance`; `lead,` in `AUGMENTS` after `lance,` (shot cluster, not the end)
- edit `src/core/tiers.ts` - `tierTowerLine()` next to `tierAddedLine()`
- edit `src/core/augments.ts` - `TowerSpec.lead`/`leadCount` + count block in `towerSpec()`
- edit `src/scenes/DraftScene.ts` - 2 lines: import `tierTowerLine`, card tower line (line 91) uses it
- edit `src/art/textures.ts` + `src/art/entities.ts` - `DART_TEXTURE = 'fx:dart'`, painted in `paintEntityTextures` (flat white capsule, tinted by payload)
- edit `src/art/barrels.ts` - `BarrelLook.chevronTip?`/`chevrons?` + painting (chevron tip, green chevron ticks; key includes both)
- edit `src/entities/towerLook.ts` - `barrelLook()`: Lead first → length 2, width 0.32, `chevronTip: true`; `chevrons: max(0, leadCount − (firstId==='lead'?1:0))`
- edit `src/entities/Projectile.ts` - aimed mode: fixed impact point, dart texture, reset fields
- edit `src/systems/ProjectileSystem.ts` - `fx` constructor arg, `fire()` passes aim through, fizzle in `land()`, `brokenAim()`
- edit `src/systems/attacks/shot.ts` - aim barrels at the lead point when `spec.lead > 0`
- edit `src/systems/TowerSystem.ts` - `fireBolt` computes the aim point per target
- edit `src/scenes/GameScene.ts` - 1 line: `new ProjectileSystem(this, this.enemies, this.fx)` (line 68)
- edit `src/debug/runChecks.ts` - invariant line after `['projectiles.stuck']`

### Interfaces
```ts
// core/lead.ts (board units in; `Cells` args in cells)
export const LEAD_HIT_RADIUS = 0.9; // cells; enemy farther from the impact point than this on arrival -> fizzle
export function leadCells(distCells: number, enemySpeedCells: number, shotSpeedCells: number, capCells: number): number; // min((dist/shotSpeed)*speed, cap); 0 if speed<=0 or shotSpeed<=0
export function leadAim(towerX: number, towerY: number, target: { x: number; y: number; dirX: number; dirY: number; speed: number; slowPct: number }, shotSpeed: number, capCells: number): { x: number; y: number };
// body: lead = leadCells(hypot(t→target)/CELL, target.speed*(1−slowPct)/CELL, shotSpeed/CELL, capCells)*CELL; return target + dir*lead (Enemy matches the param structurally)

// content/types.ts — FirstForm: `lead?: number;` (base lead cap, cells; Lead: 1.2)
// AddedForm: `lead?: number;` (raises the tower's lead cap per Lead after the first; Lead: 0.6)
// TierValues: `asTower?: string;` (card's tower line at this tier; Common: `asTower` itself) — right after `asAdded`
export function tierTowerLine(def: AugmentDef, tier: Tier): string; // common -> def.asTower, else tiers[tier].asTower ?? def.asTower

// core/augments.ts TowerSpec (also in EMPTY and the spec literal: lead: 0, leadCount: 0):
lead: number; // cap in cells, 0 = no Lead
leadCount: number;
// in towerSpec(), between the mark loop and the pulse block:
let leads = 0;
for (const a of augments) if (a.id === 'lead') leads++;
if (leads > 0) { const leadDef = getAugment('lead'); spec.lead = (leadDef.first.lead ?? 0) + (leads - 1) * (leadDef.added.lead ?? 0); spec.leadCount = leads; }

// art/barrels.ts BarrelLook: chevronTip?: boolean; chevrons?: number;  // key: `:${look.chevronTip ? 'c' : 'n'}:${chevrons}`
// entities/Projectile.ts:
aimX: number | undefined; aimY: number | undefined; // both set in fire(), both cleared in despawn()
fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number, aimX?: number, aimY?: number): void;
// fire(): aimed = aimX !== undefined; texture = aimed ? DART_TEXTURE : (pierce>0 ? TRACER_TEXTURE : BOLT_TEXTURE); rotate when aimed or tracer (both textures flat)
// advance(): fly toward (aimX, aimY) instead of the target when aimed (same step/snap code, `dist <= step || dist < 6`)
// systems/ProjectileSystem.ts:
constructor(scene: Phaser.Scene, enemies: EnemySystem, fx: FxSystem);
fire(x: number, y: number, target: Enemy, payload: HitPayload, speed: number, aimX?: number, aimY?: number): void;
brokenAim(): string | undefined; // active aimed projectile with non-finite aimX/aimY -> 'an aimed shot flies to a non-finite point'
// land(), first line: if (p.aimX !== undefined && Math.hypot(target.x - p.x, target.y - p.y) > LEAD_HIT_RADIUS * CELL) { this.fx.wave(p.x, p.y, 14, PALETTE.faint); p.despawn(); return; }  // the fizzle: gray puff, no damage, no sound
// systems/attacks/shot.ts: const aim = tower.spec.lead > 0 ? leadAim(tower.x, tower.y, first, tower.spec.projectileSpeed * CELL, tower.spec.lead) : undefined; tower.aimAt(aim?.x ?? first.x, aim?.y ?? first.y);
// systems/TowerSystem.ts fireBolt: const aim = spec.lead > 0 ? leadAim(m.x, m.y, target, spec.projectileSpeed * CELL, spec.lead) : undefined; this.projectiles.fire(m.x, m.y, target, payload, spec.projectileSpeed * CELL, aim?.x, aim?.y);
// runChecks.ts: ['projectiles.aim', (g) => g.projectiles.brokenAim()],
```
`src/content/augments/lead.ts`: `id 'lead'`, `name 'Lead'`, `asTower: 'Aims where the enemy will be: heavy shot.'`, `asAdded: 'Shots lead +0.6 cells per extra Lead.'`, `description: 'Aims where the enemy will be: heavy shot. Added: shots lead +0.6 cells per extra Lead.'`, `look: { shape: 'chevron', color: 'green', size: 0.22 }` (green is shared with Reach by design; the content folder has no chevron+green), `first: { kind: 'shot', damage: 16, range: 4.5, rate: 1 / 1.2, projectileSpeed: 8, lead: 1.2 }`, `added: { lead: 0.6 }`, `tiers: { rare: { damageMul: 20 / 16, cooldownMul: 0.875, asAdded: 'Shots lead +0.6 cells per extra Lead.', asTower: 'Aims where the enemy will be: 20-damage heavy shot.' }, epic: { damageMul: 24 / 16, cooldownMul: 0.75, asAdded: 'Shots lead +0.6 cells per extra Lead.', asTower: 'Aims where the enemy will be: 24-damage heavy shot.' } }`. Draft pool, icon and body texture need no wiring (damage > 0 opens the draft; painters iterate `AUGMENTS`). Dart texture: `paintTexture(scene, DART_TEXTURE, 8, 14, ...)` with `roundRectPath(ctx, 1, 3, 6, 11, 3)` filled white. FxSystem is NOT touched (fizzle reuses `fx.wave`). Sfx is NOT touched (`sfx.shoot()` is already Reach's sound; fizzle plays nothing).

### Steps
1. `core/lead.ts`, 2. `content/augments/lead.ts`, 3. `content/types.ts` (3 fields), 4. `content/augments/index.ts`, 5. `core/tiers.ts`, 6. `core/augments.ts` (fields + literal + block), 7. `DraftScene.ts`, 8. dart texture (`textures.ts` const, `entities.ts` paint), 9. `barrels.ts`, 10. `towerLook.ts`, 11. `Projectile.ts`, 12. `ProjectileSystem.ts`, 13. `shot.ts`, 14. `TowerSystem.ts`, 15. `GameScene.ts`, 16. `runChecks.ts`, 17. `tests/core/lead.test.ts`, then `npm run check` and `npm run smoke`.

### Pitfalls
- The Lead shot must NOT home: it flies to a fixed impact point; that is what makes the fizzle exist. Don't "fix" fizzles by re-homing — against a full-ramp Sprinter moving directly away, even a maxed cap can still fizzle; that is intended (cap is the answer, and at normal angles/ranges more Leads connect again).
- Pooling: reset `aimX`/`aimY` in `fire()` AND clear them in `despawn()`; a stale aim on a recycled projectile makes it fly off to a dead point. Target dying mid-flight still despawns silently via `lost` (no puff — the puff means "missed", not "target died").
- Barrel texture cache key must include `chevronTip`/`chevrons` or looks collide across towers; grow the canvas (`+ w * 2.4` room when `chevronTip`) or the chevron tip paints into a hard texture edge.
- `lead: 0, leadCount: 0` are required in BOTH `EMPTY` and the `towerSpec` literal (TS errors if missing), then assigned in the count block.
- `content.test.ts` gates: `added` needs ≥1 key (`{ lead: 0.6 }` satisfies it), `asAdded` is required at every tier, `cooldownMul` must stay in (0,1); `augments.test.ts` DPS band (12, min×2) still passes with Lead's 16/1.2 ≈ 13.3.
- Lead on a Frost/Splash tower is intentionally inert (no aimed shot): `spec.lead` is set but pulse/rally/mark attacks never read it — don't add decorations or HUD for it.
- All movement uses `dt`; the `age > 5` stuck-projectile invariant still holds (aimed shots land within ~1 s). `run.rng` is untouched (Lead adds no randomness). No HUD/input/layout changes — nothing to do for 412x915.
- Shared files are being edited in parallel (types.ts, core/augments.ts, TowerSystem, runChecks, GameScene): add exactly the lines above at the positions above; if a rebase conflict appears, keep both sides.

### Tests
`tests/core/lead.test.ts`: `leadCells` (still → 0; 4 cells @2 cells/s vs 8 cells/s shot → 1.0; over cap → cap; 0 shot speed → 0); `leadAim` (still enemy → its position; 4 cells @2 cells/s → +64 units along dir; slowPct 0.5 → half lead; fast enemy → capped at 1.2 cells); caps through `towerSpec` (`lead` → 1.2; `bolt,lead` → 1.2; `lead,lead` → 1.8; `lead,lead,lead` → 2.4; `splash,lead` → 1.2 but kind `pulse`; `bolt` → 0); Lead-first spec (shot, 16 dmg, 4.5 range, rate 1/1.2, projectileSpeed 8); tier specs via `tierFirst` (16/20/24, rates 1/1.2, 1/1.05, 1/0.9, range 4.5, lead 1.2); card lines (`tierTowerLine` per tier, `tierAddedLine` identical at all tiers); look `{ shape: 'chevron', color: 'green' }`.
