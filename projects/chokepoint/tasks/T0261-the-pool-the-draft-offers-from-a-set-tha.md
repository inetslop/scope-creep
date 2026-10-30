---
id: T0261
title: "The pool: the draft offers from a set that grows at each clear"
size: M
priority: 2
status: design
depends_on: [T0260]
attempts: 0
created: 2026-10-30T05:49:22Z
epic: E3
---

## Goal
The build grows across levels: the run's draft offers from a small pool of augments, and clearing a level is a moment to add one more to it — E3's progression.

## Details
- A run starts with a draft pool of six augments: Bolt, Rapid, Splash, Lance, Reach and Push (minus any the 16-cap has already removed; Bolt never leaves the index, so the first-draft floor (T0048) always holds). Every draft offer rolls from the pool with today's tier odds — the three cards, the 4th card of the second pick (T0065) and the reroll (T0036) — and every other draft rule (no repeat (T0052), the odds shift (T0011), the fit row (T0243), the what-if price (T0251)) is unchanged, only the source is the pool.
- Clearing a level (wave 10 or 20, after T0260's top card) opens the level pick, its own moment: a full-screen overlay over the new board, on the draft scene's pattern — a title with the level the run enters ("Level 2") and a muted "one for your pool" under it, and three cards offered from the augments that are in the index, not yet in the pool, and not in the codex's locked set (T0248 — Haste, Momentum, Mend as their registrations land), rolled with the draft's own odds at that depth. No reroll, no pass: tapping a card picks it — the card lifts with the hand's ring, the tier chime (T0032), a muted "Lance · added to your pool" line under the row — ~400 ms later the scene closes and the normal draft opens, which can already offer the just-added augment (the pool is seven by then).
- The picked augment joins the pool for the rest of the run: level 2 drafts from seven, level 3 from eight. The pool is part of the run's save: a resumed run keeps its pool and the pick never re-opens; a ghost run is a normal run on the saved seed's boards (it follows the pool rules like any run and never changes the saved seed).
- The tech pool nodes (Haste's (T0153) and Momentum's (T0209)) add their augment to the run's pool when bought — before the run or mid-run — the same unlock the draft's source now is; a tech-locked augment never appears in a pick's offers. The codex (T0221) and its locks (T0248) stay a global reference of everything that exists, unchanged.
- The offer set is always at least three (the index is 15-16, the pool 6-7, the locked set at most 3); if it ever is not, offer whatever is left. The menu demo is byte-identical (it runs one wave, not a run).
- New files: a core/pool.ts with unit tests (the initial set, the offers, the pick, the tech add, the save shape) and the pick scene on the draft scene's pattern.
- The screen bar, stated: the pick is a moment, not a mark — it adds no card or chip to the board or HUD and no input beyond tapping a card; the pool itself is new information (what the build is made of from now on), shown only where the player touches it: the offers and the added-to-pool line.

## Acceptance criteria
- [ ] A fresh run's drafts offer only pool members; the pre-wave-1 draft still always includes a Common Bolt.
- [ ] Clearing wave 10 opens the pick over the new board: exactly three cards, all outside the pool, none locked, with tier odds as the draft's at that depth.
- [ ] Tapping a card shows the chime and the "added to your pool" line, then the normal draft opens, which can offer the added augment.
- [ ] The pick opens exactly once after wave 10 and once after wave 20; a resumed run mid-level 2 keeps its seven-augment pool and the pick never re-opens.
- [ ] Buying the Haste or Momentum node mid-run makes that augment offerable from the next draft, and it never appears in a pick's offers.
- [ ] The second pick's 4th card and the reroll roll from the pool; the codex and its locks are unchanged.
- [ ] The scene fits both 412x915 and 1280x720 (three cards, one row each), and the smoke test passes on desktop and mobile.
