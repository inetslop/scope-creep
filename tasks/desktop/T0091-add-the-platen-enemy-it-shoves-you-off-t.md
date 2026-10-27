---
id: T0091
title: Add the Platen enemy — it shoves you off the page
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T08:45:39Z
---

## Goal
A new enemy that asks something no existing enemy does: the Platen pushes. It crawls toward you and every few seconds flattens and slams — a radial ink shockwave that shoves the player and the swarm away with no direct damage. It is the first enemy that changes where things are instead of how much they hurt, and it becomes a tool: bait its slam to push a swarm into the crop burn (T0045) or shove yourself out of an ambush.

## Details
- Closest existing enemy: the Block (charger). The Block charges at the player — aimed, kinetic, it comes to you. The Platen instead emits a radial push from itself that moves everything around it, including the player. The new behavior is the shove: a telegraphed, radial, zero-damage knockback wave.
- Shape and stats: yellow circle (yellow = heavy in the color language), radius 26, standard ink outline and hard paper-cut shadow. 60 hp, speed 20 (crawls toward the player — a wall that drifts), 10 contact damage, 4 xp, threat 3, spawn weight 2, unlocks at 150 s, knockbackResist 0.5 (heavy — it shrugs off about half of any push and keeps crawling).
- Slam cycle, repeating every 5 s (first slam 5 s after the Platen spawns):
  - Telegraph, 0.5 s: the Platen flattens to 40% of its height (scaleY) and a thin ink ring at 160-unit radius fades in around it. The telegraph is ink, not red — the slam does no damage, so red stays reserved for things that hurt (the Grid's sweep).
  - Slam: the ink ring ripples outward from the Platen (radius 26 → 160) over 0.25 s and fades. Any player within 160 units takes a 220-strength knockback impulse directly away from the Platen (for scale, Orbit's contact knockback is 90); every enemy within 160 units (including other Platens) takes a 120-strength impulse away. The slam itself deals no damage — the only damage a Platen does is its 10 contact damage.
  - The Platen returns to full height, and the next cycle starts 5 s later.
- First-encounter marginalia (T0027): "IT SHOVES", 2 s.
- Elites: the regular 45 s elite schedule can roll an elite Platen (1.8× scale, elite hp, same slam behavior).
- One new enemy content data file following the existing pattern (closest example: the Splitter content file, T0009) plus the slam behavior; the slam should reuse the existing knockback plumbing, so no new physics.
- No new weapon, no new key, no new scene.

## Acceptance criteria
- [ ] From 150 s onward a yellow circle (radius 26) spawns among the late-run enemies, crawls toward the player at speed 20 and deals 10 contact damage; the spawn-unlock test passes with the expanded roster (absent before 150 s, present at/after).
- [ ] Every 5 s (first at 5 s after spawning) it flattens to 40% of its height while a thin ink ring at 160 radius fades in over 0.5 s, then the ring ripples outward to 160 over 0.25 s.
- [ ] On the slam, the player within 160 units is visibly shoved away with the 220-strength impulse and enemies within 160 units with 120; the slam itself deals no damage.
- [ ] A Platen resists about half of the push (knockbackResist 0.5) and keeps crawling; an elite Platen appears on the normal elite schedule with the elite scale and hp.
- [ ] The first Platen in a run shows the marginalia "IT SHOVES" for 2 s.
- [ ] The telegraph reads as "get out of the way" (flattening + ink ring) and is clearly distinct from the red damage telegraphs (the Grid sweep).
