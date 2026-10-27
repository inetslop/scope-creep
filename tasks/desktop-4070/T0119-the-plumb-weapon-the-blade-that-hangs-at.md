---
id: T0119
title: The Plumb weapon — the blade that hangs at your aim
assignee: desktop-4070
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T15:11:35Z
claimed_at: 2026-10-27T15:42:54Z
designer: desktop
---

## Goal
A new level-up card that changes how you aim: a thin ink line hangs from the top of the page at your aim's X and re-aims instantly, biting everything that crosses it — a standing wall you place with your aim, in the line of the other weapon cards (Line, Orbit, Arc, Counterpoint).

## Details
- The card: "Plumb" — ink-colored, weight 4, maxLevel 1, like the other weapon cards. One line of card text does the teaching: "A thin ink line hangs at your aim and bites what crosses it." The line is self-evident the moment it appears.
- The line: a thin (2 u wide) ink line hangs from the top edge of the crop-safe area straight down to the bottom edge at your aim's X. It follows the aim instantly every frame — no firing, no cooldown, no projectile. It stays inside the crop-safe area, so it follows the T0045 shrink and never extends into the cropped margin.
- The bite: an enemy whose body crosses the line takes 12 damage once per 0.5 s per enemy (a steady bite, not a per-frame burn) with the normal hit flash, and is shoved 60 units horizontally away from the line (a small knock in the existing knockback idiom). The line never hurts the player. Bosses bite the same as any other enemy — a slow bleed while you focus.
- It eats fire: an enemy bullet that touches the line is destroyed, with a small flat ink ring where it dies (reuse the existing ring FX).
- It composes like the other weapon cards: picking it adds it to your kit — your Point volleys keep firing normally (the Plumb is a standing weapon like the Orbit, not a volley). It shows in The Index (T0104) as a normal pick and, at maxLevel 1, is never offered again (the existing rule).
- Pool: the upgrade pool is 16/16 at the cap, so this task also removes the Momentum card (+12% move speed) from `UPGRADES` — Plumb in, Momentum out, the pool stays exactly 16. Momentum is the least decision-changing of the stat cards (see the pool note in IDEAS.md). If a unit test names `momentum` by id (upgrade-roll, stat-stacking or spawn tests), update it in the same task so the suite stays green; no other card's numbers change.
- No new input, no new HUD element, no new scene, no new sound.

## Acceptance criteria
- [ ] "Plumb" appears as a level-up card (ink, weight 4, maxLevel 1); picking it adds a thin ink line hanging from the top of the crop-safe area at your aim's X that follows the aim instantly, and it is listed in The Index.
- [ ] An enemy crossing the line takes 12 damage once per 0.5 s with the normal hit flash and a small 60-unit horizontal shove; the player is never hurt by the line; enemy bullets that touch the line are destroyed.
- [ ] Your Point volleys keep firing normally; the card is never offered a second time; a Warm Start (T0114) can draw it like any other card.
- [ ] The upgrade pool has exactly 16 cards: Momentum is gone (never offered, never drawn) and Plumb is in; the existing upgrade-roll, spawn and stat-stacking tests stay green (updated in the same task where they name momentum).
- [ ] `npm run check` and `npm run smoke` pass.
