---
id: T0131
title: Build rings — your build is on your circle
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T17:13:57Z
---

## Goal
The build you have picked becomes visible on your own shape: every 4 total upgrade levels your circle gains one thin ink ring just outside its outline — up to 3 — so in the middle of the late-run chaos you can read how deep the run has gone.

## Details
- totalLevels = the sum of the levels of every distinct upgrade picked this run — the same count The Index (T0104) lists, pips included, Warm Start's pick (T0114) counted at run start. Rings = min(3, floor(totalLevels / 4)): the first ring at 4 total levels, the second at 8, the third at 12, and 12+ stays at 3.
- A ring is a flat 2 u ink circle drawn just outside the player's outline, at 4, 8 and 12 units past it — the same flat-stroke, hard-paper-cut-shadow convention as the player's own outline (no glow), and it swells with the level-up pulse (T0102), so the moment a threshold is crossed the whole build pops, not just the circle.
- The rings are pure art: the player's hitbox, stats and blue fill are unchanged. They are deliberately distinct from The Palette's swatch stripes (T0097), which are colored and sit on the circle.
- A fresh run starts ringless; rings appear the moment a threshold is crossed and persist for the rest of the run — picks only grow, nothing removes a level.

## Acceptance criteria
- [ ] At 4 / 8 / 12 total upgrade levels the player's circle gains its first / second / third 2 u ink ring just outside its outline; at 16+ levels it has exactly 3; a fresh run (and any run before 4 total levels) has none.
- [ ] A ring appears the moment its threshold is crossed — with the level-up pulse — and persists for the rest of the run.
- [ ] The rings are ink, outside the outline, and never read as The Palette's colored swatch stripes; the player's hitbox and stats are byte-identical to before.
- [ ] No new sound, HUD element, key or scene; the pause-screen Index and everything else is untouched.

## Design (architect, desktop)

### Files
- edit `src/entities/Player.ts` - new `buildRings` Graphics + `setBuildDepth()`; rings follow the barrel, swell with the level-up pulse, destroyed with the player
- edit `src/scenes/GameScene.ts` - seed the rings after the Player exists (Warm Start already applied); one `build-rings` invariant
- edit `src/scenes/LevelUpScene.ts` - one line in `choose()` beside `pulse()`

### Interfaces
```ts
// Player.ts only — no new types, files, content, sound, HUD, keys or scenes
buildDepth: number;                    // rings currently drawn (0..3); read by the invariant
setBuildDepth(totalLevels: number): void; // count = min(3, floor(totalLevels / 4)); no-op if unchanged
```
### Steps
1. `Player.ts` — fields, after `stripeRing` (line 29):
```ts
  /** Build depth: min(3, floor(totalLevels / 4)) 2 u ink rings at 4, 8 and 12 u past the outline. */
  private readonly buildRings: Phaser.GameObjects.Graphics;
  /** Build rings currently drawn (0..3); the 'build-rings' invariant checks it against the run. */
  buildDepth = 0;
```
2. `Player.ts` — constructor, after `this.stripeRing = ...` (line 41):
`this.buildRings = scene.add.graphics().setDepth(DEPTH.playerBarrel).setVisible(false);`
3. `Player.ts` — method after `paintStripe` (line 55); same drawing as stripes but ink, at 4/8/12:
```ts
  /** Redraws the build rings from the run's total upgrade levels; no-op when the count is unchanged. */
  setBuildDepth(totalLevels: number): void {
    const count = Math.min(3, Math.floor(totalLevels / 4));
    if (count === this.buildDepth) return;
    this.buildDepth = count;
    this.buildRings.clear();
    this.buildRings.lineStyle(2, PALETTE.ink, 1);
    for (let i = 1; i <= count; i++) this.buildRings.strokeCircle(0, 0, PLAYER_RADIUS + i * 4);
    this.buildRings.setVisible(count > 0);
  }
```
4. `Player.ts` — `tickPulse()`: in the `!this.visible || now >= this.pulseUntil` branch add `if (this.buildRings.scaleX !== 1) this.buildRings.setScale(1);` after the pop reset; after line 103 (`this.pop.setScale(s)...`) add `if (this.buildRings.visible) this.buildRings.setScale(s);`
5. `Player.ts` — `syncBarrel()` after the stripeRing line (110): `this.buildRings.setPosition(this.x, this.y).setAlpha(this.alpha);` — and `destroy()`: `this.buildRings.destroy();` after `this.stripeRing.destroy();` (129).
6. `GameScene.ts` — `create()` after line 116 (`registry.set('player', ...)`):
`this.player.setBuildDepth(Object.values(this.run.upgradeLevels).reduce((a, b) => a + b, 0));`
7. `GameScene.ts` — `registerInvariants()`, insert right after the `'upgrade-history'` invariant (line 422):
```ts
    hook.addInvariant('build-rings', () => {
      const total = Object.values(this.run.upgradeLevels).reduce((a, b) => a + b, 0);
      const expected = Math.min(3, Math.floor(total / 4));
      return this.player.buildDepth === expected ? null : `build rings ${this.player.buildDepth} but ${expected} at ${total} total levels`;
    });
```
8. `LevelUpScene.ts` — `choose()`, one line after `getPlayer(this).pulse();` (118):
`getPlayer(this).setBuildDepth(Object.values(getRun(this).upgradeLevels).reduce((a, b) => a + b, 0));`
9. `npm run check`, then `npm run smoke`.

### Pitfalls
- Warm Start's `applyUpgrade` (GameScene.create line 104) runs BEFORE `new Player` (line 115) — seed the rings after Player construction, counting from the run; never from `run.level` (XP level, not picks) or a since-run counter, or a warm-started run shows rings one pick late.
- Step 4's scale-reset line is mandatory: without it a ring stays frozen at peak scale 1.25 after the first pulse in which it was visible.
- Rings are local-space (0,0) pinned in `syncBarrel()` (POST_UPDATE) exactly like the barrel/stripes; drawing in world coordinates trails the player by a frame and wobbles.
- Keep rings out of `stripes`/`stripeRing`: that is The Palette's trophy (colored, +3 + slot*2). Rings are `PALETTE.ink` at `PLAYER_RADIUS + 4/8/12` on their own Graphics.
- Never scale the player sprite or body — rings are a separate Graphics; hitbox and stats stay byte-identical.
- All shared-file edits are one-line appends next to their siblings (other tasks are editing GameScene/LevelUpScene concurrently); do not reformat or move existing lines.
### Tests
- none (pure art; the count rule is one line inside the art method, policed by the `build-rings` invariant in smoke).
