---
id: T0025
title: "Chain: the zap that leaps between enemies"
assignee: asus
size: L
priority: 3
status: design
depends_on: [T0020]
attempts: 0
created: 2026-10-28T05:31:15Z
epic: E4
---

## Goal
The draft can roll a new augment, Chain: a zap that strikes one enemy and leaps to the next — the first attack that changes target mid-attack. Added to any tower, it makes that tower's attack leap to one more enemy, so a chokepoint can hit a whole pocket, not just one line.

## Details
- New pool augment (rolls at all tiers like Lance and Anchor — not Epic-only; offered from the opening draft, since it has an attack of its own). **Closest existing:** Splash (the only other multi-hit: a burst that strikes everything inside a radius). **What is new:** Chain's hits pick a *new enemy one at a time* — each leap reaches up to 2.5 cells from the previous hit, so a 3-leap chain can cross the whole field, far past any burst radius. And as an added form it makes **any** first augment's attack leap to a second target (a Bolt + Chain shot strikes one enemy beyond the target; Lance's pierce is only along the path — this is a different way of hitting more than anything in the game).
- **As a tower's first augment (an attack of its own):** a zap that strikes the enemy furthest along in range, then leaps to the nearest enemy it has not yet struck, then to the next. Each leap is a flat white zigzag bolt that flashes between the two struck enemies and fades over ~100 ms, with a soft bright zap blip per leap (one new Sfx method, no louder than the hit blip). If no unstruck enemy is within leap reach, the attack ends early (2 or 1 leap is fine — an attack never wastes a leap on air).
- **When added to a tower:** each attack leaps to 1 more enemy — after the attack's last normal hit, the zap leaps to the nearest unstruck enemy within leap reach. Copies stack: two added Chains leap to two more.
- **Exact values (Common / Rare / Epic):**
  - Damage per leap: 15 / 18 / 20.
  - Leaps per attack: 3 at every tier; +1 per added Chain copy (any tier).
  - Attack cadence: every 1.2 s / 1.05 s / 0.9 s.
  - Range 2.8 cells; leap reach 2.5 cells from the previous hit.
- **Card lines (Common):** first: "A zap that leaps: 15 damage, 3 leaps, every 1.2s." / added: "Each attack leaps to 1 more enemy." The Rare and Epic cards show their own damage and cadence in the same first line; the added line is the same at every tier.
- **Look on the tower:** a body shape and a bright color no other augment uses (check the content folder; if the obvious pair is taken by an in-flight augment, take the next free one). A short stubby white barrel (the zap flashes out of it; it throws nothing), and one small white zigzag tick on the base ring per Chain in the tower (the existing tick look).
- The leap rule is a pure core function with unit tests (first target = furthest along; each next = nearest unstruck enemy within leap reach; an enemy already struck this attack is skipped; early stop when nothing is in reach). Closest example: the pierce-target function and its tests in the core targeting file (Lance, T0004).
- The per-leap number is the one the damage-per-second sanity test in the augment tests sees (15 × ~0.83 ≈ 12.5, the same band as the other first augments), so that test should pass unmodified — if it does not, tune the Common values inside the band, never the test's floor. A 3-leap zap being strong against packed waves is the point: that is its role, like Splash's burst.

## Acceptance criteria
- [ ] The draft can roll Chain as Common, Rare and Epic (frame and gem row per T0002); the card shows that tier's damage and cadence; the added line reads "Each attack leaps to 1 more enemy."
- [ ] A lone Common Chain tower zaps the enemy furthest along, then leaps to the nearest other enemy, then the next: three white zigzag flashes, three hit flashes, 15 damage each.
- [ ] With only two enemies in reach the attack makes two leaps and stops; an enemy already struck by this attack is never struck again by it.
- [ ] A Bolt tower with Chain in a later slot strikes one more enemy beyond its target per shot; with two added Chains it strikes two more.
- [ ] A Rare Chain tower deals 18 damage per leap and attacks every 1.05 s — visibly faster and harder than the Common one.
- [ ] The tower shows the unused shape/color body, the short white barrel and one zigzag tick per Chain copy, visible at 1x zoom at 412x915 and 1280x720.
- [ ] Each leap plays the soft zap sound (no louder than the hit blip), and a first-time player can read exactly whom the chain hit from the flashes alone.
