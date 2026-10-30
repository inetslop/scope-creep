---
id: T0247
title: Pierce shots fly straight through the line instead of homing
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T00:51:08Z
---

## Goal
A shot with pierce (a Lance tower, or any shot tower with Lance added) should feel like a lance, not a homing missile. Today it homes in on its target, then jumps to a nearby enemy and homes in again (`pickPierceTarget` in `src/core/targeting.ts`), so it can turn corners. Make it fly in a straight line instead, through every enemy in its path, until its pierce is used up or it flies out of reach. Then where you place a Lance matters: along a straight stretch of road it hits a whole queue, across a bend only a few.

## Details
- **The shot:** a shot with pierce 1 or more is fired at its target and then flies straight; it never turns. It strikes each enemy it touches, once each, until it has hit pierce + 1 enemies or flown 1.5 × the tower's range from the tower, then it is gone. It never homes and never jumps to an enemy off its line.
- **It still hits its first target:** aim at where the target will be when the shot gets there (its speed along the road and the shot's speed), so the first hit lands as reliably as a homing shot does today. A shot without pierce homes in as now.
- **Effects per hit stay as today:** every enemy it strikes takes the hit's damage and effects (slow, burn, push, mark). Splash bursts at the shot's last hit, as now.
- **Same for pellets:** Spray's pellets already fly straight with pierce; keep them as they are.
- **Code:** the straight flight for pierce shots replaces the jump in `src/systems/ProjectileSystem.ts` (the pierce branch that calls `pickPierceTarget`). Reuse the straight-pellet path that Spray uses (`fireCone`'s flight) rather than writing a second one. If nothing else uses `pickPierceTarget` and `PIERCE_REACH` afterwards, remove them.
- **Card lines:** Lance's `asTower` says the shot flies straight through the line, e.g. "A long thin shot straight through the line: 12 damage every 0.9 s, hits one beyond." (keep each tier's numbers), and `description` matches.

## Acceptance criteria
- [ ] A Lance tower's shot hits its target, then keeps going in a straight line and hits the enemies behind it on that line, up to its pierce + 1 enemies.
- [ ] A pierce shot never turns toward an enemy that isn't on its line, and is gone after 1.5 × the tower's range.
- [ ] Against a single walking enemy, a Lance tower hits as reliably as before (aims ahead).
- [ ] Shots without pierce still home in as before; Spray's pellets are unchanged.
