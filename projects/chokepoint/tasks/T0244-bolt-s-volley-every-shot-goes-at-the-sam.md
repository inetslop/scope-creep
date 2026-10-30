---
id: T0244
title: "Bolt's volley: every shot goes at the same enemy, one per barrel"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T00:51:08Z
claimed_at: 2026-10-30T00:52:07Z
designer: cachyos-x8664
---

## Goal
A tower with extra shots (Bolt added) now fires each shot at a different enemy (`pickTargets` in `src/systems/attacks/shot.ts`). Make it a volley instead: every shot of an attack goes at the same enemy, each from its own barrel, aimed with the sideways offset of that barrel. Extra shots become focused damage on the enemy furthest along, and a tower with pierce, whose shots fly straight, fires parallel lines as wide as its barrels, like a shotgun.

## Details
- **One target per attack:** a shot tower picks one enemy, the one furthest along as now, and fires all its shots at it. With shots 3, it fires three bolts at that enemy.
- **One bolt per barrel, offset like the barrels:** bolt n leaves barrel n's muzzle (`tower.muzzle(n)`, as now) and aims at the target moved sideways by barrel n's offset (perpendicular to the aim). A homing bolt still homes in and hits the target, and the offset only shows as the volley leaving side by side. A bolt that flies straight (a tower with pierce) keeps the offset, so the volley flies as parallel lines.
- **Pulse towers' bolts too:** a pulse tower with extra shots fires its bolts the same way (`src/systems/attacks/pulse.ts`): all at one enemy, the furthest along.
- **Card lines:** Bolt's added line at each rarity says the shots go at the same enemy, keeping that rarity's count, e.g. "One more shot at the same enemy each attack." Bolt's `description` matches.
- **Keep:** targeting picks the furthest-along enemy as now; when the targeting-modes task lands it picks the volley's one target. Damage per bolt, the shot sound (once per volley) and the barrels' look stay the same.

## Acceptance criteria
- [ ] A Bolt tower with two Bolts added fires three bolts per attack, all at the enemy furthest along, each from its own barrel.
- [ ] With Lance added too, the three shots fly as parallel straight lines, offset like the barrels.
- [ ] A pulse tower with extra shots fires all its bolts at one enemy.
- [ ] Bolt's added card line says the shots go at the same enemy, at every rarity.
