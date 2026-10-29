---
id: T0084
title: The panel says how hard a tower hits
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
claimed_at: 2026-10-29T00:05:23Z
epic: E4
designer: cachyos-x8664
---

## Goal
A first-time player can compare towers at a glance: the tower panel shows each tower's expected damage per second, one number that moves as augments are added.

## Details
- A new muted line at the bottom of the tower panel, under the kills line (T0070): "≈ N/s" — N is the tower's expected damage per second against **one** enemy, read from the tower's accumulated spec (the same effective values the tower's attacks actually use — tier applied, added forms applied), one term per augment in the tower:
  - Shot attacks (Bolt, Lance, Rapid, Reach, Splash): the attack's effective damage × its attacks per second. Pierce, Splash's burst and any second target do not count — the line is one enemy; Splash counts its primary hit only.
  - Ember (T0028) added: its burn's per-second rate (3/4/5 by tier) is added on top of the host's shot term.
  - Support augments (Frost, Push, Anchor, Mark, Mint, Rally): 0 — they deal no damage to that enemy.
  - The "≈" says it is an estimate; N is floored to a whole number; a tower whose total is under 1/s (a pure support tower) shows no line at all.
  - When Chain (T0025) and Beam (T0073) land, they contribute their primary-strike terms (Chain: one strike per attack; Beam: its per-second rate, main beam only) — the spec is written so each augment kind adds exactly one term.
- New pure module (e.g. `src/core/towerDps.ts`) with the per-kind terms and unit tests; the panel line is a read of that function — it updates as augments are added with no extra state.
- Muted ink, the kills line's (T0070) size and placement; the panel grows by one fixed line height. No input, no sound, no board change.
- Closest example: the kills line (T0070) for placement and style; the tier-effective values the attacks already use (T0002's tiers) for the numbers.

## Acceptance criteria
- [ ] A lone Common Bolt tower shows "≈ N/s" where N is floor(its damage ÷ its attack interval), using the same damage and cadence the bolt actually fires with.
- [ ] A Bolt with Rapid added shows the modified damage and cadence (the added form's numbers, not the bare Bolt's).
- [ ] A Bolt with Ember added shows the bolt's term plus Ember's per-second rate for the tower's tier.
- [ ] A Rally-only tower shows no line; a Mark + Bolt tower shows the bolt's term with Mark contributing 0.
- [ ] The line updates as augments are added and removed from the hand; unit tests cover one per augment kind, a Bolt + Rapid + Frost combo and a support-only tower.
