---
id: T0134
title: "Spray becomes a shotgun: a cone of pellets"
assignee: inet-racing
size: L
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T09:34:10Z
claimed_at: 2026-10-29T10:01:38Z
finished_at: 2026-10-29T13:46:52Z
epic: E4
---

## Goal
Spray stops being a second Lance-like "one hit that reaches more enemies" and becomes the pool's close-range shotgun. Each attack blasts a cone of straight, non-homing pellets. At point blank most of them hit, so it is the hardest-hitting short-range tower. At the edge of its range they spread out and many miss. Every other augment combines with it the way a player would expect: each pellet counts as a hit.

## Details
- Keep the id `spray` and the name "Spray" so saved and resumed runs that hold a Spray still load. Remove the needle split entirely: `HitPayload.needles`, `ProjectileSystem.spread()`, the `needles: 0` resets and the needle text in `describeSpec`. Keep `lightOf()` only if the pellets use it.
- Card lines. Use these exact strings, which fit the 70-char line cap and the 56-char tier cap in tests/content.test.ts:
  - As a tower's first augment: "Blasts 5 pellets in a cone: deadly up close."
  - When added: "+2 pellets per blast."
- Numbers by tier (Common/Rare/Epic): 5 pellets of 4/5/6 damage each, one blast every 1.2/1.05/0.9 s, range 2.5 cells.
- The blast: aim at the enemy furthest along within range, the same targeting as today. Fire every pellet at once, spread evenly across a 50° cone centred on that aim line. Pellets fly straight and do not home. A pellet hits the first enemy whose token it touches and then despawns. If it touches nothing, it vanishes at the tower's range. Several pellets can hit the same enemy, which is the point-blank payoff.
- Pellet look: short thin tracers in a lighter tint of the tower's colour (the existing tracer look). One shoot sfx per blast, not per pellet.
- How it combines. Every pellet is a hit and carries the tower's whole payload:
  - Spray added: +2 pellets per extra Spray. The cone stays 50°, so the pellets get denser.
  - Bolt added: +1 pellet per Bolt ("one more shot each attack"). Today an added Bolt does nothing on a Spray tower; fix that.
  - Rapid added: blasts come 50% faster and each pellet is 25% lighter (the existing multipliers).
  - Reach added: range ×1.35, so pellets fly further before vanishing. The cone angle is unchanged.
  - Lance added: each pellet pierces +1 enemy, continuing straight along its own line rather than retargeting.
  - Splash added: each pellet's hit bursts with the normal splash and cap.
  - Frost, Ember, Mark, Anchor added: each pellet hit applies its slow, burn, mark or root by the existing rules. These already refresh and never stack, so several pellets on one enemy do not multiply them.
  - Push added: an enemy is pushed at most once per blast, however many pellets hit it. Otherwise 5 pellets × 0.4 cells would throw it 2 cells.
  - Mint added and kill credit: a pellet kill is the tower's kill. That covers the gold pop, Mint's +1, the combo counter and the panel's kills line.
  - Rally (nearby or added): faster blasts, as for any tower.
  - Beam added: the second beam works exactly as on any other tower. No change.
  - Momentum (T0064, in flight): it multiplies the tower's damage before the payload is built, so pellets inherit it. Do not wire it separately.
  - Beam: T0131 (Beam combos II) defines an added Spray on a Beam tower as needles split from a beam kill, and those needles go away here. Whichever of T0131 and this task lands second must restate that combo in pellets (for example, a beam kill blasts the added Sprays' pellets outward from the corpse) and update T0131's card line to match.
  - Spray added to any other non-Spray tower: still does nothing. Its card line says "per blast", so that is honest. Keep the `spec.kind === 'spray'` gate.
- The panel's "≈ N/s" line (T0084): the Spray term becomes pellet damage × pellets × rate. This is the point-blank estimate against one enemy, the same convention as the shot term. Example: Common 4 × 5 / 1.2 ≈ 16.7.
- `describeSpec`: "Blasts N pellets at the enemy furthest along", plus the existing pierce, mark, slow and root suffixes, worded per pellet (for example ", each pellet hits 2 in a line").
- The wave-1 test in tests/core/augments.test.ts currently counts needles. Change it to count pellets (damage × pellets × rate), which comfortably holds wave 1.
- Closest existing augment: Splash, which damages a cluster. The difference: Spray's damage depends on distance. It is strongest when the enemy is on top of it, so placement next to the road matters more than for any other tower.

## Acceptance criteria
- [ ] A lone Common Spray fires 5 straight pellets of 4 damage across a 50° cone every 1.2 s, range 2.5. Rare and Epic give 5 and 6 damage, every 1.05 and 0.9 s.
- [ ] Pellets do not home. A pellet that touches no enemy vanishes at the tower's range. An enemy right next to the tower can take every pellet in one blast.
- [ ] No needles remain anywhere in the code: no `needles` field and no split on hit.
- [ ] Extra Spray: +2 pellets. Extra Bolt: +1 pellet. Rapid, Reach and Rally change cadence, damage and range as on any tower.
- [ ] Lance makes each pellet pierce along its own line. Splash bursts on each pellet hit. Frost, Ember, Mark and Anchor apply per pellet hit without stacking past their existing rules. Push moves an enemy at most once per blast.
- [ ] A pellet kill is the tower's kill: gold pop, Mint's +1, combo counter and kills line.
- [ ] Unit tests in tests/core/augments.test.ts cover the spec for each combination above: the pellet count with Spray and Bolt, pierce, splash, the Rapid multipliers and the Reach range. The panel DPS line reads 16.7/23.8/33.3 by tier for a lone Spray.
- [ ] The card lines are the exact strings above. A Spray added to a Bolt tower changes nothing. Desktop 1280x720 and mobile 412x915 smoke pass.

## Result (attempt 1, inet-racing)

Spray is now a close-range shotgun: its attack fires `spec.spray` straight non-homing pellets in a 50° cone at the enemy furthest along, each pellet striking the first enemy its path touches and vanishing at the tower's range, rendered as light-tinted tracers with one shoot sound per blast. The needle split is fully removed (HitPayload.needles, ProjectileSystem.spread, needle describeSpec text), and every augment now combines per pellet: Spray +2 and Bolt +1 pellets, Lance pierce along each pellet's own line, Splash bursts per pellet, Push at most once per blast via a per-blast guard in ProjectileSystem. Card strings, tier numbers (4/5/6 damage every 1.2/1.05/0.9 s, range 2.5), the panel DPS term (16.7/23.8/33.3), and the wave-1 balance test were updated to match, with the test suite extended to cover pellet counts, combinations, and the new describeSpec line. npm run check (typecheck + lint + 222 tests) and npm run smoke (desktop 1280x720 and mobile 412x915) both pass.

- Self-review: APPROVE
- Time: 225.2 min

```
.../chokepoint/game/src/content/augments/spray.ts  | 18 ++---
 projects/chokepoint/game/src/content/palette.ts    |  2 +-
 projects/chokepoint/game/src/content/types.ts      |  6 +-
 projects/chokepoint/game/src/core/augments.ts      |  9 ++-
 projects/chokepoint/game/src/core/towerDps.ts      |  9 ++-
 .../chokepoint/game/src/entities/Projectile.ts     | 53 ++++++++++++-
 projects/chokepoint/game/src/entities/towerLook.ts |  4 +-
 .../chokepoint/game/src/systems/EnemySystem.ts     |  2 -
 .../game/src/systems/ProjectileSystem.ts           | 90 ++++++++++++++++++----
 .../chokepoint/game/src/systems/TowerSystem.ts     |  5 +-
 .../chokepoint/game/src/systems/attacks/attack.ts  |  2 +
 .../chokepoint/game/src/systems/attacks/spray.ts   |  6 +-
 .../chokepoint/game/tests/core/augments.test.ts    | 56 ++++++++------
 13 files changed, 194 insertions(+), 68 deletions(-)
```

## Merge (attempt 1, inet-racing)

- Conflicts in: projects/chokepoint/game/src/entities/Projectile.ts, projects/chokepoint/game/src/systems/ProjectileSystem.ts
- The conflict agent resolved them.
