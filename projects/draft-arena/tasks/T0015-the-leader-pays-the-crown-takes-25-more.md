---
id: T0015
title: "The leader pays: the crown takes 25% more damage from players"
size: S
priority: 2
status: designing
depends_on: [T0013]
attempts: 0
created: 2026-10-31T03:34:39Z
claimed_at: 2026-10-31T04:06:51Z
epic: E4
designer: desktop
---

## Goal
Leading is a target, not just a scoreboard number: the crowned player takes more damage from other players, so holding the top spot is actively risky and knocking the crown out is quicker and more satisfying.

## Details
- A new rule value next to `pvp.damageMul` in src/content/rules.ts (the closest example: `pvp.damageMul` 0.5, `pvp.bountyXpPerLevel` 4): add `pvp.crownTakenMul` = 1.25.
- When another player's damage lands on the crowned leader, multiply it by `pvp.crownTakenMul` after the normal `pvp.damageMul`: a normal player deals 0.5x, and against the crown 0.5 x 1.25 = 0.625x.
- Only the damage *taken* by the crown changes. The crown deals the same damage as before, non-crowned players are unaffected, and monster damage to the crown is unchanged (this is a pvp rule, not a monster rule).
- Works with 6 and with 60: in a 6-player match the crown is visibly easier to bring down in a duel; at 60 the top spot turns over faster, so the crown changes hands more often.
- What the player feels: the leader is a softer target — going for the crown is quicker and pays off sooner, so the field's attention concentrates on the top scorer.

## Acceptance criteria
- [ ] A level-10 crowned player takes 25% more damage from another player's weapon than an identical non-crowned player (0.625x vs 0.5x the attacker's damage).
- [ ] The crowned player's own outgoing damage is unchanged from a non-crowned player.
- [ ] Monster damage to the crowned player is unchanged (no 1.25 multiplier from monsters).
- [ ] A non-crowned player takes exactly the same damage as before (0.5x pvp).
- [ ] The new value lives in rules.ts next to the other pvp numbers; no new HUD or input.
