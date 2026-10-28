---
id: T0037
title: The Recent line stars your best run
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T09:20:45Z
epic: E1
---

## Goal
The menu's Recent line (T0018) already lists your last four runs so you can see your trend; now the run that set your record is marked with the same small yellow star the profile card already uses (T0016), so you can see at a glance which recent run was your best.

## Details
- The menu's profile card lists your last four finished runs as short entries (wave + coins), most recent first. This task adds one visual element to those entries: a small yellow five-point star.
- Any Recent entry whose wave equals your all-time best wave gets the star, drawn exactly like the profile card's "Best wave" star (T0016): same five-point shape, same yellow, same size, sitting to the right of that entry's numbers on the same baseline.
- If two of the last four runs both reached your best wave, both entries get the star. If none of the last four reached it (the record is older than four runs), no entry gets a star — the profile card's best-wave line still shows the number either way.
- The star appears or disappears on its own as runs finish and the list shifts; there is no interaction, no new key or button, and the pause screen is unchanged.
- It is a menu-screen touch only: no change to the run itself, the HUD, the rewards screen, the profile's saved data, or the star on the profile card.

## Acceptance criteria
- [ ] In the menu, a Recent entry whose wave equals your best wave shows the small yellow star to the right of its numbers; entries below best wave show no star.
- [ ] Two Recent entries at the same best wave both show the star.
- [ ] After a run that does not beat your best wave, the star stays on the entry that holds the best wave (and simply disappears from the list if that entry scrolls out of the four).
- [ ] The star matches the profile card's star (T0016) in shape, size, yellow, and baseline, and nothing else on the profile card or Recent entries changes.
