---
id: T0304
title: "Summary: the pause's page of the run so far"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T20:16:45Z
---

## Goal
While a run is on, the player can read the run's own numbers from the pause: one "Summary" button opens a page of the ledger's rows and one row per standing tower — which towers are paying, seen while selling (E7) and targeting (T0114) are still open decisions.

## Details
- The pause screen gains one button, "Summary," beside the other reference buttons (the enemies, waves and bosses references' pattern, T0252, T0264, T0277): it opens a full-screen white card (their layout, their back); the pause's own layout is otherwise unchanged.
- The card's title line reads "Summary," under it two blocks:
  - **So far** — one muted row each, every one a read the player already owns from the run ledger or the claim card (no new field on the run or the profile): clean waves (the count in green, the exit's clean language); held waves (muted, the held chip's language, T0218 — held = the ledger's waves-held minus its clean count); kills, total; best combo ×N (yellow at ×10 and up, the milestone color, T0034; "—" before the first kill); the richest minute, +N gold (T0082's row, "—" before the first kill); board ABCD (the seed line, T0056's look).
  - **Towers** — one row per standing tower: the end card's by-tower rows (T0216) as they are, each with the tower's ≈N/s line (T0084), sorted by kills descending; support towers read kills 0 (T0070) and sit at the bottom; a sold tower's row is gone (T0274's rule — only standing towers).
- The page adds what the pause doesn't say; nothing on it repeats the pause's own run line (wave, lives, gold, coins, worth) — no duplicate readout on the same screen.
- Teach with what the game already shows: every row is a number the player has already seen on the tower panel (kills, ≈N/s) or the claim card (best combo, richest minute, board seed); no new teach line, no HUD element, no board mark.
- When the rows outgrow the card the list scrolls (the enemies reference's pattern); every line that can show at once fits at 412x915 and 1280x720.
- Unchanged: the HUD, the pause's run line, the claim card, the end card and every other screen. A resumed run's page reads the saved run's state, so it matches what was on screen before the close.

## Acceptance criteria
- [ ] The pause shows one "Summary" button with the other reference buttons; it opens the page and back returns to the pause, at 412x915 and 1280x720 with no overlap (the layout check, T0226).
- [ ] The So far block shows clean waves, held waves, total kills, best combo (yellow at ×10 and up), the richest minute and the board seed, all read from the run ledger with no new field added to the run or the profile; a unit test on the rows' builder covers the "—" cases before the first kill.
- [ ] The Towers block lists every standing tower exactly once, with its first augment's icon, its tier pip, its kills this run and its ≈N/s, sorted by kills descending; each row's kills equal that tower's panel line (T0070); a sold tower is absent.
- [ ] No readout on the page duplicates the pause's own run line (wave, lives, gold, coins, worth).
- [ ] Close and resume mid-run: the page shows the same values as before the close.
- [ ] npm run check and the desktop/mobile smoke pass.
