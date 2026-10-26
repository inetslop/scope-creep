---
id: T0004
title: Floating damage numbers
assignee: desktop
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
---

## Goal
Show the damage of each hit as a small number that pops up from the enemy and fades, so upgrades feel impactful.

## Details
- Create `src/systems/DamageNumbers.ts` that owns a pool of at most 60 `Phaser.GameObjects.Text` objects (create lazily, reuse inactive ones, never create more than 60).
- `show(x, y, amount, crit = false)`: text = rounded amount, bold, color `PALETTE.ink` (crit: `PALETTE.red` and bigger), depth `DEPTH.fx + 1`. Animate: rise ~24 world units and fade out over 450 ms, then deactivate. Add a small random x offset so numbers don't stack exactly.
- Call it from `CombatSystem.onProjectileHit` with the damage dealt.
- Text uses `textStyle()` from `src/ui/text.ts` with a `PALETTE.paperLight` stroke (strokeThickness 3) so it reads over shapes. Flat style: no glow or shadow blur.
- Add an invariant `damage-numbers-pool`: active numbers <= 60. Remove it on scene shutdown like the others in `GameScene`.

## Acceptance criteria
- [ ] Every projectile hit shows a floating number with the damage dealt
- [ ] Never more than 60 number objects exist (pooled)
- [ ] Readable on both desktop and phone

## Design (architect, desktop)

### Files
- create `src/systems/DamageNumbers.ts` - pooled floating damage numbers (≤60 `Text` objects), tween-animated
- edit `src/systems/CombatSystem.ts` - take a `DamageNumbers`, call `show()` on every projectile hit
- edit `src/scenes/GameScene.ts` - construct the system, pass it to CombatSystem, register the invariant

### Interfaces
- `DamageNumbers` (new, `src/systems/DamageNumbers.ts`): `constructor(scene: Phaser.Scene)`; `get activeCount(): number`; `show(x: number, y: number, amount: number, crit?: boolean): void`; no `update()` (self-animating via one tween per active number)
- `CombatSystem` constructor: append `damageNumbers: DamageNumbers` as the last parameter (after `sfx`)
- No crit stat exists in `PlayerStats` — `CombatSystem` never passes `crit`; the parameter stays for the future. Do not invent one.

### Steps
1. Create `src/systems/DamageNumbers.ts` with exactly this:
```ts
import type Phaser from 'phaser';
import { DEPTH } from '../config';
import { cssColor, PALETTE } from '../content/palette';
import { textStyle } from '../ui/text';

const MAX_NUMBERS = 60;
const LIFE_MS = 450;
const RISE = 24;

/** Floating damage numbers: a pool of at most 60 Text objects that pop up from hit enemies and fade. Cosmetic only. */
export class DamageNumbers {
  private readonly scene: Phaser.Scene;
  private readonly pool: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get activeCount(): number {
    let n = 0;
    for (const t of this.pool) if (t.active) n += 1;
    return n;
  }

  /** Pops a number at (x, y); dropped if all 60 slots are busy. */
  show(x: number, y: number, amount: number, crit = false): void {
    let i = this.pool.findIndex((t) => !t.active);
    if (i === -1) {
      if (this.pool.length >= MAX_NUMBERS) return; // pool exhausted: skip rather than allocate
      i = this.pool.length;
      this.pool.push(this.scene.add.text(0, 0, '', this.style(crit)).setOrigin(0.5).setDepth(DEPTH.fx + 1));
    }
    const t = this.pool[i];
    t.setText(String(Math.round(amount)));
    t.setStyle(this.style(crit));
    t.setPosition(x + (Math.random() * 2 - 1) * 10, y); // small jitter so numbers don't stack exactly
    t.setAlpha(1).setActive(true).setVisible(true);
    this.scene.tweens.add({
      targets: t,
      y: y - RISE,
      alpha: 0,
      duration: LIFE_MS,
      ease: 'Cubic.Out',
      onComplete: () => t.setActive(false).setVisible(false),
    });
  }

  private style(crit: boolean): Phaser.Types.GameObjects.Text.TextStyle {
    return textStyle(crit ? 28 : 20, crit ? PALETTE.red : PALETTE.ink, {
      fontStyle: 'bold',
      stroke: cssColor(PALETTE.paperLight),
      strokeThickness: 3,
    });
  }
}
```
2. Edit `src/systems/CombatSystem.ts`: add `import type { DamageNumbers } from './DamageNumbers';`; field `private readonly damageNumbers: DamageNumbers;`; constructor param `damageNumbers: DamageNumbers,` (last) + `this.damageNumbers = damageNumbers;`; in `onProjectileHit` insert `this.damageNumbers.show(e.x, e.y, p.damage);` right after `const died = e.hit(p.damage, p, p.knockback);`.
3. Edit `src/scenes/GameScene.ts`: `import { DamageNumbers } from '../systems/DamageNumbers';`; field `private damageNumbers!: DamageNumbers;`; in `create()` after `this.fx = new FxSystem(this);` add `this.damageNumbers = new DamageNumbers(this);`; append `this.damageNumbers` to the `new CombatSystem(...)` call; in `registerInvariants()` add `hook.addInvariant('damage-numbers-pool', () => (this.damageNumbers.activeCount <= 60 ? null : `${this.damageNumbers.activeCount} damage numbers active`));`; add `'damage-numbers-pool'` to the `INVARIANTS` array (the existing shutdown loop removes it).
4. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Pooling: create a new `Text` only when `findIndex` finds no inactive slot AND `pool.length < 60`; when full, drop the number (same "skip rather than allocate" as `WeaponSystem`). A slot becomes inactive only in the tween's `onComplete`, so a reused slot never has a live tween — never add a second animation path (e.g. a second tween or manual per-frame movement) to a slot.
- Reset every field in `show()` (text, style, position, alpha, active) — pooled objects are reused.
- Jitter uses `Math.random()` on purpose: cosmetic, not gameplay (Sfx does the same); do not add `run`/`rng` to the constructor.
- Phone readability: camera zoom at 412 px ≈ 0.64, so keep the 20 px base font (≈13 px on screen) and the 3 px `paperLight` stroke; don't shrink the font or drop the stroke. Flat style: no shadow/glow on these texts.
- Cleanup: no listeners are added; the `Text`s are scene children so they die on shutdown; numbers freeze while the scene is paused (level-up/pause) — correct, matches the rest of the world.

### Tests
none (Phaser-dependent system; no pure logic in `core/`).
