---
id: T0018
title: The menu remembers your last four runs
assignee: narcissus
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-28T03:39:38Z
epic: E1
---

## Goal
After a few runs, the menu should show your recent runs and what they paid out, so you can see you are progressing run to run.

## Details
- The saved profile (T0001) gains a small list of the four most recent finished runs, most recent first, each storing the run's wave and its coins. When a run ends, the new run is prepended to the list and the list is capped at 4. The existing profile fields (best wave, total coins, last run) are unchanged.
- Under the profile card on the menu, add one small line: the word "Recent" followed by up to 4 entries, each "W<wave> +<coins>", most recent first, separated by " · ". For example: `Recent  W12 +9 · W8 +6 · W5 +4 · W9 +7`.
- The line is a separate menu element (not inside the profile card), in small muted-gray text (~12 px) matching the menu's existing secondary lines. It is a text line, not a card, so its layout impact is minimal.
- If the player has fewer than 4 finished runs, show only those; if they have none, show no line at all.
- The line must fit the menu at 412x915 and 1280x720. At 412 px wide it may wrap to a second line if needed, but it must not push the other menu elements (title, profile card, how-to, Play) out of place.

## Acceptance criteria
- [ ] After 3 finished runs, the menu shows a "Recent" line with exactly 3 entries, most recent first, each with the correct wave and coin values.
- [ ] After 5 finished runs, only the most recent 4 are shown.
- [ ] A fresh profile (no runs) shows no "Recent" line.
- [ ] The line fits at 412x915 and 1280x720 without breaking the menu layout.
- [ ] The profile's existing best wave, total coins, and last-run line are unchanged and still display correctly.
