---
id: T0152
title: "Haste: the Epic that hastens everything it touches"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T12:14:31Z
claimed_at: 2026-10-29T12:14:34Z
epic: E4
designer: desktop
---

## Goal
E4's next pool augment — and the first tech-gated one: an Epic-only aura that makes the road inside it race, so a Haste tower is a tempo trade, the first augment whose buff costs the run something. It lands gated: absent from every draft roll until the tech tree's pool node (T0153, 25 coins) is bought, so the tree unlocks Haste, it doesn't build.

## Details
- Card (Epic only, like Mark/Rally/Mint/Anchor — never Common or Rare; not an opening-draft augment):
  - asTower: “2 cells: towers +30% attack, enemies +30% speed.”
  - asAdded: “Each extra Haste: +15% to both.”
  - description: “Towers and enemies within 2 cells run 30% faster. Added: each extra +15% to both.”
- First form: kind `rally` (the support aura that makes towers attack faster), extended with a new enemy side — a support with no attack of its own, 0 damage like the other supports (the panel's “≈ N/s” line, T0084, shows nothing for it).
- Added form: a new field `haste` (no existing added form changes it): each extra copy scales the aura +15% to both sides. It is the aura itself, so it works the same on every host attack kind (shot, spray, pulse, beam, burn, mark, rally, spray) — there are no per-hit effects to apply.
- The aura (one per Haste tower, radius 2 cells, the same circle reach as Rally and Mint — the T0103 ring rule: the enemy's or tower's center inside the 2-cell circle around the Haste tower):
  - Enemy side: while an enemy's center is inside, it walks ×(1.30 + 0.15 × extra copies) of its current speed — continuous while inside, off the moment it leaves; no duration, no re-application, no shrug-off (it is not a root). It multiplies whatever speed the enemy has: a Sprinter's ramped speed, a Dasher's crawl and its dash. The Ward (T0111) is affected — it ignores slow, root and push, not speed changes. With a slow: the slow first, then Haste (a 40% slow + 30% haste = 0.6 × 1.3 = 0.78 of base).
  - Tower side: the same attack-speed stat Rally changes — every tower with its center inside, including the host tower (a Bolt + Haste tower fires at 1.3× its rate) and supports' pulses, attacks (1.30 + 0.15 × extra copies) × faster. Stacks additively with Rally (10% + 30% = 40% faster), no cap. A Mute-silenced tower inside the aura stays silent (the buff does not override silence).
  - Copies: two Hastes in one tower = one aura at +45% to both; three = +60%; additive, no cap.
- Look: a flat wide red ring at the tower's base (no augment uses red; the draft-card icon is the same red ring, size 0.22); one tick per copy; the ring is 40% alpha while no enemy is inside, full alpha while at least one is, and flashes to full for a ~0.2 s beat each time an enemy enters (the working-aura beat, T0055).
- The gate (the tech-tree unlock, E2's branch three): Haste is in the content but absent from every draft roll (pre-wave-1, later, reroll, the fourth card) unless the saved profile's purchased list holds the tech node id `haste` (T0153's node). The check runs at every draft roll, so a node bought between runs takes effect from the next draft on. Until T0153 lands the node cannot be bought and Haste never rolls.
- 16-cap (the augments module): this is the pipeline's 19th augment (14 in + T0025, T0062, T0064, T0095, T0152). The ROADMAP flags the cap: the first task to land past 16 (Momentum, T0064) removes or merges one and says which — the PO's leaning is a Frost + Haste merge (the same enemy-speed stat, opposite signs). If that merge lands before this task builds, Haste is the merged form and this task is re-filed to match; the architect notes the state at design time.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Rally | `kind rally`: a 2-cell aura that makes towers attack faster; its added form changes the same attack-speed stat | It also makes enemies inside walk faster — Rally only buffs towers; Haste is the first aura that works on enemies and towers at once, a buff that costs the run something |
| Frost | the added form changes enemy movement speed | Frost slows hit enemies by 40% for 2 s, applied per hit with a duration; Haste hastens continuously while inside the aura — the opposite direction, no per-hit, no duration, and Frost never touches towers |
| Push | an aura that moves enemies in a radius | Push drags enemies backward along the road (position, −0.4 cells per hit); Haste changes walking speed (velocity) — a pushed-and-hasted enemy keeps walking, faster |
| Anchor | an aura that changes enemy speed to zero | Anchor fully stops for 0.75 s every 3 s, with the 2 s shrug-off after; Haste multiplies speed while inside — continuous, reversible the moment the enemy leaves, no timer |
| Mint | a 2-cell aura support with no attack of its own | Mint's aura changes the economy (kill gold); Haste's aura changes tempo — and its buff is a cost as much as a gain |
| Momentum | a run-growth buff with no input | Momentum is run-wide, one-way and damage-only (+5% per clean wave, never lost); Haste is per-tower, two-way, and turns off the instant the enemies leave the radius |

## Acceptance criteria
- [ ] With the `haste` node not owned (or T0153 not landed), no draft — pre-wave-1, later, a reroll, a fourth card — ever offers Haste; with it owned, Haste rolls Epic-only like the other Epics and can be bought and built like them.
- [ ] A Haste tower: an enemy inside its 2-cell radius walks 30% faster while inside and the multiplier is gone the moment it leaves (a Dot covers the same stretch measurably quicker through the ring); the aura is continuous — no duration, no re-application, no shrug-off after leaving.
- [ ] A Haste tower: every tower inside the radius attacks 30% faster, including the host (a Bolt + Haste tower fires at 1.3× its rate) and supports' pulses; a Mute-silenced tower inside the aura stays silent.
- [ ] Two Hastes in one tower: one aura, +45% to both, two ticks on the base ring; three: +60%; additive, no cap; with a Rally overlapping, the tower side is 10% + 30% = 40% faster.
- [ ] A Sprinter inside the aura walks at its ramped speed ×1.3; a Ward inside walks +30% faster; an enemy both slowed (Frost) and hastened walks at 0.6 × 1.3 = 0.78 of its base speed.
- [ ] Look: a flat wide red ring at the base, one tick per copy, 40% alpha with no enemy inside, full while at least one is inside, a ~0.2 s brighten beat on each entry; the draft card's icon is the red ring.
- [ ] Byte-identical: with no Haste tower on the board (and no node owned), enemy speeds and tower attack cadences are byte-identical to today.
