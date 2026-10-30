---
id: T0241
title: "Iron: the mode that plays a run at one life for double coins"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T00:29:56Z
claimed_at: 2026-10-30T00:29:59Z
epic: E6
designer: desktop
---

## Goal
A second start option off the menu — "Iron": the same run at 1 life that pays 2× coins, so the risk is chosen before wave 1 and the payout says it was the mode.

## Details
- The menu: directly under the Play button, in the menu's own column, a white card — bold "Iron" over a muted line "1 life · 2× coins". The menu's other options keep their places (Ghost, Tech, …) and the whole menu shows every option without scrolling at 412x915 and 1280x720 (the cards scale to fit, as the codex's do); the new card replaces nothing.
- Start: an Iron run starts with exactly 1 life. The tech tree's "Life +1" nodes do not apply to it (the start stays 1); the gold nodes apply normally. Board, waves, augments, gold and lives otherwise behave as in a normal run.
- Coins: an Iron run's coin payout is 2× the normal formula — the one pure formula (T0001) with the tech nodes' terms applied first (e.g. Clean ×2), then doubled. The live "+N coins" tally (the stats card), the pause "worth +N" line and the claim card's recipe line all read the doubled payout from that same formula, so the recipe terms always sum to the payout shown.
- The last stand (T0054) is off for Iron: no double kill gold at 1 life, no "Last stand" banner or sting, and the lives number never turns red or pulses. The mode's risk is stated at the menu and on the claim card, not in the HUD — no new HUD element.
- The claim card: the run line wears a small muted "Iron" tag beside the wave — nothing currently says which mode a run was, so it is new, not shown twice.
- Resume and ghost: a closed Iron run is saved with its mode and resumes as Iron (its 1 life and its doubled coins intact); the Ghost option is unchanged (it still replays the normal best run). A normal Play run is byte-identical: every Iron rule is gated on the run's mode.

## Acceptance criteria
- [ ] The menu shows the "Iron" card with its "1 life · 2× coins" line under Play, and every menu option is visible without scrolling at 412x915 and 1280x720.
- [ ] Starting an Iron run: the stats card reads 1 life from the first wave (even with both "Life +1" nodes owned), kills pay normal gold, and no last-stand banner, sting or red lives number appears.
- [ ] An Iron run with the same waves, kills and clean count as a normal run pays exactly 2× the normal coins; the claim card's recipe terms are the doubled ones, sum to the payout, and the run line wears the muted "Iron" tag.
- [ ] During an Iron run the live coin tally and the pause "worth" line show the doubled numbers.
- [ ] A normal Play run is unchanged (lives, gold, coins, banners, claim card byte-identical), and a closed Iron run resumes as Iron.
