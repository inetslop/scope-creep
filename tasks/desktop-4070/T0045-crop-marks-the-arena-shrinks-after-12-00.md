---
id: T0045
title: "Crop marks — the arena shrinks after 12:00"
assignee: desktop-4070
size: L
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-26T23:09:26Z
---

## Goal
Late-run pressure with a print-shop theme: after 12:00 the page gets cropped — the safe area slowly shrinks toward the center, and standing in the cropped margin burns you, forcing late-game fights to the middle of the sheet.

## Details
- Timing (put it in a pure module, like `src/core/boss.ts`): before 720 s (12:00) the safe area is 100% of the arena. From 720 s to 1020 s (17:00) the safe fraction shrinks linearly from 1.0 to 0.7. From 1020 s onward it stays at 0.7. The safe area is always the arena rectangle scaled about its center.
- Visuals: the cropped margin (outside the safe rectangle) is a slightly darker paper tone. At the four corners of the safe rectangle sit crop marks — small L-shaped ink marks (like the registration marks on a printed page), 24 units long per leg, 3 units thick, ink color. The marks move inward as the safe area shrinks.
- Player damage: while any part of the player is outside the safe rectangle, they burn for 5 damage per second. This is a continuous burn (apply 5 × dt per frame), it does NOT use the post-hit invulnerability window, and it does not shake the screen. While burning, a small red damage number pops every 0.5 s so the drain is readable.
- Enemies, bullets, shards and bosses are unaffected by the margin — only the player burns.
- At 12:00, a "CROPPING" label flashes in the HUD (reuse the existing HUD flash style, like the RHYTHM flash).
- Add `cropDamageTaken: number` to the stats in `debug/testHook.ts`.
- Unit test in `tests/core/` for the shrink schedule: safe fraction is 1.0 at 719 s, strictly between 0.7 and 1.0 at 870 s, and exactly 0.7 at 1020 s and 1200 s.

## Acceptance criteria
- [ ] Before 12:00 the full arena is safe: no crop marks, no margin, no burn
- [ ] At 12:00 "CROPPING" flashes in the HUD and crop-mark corners appear at the arena edges
- [ ] The safe area shrinks steadily and reaches 70% of the arena at 17:00, then holds; the crop marks track the safe-area corners the whole time
- [ ] Standing in the cropped margin drains 5 HP/s with a small red damage number every 0.5 s; leaving the margin stops the drain immediately
- [ ] Enemies and the boss are unaffected by the margin
- [ ] `cropDamageTaken` is tracked in the debug stats
- [ ] Unit test for the shrink schedule in `tests/core/`
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/core/crop.ts` — pure shrink schedule (model on `src/core/boss.ts`)
- create `src/systems/CropSystem.ts` — margin + crop-mark drawing, player burn
- create `tests/core/crop.test.ts` — schedule unit test
- edit `src/core/run.ts` — add `drain()` method
- edit `src/systems/DamageNumbers.ts` — optional `red` param on `show()`
- edit `src/debug/testHook.ts` — add `cropDamageTaken` to `HookStats`
- edit `src/scenes/GameScene.ts` — wire system, hook stat, invariant
- edit `src/scenes/HudScene.ts` — "CROPPING" flash
- edit `tests/core/core.test.ts` — drain test

### Interfaces
```ts
// src/core/crop.ts (exact file — no Phaser import, lint-enforced)
export const CROP = { startSec: 720, endSec: 1020, endFraction: 0.7, burnPerSec: 5 } as const;
export function cropSafeFraction(timeSec: number): number {
  if (timeSec <= CROP.startSec) return 1;
  if (timeSec >= CROP.endSec) return CROP.endFraction;
  const t = (timeSec - CROP.startSec) / (CROP.endSec - CROP.startSec);
  return 1 - t * (1 - CROP.endFraction);
}
// src/core/run.ts — insert after takeDamage():
drain(amount: number): number { // no armor, no min-1, no invuln; returns damage actually taken
  if (amount <= 0 || this.isDead) return 0;
  const dealt = Math.min(amount, this.hp);
  this.hp -= dealt;
  if (dealt > 0) this.streak = 0;
  return dealt;
}
// src/systems/DamageNumbers.ts — show(x, y, amount, crit = false, red = false); style: textStyle(crit ? 28 : 20, crit || red ? PALETTE.red : PALETTE.ink, {...unchanged})
// src/systems/CropSystem.ts
export class CropSystem {
  totalDamage = 0; // read by GameScene for hook.stats.cropDamageTaken
  constructor(scene: Phaser.Scene, run: RunState, player: Player, damageNumbers: DamageNumbers);
  update(dt: number): void;
}
// src/debug/testHook.ts — HookStats + stats init: cropDamageTaken: number / 0 (after upgradesTaken)
```

### Steps
1. Create `src/core/crop.ts` exactly as above (add a 2-line doc comment like boss.ts).
2. Create `tests/core/crop.test.ts`: `expect(cropSafeFraction(719)).toBe(1)`; `const mid = cropSafeFraction(870); expect(mid).toBeGreaterThan(0.7); expect(mid).toBeLessThan(1); expect(mid).toBeCloseTo(0.85);`; `expect(cropSafeFraction(1020)).toBe(0.7); expect(cropSafeFraction(1200)).toBe(0.7);`; plus `expect(CROP).toEqual({ startSec: 720, endSec: 1020, endFraction: 0.7, burnPerSec: 5 })`.
3. Edit `src/core/run.ts`: add `drain()` after `takeDamage()`. In `tests/core/core.test.ts` RunState block add: `run.applyUpgrade(UPGRADE_BY_ID.get('mass')!)` (+1 armor), then `expect(run.drain(0.5)).toBe(0.5)`, `expect(run.hp).toBeCloseTo(hp - 0.5)`, `expect(run.drain(9999)).toBe(hp - 0.5)`, `expect(run.hp).toBe(0)`, `expect(run.isDead).toBe(true)`, `expect(run.drain(1)).toBe(0)`.
4. Edit `src/systems/DamageNumbers.ts`: add `red = false` param to `show()`, pass it to `this.style(crit, red)`, add `red = false` to `style()` and use `crit || red ? PALETTE.red : PALETTE.ink`.
5. Create `src/systems/CropSystem.ts` (use `import type Phaser from 'phaser'`):
```ts
const MARK = 24;
const NUMBER_EVERY = 0.5;
export class CropSystem {
  totalDamage = 0;
  private readonly run: RunState; private readonly player: Player; private readonly damageNumbers: DamageNumbers;
  private readonly g: Phaser.GameObjects.Graphics; private numberTimer = 0;
  constructor(scene: Phaser.Scene, run: RunState, player: Player, damageNumbers: DamageNumbers) {
    this.run = run; this.player = player; this.damageNumbers = damageNumbers;
    this.g = scene.add.graphics().setDepth(DEPTH.floor + 1); // above floor, below arena walls
  }
  update(dt: number): void {
    const g = this.g; g.clear();
    if (this.run.timeSec < CROP.startSec) return; // before 12:00: no marks, no margin, no burn
    const half = (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec);
    const a = ARENA_SIZE / 2;
    g.fillStyle(PALETTE.paperDark, 1); // margin: four darker-paper strips (Graphics has no holes)
    g.fillRect(-a, -a, ARENA_SIZE, -half + a); g.fillRect(-a, half, ARENA_SIZE, a - half);
    g.fillRect(-a, -half, -half + a, 2 * half); g.fillRect(half, -half, a - half, 2 * half);
    g.lineStyle(3, PALETTE.ink, 1); // crop marks: ink L at each safe-rect corner, legs into the margin
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      g.lineBetween(sx * half, sy * half, sx * (half + MARK), sy * half);
      g.lineBetween(sx * half, sy * half, sx * half, sy * (half + MARK));
    }
    const outside = this.player.x - PLAYER_RADIUS < -half || this.player.x + PLAYER_RADIUS > half ||
      this.player.y - PLAYER_RADIUS < -half || this.player.y + PLAYER_RADIUS > half;
    if (outside && !this.run.isDead) {
      this.totalDamage += this.run.drain(CROP.burnPerSec * dt);
      this.numberTimer -= dt;
      if (this.numberTimer <= 0) {
        this.numberTimer = NUMBER_EVERY;
        this.damageNumbers.show(this.player.x, this.player.y - 24, CROP.burnPerSec * NUMBER_EVERY, false, true);
      }
    } else { this.numberTimer = 0; } // re-entering pops a number immediately
  }
}
```
Imports: `ARENA_SIZE, DEPTH, PLAYER_RADIUS` from `../config`; `PALETTE` from `../content/palette`; `CROP, cropSafeFraction` from `../core/crop`; types `RunState`, `Player`, `DamageNumbers`.
6. Edit `src/debug/testHook.ts`: `cropDamageTaken: number;` in `HookStats` after `upgradesTaken`, and `cropDamageTaken: 0,` in the stats init.
7. Edit `src/scenes/GameScene.ts` (six additive insertions): import `CropSystem` after the `CombatSystem` import; field `private crop!: CropSystem;` after `private combat!`; in `create()` after `this.damageNumbers = new DamageNumbers(this);` add `this.crop = new CropSystem(this, this.run, this.player, this.damageNumbers);`; in `update()` after `this.pickups.update(dt);` add `this.crop.update(dt);`; in `updateHookStats()` add `s.cropDamageTaken = this.crop.totalDamage;`; in `registerInvariants()` add `hook.addInvariant('crop-damage', () => Number.isFinite(this.crop.totalDamage) && this.crop.totalDamage >= 0 ? null : \`crop damage ${this.crop.totalDamage}\`);` and append `'crop-damage'` to the `INVARIANTS` array at the bottom.
8. Edit `src/scenes/HudScene.ts`: import `{ CROP }` from `../core/crop`; fields `private cropText!: Phaser.GameObjects.Text;` and `private cropUntil = 0; private cropFlashed = false;`; in `create()` after the `rhythmText` line add `this.cropText = this.add.text(0, 0, 'CROPPING', textStyle(13, PALETTE.red, { fontStyle: 'bold' })).setOrigin(1, 0.5).setVisible(false);` and reset `cropUntil = 0; cropFlashed = false;` with the other resets; in `update()` after `this.updateStreak(run, width);` add:
```ts
if (!this.cropFlashed && run.timeSec >= CROP.startSec) {
  this.cropFlashed = true;
  this.cropUntil = this.time.now + 800;
  this.tweens.killTweensOf(this.cropText);
  this.cropText.setScale(1).setAlpha(1);
  this.tweens.add({ targets: this.cropText, alpha: 0.35, scale: 1.2, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
}
this.cropText.setPosition(width - PAD - this.streakText.width - 8, PAD + 60); // same slot as RHYTHM
this.cropText.setVisible(this.time.now < this.cropUntil);
```
9. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Do NOT use `run.takeDamage()` for the burn: armor + min-1 damage would make it ~60 HP/s. Use `drain()`.
- Do NOT call `player.hurt()`, `fx.playerHit()`, or `fx.shake()` — spec: no invulnerability window, no shake. The red number is the only feedback.
- Margin graphics depth must be `DEPTH.floor + 1` (1), never `DEPTH.arena` (5) or higher, or it paints over the inner half of the ink wall frame.
- `g.clear()` must run before the early return; the zero-height strips at exactly 720 s are harmless.
- Crop marks are redrawn every frame at the current corners, so they track the shrink for free; at 720 s they sit at the arena edges as required.
- Add `'crop-damage'` to the `INVARIANTS` const or it is never removed on shutdown.
- T0040 and T0044 (both in progress) also touch GameScene.ts / testHook.ts / run.ts — keep every edit additive and surgical; never reformat or reorder surrounding lines.
- The smoke test never reaches 12:00, so crop visuals are only covered by the invariant + `check`; don't add smoke-only hacks.
- The burn number shows `Math.round(2.5)` = "3" — intended, cosmetic.

### Tests
- `tests/core/crop.test.ts` (new, step 2) and the `drain()` test in `tests/core/core.test.ts` (step 3).
