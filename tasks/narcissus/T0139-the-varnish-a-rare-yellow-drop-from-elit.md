---
id: T0139
title: The Varnish — a rare yellow drop from elites
assignee: narcissus
size: M
priority: 2
status: in-progress
depends_on: [T0138]
attempts: 1
created: 2026-10-27T19:37:42Z
claimed_at: 2026-10-27T21:08:36Z
---

## Goal
Elite kills become a decision instead of a free payday: 10% of the time an elite also drops the Varnish — pick it up and you trade the shard economy for 8 s of contact immunity.

## Details
- Drop: 10% of elite kills (one seeded draw from the run RNG, the gilt-roll idiom, T0112) also drop one Varnish at the corpse: a small flat yellow circle, radius 6, 2 u ink outline, no shadow. It drifts toward the player at 20 u/s and picks up like a shard (the Gravity pickup radius, T0016, applies). Normal enemies and bosses never drop it. If not picked up within 8 s it fades out over its last 1 s.
- Pickup: plays the existing pickup pluck (no new SFX).
- The coat (8 s from pickup; a second pickup refreshes to a fresh 8 s, never stacking):
  - the player's circle wears a flat 2 u yellow outline 2 u just outside the blue fill — inside the first build ring (T0131, 4 u out) and distinct from The Palette's swatch stripes (T0097).
  - all contact damage the player takes (enemy, elite, boss or boss part) is halved, rounded down, applied after armor. Enemy bullets and continuous burns (the Gutter, T0099; the Crop, T0045; Tide, T0127; The Press wall, T0116) are not halved.
  - the platemark (T0094) still prints on a halved hit.
  - shards: while coated, a shard that reaches pickup range is not collected — it is pushed 60 u straight out from the player's center over 0.2 s, grants no XP, and comes to rest there (the push does not repeat; a pushed shard stays put). The moment the coat ends, normal pickup resumes — a shard in range at that moment is collected as usual.
- End: after 8 s the outline fades over 0.3 s and everything returns to normal.
- No new key, HUD element, scene or SFX.

## Acceptance criteria
- [ ] An elite kill has a 10% seeded chance to also drop a small flat yellow circle (radius 6, 2 u ink outline) that drifts toward the player and can be picked up; normal enemies and bosses never drop it; an unpicked Varnish fades out after 8 s.
- [ ] Picking it up plays the existing pickup pluck and puts a flat 2 u yellow outline on the player's circle for exactly 8 s; a second pickup while coated refreshes to a fresh 8 s.
- [ ] While coated, contact damage from any shape is halved (rounded down, after armor); enemy bullets and continuous burns are unaffected; the platemark still prints on a halved hit.
- [ ] While coated, a shard in pickup range pops 60 u away and grants no XP, and once the coat ends the same shard picks up normally if still in range.
- [ ] After 8 s the outline fades over ~0.3 s; no new key, HUD element, scene or SFX; the same seed gives the same Varnish drops.

## Design (architect, desktop)

### Files
- create `src/core/varnish.ts` - pure rules: `VARNISH` constants, `rollVarnish()`, `coatContactDamage()`, `VarnishCoat` state (modeled on `core/fermata.ts`)
- create `src/entities/Varnish.ts` - pooled drop image (modeled on `Shard.ts`), `drop(x,y)`/`despawn()`
- create `src/systems/VarnishSystem.ts` - drop pool + drift/magnet/fade, pickup, ticks `run.varnish`, drives the player ring
- create `tests/core/varnish.test.ts` - unit tests (below)
- edit `src/core/run.ts` - add `readonly varnish = new VarnishCoat()` (next to `rest`, line ~37) and the `contact` param + halving in `takeDamage()`
- edit `src/entities/Player.ts` - new `varnishRing` graphics (modeled on `buildRings`): ctor line after line 47, `syncBarrel()` after line 130, `destroy()` after line 150
- edit `src/entities/Shard.ts` - 4 push fields + reset in `drop()`
- edit `src/systems/PickupSystem.ts` - coated branch in `update()` + `startPush()`/`tickPush()` private methods + `import { VARNISH } from '../core/varnish'`
- edit `src/systems/CombatSystem.ts` - `import type { VarnishSystem }` + `import { rollVarnish } from '../core/varnish'`, append `varnishes: VarnishSystem` to ctor, elite roll in `killEnemy()`, `takeDamage(..., true)` at line 89 only
- edit `src/systems/BossSystem.ts` - line 389: `this.run.takeDamage(grid.armDamage, true);` line 553: `this.run.takeDamage(damage, true);`
- edit `src/art/textures.ts` - `varnish: 'varnish'` in TEX (after `shardGilt`); in `generateTextures` after line 92: `graphicsTexture(scene, TEX.varnish, 18, 18, (g) => drawShape(g, 'circle', 9, 9, 6, PALETTE.yellow, { outlineWidth: 2, shadow: false }));`
- edit `src/scenes/GameScene.ts` - imports (`VarnishSystem` after `Underdrawing` line 39; `VARNISH` from core after `vec` line 14), field `private varnishes!: VarnishSystem;` after line 82, `this.varnishes = new VarnishSystem(this, this.run, this.player, this.fx, this.sfx);` after line 134, `, this.varnishes` appended to the CombatSystem ctor call (line 139), `this.varnishes.update(dt);` after line 196, `varnish` invariant after the `rest` invariant (line 449)
- edit `docs/ARCHITECTURE.md` - extend the step-6 line: after pickups, `VarnishSystem.update` ages the rare elite Varnish drops (drift 20 u/s, shard-like pickup) and ticks the 8 s coat (halved contact, shards pushed out)

### Interfaces
```ts
// core/varnish.ts
export const VARNISH = { dropChance: 0.1, radius: 6, driftSpeed: 20, lifeSec: 8, fadeTailSec: 1, coatSec: 8, coatFadeSec: 0.3, shardPush: 60, shardPushSec: 0.2 } as const;
export function rollVarnish(rng: Rng): boolean;                 // one rng.chance draw, gilt-roll idiom
export function coatContactDamage(afterArmor: number): number;  // Math.floor(afterArmor / 2)
export class VarnishCoat { get coated(): boolean; get active(): boolean; get leftSec(): number; get alpha(): number; refresh(): void; update(dt: number): void; }
// core/run.ts (changed)
takeDamage(amount: number, contact: boolean = false): number;   // after armor: if (contact && this.varnish.coated) dealt = coatContactDamage(dealt)
readonly varnish: VarnishCoat;
// entities/Shard.ts (new fields, reset in drop())
pushed = false; pushTime = 0; pushTargetX = 0; pushTargetY = 0;
// entities/Player.ts (new)
readonly varnishRing: Phaser.GameObjects.Graphics; // lineStyle(2, PALETTE.yellow, 1); strokeCircle(0,0, PLAYER_RADIUS + 2); depth DEPTH.playerBarrel; hidden by default
// systems/VarnishSystem.ts
export class VarnishSystem {
  readonly drops: Phaser.GameObjects.Group; get activeCount(): number;
  constructor(scene: Phaser.Scene, run: RunState, player: Player, fx: FxSystem, sfx: Sfx);
  drop(x: number, y: number): void;  update(dt: number): void;
}
```

### Steps
1. `src/core/varnish.ts` exactly as the interface (same doc style as `fermata.ts`).
2. Texture + `entities/Varnish.ts` (fields `age, magnetized, vx, vy`; `drop()` resets all + `setAlpha(1)` + `DEPTH.pickups`).
3. `run.ts`: field + `takeDamage` (update the doc comment: "Contact hits while the varnish coat is active are halved (rounded down) after armor"). Default param keeps every existing caller/test working.
4. `Player.ts` ring (radius `PLAYER_RADIUS + 2` = 18 — the +2/+3/+4 ladder: varnish 18, Palette stripe 19, build ring 20).
5. `Shard.ts` push fields; `PickupSystem.ts`: hoist `const coated = this.run.varnish.coated;` above the loop; replace the collect block with:
```ts
if (coated) {
  if (s.pushTime > 0) { this.tickPush(s, dt); s.rotation += dt * 2; continue; }
  if (s.pushed) { s.rotation += dt * 2; continue; } // at rest: stays put until the coat ends
  if (dist < COLLECT_DISTANCE) { this.startPush(s, dx, dy, dist); continue; }
} else if (dist < COLLECT_DISTANCE) { /* existing collect block, unchanged */ }
```
`startPush`: `s.pushed = true; if (dist < 0.001) return;` (center case: rests there) else `s.pushTargetX = s.x - (dx / dist) * VARNISH.shardPush;` (same for Y), `s.pushTime = VARNISH.shardPushSec;`. `tickPush`: speed = `VARNISH.shardPush / VARNISH.shardPushSec`; decrement `pushTime`; if `d <= speed * dt || s.pushTime <= 0` snap to target and `pushTime = 0`, else move `speed * dt` toward target. No XP, no SFX, no FX on push.
6. `systems/VarnishSystem.ts`: local `const COLLECT_DISTANCE = 22; const MAGNET_ACCEL = 2400; // mirrors PickupSystem — keep in sync` and `MAX_DROPS = 4`. `update()`: `this.run.varnish.update(dt);` then `this.player.varnishRing.setAlpha(this.run.varnish.alpha).setVisible(this.run.varnish.active);` then per drop: `age += dt`, despawn at `VARNISH.lifeSec`, collect at `< COLLECT_DISTANCE` (`this.run.varnish.refresh(); this.fx.pickup(v.x, v.y); this.sfx.pickup(); v.despawn();`), else magnet inside `run.stats.pickupRadius` (shard math) or drift `VARNISH.driftSpeed` u/s toward the player, then `v.setAlpha(Math.min(1, (VARNISH.lifeSec - v.age) / VARNISH.fadeTailSec))`.
7. `CombatSystem.ts`: `killEnemy()` elite branch, after the shard loop and before `hook.stats.elitesKilled += 1;`: `if (rollVarnish(this.run.rng)) this.varnishes.drop(e.x, e.y);`. Line 89 → `this.run.takeDamage(e.contactDamage, true);` (line 104 bullet stays unhalved).
8. `BossSystem.ts` two lines; `GameScene.ts` six placements incl. invariant:
```ts
hook.addInvariant('varnish', () => {
  const coat = this.run.varnish;
  if (coat.leftSec > VARNISH.coatSec + 1e-6) return `varnish coat ${coat.leftSec} s`;
  if (this.player.varnishRing.visible !== coat.active) return `varnish ring visible ${this.player.varnishRing.visible} but coat active ${coat.active}`;
  if (this.varnishes.activeCount > 4) return `${this.varnishes.activeCount} varnish drops on screen`;
  return null;
});
```
9. `tests/core/varnish.test.ts` (below); `docs/ARCHITECTURE.md` line. Run `npm run check` and `npm run smoke` — both must pass.

### Pitfalls
- Halving must happen **inside** `takeDamage` **after** armor. Pre-halving the input at call sites is wrong (10 dmg, 2 armor → must deal 4, not 3). Never pass `contact: true` for `onPlayerShot` or `run.drain()` (Crop/Gutter burns, future Tide/Press wall).
- Exactly one RNG draw, only in the elite branch of `killEnemy`, after the six shard gilt rolls. No draw for normal kills or bosses, or seeded runs desync.
- `run.ts`, `GameScene.ts`, `CombatSystem.ts`, `PickupSystem.ts` are being edited by open tasks right now (T0138 in progress rewrites `PickupSystem.update`). Re-read each file and re-anchor on the stated lines immediately before editing; add only the listed lines, never reformat neighbors.
- Division by `dist`: safe because collect/push triggers first at `< 22`; keep that order. In `tickPush` the `d <= step` check must come before any `tx / d` use.
- Ring depth `DEPTH.playerBarrel` (39, under the player sprite) is intentional — same as stripe/build rings; do not "fix" it. No new HUD/input/SFX/scene (ring is world-space, zoom-scales on mobile).
- Pooled resets: `Varnish.drop()` resets every field; `Shard.drop()` resets the four push fields.

### Tests
`tests/core/varnish.test.ts`: roll deterministic under a fixed seed; fraction in [0.06, 0.14] over 1000 rolls; exactly one draw per roll (`rollVarnish(a) === b.next() < VARNISH.dropChance`); pins `dropChance 0.1`, `coatSec 8`, `shardPush 60`; coat refresh resets to full 8 s (refresh at 5 s left, 5 s later → 3 s left, not 11); alpha 1 while coated then 1→0 over 0.3 s, `active` false after; `takeDamage(10, true)` with 2 armor (two `mass` upgrades from `UPGRADE_BY_ID`) → 4, `takeDamage(9, true)` → 3, `takeDamage(10, false)` → 8, 1-dmg-after-armor contact → 0, full damage again after 10 s of `update`.
