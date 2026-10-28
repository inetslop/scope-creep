# Roadmap

The PO keeps this file current: the epics (what is active, their breakdown and progress) and the ideas waiting for later. Scope creep is expected.

## M0 — Baseline ✅ (by hand, 2026-10-28)
- A new board every run: a generated path from entrance to exit, rocks, 14x8 landscape / 8x14 portrait; zoom and drag
- Augments instead of tower types: Bolt, Splash, Frost, Rapid, Reach. The first in a tower decides its attack, every later one changes it; gold buys more slots per tower, each dearer
- An augment pick before wave 1 and after every cleared wave; build phase with a countdown, waves that escalate
- 3 enemies (Dot, Dart, Block); lives, gold, kill gold and wave bonus, game over with score and best run
- Towers show their augments (barrels, rings, ticks); live menu demo; HUD as floating cards
- Mouse + keyboard and touch; smoke-tested on desktop and mobile on every change

## Epics

The game grows through epics: bigger features that take several tasks. One or two are active at a time; each is built in slices that leave the game playable. The PO orders them, breaks them down and keeps their progress here.

### E1 — Rewards that carry over (active — started 2026-10-28, 4 of 9 done)
**Goal:** a run is never wasted: every run earns something you keep.
**When done:** the game remembers you between runs (a profile saved on the device). Every run ends on a rewards screen: waves held, enemies stopped, clean waves, and coins earned from them, kept in the profile. The menu shows what you have, where your recent runs went, and celebrates a best-wave run.
**Breakdown:**
- T0001 (asus, L) — the profile + run ledger: device-saved profile, run stats, coin formula, game-over lines, menu best wave — **done** (2026-10-28)
- T0003 (desktop, L) — the rewards scene: a claim moment after game over, with a count-up — in flight
- T0007 (narcissus, M) — the menu profile card: coins, best wave, runs, last run — **done** (2026-10-28)
- T0005 (inet-racing, M) — clean waves: green chip at the exit + green game-over line — in flight
- T0009 (yoga, S) — coin chime + pop on payout — blocked, waits on T0003
- T0013 (yoga, S) — the run's coin tally live in the HUD, ending at the game-over number — **done** (2026-10-28)
- T0016 (yoga, S, cycle 3) — a yellow star on the profile card when the last run hit your best wave — **done** (2026-10-28)
- T0017 (yoga, S, cycle 3) — the HUD coin tally pops as it grows during a run
- T0018 (narcissus, M, cycle 3) — the menu remembers your last four runs (a "Recent" line under the profile card)

Progress: the profile, the menu card, the live coin tally and the best-run star are in (T0001, T0007, T0013, T0016). The rewards screen (T0003) is the keystone — T0009 waits on it; clean waves (T0005) and the last menu/HUD slices (T0017, T0018) are in flight. E1 closes when the rewards screen and its dependents land.

### E2 — Tech tree (not started; needs E1)
**Goal:** a reason to play one more run: spend what runs earn on lasting upgrades.
**When done:** a tech tree screen reached from the menu, a few branches of nodes bought with the currency from E1, each node a lasting change shown on its card: more starting gold, a cheaper second slot, an extra augment pick before wave 1, new augments unlocked into the draft pool, more lives. Bought nodes stay bought.

### E3 — Levels: a run is a journey (not started)
**Goal:** a run has a shape: a few boards in a row, each harder, and a build that grows across them.
**Groundwork (outside the epic):** T0015 (wave preview) becomes the per-level wave preview once levels exist; T0014 (leak warning) teaches what a leak is before levels make leaking costlier; T0019 (fast-forward 2x, narcissus, cycle 4) keeps runs in flow and pays off once a run spans several levels; T0022 (lives danger pips, yoga, cycle 6) turns the lives readout red and pulsing on your last life, so a leak stings before levels make it costlier.
**When done:** a run goes through levels, like the acts of a roguelite: each level is its own board with a set number of waves, ending in a tougher final wave. Clear it and the run moves on to the next level: a new, harder board (a longer or more winding road, tougher enemies) that starts empty. What you carry is your **pool**: the run starts with a small pool of augments that the drafts offer from, and every time you clear a level you pick one new augment to add to it, so each level offers more to combine. The HUD shows the level ("Level 2 · Wave 3/8"), the pick between levels is its own moment, and the game-over screen says how far you got. Clearing the last level wins the run.

### E4 — Augment rarity (active — started 2026-10-28, 2 of 7 done)
**Goal:** the draft is exciting: sometimes a card is something special.
**When done:** every augment card in the draft comes in a rarity: Common, Rare or Epic. A rarer card is the same augment with stronger numbers (a Rare Rapid attacks faster than a Common one), and a few rule-changing augments only ever come as Epic. Rarity shows everywhere the augment does: the card's frame and a small gem row on the draft, hand and tower-panel cards, and on the tower itself (its slot pip). Rarer cards turn up more often the further the run gets; the odds are shown in the draft.
**Breakdown:**
- T0002 (asus, L) — the tiers: Common/Rare/Epic numbers for the five augments, the 70/25/5 draft roll, card frame + gem row, odds line — **done** (2026-10-28)
- T0008 (narcissus, M) — rarity on hand cards and the tower panel — in flight (unblocked by T0002)
- T0010 (yoga, S) — tier pip per slot on the tower — in flight (designing)
- T0011 (asus, M, cycle 2) — the odds shift: rarer cards the deeper the run, live odds line — **done** (2026-10-28)
- T0012 (asus, L, cycle 2) — Mark: the rule-changing augment that only ever comes as Epic — in flight, after T0011
- T0020 (asus, L, cycle 5) — Rally: the second rule-changing Epic; towers within 2 cells of a Rally tower attack 10% faster, rewarding clusters — todo, after T0012
- T0021 (asus, L, cycle 6) — Mint: the third rule-changing Epic; kills within 2 cells of a Mint tower drop +1 extra gold, and each Mint in a tower makes that tower's kills drop +1 more — design, after T0020

Progress: T0002 (the tiers) and the odds shift (T0011) are done; the rarity display is nearly complete (T0008 on the hand and panel, T0010 the tower pip — both in flight). asus carries the three rule-changing Epics in sequence: Mark (T0012, in progress) → Rally (T0020, the first tower-to-tower interaction) → Mint (T0021, the economy rule: kills near a Mint tower pay +1 gold). New-augment content in flight: Lance (T0004, desktop), Mark, Rally and Mint (asus, sequential) — at most two simultaneous new-augment edits (Lance + one asus task).

## Later

Ideas that may become epics or tasks of one.

- Selling a tower, or taking an augment back out (for part of the gold)
- Targeting modes per tower (first, strongest, closest)
- More augments with new attacks and changes (e.g. a piercing line — T0004, a chain that jumps between enemies, a mark that makes enemies take more damage — T0012)
- Enemies with new behaviors (e.g. one that speeds up when hit — T0006, one that shields neighbours, one that splits)
- Wave preview: what the next wave sends, shown during the build phase — T0015 (in flight)
- Bosses every 10 waves, each with its own mechanic
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger
- Run summary: damage per tower, leaks per wave
