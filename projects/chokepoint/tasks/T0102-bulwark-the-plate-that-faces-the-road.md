---
id: T0102
title: "Bulwark: the plate that faces the road"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T07:23:57Z
designer: desktop-4070
---

## Goal
The enemy queue's head (the Mute, T0074, has landed): a fat slow walker whose front half takes half damage — the first enemy for which the side of the road a tower sits on changes the damage that tower deals.

## Details
- Closest existing enemy: Block (a plain slow walker). What is new: directional damage — its front side reduces the damage it takes, so a tower downstream (shooting into the plate) is worth less than one upstream (shooting the rear), and placement along the road becomes a real decision against it.
- Look: a fat round — a circle at 1.25× Block's size — red (a repeated family color: the warm palette is closed, T0074's lesson), with a flat plate on its front half: a flat arc across the front third of the disc in the token's darker side-face red, turning to face its direction of travel. The usual darker side face and soft shadow.
- Movement: 80% of Block's speed, walks (no behavior besides the plate).
- Survivability: exactly Block's hp (the plate is not hp); wave escalation applies as usual. Threat 1 (Block's). Gold: the normal Block bounty. Leak: 1 life, as usual.
- Damage rule: the plate covers the enemy's forward 180° (the direction it travels along the road). A directed shot whose travel is with the enemy's direction of travel (striking the plate — a tower downstream shooting upstream) deals 50% of its damage; a directed shot traveling against it (striking the rear — a tower upstream shooting downstream) deals 100%; a dead-side hit (exactly perpendicular) counts as the rear (100%). Damage with no flight direction — pulse rings, trap springs, burn ticks, the beam — always deals full.
- Waves: from wave 12, one Bulwark on waves 12, 16, 20, 24, … — reserved in the wave plan and kept out of the budget picks (the Hauler/Mute pattern).
- Its death is an ordinary kill: gold, combo, Mint, the kills line and the "stopped" count all fire normally. The name tag (T0085) announces "Bulwark" on its first spawn; the wave preview, icon and sounds pick it up the way the Hauler's did (T0057).
- It lives in its own content file (the Mute's own-files pattern, T0074), so it lands beside the shared-augment queue.

## Acceptance criteria
- [ ] From wave 12 on, waves 12, 16, 20, … each contain exactly one Bulwark (reserved in the plan, not added by the budget picks); waves 1–11 are byte-identical to today.
- [ ] A tower downstream of a Bulwark (shooting its plate) deals half the damage the same tower deals to a Block; a tower upstream (shooting the rear) deals full; pulse/trap/beam/burn-tick damage is full either side.
- [ ] The plate faces the direction of travel and turns with it; the token is red, 1.25× Block's size, round, plate in the darker side-face red.
- [ ] A Bulwark leak costs 1 life like any enemy's; its kill pays the normal gold with the normal pop, and the kills line counts it.
- [ ] The first spawn shows the "Bulwark" name chip (T0085); the wave preview shows its token and count.
