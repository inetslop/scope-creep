---
id: T0102
title: "Bulwark: the plate that faces the road"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 2
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T12:24:22Z
---

## Goal
The enemy queue's head (the Mute, T0074, has landed): a fat slow walker whose front half takes half damage — the first enemy for which the side of the road a tower sits on changes the damage that tower deals.

## Details
- Closest existing enemy: Block (a plain slow walker). What is new: directional damage — its front side reduces the damage it takes, so a tower downstream (shooting into the plate) is worth less than one upstream (shooting the rear), and placement along the road becomes a real decision against it.
- Look: a fat round — a circle at 1.25× Block's size — red (a repeated family color: the warm palette is closed, T0074's lesson), with a flat plate on its front half: a flat arc across the front third of the disc in the token's darker side-face red, turning to face its direction of travel. The usual darker side face and soft shadow.
- Movement: 80% of Block's speed, walks (no behavior besides the plate).
- Survivability: exactly Block's hp (the plate is not hp); wave escalation applies as usual. Threat 1 (Block's). Gold: the normal Block bounty. Leak: 1 life, as usual.
- Damage rule: the plate covers the enemy's forward 180° (the direction it travels along the road). A directed shot whose travel is with the enemy's direction of travel (striking the plate — a tower downstream shooting upstream) deals 50% of its damage; a directed shot traveling against it (striking the rear — a tower upstream shooting downstream) deals 100%; a dead-side hit (exactly perpendicular) counts as the rear (100%). Damage with no flight direction — pulse rings, trap springs, burn ticks, the beam — always deals full.
- Waves: from wave 12, one Bulwark on waves 12, 16, 20, 24, … — reserved in the wave plan and kept out of the budget picks (the Hauler/Mute pattern).
- Its death is an ordinary kill: gold, combo, Mint, the kills line and the "stopped" count all fire normally. The name tag (T0085) announces "Bulwark" on its first spawn; the wave preview, icon and sounds pick it up the way the Hauler's did (T0057).
- It lives in its own content file (the Mute's own-files pattern, T0074), so it lands beside the shared-augment queue.

## Acceptance criteria
- [ ] From wave 12 on, waves 12, 16, 20, … each contain exactly one Bulwark (reserved in the plan, not added by the budget picks); waves 1–11 are byte-identical to today.
- [ ] A tower downstream of a Bulwark (shooting its plate) deals half the damage the same tower deals to a Block; a tower upstream (shooting the rear) deals full; pulse/trap/beam/burn-tick damage is full either side.
- [ ] The plate faces the direction of travel and turns with it; the token is red, 1.25× Block's size, round, plate in the darker side-face red.
- [ ] A Bulwark leak costs 1 life like any enemy's; its kill pays the normal gold with the normal pop, and the kills line counts it.
- [ ] The first spawn shows the "Bulwark" name chip (T0085); the wave preview shows its token and count.

## Design (architect, desktop-4070)

### Files
- create `src/content/enemies/bulwark.ts` — model `mute.ts`: id 'bulwark', name 'Bulwark', description 'Wears a plate across its front: shots into the face are halved, into the back they go through.', behavior 'walk', hp 120 (Block's), speed 0.72 (80% of Block's), gold 10, livesCost 1, threat 1 with comment `// placeholder: the Bulwark never gets drawn from the budget`, fromWave 12, `plate: 0.5`, look `{ shape: 'circle', color: 'red', size: 0.325 }`.
- edit `src/content/enemies/index.ts` — `import { bulwark } from './bulwark';` after the block import; in `ENEMIES`, `bulwark,` on one line right after `mute,`.
- edit `src/content/types.ts` — EnemyDef, after `splitsInto?: string;`: `/** Multiplies damage from a directed shot that strikes its front (flying against its travel); the rear and flightless hits go whole (core/plate.ts). */ plate?: number;`
- create `src/core/plate.ts` — pure, no imports: `export function plateMul(plate: number, fx: number, fy: number, dx: number, dy: number): number { return fx * dx + fy * dy < 0 ? plate : 1; }` plus doc comment (shot flight vs travel; strict `< 0`: perpendicular and forward flight go whole).
- edit `src/core/waves.ts` — three edits: (1) walkers filter append `&& e.id !== 'bulwark'`; (2) after the mute-reserved line: `// The Bulwark: one on 12, 16, 20, ... (it never comes from the budget; its threat is a placeholder).` then `if (wave >= 12 && (wave - 12) % 4 === 0) reserved.push('bulwark');`; (3) after the Mute re-add line: `// A Bulwark wave always sends its Bulwark, even when the halving would drop it: it walks in first.` then `if (wave >= 12 && (wave - 12) % 4 === 0 && !finalSpawns.some((s) => s.enemy === 'bulwark')) finalSpawns = [{ enemy: 'bulwark', delaySec: 0 }, ...finalSpawns];`
- edit `src/systems/EnemySystem.ts` — import `plateMul` from '../core/plate'; give `hit()` and `strike()` optional 3rd param `flight?: { x: number; y: number }`; in `hit()` pass it through: `for (const e of victims) this.strike(e, payload, flight);`; in `strike()` replace the damage line with `const damage = payload.damage * (flight && e.def.plate !== undefined ? plateMul(e.def.plate, flight.x, flight.y, e.dirX, e.dirY) : 1); if (payload.damage <= 0 || !e.hit(damage)) return false;`
- edit `src/systems/ProjectileSystem.ts` — in `land()`, after the payload line add `const flight = { x: p.fx, y: p.fy };` and pass it as 3rd arg to both `this.enemies.hit(target, payload, flight);` and `this.enemies.strike(target, payload, flight);`.
- edit `src/entities/Projectile.ts` — fields `fx = 1; fy = 0;` (unit vector, the way it flies); in `fire()` after the position is set, toward its target: `const d = Math.hypot(target.x - x, target.y - y); if (d > 0) { this.fx = (target.x - x) / d; this.fy = (target.y - y) / d; }`; in `advance()` after `const dist = ...`: `if (dist > 0) { this.fx = dx / dist; this.fy = dy / dist; }` (re-firing a pierce leg calls fire(), so each leg gets its own flight).
- edit `src/entities/Enemy.ts` — add field `private plate?: Phaser.GameObjects.Image;`; add PLATE_TEXTURE to the art/textures import; at the end of spawn() after `setVisible(true)`: if `this.def.plate !== undefined && !this.plate` create `this.plate = this.scene.add.image(0, 0, PLATE_TEXTURE); this.plate.setDepth(DEPTH.enemies);`, then always `this.plate?.setVisible(false);` (spawn frame: enemy scale is 0 — advance places it); in advance() after the final `setPosition(...)`: `if (this.plate && this.def.plate !== undefined) { this.plate.setPosition(this.x, this.y).setScale(ART_SCALE * pop).setRotation(Math.atan2(this.dirX, -this.dirY)).setVisible(true); }`; in despoon… in despawn() add `this.plate?.setVisible(false);`.
- edit `src/art/textures.ts` — add `export const PLATE_TEXTURE = 'enemy:plate';` and `export const tokenDepth = (r: number): number => Math.max(2, r * 0.18);`.
- edit `src/art/entities.ts` — enemy loop uses `tokenDepth(r)` for depth; after the CHIP block paint the plate: `const bR = getEnemy('bulwark').look.size * CELL; const bDepth = tokenDepth(bR); const plateSize = tokenRoom(bR, bDepth) * 2; paintTexture(scene, PLATE_TEXTURE, plateSize, plateSize, (ctx) => { ctx.strokeStyle = rgba(deepOf('red'), 1); ctx.lineWidth = bR * 0.34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(plateSize / 2, plateSize / 2 - bDepth / 2, bR * 0.72, -Math.PI / 2 - Math.PI / 3, -Math.PI / 2 + Math.PI / 3); ctx.stroke(); });` (flat, no shading — it rotates at runtime; import `getEnemy` from '../content/enemies' and the two new textures exports).
- create `tests/core/plate.test.ts` — vitest: `plateMul(0.5, -1, 0, 1, 0)` and `(0.5, 1, 0, -1, 0)` → 0.5 (both directions into the face); `(0.5, 1, 0, 1, 0)` chase → 1; `(0.5, 0, 1, 1, 0)` exactly perpendicular → 1.
- edit `tests/core/waves.test.ts` — in the budget test's skip filter add `&& s.enemy !== 'bulwark'`; in the quiet-wave cap test filter (the one excluding `'mute'`, waves [4,8,12,16,20,24]) also exclude `'bulwark'`; new test: for wave 1..30, `planWave(wave, new Rng(wave), ENEMIES)` has exactly `wave >= 12 && (wave - 12) % 4 === 0 ? 1 : 0` bulwarks.

### Interfaces
`plateMul(plate, fx, fy, dx, dy): number` — plate if flight opposes travel, else 1. `EnemyDef.plate?: number`. `EnemySystem.hit/strike(target, payload, flight?)` — flightless (pulse/burn/traps) omit it → always full. `Projectile.fx/fy` refreshed every advance.

### Steps
1 bulwark.ts + registry; 2 types.ts field; 3 plate.ts; 4 waves.ts (three edits); 5 EnemySystem flight param + damage line; 6 Projectile fx/fy; 7 ProjectileSystem passes flight; 8 Enemy plate image (lazy spawn+hide, advance sync, despawn hide); 9 textures consts; 10 entities.ts plate paint; 11 tests.

### Pitfalls
- Enemy extends Image — no `add()`; the plate is a scene-managed Image with explicit setVisible, never a child.
- Hide the plate in spawn(): showing it there flashes at (0,0) for a frame; advance() places and shows it every frame.
- despawn must hide it or a recycled pooled slot shows a stale plate on e.g. a dot.
- Rotation is `Math.atan2(dirX, -dirY)` (tracer convention), never atan2(dy, dx); rotate only the flat plate, never the shaded token.
- Strict `< 0`: perpendicular counts as rear = full.
- Every Bulwark wave is a quiet wave: without the post-halve re-add the single reserved one is dropped.
- hit/strike flight param must stay optional so pulse/burn ticks/traps automatically deal full.

### Tests
npm run check (typecheck+lint+unit tests) and npm run smoke (desktop + phone); new plate/waves tests above; content test passes by construction (hp 120, speed 0.72, gold 10, livesCost 1, fromWave 12, red, size 0.325).

## Attempt 1 interrupted (desktop-4070)

The machine was shut down by hand mid-task and paused. Requeued for any machine.
