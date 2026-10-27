---
id: T0124
title: The Redactor — the first pre-run pick
assignee: asus
size: L
priority: 2
status: done
depends_on: [T0117, T0123]
attempts: 1
created: 2026-10-27T15:42:50Z
claimed_at: 2026-10-27T20:44:46Z
finished_at: 2026-10-28T00:18:15Z
design_attempts: 1
---

## Goal
Player agency returns in the only sanctioned form — a loadout you choose before the run, not a system that is simply always there: after the first run ends, the menu offers The Redactor, and while picked, the run carries one active, Redact, that erases the ink coming at you. It costs a lighter shard economy, so every run is a real decision about it.

## Details
- Availability and persistence: after the first completed run (any length, the game-over card has landed), a small ink-eraser glyph (40 px, flat ink, house style) appears beside the menu's start button — 16 px to its right, vertically centered with it. Tapping/clicking it toggles the pick for the next run; the setting persists between sessions exactly like the best score does (the T0114 storage pattern). The first time the glyph appears, a one-line note "NEW IN THE STUDIO — THE REDACTOR" fades in under it over 3 s (the marginalia idiom). While marked, the glyph fills with ink.
- The label, one line in small caps at The Index's type size (T0104), sits under the start-button row without overlapping the start button or the Warm Start hint line (T0114): "REDACTOR — ERASES THE INK · SHARDS HALF". Build on the menu layout T0114 adds; if it has not landed when this is built, place the line where its description says it lands.
- The cost: while the Redactor is picked, every shard you pick up is worth half XP (rounded down) — normal, gilt (3× before halving) and boss-death shards alike; the XP pops show the halved value. An unpicked run's economy is byte-identical to today.
- The active — Redact: Space (desktop), Y (gamepad), or a 64 px touch button in the bottom-right corner beside the existing touch pause button (12 px gap, not overlapping it or the Inkwell meter; a proper thumb target). Triggering Redact: every enemy bullet within 140 units of the player is erased — each dies in a small flat ink ring at its position (the existing ring FX); every normal enemy and elite within 140 units is slowed to 60% speed for 2.5 s, each flashing pale blue once (100 ms) at the moment of Redact. Bosses and their parts (swatches, arms, the Press's wall and blocks) are never slowed. A retrigger refreshes the slow timer on already-slowed enemies. Enemy bullets are not restored.
- Cooldown: 12 s from each trigger; it burns even if nothing is in range; a trigger during cooldown is rejected. The cooldown is the only new HUD element and it is the button itself: a flat 64 px ink circle with the input's glyph in small caps inside (the letter on desktop, the gamepad button letter on a pad, a small eraser glyph on touch) and a thin (2 px) ink ring around it that drains clockwise from full as the cooldown recovers — full ring means ready. It must sit cleanly in the bottom-right corner at 412x915 and 1280x720, never overlapping the pause button or the Inkwell meter.
- Teaching: while the Redactor is picked, the first second of every run prints a small-caps note in the HUD that fades over 2 s in the nameplate idiom (T0064) — "THE REDACTOR ERASES — SPACE" on desktop, "THE REDACTOR ERASES — Y" on gamepad, "THE REDACTOR ERASES" on touch. The pause controls card (T0123) lists the Redactor's input with the other inputs, but only while the loadout is picked.
- One new SFX: a ~120 ms filtered paper-swipe noise at about half the gain of a hit, on each trigger (the T0109 filtered-noise idiom) — the page being cleaned.
- Redact is only usable while the game is running — not while paused, in a level-up overlay, or in the menu.
- A pure rule module in `src/core/` with unit tests in the underexposure pattern (T0105): the half-XP rounding (including the gilt 3×-then-half case), the cooldown timing, the slow-and-refresh rule, and the 140 u radius membership.
- The upgrade pool and the enemy pool are untouched (no card, no enemy); no new scene; no new keys beyond the one active's.

## Acceptance criteria
- [ ] After the first completed run, the eraser glyph appears beside the start button with the "REDACTOR — ERASES THE INK · SHARDS HALF" label; toggling it persists across a page reload; the "NEW IN THE STUDIO — THE REDACTOR" note plays exactly once.
- [ ] In a picked run, the 64 px ink circle (key glyph inside, 2 px ring) sits in the bottom-right corner on desktop, gamepad and touch without overlapping the pause button or the Inkwell meter at 1280x720 or 412x915; the ring drains clockwise over 12 s from each trigger and is full when ready.
- [ ] Triggering Redact (Space / Y / touch) erases every enemy bullet within 140 u of the player, each in a small flat ink ring, and slows every normal enemy and elite within 140 u to 60% speed for 2.5 s with a one-shot 100 ms pale blue flash; bosses and their parts are unaffected; a trigger during the 12 s cooldown is rejected; a retrigger refreshes existing slows.
- [ ] While the Redactor is picked, every shard pickup is worth half XP (rounded down; a gilt shard is 3× before halving) and the XP pop shows the halved value; an unpicked run's economy is unchanged.
- [ ] At the start of a picked run, "THE REDACTOR ERASES — SPACE" (or the device's own key name) fades over 2 s; the pause controls card lists the Redactor's input only while the loadout is picked.
- [ ] The pure rule module is unit-tested (half-XP rounding including gilt, cooldown timing, slow refresh, radius membership); `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, desktop)

### Files
- create `src/core/redactor.ts` - pure rules (half-XP, RedactClock cooldown, slow tick, 140 u radius) + localStorage flags, warmStart.ts pattern
- create `src/systems/RedactSystem.ts` - the Redact active: input edge, erase bullets, slow enemies, cooldown
- create `tests/core/redactor.test.ts` - underexposure-pattern unit tests
- edit `src/entities/Enemy.ts` - `slowLeft` field, `redact()` trigger method, slow tick in `steer()`, reset in `spawn()`
- edit `src/input/Controls.ts` - `ControlState.redact`, SPACE in addKeys, gamepad Y
- edit `src/input/TouchSticks.ts` - `ignoreZones` so a touch on the Redact button doesn't spawn the aim stick
- edit `src/scenes/HudScene.ts` - 64 px button + 12 s ring (bottom-right), device glyph, first-second note, ignore-zone wiring
- edit `src/scenes/MenuScene.ts` - eraser glyph + label + one-time note + toggle + start-guard + row shift
- edit `src/scenes/GameOverScene.ts` - `saveRedactorUnlocked()` in create() (the card has landed)
- edit `src/scenes/PauseScene.ts` - Redactor input line in T0123's controls card, only while picked
- edit `src/systems/PickupSystem.ts` - constructor flag, halved value in `collect()` (both the normal and pool-full paths)
- edit `src/scenes/GameScene.ts` - construct system, `redact.update(dt, input.redact)` after `pickups.update`, event binding, registry, 2 invariants
- edit `src/scenes/keys.ts` - `GAME_EVENTS.redactRequest: 'redact-request'`, `getRedact(scene)` (type-only import of RedactSystem)
- edit `src/audio/Sfx.ts` - `redact()` after `gutterSlap()`: `this.noise(0.12, 0.11, 900, 'lowpass')` (T0109 idiom, half a hit's 0.22 gain)
- edit `src/art/shapes.ts` - reuse existing `drawBar` for the eraser glyph; no new file needed

### Interfaces
```ts
// core/redactor.ts
export const REDACT_RADIUS = 140; export const REDACT_COOLDOWN_SEC = 12;
export const REDACT_SLOW_SEC = 2.5; export const REDACT_SLOW_MUL = 0.6; export const REDACT_FLASH_MS = 100;
export function redactorShardXp(base: number, gilt: boolean, picked: boolean): number; // !picked: shardXp unchanged; picked: Math.floor(shardXp/2)
export function redactSlowTick(slowLeftSec: number, dtSec: number, retriggered: boolean): { left: number; mul: number };
export function inRedactRadius(px: number, py: number, x: number, y: number): boolean; // closed circle: <= r^2
export class RedactClock { get ready(): boolean; get cdLeft(): number; trigger(): boolean; update(dt: number): boolean; }
// storage: load/saveRedactorUnlocked, load/saveRedactorPick, loadRedactorNoteSeen/saveRedactorNoteSeen (keys scope-creep.redactor-unlocked/-pick/-note, '1'/'0', try/catch)
// RedactSystem: constructor(player, enemies: Group, shots: Group, fx, sfx, picked: boolean);
//   get ringFrac(): number // ready ? 1 : cdLeft / 12 (full ring = ready)
//   request() // HUD touch edge; reset() // on resume; update(dt, redactInput)
// Enemy: slowLeft = 0; redact() { slowLeft = 2.5; setTintFill(PALETTE.blueLight); flashMs = REDACT_FLASH_MS; }
// ControlState: + redact: boolean // keyboard: k.SPACE; gamepad: pad.Y > 0.3 (also in the "stay in gamepad mode" gate); touch: false
```
### Steps
1. `core/redactor.ts` (no Phaser). `RedactClock.update`: `left = cd - dt; cd = left < 1e-9 ? 0 : left; return cd <= 0` — the 1e-9 snap matters for float edges (same idiom as `addInkwell`). `trigger()` is a no-op returning false while `cd > 0`.
2. `RedactSystem.update`: `clock.update(dt)`; edge = `(redactInput && !held) || touchRequested`; clear both; if no edge or not picked return; if `!clock.trigger()` return (cooldown rejects); then for each active `EnemyBullet` in the shots group within 140 u: `fx.critRing(b.x, b.y)` + `b.despawn()`; for each active `Enemy` in the enemies group within 140 u: `e.redact()` (bosses/boss parts are not in these groups, so they are never slowed); `sfx.redact()`.
3. Enemy: add `this.slowLeft = 0;` in `spawn()` after `this.flashMs = 0;`; in `steer()` replace `this.setVelocity(vx + this.knock.x, vy + this.knock.y);` with `const slow = redactSlowTick(this.slowLeft, dt, false); this.slowLeft = slow.left; this.setVelocity(vx * slow.mul + this.knock.x, vy * slow.mul + this.knock.y);` (slow applies to steer velocity only, not knockback).
4. TouchSticks: `readonly ignoreZones: Phaser.Geom.Rectangle[] = []`; in `onDown` after the top-band check: `if (this.ignoreZones.some((z) => z.contains(p.x, p.y))) return;`.
5. PickupSystem: add last constructor param `private readonly redactorPicked: boolean`; `drop()` pool-full path and `update()` both call new `private collect(base: number, gilt: boolean)` which computes `const xp = redactorShardXp(base, gilt, this.redactorPicked)` once, calls `run.addXp(xp)` — that value is the single source for any pickup XP pop (T0117's GiltPop must receive `xp`, never recompute; halving is floor(gilt 3× then half), boss shards included since they flow through this).
6. MenuScene: hold refs to the hint (0.74) and warm-start (0.70) lines; if `loadRedactorUnlocked()`: `warmStartText.setY(prompt.y + 56); hintText.setY(prompt.y + 84);` label `'REDACTOR — ERASES THE INK · SHARDS HALF'` bold 13 ink at `(prompt.x, prompt.y + 28)`; glyph at `gx = prompt.x + prompt.width / 2 + 36, gy = prompt.y` drawn as `drawBar(g, gx, gy, 40, 22, picked ? PALETTE.ink : PALETTE.paperLight)` + band `fillRect(gx - 16, gy - 8, 8, 16)` in the opposite color (house shadow via drawBar default); `g.setInteractive(new Phaser.Geom.Rectangle(gx - 28, gy - 28, 56, 56))`, `pointerup` → `saveRedactorPick(!loadRedactorPick())` + redraw; the full-screen `pointerup` start handler must skip when the pointer is inside that 56×56 box; note (only if `!loadRedactorNoteSeen()`, save it immediately so it plays exactly once): `'NEW IN THE STUDIO — THE REDACTOR'` 13 inkSoft bold, origin (1, 0.5) at `(gx + 20, prompt.y + 112)`, tween alpha 0→1 over 3000 ms, hold 1200, fade 800, destroy.
7. HudScene: in `create()` read `loadRedactorPick()`; build button container at local origin — graphics: shadow `fillCircle(3, 3, 32, ink 0.18)`, body `fillCircle(0, 0, 32, ink)`; separate ring graphics; eraser `drawBar(g, 0, 0, 20, 11, PALETTE.paperLight, { shadow: false })` + paperDark band `fillRect(-7, -4, 5, 8)`; glyph Text bold 13 paperLight; `setInteractive(new Phaser.Geom.Circle(0, 0, 40))`; `pointerdown` → emit `GAME_EVENTS.redactRequest` on the game scene, only when `this.scene.isActive(SCENES.game)`. In `update()` (after `drawInkwell`): center `(width - 44, height - 44)` (64 px button, 12 px off both edges); `setVisible(picked)`; ring `lineStyle(2, ink).strokeArc(0, 0, 36, -90, -90 + 360 * frac, true, 1, 48)` with `frac = getRedact(this)?.ringFrac ?? 1`; glyph per device: touch → eraser visible/text hidden; gamepad → `'Y'`; else `'SPACE'`; set `touch.ignoreZones` to one 80×80 rect at the button center when picked, else empty. First-second note: when picked, `!shown`, `run.timeSec < 1`: text per device (`'THE REDACTOR ERASES — SPACE'` / `— Y` / plain), 20 bold ink at `bossPlatePos(width)`, y + 26 if `bossPlateActive` (warm-start note collision), 2 s linear fade whose age advances only while `scene.isActive(SCENES.game)`.
8. GameScene: `const redactorPicked = loadRedactorPick();` after run creation; `new PickupSystem(..., redactorPicked)`; `this.redact = new RedactSystem(this.player, this.spawns.enemies, this.spawns.enemyShots, this.fx, this.sfx, redactorPicked)` after the `this.arc` line + `registry.set('redact', ...)`/remove on shutdown; `this.redact.update(dt, input.redact);` after `pickups.update`; bind/`off` `GAME_EVENTS.redactRequest` → `redact.request()`; `redact.reset()` in the RESUME handler; invariants `redact-cooldown` (cdLeft in [0, 12], finite) and `redact-slow` (active enemies' `slowLeft` in [0, 2.5]).
9. PauseScene (T0123 landed): in its controls card, one extra line only when `loadRedactorPick()`: `REDACT — SPACE` / `REDACT — Y` / `REDACT — ERASE` (touch), same style as its other input lines, device via `getControls(this)?.device` plus the touch/`everTouched` check.
10. GameOverScene: `saveRedactorUnlocked();` once in `create()`.

### Pitfalls
- "12 px gap from the existing touch pause button" is a false premise: the pause button and Inkwell meter are top-right; the acceptance criteria are bottom-right corner + no overlap, which the (width−44, height−44) placement satisfies at 412×915 and 1280×720 (ring outer edge 7 px from both edges; right-stick hint at (0.82w, 0.8h) clears it). Keep the 12 px edge margin; do not move the pause button.
- Without `ignoreZones`, every touch on the button also spawns the right aim stick; the zone must be cleared when unpicked or a later task's layout change silently blocks the stick.
- Edge-trigger: holding Space must not re-fire; clear `redactHeld`/`touchRequested` in `reset()` on resume or a stale touch fires Redact the frame after unpause.
- `ringFrac` snaps 0→1 on the completion frame by design (full ring = ready; drains clockwise from full over the 12 s: arc start fixed at −90°, end retreats as frac falls).
- Unpicked economy byte-identical: `redactorShardXp(v, gilt, false)` must return `shardXp(v, gilt)` exactly — no `Math.floor` on that path.
- Menu: the 0.66–0.74 band has no room for 4 rows; the row shift only happens when unlocked, so first-time players see today's menu. Note gets its own row (+112) — it is a 5.5 s one-time marginalia, never a layout resident.
- `strokeArc` clockwise flag is required (default draws the other way); Phaser angles are degrees, 0 at 3 o'clock.
- Pooled objects: `slowLeft` reset in `Enemy.spawn()`; erased bullets use `despawn()` (they are not restored); Redact only iterates `active` children.
- GameScene/keys.ts/Sfx.ts are shared with open tasks — keep each edit a one-liner next to its kin (listed above); if T0117/T0121 land between design and implementation, re-locate the one-line insertions.

### Tests
- `tests/core/redactor.test.ts` (underexposure pattern): `redactorShardXp` — unpicked `(5,f)=5, (5,t)=15`; picked `(5,f)=2, (1,f)=0`; gilt-then-half `(5,t)=7, (3,t)=4`; `RedactClock` — starts ready, trigger burns 12 s, mid-cooldown trigger rejected and clock untouched, completion edge returned exactly once (assert with the 1e-9 snap, e.g. update(11.999) then update(0.001)); `redactSlowTick` — `(0,dt)= {left:0,mul:1}`, `(2.5,0.5,f)={left:2,mul:0.6}` (binary-exact values only), `(0.25,0.5,f)={left:0,mul:1}`, retrigger `(0.4,0.1,true)={left:2.5,mul:0.6}`; `inRedactRadius` — boundary `(0,0,140,0)` in, `(0,0,141,0)` out, `(0,0,99,98)` in, `(0,0,99,99)` out.

## Result (attempt 1, asus)

Added The Redactor, the first pre-run pick: after the first run ends the menu offers an ink-eraser toggle (persisted like the best score, one-time "NEW IN THE STUDIO" marginalia); while picked, a 64 px cooldown button in the bottom-right (Space / pad Y / touch) erases enemy bullets and slows enemies in 140 u for 2.5 s on a 12 s ring-drained cooldown, and all shard XP is halved (gilt 3× first) with the halved value in the gilt pop. Implemented as a pure `src/core/redactor.ts` rule module with unit tests, a `RedactSystem`, and one-line wirings through Enemy, Controls, TouchSticks, PickupSystem, GameScene, Hud/Menu/GameOver/Pause scenes, keys and Sfx. Two minimal deviations from the design's wording: Phaser 3.90 removed `Graphics.strokeArc` (ring drawn with the `beginPath`/`arc`/`strokePath` path idiom at the same geometry) and `pad.Y` is a boolean there, plus a `seedHeld` guard so a Space/Y press used to *start* the run in the menu doesn't fire Redact on frame 1 (the spec forbids Redact "in the menu"). `npm run check` and `npm run smoke` both pass on desktop and mobile.

- Self-review: APPROVE
- Time: 213.5 min

```
game/src/audio/Sfx.ts            |   6 +++
 game/src/core/redactor.ts        |  93 ++++++++++++++++++++++++++++++++
 game/src/entities/Enemy.ts       |  16 +++++-
 game/src/input/Controls.ts       |  22 +++++---
 game/src/input/TouchSticks.ts    |   3 ++
 game/src/scenes/GameOverScene.ts |   2 +
 game/src/scenes/GameScene.ts     |  27 +++++++++-
 game/src/scenes/HudScene.ts      |  99 +++++++++++++++++++++++++++++++++-
 game/src/scenes/MenuScene.ts     |  45 ++++++++++++++--
 game/src/scenes/PauseScene.ts    |   7 ++-
 game/src/scenes/keys.ts          |   7 +++
 game/src/systems/PickupSystem.ts |  22 +++++---
 game/src/systems/RedactSystem.ts |  93 ++++++++++++++++++++++++++++++++
 game/tests/core/redactor.test.ts | 111 +++++++++++++++++++++++++++++++++++++++
 14 files changed, 531 insertions(+), 22 deletions(-)
```
