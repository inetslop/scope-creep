---
id: T0278
title: "A run you can show: the claim card's result becomes a copyable line"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T10:09:05Z
claimed_at: 2026-10-30T10:48:08Z
epic: E8
designer: desktop
---

## Goal
A finished run is a line you can keep and share (E8's first slice): the claim card gains a "Copy" control that puts the whole result on the clipboard — "Chokepoint · Wave N · Board SEED · +C coins" (and "· Iron" for an Iron run) — so a player can paste it where runs are shared and a friend can replay the exact board from the seed (the ghost run, T0078).

## Details
- **The control (the claim card, RewardsScene):** under the card's "Board SEED" line (T0056), one small "Copy" control — a compact rounded button in the card's own muted-ink language, no wider than the line already uses. It is the only thing added to the card; every existing line (waves, score + breakdown, coins + recipe, clean, stopped, best combo, the seed line, Flawless) is untouched.
- **What it copies:** exactly one line, "Chokepoint · Wave N · Board SEED · +C coins", where N is the run's last wave, SEED the board seed (T0056's own value) and C the run's coin tally — the same three numbers the card already shows. For an Iron run (T0241) the line appends " · Iron" after the coins, so the mode travels with it. One tap, no dialog, no input.
- **The "Copied" beat:** on tap the control's label swaps to "Copied" for ~1 s (the name-tag chip's transient, T0085) then back to "Copy". No sound. Where the clipboard is unsupported (a guarded navigator.clipboard, the haptics pattern T0265) the tap still shows "Copied" but writes nothing — it never throws and never blocks the card.
- **Fits:** the claim card (T0224's tidy column) absorbs the control's row at 412x915 and 1280x720 with the longest numbers (a wave in the hundreds, a seed, a large coin total); the column re-derives its height from its parts as T0224 does.
- **The split with what already shows:** the seed, the wave and the coins are already shown as readouts on the card; this adds an ACTION (one tap → clipboard), not a fourth readout, and a new control where none existed (one control per action). It is the bridge from the card to the leaderboard and the ghost replay, both of which already read the seed.
- **Why it matters now:** today the seed is shown (T0056) "so a run can be shared and replayed," but a player retypes the wave, the seed and the coins by hand to share one result; a finished run is the game's loudest moment and it has nothing to hand a friend.

## Acceptance criteria
- [ ] The claim card shows a small "Copy" control under the "Board SEED" line, in the card's muted-ink language, and it is the only thing added to the card.
- [ ] Tapping it copies exactly "Chokepoint · Wave N · Board SEED · +C coins" (with " · Iron" appended for an Iron run) to the clipboard — the run's own last wave, board seed and coin tally, the three numbers the card already shows.
- [ ] On tap the label reads "Copied" for ~1 s then returns to "Copy"; it is silent with sound on and off; where the clipboard is unsupported the tap still shows "Copied" and never throws or blocks the card.
- [ ] No existing claim-card line changes; the card's tidy column (T0224) re-derives its height and fits at 412x915 and 1280x720 with a wave in the hundreds, a seed and a large coin total.
- [ ] No in-game HUD element, key, sound or on-board readout is added; the game-over card and the menu are unchanged.
