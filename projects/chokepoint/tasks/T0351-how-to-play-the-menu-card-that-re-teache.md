---
id: T0351
title: "How to play: the menu card that re-teaches the run's loop"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T09:37:42Z
claimed_at: 2026-11-01T09:37:46Z
designer: desktop
---

## Goal
The first-run hints (T0318, T0319, T0320) teach the run's loop once and never return, and no screen explains the loop afterwards — the codex shows the augments, the references show the enemies, waves, coins, bosses and boards, but "what is this run about" has nowhere to be looked up. A How card on the menu re-teaches the loop on demand, in the game's own words.

## Details
- A new menu row in the start screen's column (the menu row's look, one word, e.g. "How") that opens a menu-adjacent overlay in the CodexScene/TechScene pattern: the menu dims, one white rounded card. The row joins the start screen's fit-sum (T0222) so the menu still fits without scrolling at 412x915 and 1280x720. The row earns its place: the column already grew a row per new option (Iron, T0241) and still fits, and the loop it opens is the one thing no screen explains after the first run.
- The card is the run's loop in four dry lines (one line each, the game's own voice), with no number the game doesn't have:
  1. "Cards make the towers: the first card decides the attack, every one after changes it."
  2. "Gold buys the slots, each one dearer — few strong towers or many simple ones."
  3. "A leak costs a life; out of lives, the run ends."
  4. "Coins pay from wave 10 on, and buy the tech between runs."
- Under the four lines, one muted pointer line: "The keys are on the pause." The controls stay listed on the pause screen; nothing is repeated here, and the pause screen is not touched.
- The row toggles the overlay (the codex's own open/close: tap the shade or the row again to close); the overlay takes no other input, plays no sound, and writes nothing to the profile.
- No new numbers, no new state: the lines are static content in the new scene file, checked against the game's own data (the wave-10 pay rule, the slot prices, the tech spend) so the card never states what the game doesn't do.

## Acceptance criteria
- [ ] The start screen shows the new row in the menu row's look, and the menu still fits without scrolling at 412x915 and 1280x720 (the smoke test's layout check).
- [ ] Tapping the row opens the dimmed overlay with the white card: the four loop lines and the muted "The keys are on the pause." line; tapping the shade or the row again closes it back to the menu.
- [ ] The four lines state the loop's rules (the cards make the towers, the first card deciding the attack; the gold buys the slots, each dearer; a leak costs a life; coins pay from wave 10 on and buy the tech) and state no number or rule the game doesn't have.
- [ ] Nothing else changes: the pause screen and its controls list, the codex, the references, the menu demo and the profile card are untouched; no sound, no new input, nothing written to the profile.
