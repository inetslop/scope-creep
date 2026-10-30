---
id: T0287
title: "Level augments I: the unlock, the menu choice and Tough"
size: L
priority: 1
status: failed
depends_on: []
attempts: 0
created: 2026-10-30T13:56:21Z
claimed_at: 2026-10-30T15:57:12Z
finished_at: 2026-10-30T16:20:23Z
epic: E9
design_attempts: 2
---

## Goal
E9's first playable slice. A player who has reached wave 30 can switch on a level augment before a run. The run gets harder, and it pays a bigger score and more coins. It ships with one level augment, **Tough**, so the whole loop of unlock, choose, play harder and get paid more works end to end. The later slices add the HUD chips, the leaderboard multiplier, more level augments, the slot ladder and the tech reprice.

## Details
- **Unlock and slots:**
  - The profile gains `levelSlots: number`, default 0.
  - When a finished run's wave is 30 or more (normal or Iron), `levelSlots` becomes at least 1.
  - On load, an existing profile whose `bestWave` or `ironBestWave` is already 30 or more gets 1 slot, so players who got there before this task aren't made to do it again.
  - It never goes down. The ladder beyond 1 slot is a later slice: don't build it here, but keep `levelSlots` a number, not a boolean.
- **The level augments, as content:**
  - A new pure module (a `core/levelAugments.ts` or a `content/levelAugments.ts`, following the existing content pattern) defines each level augment as an id, a name, one plain card line and a bonus percentage.
  - This slice defines only **Tough**: "Enemies have +25% health", bonus **+20%**.
  - The **run multiplier** is 1 + the sum of the chosen augments' bonuses. Tough alone gives ×1.2.
- **Tough's rule:** every enemy spawned in the run, bosses included, has its max health ×1.25. Apply it where wave health is computed, as one pure function with a test. Nothing else changes: gold, speed and counts stay the same.
- **Menu:**
  - With `levelSlots ≥ 1`, the menu gains a "Level augments" card near the Iron card, in the same style.
  - The card lists the level augments as toggles (here only Tough) with their line and bonus, shows "N/M slots", and shows the run multiplier ("×1.2").
  - No more toggles than `levelSlots` can be on at once.
  - The chosen set is saved in the profile (`levelAugments: string[]`) and preselected next time.
  - With `levelSlots = 0`, the card is replaced by one muted line: "Reach wave 30 to unlock level augments."
  - It must fit at 412x915 and 1280x720.
- **The run:**
  - The chosen set applies to the next run started from the menu, both the normal and the Iron button.
  - The run state and the run save record the set, so a resumed run keeps it. An old save without the field loads with none.
- **Payout:**
  - The run's coins (`coinsForRun`'s `mul`) and its final score are multiplied by the run multiplier, rounded down, and stack multiplicatively with Iron's ×2.
  - Both are pure and tested. Example: an Iron run with Tough pays coins ×2.4.
  - The end-of-run card's score and coins show the multiplied values. A short "×1.2 level augments" line on the card is optional here; the next slice makes it and the HUD chips official.
- **Unchanged:** the tech tree, the draft, the leaderboard format and the menu demo (which never uses level augments).

## Acceptance criteria
- [ ] A fresh profile sees the muted "Reach wave 30 to unlock level augments." line and no picker. A profile that has reached wave 30, before or after this task, sees the picker with 1 slot.
- [ ] Switching on Tough shows ×1.2 on the menu. The next run's enemies, bosses included, have 1.25× health, and the run's coins and score are ×1.2 (×2.4 coins with Iron).
- [ ] The choice is remembered across sessions, and a resumed run keeps its level augments.
- [ ] Unit tests cover the unlock (including the existing-profile migration), the multiplier, Tough's health rule, the payout with and without Iron, and the save round-trip.
- [ ] `npm run check` passes. Desktop 1280x720 and mobile 412x915 smoke pass, including the menu card both locked and unlocked.

## Architect could not design it (cachyos-x8664)

no "STATUS: READY" line after 2 attempt(s). Last output:

```
Prompt is too long · automatic compaction failed: summarization produced empty response
```
