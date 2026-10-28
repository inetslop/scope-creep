---
id: T0065
title: "Second pick: every 5th draft offers a fourth card"
size: M
priority: 2
status: design
depends_on: [T0064]
attempts: 0
created: 2026-10-28T13:54:28Z
epic: E4
---

## Goal
A beat of abundance in the run's rhythm: every 5th draft offers four cards instead of three, so a deep run gets a moment to branch where three cards never could.

## Details
- **When:** counting the pre-wave-1 draft as draft 1, every 5th draft (5, 10, 15, …) offers a fourth card alongside the usual three. The player first sees it around wave 4.
- **The fourth card rolls exactly like the others:** the same tier odds for that wave (T0011), the same no-repeat rule (T0052 — it may not be any augment in the same offer or in the immediately previous offer), and T0048's first-draft floor is untouched (it acts only on draft 1).
- **Reveal:** the fourth card flips in last — ~200 ms after the third lands — with its own tier chime (T0032); the Epic frame shimmer (T0041) applies to it if it is Epic.
- **Picking:** picking any of the four ends the draft; the un-picked cards go to the hand as usual. The reroll (T0036) on a four-card draft re-rolls all four (same flips, chimes and price).
- **Layout** (both layouts, in the same row area the three-card row uses — no new scroll or zoom):
  - 1280x720: four cards in one row sharing the three-card row's width; each card is ~25% narrower than its three-card size.
  - 412x915: four cards in a 2×2 grid in the same area (two per row, two rows where the three-card row was); each card ~55% of the three-card width.
  - Cards keep the same structure (frame, name line, effect line, gem row, the owned dot T0044); type may shrink at most ~20% and no card text goes below 12 px.
- No label, no new key, no pause-screen line — the fourth card's own late flip is the teaching.
- Chained behind T0064 on purpose: T0064 adds an Epic-only entry to the pool and this changes the offer count in the same draft module, so the two never build at once.

## Acceptance criteria
- [ ] Drafts 1–4, 6–9, 11–14, … offer exactly three cards exactly as today; drafts 5, 10, 15, … offer four.
- [ ] On the 5th draft the fourth card flips in last (~200 ms after the third) with its tier chime; the draft still ends on one pick and the un-picked cards land in the hand.
- [ ] At 1280x720 the four cards fit one row in the existing row area with no scroll; at 412x915 they fit a 2×2 grid in the same area with no scroll; all card text is at least 12 px and the name line stays bold.
- [ ] The fourth card never repeats an augment from its own offer or the immediately previous one (T0052); a reroll of a four-card draft re-rolls four cards.
- [ ] The hand, the tower panel, the reroll button and every three-card draft are unchanged.
