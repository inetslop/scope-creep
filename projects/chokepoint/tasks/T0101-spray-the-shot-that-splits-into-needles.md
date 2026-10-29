---
id: T0101
title: "Spray: the shot that splits into needles"
size: L
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-29T02:55:25Z
epic: E4
---

## Goal
The pool gets its first aimed spread: a Spray shot that, on its first hit, splits into homing needles hunting separate enemies — one hit at range covers a line Splash's 1-cell burst can't.

## Details
- Both card lines (keep them inside the tier-line cap — T0093's rejection was a 91-char line against the 56-char cap in tests/content.test.ts; use these exact strings):
  - As a tower's first augment: "Fires a shot that splits into 3 homing needles on hit."
  - When added: "+1 needle per split per extra Spray."
- Numbers by tier (Common/Rare/Epic): 12/14/16 damage per shot, every 1.1/0.95/0.8 s, range 4.
- On its first hit the shot deals its full damage to the enemy it struck, then splits into N needles, N = 3 + the tower's extra Sprays: each needle carries a third of the shot's damage and homes to a different nearest enemy other than the one just struck — one shot therefore reaches up to 1 + N enemies in a line or cluster.
- The needles are the tower's damage: a needle kill is that tower's kill (gold pop, Mint's +1, the combo counter and the panel's kills line all credit it); Mark added to a Spray marks everything the needles find; Rally speeds the cadence; Momentum (T0064) multiplies the needles' damage.
- Pool, all tiers, offered from the opening draft, the normal tier roll and no-repeat rule.
- Look: a flat wide head on the tower with one tick per copy (Momentum's tick language); the needles a lighter tint of the tower's own color, thin tracers.
- Closest existing augment: Splash (damage across a cluster). New: the spread is aimed — the needles home to separate enemies, so the hit reaches beyond the burst's circle, and the spread grows with copies, which no added form does.
- The panel's "≈ N/s" line (T0084) gains the Spray's primary-strike term when this lands — the shot's damage × shots per second against one enemy; the needles are the spread, not the per-target estimate.
- Claim order: last in the documented order, after Mend (T0095) — the runner keeps the shared registration one at a time; the queue is deep on purpose, the pool is the epic.

## Acceptance criteria
- [ ] The draft offers Spray at all three tiers from the opening draft, with the two card lines above (inside the cap) and the usual frame, gem row and odds treatment.
- [ ] A lone Spray's shot strikes one enemy at full damage (12/14/16 by tier) and splits into three needles, each homing to a different nearest enemy other than the one struck, each dealing a third of the shot's damage.
- [ ] Each added Spray adds one needle per split (4, 5, 6, …), still to different nearest enemies.
- [ ] A Spray tower looks unlike every other tower: the flat wide head with one tick per copy; the needles a lighter tint of the tower's color.
- [ ] A needle kill is the tower's kill — gold pop, Mint's +1, combo counter and kills line — and Mark added to a Spray marks everything the needles find.
- [ ] The panel's DPS line (T0084) shows the shot term for a Spray tower (10.9/14.7/20 by tier against one enemy); desktop 1280x720 and mobile 412x915 smoke pass.
