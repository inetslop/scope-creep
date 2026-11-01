---
id: T0354
title: The Haste shows its working aura
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T11:14:54Z
claimed_at: 2026-11-01T16:10:48Z
---

## Goal
A Haste tower never fires, and its aura works both ways — it speeds the towers up and it speeds the enemies up; like the other never-firing supports it should show the moment it is working, so a tower that looks dead is seen doing both jobs.

## Details
- The working-aura language (T0055) at the Mute-ring's example (T0219): while an enemy's center is inside a Haste tower's 2-cell radius, a thin ring in the Haste tower's own color shows at ground level under the tower, out to the full radius, re-pulsing once a second (the Mute ring's own fade in and out, same placement).
- Display only: no sound, no text, no new card or readout; a Haste tower with no enemy in range shows nothing (its tower side is already visible on the towers firing faster — the same reason Rally shows no ring).
- A new small painter file in src/systems/fx/ mirroring the Mute's ring painter (T0219) in shape and timing, wired from the one place src/systems/HasteSystem.ts already knows an enemy is in range; the aura's numbers are untouched.
- Every Haste tower shows its own ring (two in a cluster show two).

## Acceptance criteria
- [ ] while any enemy is inside a Haste tower's 2-cell radius, a thin ring in the tower's own color pulses once a second at ground level under it, out to the radius; the moment no enemy is in range, it is gone
- [ ] it is display only — no sound, no text, no new HUD element — and the Haste aura's numbers are unchanged (enemies +30%, towers +30%, +15% to both per copy)
- [ ] a run with no Haste towers is byte-identical: no ring, no change

## Design (architect, yoga)

### Files
- create `src/systems/fx/hasteRing.ts` - one beat of the Haste working ring: paints the thin ring's `Graphics` + its in-and-out tween, returns both so the caller drops them
- edit `src/systems/HasteSystem.ts` - takes the scene; per-tower pulse beat in `beats`; `rings` map; the ring branch where `inside` is known; `dropRing()`; fixes the cleanup line
- edit `src/scenes/GameScene.ts` - line 155: `this.haste = new HasteSystem(this, this.towers, this.enemies);`

### Interfaces
```ts
// src/systems/fx/hasteRing.ts (whole file, modelled on the Mute ring, systems/enemyHooks/muteJam.ts)
import { TOWER_BODY } from '../../art/textures';
import { CELL, DEPTH } from '../../config';
import { fillRing } from '../../ui/ring';
import type Phaser from 'phaser';

export function hasteRing(scene: Phaser.Scene, x: number, y: number, radius: number, color: number): { g: Phaser.GameObjects.Graphics; tw: Phaser.Tweens.Tween } {
  const g = scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y);
  fillRing(g, 0, 0, radius, 3, 0, Math.PI * 2, color, 0.9);
  g.setScale((TOWER_BODY * CELL) / radius);
  const tw = scene.tweens.add({ targets: g, scale: 1, alpha: 0, duration: 1000, ease: 'Quad.easeOut', onComplete: () => g.destroy() });
  return { g, tw };
}
// HasteSystem: constructor(scene: Phaser.Scene, towers: TowerSystem, enemies: EnemySystem)  // scene is the new first parameter
```

### Steps
1. Create `src/systems/fx/hasteRing.ts` exactly as above (add a doc comment: one beat of a Haste tower's working ring (T0354), the Mute ring's own fade in and out, from the tower's body out to the radius over 1 s of scene.time).
2. `src/systems/HasteSystem.ts`: add imports (one per line, next to the related ones): `PALETTE` from `'../content/palette'`, `towerColor` from `'../core/augments'`, `type Phaser` from `'phaser'`, `hasteRing` from `'./fx/hasteRing'`. Add `private readonly scene: Phaser.Scene;` (new first constructor param). Beat type becomes `{ prev: number; flash: number; pulse: number }` (init `{ prev: 0, flash: 0, pulse: 0 }`; `pulse` = scene.time ms of the last working-ring pulse, 0: the first holding frame pulses straight away). New field: `private readonly rings = new Map<Tower, { g: Phaser.GameObjects.Graphics; tw: Phaser.Tweens.Tween }>();`
3. In `update()`: `const now = this.scene.time.now;` just before the last `for (const h of auras)` loop; in it, after the `h.hasteRing` alpha line:
```ts
      // The working ring: once a second of scene.time while at least one enemy is inside; gone the frame they all leave.
      if (n === 0) this.dropRing(h);
      else if (now - beat.pulse >= 1000) {
        beat.pulse = now;
        this.dropRing(h); // the last beat is fading out; a no-op once it has faded
        const color = towerColor(h.augments);
        this.rings.set(h, hasteRing(this.scene, h.base.x, h.base.y, h.spec.range * CELL, color ? PALETTE[color] : PALETTE.faint));
      }
```
4. Replace the cleanup line `for (const [t] of this.beats) if (!t.active) this.beats.delete(t);` with:
```ts
    for (const [t] of this.beats) if (!this.towers.towers.includes(t)) { this.dropRing(t); this.beats.delete(t); } // the tower was sold or the board re-grew
```
and add the method:
```ts
  /** The frame the aura stops (or the tower is sold): the ring is gone, even mid-beat. */
  private dropRing(h: Tower): void {
    const r = this.rings.get(h);
    if (!r) return;
    this.rings.delete(h);
    r.tw.remove();
    r.g.destroy();
  }
```
5. One class-doc line: "The working ring: while at least one enemy is inside, a thin ring in the tower's own color re-pulses at ground level out to the full radius once a second of scene.time (systems/fx/hasteRing.ts); gone the frame the last one leaves." 6. GameScene line 155 as above. 7. `npm run check` must pass.

### Pitfalls
- The ring is a draw, not an fx: never `fx.track`/`fx.full`/`this.fx` (a tracked ring would auto-destroy after 1 s and be blocked by the cap); the Mute ring (systems/enemyHooks/muteJam.ts) is the model.
- `dropRing`: `r.tw.remove()` before `r.g.destroy()` — the removed tween can't fire `onComplete`, so no double destroy.
- Radius `h.spec.range * CELL` (the exact expression the inside check squares) — not a hardcoded 2; the ring always matches the true aura radius.
- Position `h.base.x, h.base.y` (plinth centre; the inside check measures from it), depth `DEPTH.preview` (ground level, same as the Mute/aura rings); per-tower ring, so two in a cluster show two.
- Display only: leave `e.hastePct`, `t.hasteRatePct`, the dim base ring (`h.hasteRing` alpha) and the entry flash untouched; numbers (+30%, +15%, 2 cells) unchanged.
- The old cleanup's `!t.active` is a type error (Tower has no `active` field) — the replacement above is how a sold/re-grown tower is detected; do not add a field to Tower, do not touch Tower.ts/towerLook.ts.
- `n === 0` drops the ring that frame; no Haste tower ⇒ `auras` empty ⇒ nothing runs, the run is byte-identical.

### Tests
none (display only, no core rule).
