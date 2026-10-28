---
id: T0012
title: "Mark: the rule-changing augment that only comes as Epic"
assignee: asus
size: L
priority: 2
status: designing
depends_on: [T0002, T0011]
attempts: 0
created: 2026-10-28T02:08:37Z
claimed_at: 2026-10-28T02:51:58Z
epic: E4
designer: desktop
---

## Goal
E4's jackpot: a rule-changing augment that only ever appears as Epic. It marks the enemy furthest along so that everything hurts it more — and it turns any tower's hits into markers, so it combines in a way no current augment does.

## Details
- New augment, Epic only. Closest existing: Bolt (same target — the enemy furthest along) and Frost (the support-role precedent — a first form that affects enemies without dealing damage). What is new: the **mark** — a damage multiplier on an enemy that applies to ALL damage sources (other towers, other augments, this tower's later hits), not just one tower's attack.
- As a tower's first augment (support role, no damage, no projectile): every 1.2 s it marks the unmarked enemy furthest along within 3.0 cells. A marked enemy takes 25% more damage from everything, until it dies.
- Added to a tower: "hits apply the mark" — every enemy this tower hits takes the mark. Mark potency = 25% per Mark in the tower that marked the enemy (a tower holding two Marks marks for +50%). An enemy carries at most one mark (first mark wins); the mark disappears when the enemy dies.
- Card lines (the card is always Epic; no Common/Rare values exist):
  - "Marks the enemy furthest along: +25% damage from all."
  - "Added: hits apply the mark, +25% per Mark."
- Draft rule: a card rolls its tier first, then its augment — Mark is in the pool ONLY for cards that rolled Epic. Common and Rare cards are drawn from the unchanged pool, so a Common or Rare Mark card can never exist. (With T0011's live odds Mark is ~1 of every 6 Epic cards — rarer still late in a run.)
- Look on the tower: body color pink (if an augment already uses pink, another bright unused color) with a body shape no other augment uses, so a Mark tower reads as new at a glance. A thin ink-colored ring around the tower base flashes on each mark (scale up + fade, 200 ms); each Mark in the tower adds one small tick to the ring (the existing tick look). If T0010's tier pips have landed, they stay visible — the ring and ticks sit around/below the pips, never on top of them.
- Look on the enemy: the mark is a small ink-colored down-chevron hovering above the enemy, pop-in over 100 ms. It never overlaps the enemy's body or the towers.
- Values: no damage, no kill gold, cooldown 1.2 s, range 3.0 cells. Available from the very first draft; no wave gating.

## Acceptance criteria
- [ ] A lone Mark tower marks the enemy furthest along in range every 1.2 s; the marked enemy shows the ink chevron and dies one hit sooner than an unmarked one of the same kind.
- [ ] A Bolt tower with Mark in a second slot marks the enemy it hits (the chevron appears on the hit enemy, not on the furthest one).
- [ ] A tower with two Marks marks for +50% (the marked enemy dies even sooner); an enemy never shows two chevrons.
- [ ] Over many seeded drafts, Mark appears only as Epic (purple frame, 3 gems); no Common or Rare Mark card ever appears.
- [ ] The Mark tower shows the ink ring; the ring flashes on each mark; chevron and ring are visible at 1x zoom at 412x915 and 1280x720.
- [ ] T0011's odds line and the normal draft pool for non-Epic cards are unchanged by this task.
