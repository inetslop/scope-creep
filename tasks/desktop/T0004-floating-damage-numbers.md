---
id: T0004
title: Floating damage numbers
assignee: desktop
size: M
priority: 2
status: design
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
