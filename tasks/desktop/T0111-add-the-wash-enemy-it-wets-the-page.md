---
id: T0111
title: Add the Wash enemy — it wets the page
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T13:24:32Z
claimed_at: 2026-10-27T15:11:41Z
finished_at: 2026-10-27T15:21:56Z
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

## Design (architect, desktop)

### Files
- create `src/content/enemies/wash.ts` - Wash enemy data: `chase` + new `puddle` tuning, note `LEAVES THE PAGE WET`
- create `src/systems/PuddleSystem.ts` - pooled puddle decals: drop/age/fade, per-wash cap, player-slow query
- edit `src/content/types.ts` - new `PuddleDef` interface; optional `puddle?: PuddleDef` on `EnemyDef` (after `shoot`)
- edit `src/content/enemies/index.ts` - import `wash`, append to `ENEMIES` (10th enemy; bar is "more than 10", OK)
- edit `src/art/textures.ts` - `puddle: 'puddle'` key in `TEX` + 128x128 texture drawn in `generateTextures`
- edit `src/entities/Enemy.ts` - puddle timer + pending flag + `consumePuddle()`, both reset in `spawn()`
- edit `src/systems/SpawnSystem.ts` - ctor takes `PuddleSystem`; on `consumePuddle()` call `puddles.drop(...)`
- edit `src/scenes/GameScene.ts` - own `PuddleSystem`, multiply move speed, `puddles.update(dt)`, `puddle-pool` invariant
- edit `tests/content.test.ts` - puddle-tuning sanity test (mirrors the `shoot tuning` test)

### Interfaces
```ts
// content/types.ts
export interface PuddleDef {
  periodSec: number; // seconds between puddles (2.0)
  radius: number;    // world units (60 = 120 across)
  lifeSec: number;   // 2.0
  fadeSec: number;   // 0.5 fade at the end
  maxAlive: number;  // max per single spawn (3); a new one removes the owner's oldest
  slowMul: number;   // player move-speed multiplier while its center is inside (0.8)
}
// on EnemyDef:  puddle?: PuddleDef;

// systems/PuddleSystem.ts
export class PuddleSystem {
  constructor(scene: Phaser.Scene);  // pre-creates 12 hidden Images: TEX.puddle, depth DEPTH.floor + 1 (under entities, like platemarks)
  get maxPuddles(): number;
  get activeCount(): number;
  drop(x: number, y: number, ownerSerial: number, def: PuddleDef): void;
  playerSpeedMul(x: number, y: number): number; // min slowMul of puddles containing the point, else 1
  update(dt: number): void;
}
// entities/Enemy.ts:  consumePuddle(): boolean   // one-shot, same pattern as consumeShot()/consumeSlam()
```

### Steps
1. `types.ts`: add `PuddleDef` (fields above, one-line comment each) and `puddle?: PuddleDef;` on `EnemyDef`.
2. `wash.ts` (copy `wedge.ts` shape): `id:'wash', name:'Wash', note:'LEAVES THE PAGE WET', hp:35, speed:55, contactDamage:6, xp:2, threat:2, spawnWeight:4, unlockAtSec:120, behavior:'chase', knockbackResist:0.3, look:{shape:'circle', radius:14, body:PALETTE.blueLight, accent:PALETTE.ink}, puddle:{periodSec:2, radius:60, lifeSec:2, fadeSec:0.5, maxAlive:3, slowMul:0.8}`.
3. `enemies/index.ts`: `import { wash } from './wash';` + append `wash` to `ENEMIES`.
4. `textures.ts`: in `generateTextures` next to the platemark: `graphicsTexture(scene, TEX.puddle, 128, 128, (g) => { g.fillStyle(PALETTE.blue, 0.25); g.fillCircle(64, 64, 60); g.lineStyle(2, PALETTE.ink, 1); g.strokeCircle(64, 64, 60); });` — raw fill/stroke, NOT `drawShape` (it forces alpha 1 and the paper-cut shadow).
5. `PuddleSystem.ts`: exactly the API above. Entry `{img, active, x, y, age, owner, radius, lifeSec, fadeSec, slowMul}`. `drop()`: count the owner's active puddles; if `>= def.maxAlive` despawn its oldest (largest `age`); slot = first inactive entry, else the globally oldest; set every field; `img.setPosition(x, y).setAlpha(1).setVisible(true)`. `update(dt)`: `age += dt`; `age >= lifeSec` → despawn (`active=false; img.setAlpha(0).setVisible(false)`); else `img.setAlpha(age > lifeSec - fadeSec ? (lifeSec - age) / fadeSec : 1)`. `playerSpeedMul`: squared-distance check `dx*dx + dy*dy <= radius*radius`.
6. `Enemy.ts`: fields `private puddleTimer = 0; private puddlePending = false;`. In `spawn()` (after the slam resets): `this.puddleTimer = this.def.puddle ? this.def.puddle.periodSec : 0; this.puddlePending = false;`. In `steer()`, after the behavior switch, before the knockback decay: `if (this.def.puddle) { this.puddleTimer -= dt; if (this.puddleTimer <= 0) { this.puddlePending = true; this.puddleTimer = this.def.puddle.periodSec; } }`. Add `consumePuddle()` beside `consumeSlam()`.
7. `SpawnSystem.ts`: ctor param `puddles: PuddleSystem` (last position). In the enemy loop, after the `consumeSlam` line: `if (e.consumePuddle() && e.def.puddle) this.puddles.drop(e.x, e.y, e.serial, e.def.puddle);`
8. `GameScene.ts`: field `private puddles!: PuddleSystem;`; in `create()` `this.puddles = new PuddleSystem(this);` right after `new FxSystem`; pass it last into `new SpawnSystem(...)`; in `update()` change the drive line to `this.player.drive(input.move, run.stats.moveSpeed * this.puddles.playerSpeedMul(this.player.x, this.player.y));` and add `this.puddles.update(dt);` after `this.marginalia.update(dt);`; add invariant `hook.addInvariant('puddle-pool', () => (this.puddles.activeCount <= this.puddles.maxPuddles ? null : \`${this.puddles.activeCount} puddles on screen\`));` and `'puddle-pool'` in the `INVARIANTS` array.
9. `content.test.ts`: add the test below. Then run `npm run check` and `npm run smoke`.

### Pitfalls
- Pooled enemies: `spawn()` must reset BOTH `puddleTimer` and `puddlePending`, or a recycled Wedge fires a stale puddle.
- Own puddles by `serial` (unique per spawn) — never by Enemy reference; pooled enemies are reused with a new serial (same reason as in `Marginalia`).
- Puddles get no physics body, no damage, no targetability; the slow is applied only in `GameScene` via `playerSpeedMul`, so knockback (slam shove), enemies, enemy shots and shards are untouched.
- The 0.25 alpha is baked into the texture; runtime alpha handles only the final 0.5 s fade (1 → 0).
- Texture is 1:1 world units: 128 px = 128 u, so the 2 px line is a 2 u outline. No shadow → no `PAD` padding needed.
- `SpawnSystem` ctor signature changes — `GameScene` is its only caller; update both in the same step or typecheck fails.
- `GameScene.ts` is also touched by open T0102/T0110 — keep edits in disjoint regions (system wiring, drive line, invariants).

### Tests
The spawn-unlock pattern (`tests/content/director.test.ts`) covers Wash automatically via `it.each(ENEMIES)` — absent at 119 s, present at 120 s; no code needed. Add to `tests/content.test.ts` next to the `shoot tuning` test:
```ts
it.each(ENEMIES.filter((e) => e.puddle).map((e) => [e.id, e] as const))('%s puddle tuning is sane', (_id, e) => {
  const p = e.puddle!;
  expect(positive(p.periodSec) && positive(p.radius) && positive(p.lifeSec), 'puddle numbers > 0').toBe(true);
  expect(p.fadeSec > 0 && p.fadeSec < p.lifeSec, 'fadeSec in (0, lifeSec)').toBe(true);
  expect(Number.isInteger(p.maxAlive) && p.maxAlive >= 1, 'maxAlive integer >= 1').toBe(true);
  expect(p.slowMul > 0 && p.slowMul <= 1, 'slowMul in (0, 1]').toBe(true);
});
```

## Result (attempt 1, desktop)

Added the Wash enemy (T0111), the first arena-persistent enemy: a pale blue circle (`content/enemies/wash.ts`, 35 hp, 55 u/s chase, unlocks at 2:00) that wets the paper behind it. A new pooled `PuddleSystem` drops flat 120 u pale-blue puddles (128 px texture, 0.25 alpha, 2 u ink outline) every 2 s — max 3 per Wash, 2 s life with a 0.5 s fade, drawn under entities — and slows the player to exactly 80 % of move speed while its center is inside; enemies, shots and shards are unaffected. The `puddle?` tuning lives on `EnemyDef` as `PuddleDef`, the timer/flag ride on the pooled `Enemy` (reset in `spawn()`), and "LEAVES THE PAGE WET" prints as marginalia on first sighting. Verified: `npm run check` (245 tests, including the new puddle-tuning test and the spawn-unlock pattern covering the Wash) and `npm run smoke` both pass on desktop and mobile.

- Self-review: APPROVE
- Time: 10.3 min

```
game/src/art/textures.ts          |  10 +++
 game/src/content/enemies/index.ts |   3 +-
 game/src/content/enemies/wash.ts  |  32 +++++++++
 game/src/content/types.ts         |  18 ++++++
 game/src/entities/Enemy.ts        |  20 ++++++
 game/src/scenes/GameScene.ts      |  11 +++-
 game/src/systems/PuddleSystem.ts  | 133 ++++++++++++++++++++++++++++++++++++++
 game/src/systems/SpawnSystem.ts   |   6 +-
 game/tests/content.test.ts        |   8 +++
 9 files changed, 236 insertions(+), 5 deletions(-)
```
