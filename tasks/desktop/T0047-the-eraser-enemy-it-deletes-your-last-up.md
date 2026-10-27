---
id: T0047
title: The Eraser enemy — it deletes your last upgrade
assignee: desktop
size: L
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-26T23:43:51Z
claimed_at: 2026-10-27T01:56:46Z
---

## Goal
A late-run paper-white rectangle that punishes greed: on contact it erases the upgrade level you picked most recently, with an "ERASED" flash. The page itself becomes hostile to your build.

## Details
- New enemy content file `src/content/enemies/eraser.ts` (copy the structure of `src/content/enemies/slab.ts`) and register it in `src/content/enemies/index.ts` in unlock order (after `pinwheel`, at 180 s) with the import in alphabetical order.
- Look: a small paper-white (paperLight) rectangle with a thick ink outline, radius 13, slow wobble rotation (0.5 rad/s). It is a rectangle wider than it is tall (about 2:1) — add a new shape if the shape system has no rectangle. It reads as a clean white block on the warm paper: the only enemy that is not a primary color.
- Stats: hp 40, speed 55, xp 6, threat 3, spawnWeight 2, unlockAtSec 180, knockbackResist 0.4, behavior `chase`.
- Contact behavior (new, not damage): when it touches the player and the player has at least one upgrade level, the most recent single upgrade level is removed — e.g. Rhythm level 3 becomes Rhythm level 2; if the last pick was a granted weapon (Line, Orbit or Arc), that weapon is removed instead. The starting Point weapon is never erased. Removed effects stop applying immediately. A small all-caps "ERASED" flash appears in the HUD (reuse the RHYTHM streak-flash pattern), a soft paper-tear SFX plays, and the Eraser crumples into paper fragments and dies (dropping its 6 XP).
- The erase respects the player's normal post-hit invulnerability window — one erase per contact window, never two from the same touch.
- If the player has no upgrade levels at all, contact deals 8 damage instead (so it is never free) and the Eraser survives.
- RunState (or wherever the upgrade stack lives) must remember the order upgrades were applied this run and support removing the most recent one, recomputing derived stats. The level-up UI and any other display of owned upgrades must reflect the removal, and a removed upgrade becomes offerable again at the next level-up.
- Marginalia note for the first encounter: "TAKES YOUR LAST UPGRADE".

## Acceptance criteria
- [ ] The Eraser never spawns before 180 s and appears in the spawn pool after (covered by the existing spawn unlock test).
- [ ] On first encounter, the marginalia note "TAKES YOUR LAST UPGRADE" fades in beside it.
- [ ] When it touches a player who has upgrades, the last-picked upgrade level is removed, its effects stop applying immediately, "ERASED" flashes in the HUD, and the Eraser crumples and dies.
- [ ] When it touches a player with no upgrades, the player takes 8 damage and the Eraser survives.
- [ ] The Eraser can be shot down at 40 hp and drops 6 XP.
- [ ] After an erase, the removed upgrade is offerable again at the next level-up.

## Design (architect, desktop)

### Files
- create `src/content/enemies/eraser.ts` — the Eraser `EnemyDef` (copy `slab.ts` structure)
- edit `src/content/enemies/index.ts` — import `eraser` (between `dart` and `frameWedge`) and add it to `ENEMIES` between `pinwheel` and `frameWedge` (180 s < frameWedge's 300 s)
- edit `src/content/types.ts` — add `'rect'` to `ShapeKind`; add `outlineWidth?: number` to `EnemyLook`; add `contact?: 'erase'` to `EnemyDef`
- edit `src/art/shapes.ts` — `case 'rect'` in `shapePoints`
- edit `src/art/textures.ts` — `drawEnemy`: pass `outlineWidth: look.outlineWidth` in the `drawShape` style
- edit `src/core/run.ts` — upgrade order history + `removeLastUpgrade()` (import `UPGRADE_BY_ID` from `../content/upgrades`; lint allows core→content)
- edit `src/audio/Sfx.ts` — `paperTear()`; edit `src/systems/FxSystem.ts` — `crumple(x, y)`
- edit `src/scenes/keys.ts` — add `upgradeErased: 'upgrade-erased'` to `GAME_EVENTS` (payload: erased upgrade id)
- edit `src/systems/CombatSystem.ts` — erase branch in `onPlayerTouched`, `deathFx` param on `killEnemy`
- edit `src/scenes/HudScene.ts` — "ERASED" flash (RHYTHM pattern); edit `src/scenes/GameScene.ts` — invariant
- create `tests/core/erase.test.ts` — unit tests for `removeLastUpgrade`

### Interfaces
```ts
// content/types.ts
export type ShapeKind = 'circle' | 'triangle' | 'square' | 'rect' | 'diamond' | 'pentagon' | 'hexagon' | 'star';
// EnemyLook:  /** Outline width in pixels; default scales with size. */ outlineWidth?: number;
// EnemyDef (after contactDamage):
/** Contact behavior other than damage. 'erase' removes the player's most recent upgrade on contact (falls back to contactDamage if the player has none). */
contact?: 'erase';

// core/run.ts
readonly upgradeHistory: string[] = []; // upgrade ids in the order applied this run
removeLastUpgrade(): UpgradeDef | null;
// body: pop id (null if empty) → def = UPGRADE_BY_ID.get(id); this.mods.splice(this.mods.length - def.mods.length, def.mods.length);
//   const left = this.upgradeLevel(id) - 1; if (left <= 0) delete this.upgradeLevels[id]; else this.upgradeLevels[id] = left;
//   if (def.grantsWeapon && this.upgradeLevel(def.grantsWeapon) === 0) { const i = this.weapons.indexOf(def.grantsWeapon); if (i >= 0) this.weapons.splice(i, 1); }
//   this.stats = computeStats(this.mods); this.hp = Math.min(this.hp, this.stats.maxHp); return def;
// applyUpgrade: also `this.upgradeHistory.push(def.id);` right after the upgradeLevels line.

// content/enemies/eraser.ts
{ id: 'eraser', name: 'Eraser', note: 'TAKES YOUR LAST UPGRADE', hp: 40, speed: 55, contactDamage: 8, xp: 6,
  threat: 3, spawnWeight: 2, unlockAtSec: 180, behavior: 'chase', knockbackResist: 0.4, contact: 'erase',
  look: { shape: 'rect', radius: 13, body: PALETTE.paperLight, accent: PALETTE.ink, spin: 0.5, outlineWidth: 3 } }

// art/shapes.ts, in shapePoints:
case 'rect': return [{ x: cx - r, y: cy - r / 2 }, { x: cx + r, y: cy - r / 2 }, { x: cx + r, y: cy + r / 2 }, { x: cx - r, y: cy + r / 2 }];

// systems/CombatSystem.ts
killEnemy(e: Enemy, deathFx: 'death' | 'crumple' = 'death'): void
//   if (deathFx === 'crumple') { this.fx.crumple(e.x, e.y); this.sfx.paperTear(); } else { ...existing fx.death/enemyDeath/shake... }
// onPlayerTouched: after the existing guards, before takeDamage:
if (e.def.contact === 'erase') {
  this.player.hurt(now); // same 650 ms post-hit window: one erase per contact
  const removed = this.run.removeLastUpgrade();
  if (removed) { this.scene.events.emit(GAME_EVENTS.upgradeErased, removed.id); this.killEnemy(e, 'crumple'); }
  else { this.run.takeDamage(e.contactDamage); e.hit(0, this.player, 320); this.fx.playerHit(this.player.x, this.player.y); this.sfx.playerHurt(); }
  return;
}
// Sfx: paperTear() { if (!this.canPlay()) return; this.noise(0.16, 0.28, 1400, 'lowpass'); this.noise(0.12, 0.18, 700, 'lowpass', 0.06); }
// FxSystem: crumple(x, y) { rings→PALETTE.ink explode(1); fragments→PALETTE.paperLight explode(10); fragments→PALETTE.ink explode(3); }
```

### Steps
1. types.ts: the three additions above.
2. shapes.ts: `case 'rect'`.
3. textures.ts: pass `outlineWidth` in `drawEnemy`'s `drawShape` call.
4. Create `eraser.ts`, register in `index.ts` (import alphabetical; array after `pinwheel`).
5. run.ts: `upgradeHistory`, the `push` in `applyUpgrade`, `removeLastUpgrade`, the `UPGRADE_BY_ID` import.
6. Sfx.paperTear, FxSystem.crumple, keys.ts event.
7. CombatSystem: `killEnemy` param + erase branch (import `GAME_EVENTS` from `../scenes/keys`).
8. HudScene: `erasedText` ('ERASED', `textStyle(13, PALETTE.red, { fontStyle: 'bold' })`, origin (1, 0.5), hidden) + `erasedUntil = 0` (reset in `create`); on `GAME_EVENTS.upgradeErased` set `erasedUntil = this.time.now + 800` and run the same killTweensOf/setScale(1)/setAlpha(1)/yoyo-tween as RHYTHM; in `update` `setPosition(width - PAD, PAD + 78)` + `setVisible(this.time.now < this.erasedUntil)`; **remove the listener in the existing SHUTDOWN handler**.
9. GameScene: `hook.addInvariant('upgrade-history', ...)` — sum of `Object.values(this.run.upgradeLevels)` must equal `this.run.upgradeHistory.length`; add `'upgrade-history'` to the `INVARIANTS` array (line 306) or it leaks across restarts.
10. Write `tests/core/erase.test.ts` (see Tests). Run `npm run check`, then `npm run smoke`.

### Pitfalls
- `src/core/run.ts` is also touched by in-progress T0044 (Grid boss): make only the additive edits listed, never reformat the file.
- `mods` and `upgradeHistory` must stay in lockstep; only `applyUpgrade`/`removeLastUpgrade` may touch them (weapon upgrades have `mods: []` — `splice(n, 0)` is a no-op, that's fine).
- `point` is never erased because no upgrade grants it — do not add special-casing.
- The Eraser's body is `paperLight`, so the stock `fx.death` would draw near-invisible white rings — that's why `killEnemy` takes `deathFx` and the erase path uses `crumple` (ink ring reads on paper).
- Elite Erasers also erase (behavior comes from `def`); `killEnemy`'s elite shard bookkeeping is unchanged.
- Removed weapon effects stop immediately for free: WeaponSystem/OrbitSystem/ArcSystem all re-read `run.weapons` every frame; LevelUpScene cards read `run.upgradeLevel` at create, so "offerable again" and the UI both work with no extra code.
- Spin is constant `0.5` rad/s via the existing `look.spin` — do not add a new wobble rotation mode.

### Tests
- `tests/core/erase.test.ts`: `removeLastUpgrade` returns null with no upgrades; removes the most recent level and recomputes stats (rhythm+weight → weight gone, `damageMul` back to 1); drops one of two levels; removes a granted weapon (`line`) leaving `['point']`; clamps `hp` to reduced max after erasing `mass`; erased upgrade passes `isUpgradeAvailable` again.
- Existing `tests/content.test.ts` and `tests/content/spawn.test.ts` (it.each over `ENEMIES`) automatically validate the new def and its 180 s unlock — no edits needed there.
