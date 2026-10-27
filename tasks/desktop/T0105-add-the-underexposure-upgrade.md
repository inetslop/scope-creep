---
id: T0105
title: Add the Underexposure upgrade
assignee: desktop
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T11:32:46Z
claimed_at: 2026-10-27T11:59:03Z
designer: desktop
---

## Goal
A new level-up card that rewards finishing: while you own Underexposure, any badly wounded shape takes double damage from you, so the kills you are chasing are the ones you end fastest. It is the first conditional card in the pool — it changes which enemy you aim at, not a stat.

## Details
- New upgrade "Underexposure" in `UPGRADES` (appended at the end of the array, same shape as the other entries): `id: 'underexposure'`, `name: 'Underexposure'`, `description: 'Wounded shapes (under 50% HP) take double damage'`, `maxLevel: 2`, `weight: 3`, `color: PALETTE.ink`.
- The rule (the whole point of the card): when the player deals a hit to an enemy, if the enemy's current HP — measured before this hit is applied — is strictly below the threshold of its own max HP, that hit's damage is doubled (×2). The threshold is 50% of max HP at level 1 and widens to 75% of max HP at level 2 (the multiplier is ×2 at both levels).
- It applies to every damageable shape — normal enemies, elites, and bosses — so the second half of a boss fight is a faster, more satisfying finish.
- It composes multiplicatively with the existing crit rule: a crit that lands on a wounded enemy deals ×4 total. It composes with all weapon damage — Point, Line, Orbit contact, Arc, and the queued Counterpoint (T0055) — with no per-weapon special cases.
- Without the card, nothing changes: all damage is exactly as it is today.
- Legibility: damage numbers for hits that are doubled by Underexposure render in blue (PALETTE.blue) instead of ink, so the doubled finish is visible at the moment it happens (normal hits stay ink, crits stay red — see the DamageNumbers system from T0004, which already has the crit color path). The level-up card's description is the teach; there is no new HUD element, no new input, and no new scene.
- Keep the rule isolated from the enemy's own shape, texture and hitbox so it composes cleanly with the shape-aspect change queued on asus (T0098): the doubling is a damage-pipeline rule and the blue numbers live in the damage-number system — do not add markers to, or re-draw, the enemy shapes themselves.

## Acceptance criteria
- [ ] The level-up menu can offer the Underexposure card: a max-level-2, weight-3, ink-colored card reading "Wounded shapes (under 50% HP) take double damage".
- [ ] Without the card, a hit on an enemy at 40% of its max HP deals exactly the normal (un-doubled) damage — the game is unchanged.
- [ ] With level 1, a hit on an enemy at 49% of its max HP deals double damage, while a hit on an enemy at exactly 50% (or 51%) deals normal damage — the threshold is 50% of that enemy's own max HP, checked on the HP the enemy has before the hit.
- [ ] At level 2 the threshold widens: a hit on an enemy at 74% of its max HP is doubled, at 76% it is normal.
- [ ] It works on elites and bosses (a boss below the threshold takes double damage on the next hit), and a crit on a wounded enemy deals ×4 total.
- [ ] Damage numbers for Underexposure-doubled hits render in blue (PALETTE.blue); normal hits stay ink and crits stay red.
- [ ] `npm run check` and `npm run smoke` pass.
