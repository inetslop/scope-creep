---
id: T0102
title: Level-up pulse — your circle pops when you pick
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T10:32:47Z
---

## Goal
The moment a level-up card is picked, your blue circle swells 25% for 300 ms — the level-up is felt in your own shape, not just in the cards flipping away.

## Details
- The instant a level-up card is confirmed and play resumes, the player's circle scales 1.0 → 1.25 → 1.0 over 300 ms with a fast ease-out — a quick pop that settles.
- Visual only: the physics body / hitbox stays at its normal size the whole time; no damage, no pickup change, no stat or speed change (nearest example: the black hit-flash on enemies, which is also visual-only).
- The existing level-up sound (T0003) plays exactly as it does today — no new sound. The card-flip deal (T0059) is unchanged; the pulse starts as the LevelUp scene closes.
- One pulse per card picked; it does not delay spawns, pickups, the Orbit weapon or anything else.
- No new HUD element, no input, no scene, no content file. Identical on desktop and mobile.

## Acceptance criteria
- [ ] The moment a level-up card is picked, the player's circle swells to 1.25× and settles back to 1.0× over 300 ms.
- [ ] The swell is visual only — the hitbox, movement and all stats are unchanged, and no new sound plays.
- [ ] The card-flip level-up animation (T0059) and the existing level-up sound are unchanged.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/entities/Player.ts` - the level-up pop: a body-less copy image of the player texture that scales 1.0 → 1.25 → 1.0 over 300 ms. The sprite itself never scales, so the physics body / hitbox never changes.
- edit `src/scenes/LevelUpScene.ts` - `choose()` fires the pop (exactly one per picked card).
- edit `src/scenes/keys.ts` - `getPlayer()` typed registry getter (pattern of `getRun`/`getSfx`).
- edit `src/scenes/GameScene.ts` - registry `player` set/remove + a `player-hitbox` invariant.
### Interfaces
```ts
// Player.ts (new members)
private readonly pop: Phaser.GameObjects.Image; // DEPTH.player + 1, hidden
private pulseUntil = 0;      // scene.time.now at which the pop settles
private pulseQueued = false;
pulse(): void;               // public - called by LevelUpScene
private tickPulse(): void;
// keys.ts
export function getPlayer(scene: Phaser.Scene): Player;
```
### Steps
1. Player.ts, module level (after the imports):
```ts
const PULSE_PEAK = 1.25; // pop scale
const PULSE_MS = 300;
const PULSE_UP_MS = 100; // pop up in 100 ms, settle in the remaining 200
function easeOutQuad(u: number): number { return u * (2 - u); }
```
2. Player.ts constructor, after the barrel line: `this.pop = scene.add.image(x, y, TEX.player).setDepth(DEPTH.player + 1).setVisible(false);`
3. Player.ts, public: `pulse(): void { this.pulseQueued = true; }` (game may be paused when called; the first tick starts the clock).
4. Player.ts, `private tickPulse(): void`:
```ts
const now = this.scene.time.now;
if (this.pulseQueued) { this.pulseQueued = false; this.pulseUntil = now + PULSE_MS; }
if (!this.visible || now >= this.pulseUntil) {
  if (this.pop.visible) this.pop.setScale(1).setVisible(false);
  return;
}
const t = Math.max(0, now - (this.pulseUntil - PULSE_MS));
const rising = t < PULSE_UP_MS;
const u = easeOutQuad(rising ? t / PULSE_UP_MS : (t - PULSE_UP_MS) / (PULSE_MS - PULSE_UP_MS));
const s = 1 + (PULSE_PEAK - 1) * (rising ? u : 1 - u);
if (this.pop.texture.key !== this.texture.key) this.pop.setTexture(this.texture.key);
this.pop.setScale(s).setVisible(true).setAlpha(this.alpha);
```
   and call `this.tickPulse();` as the last statement of `preUpdate`.
5. Player.ts: in `syncBarrel()` add `if (this.pop.visible) this.pop.setPosition(this.x, this.y);`; in `destroy()` add `this.pop.destroy();`.
6. keys.ts: `import type { Player } from '../entities/Player';` and `export function getPlayer(scene: Phaser.Scene): Player { return scene.registry.get('player') as Player; }`.
7. GameScene.ts: after `this.player = new Player(this, 0, 0);` add `this.registry.set('player', this.player);`; in the SHUTDOWN handler add `this.registry.remove('player');` (next to `'sfx'`/`'controls'`); register and list the invariant (also import `PLAYER_RADIUS` from config):
```ts
hook.addInvariant('player-hitbox', () => {
  const b = this.player.body as Phaser.Physics.Arcade.Body;
  return b.halfWidth === PLAYER_RADIUS && b.halfHeight === PLAYER_RADIUS ? null : `player body ${b.halfWidth}x${b.halfHeight}`;
});
```
8. LevelUpScene.ts: import `getPlayer` from `./keys`; in `choose()` insert `getPlayer(this).pulse();` immediately before `this.scene.resume(SCENES.game);`.
### Pitfalls
- Never `player.setScale(...)` and never touch `player.body`: in this Phaser the arcade body rescales from the sprite scale every frame (see `Enemy.ts:79`), so a scaled player would swell its hitbox to radius 20 for 300 ms. Scale only the body-less `pop` image; that is what keeps the pulse visual-only and lets the new invariant pass.
- Pulse clock: use only `this.scene.time.now` (house clock; frozen while the LevelUp overlay is up). The global `time` param of `preUpdate` keeps advancing during the overlay and would end the pop while paused.
- `t` is clamped with `Math.max(0, …)`; on end the pop must reset to scale 1 and hidden, or it freezes at 1.25.
- `pop` mirrors the player's texture (red hurt frame) and alpha (invulnerability flicker) and hides on `!this.visible` (death); its position is pinned in `syncBarrel()` (POST_UPDATE, after the physics write-back), not in preUpdate.
- A second `pulse()` before a tick just re-queues: two pending level-ups → two back-to-back scenes → one pop per card.
### Tests
none
