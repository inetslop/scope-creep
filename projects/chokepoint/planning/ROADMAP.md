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

### E1 — Rewards that carry over (active — started 2026-10-28, 8 of 12 done, all slices written)
**Goal:** a run is never wasted: every run earns something you keep.
**When done:** the game remembers you between runs (a profile saved on the device). Every run ends on a rewards screen: waves held, enemies stopped, clean waves, and coins earned from them, kept in the profile. The menu shows what you have, where your recent runs went, and celebrates a best-wave run.
**Breakdown:**
- T0001 (asus, L) — the profile + run ledger: device-saved profile, run stats, coin formula, game-over lines, menu best wave — **done** (2026-10-28)
- T0003 (desktop, L) — the rewards scene: a claim moment after game over, with a count-up — **done** (2026-10-28)
- T0007 (narcissus, M) — the menu profile card: coins, best wave, runs, last run — **done** (2026-10-28)
- T0005 (desktop, M) — clean waves: green chip at the exit + green game-over line — done (2026-10-28)
- T0009 (yoga, S) — coin chime + pop on payout — done (2026-10-28)
- T0013 (yoga, S) — the run's coin tally live in the HUD, ending at the game-over number — **done** (2026-10-28)
- T0016 (yoga, S, cycle 3) — a yellow star on the profile card when the last run hit your best wave — **done** (2026-10-28)
- T0017 (yoga, S, cycle 3) — the HUD coin tally pops as it grows during a run — **done** (2026-10-28)
- T0018 (M, cycle 3) — the menu remembers your last four runs (a "Recent" line under the profile card) — in queue
- T0019 (M, cycle 4) — fast-forward: a 2x speed button for the wave phase — in queue, waits on T0015 (wave preview, in flight)
- T0030 (yoga, S, cycle 10) — the pause screen's run-so-far line: wave, lives, gold and the run's coins on one line above the key list — in queue, waits on T0019
- T0033 (yoga, S, cycle 14) — a "Clean N" line on the rewards card: green when N > 0, counting up with the other lines, mirroring the game-over card's line (T0005) — in queue, ready now

Progress: the profile, the menu card, the live coin tally (and its pop), the best-run star, the rewards scene, the clean-wave chip (T0005) and the coin chime (T0009) are in — a run now ends on a claim card that counts up waves held, stopped and +N coins with a two-note chime, a perfectly held wave pops a green "Clean" chip at the exit and turns the game-over line green, and the tally pops as it grows. In the queue: the recent-runs line (T0018), fast-forward (T0019, one hop behind the wave preview T0015, in flight), the pause screen's run-so-far line (T0030, two hops behind fast-forward) and the rewards card's clean line (T0033, written this cycle, ready for yoga). That was the last unwritten slice — the rewards card never showed the clean waves (T0003's design had only waves/stopped/coins); T0033 adds a green "Clean N" line counting up with the others. E1 closes when T0018, T0019, T0030 and T0033 land.

### E2 — Tech tree (not started; needs E1)
**Goal:** a reason to play one more run: spend what runs earn on lasting upgrades.
**When done:** a tech tree screen reached from the menu, a few branches of nodes bought with the currency from E1, each node a lasting change shown on its card: more starting gold, a cheaper second slot, an extra augment pick before wave 1, new augments unlocked into the draft pool, more lives. Bought nodes stay bought.

### E3 — Levels: a run is a journey (not started)
**Goal:** a run has a shape: a few boards in a row, each harder, and a build that grows across them.
**Groundwork (outside the epic):** T0015 (wave preview, in flight) becomes the per-level wave preview once levels exist; T0014 (leak warning) teaches what a leak is before levels make leaking costlier; T0019 (fast-forward 2x) keeps runs in flow and pays off once a run spans several levels; the lives danger-pip idea was rejected as T0022 (the stats card has no room — see IDEAS) and is the one to revisit if levels make leaking costlier.
**When done:** a run goes through levels, like the acts of a roguelite: each level is its own board with a set number of waves, ending in a tougher final wave. Clear it and the run moves on to the next level: a new, harder board (a longer or more winding road, tougher enemies) that starts empty. What you carry is your **pool**: the run starts with a small pool of augments that the drafts offer from, and every time you clear a level you pick one new augment to add to it, so each level offers more to combine. The HUD shows the level ("Level 2 · Wave 3/8"), the pick between levels is its own moment, and the game-over screen says how far you got. Clearing the last level wins the run.

### E4 — Augment rarity (active — started 2026-10-28, 8 of 15 done)
**Goal:** the draft is exciting: sometimes a card is something special.
**When done:** every augment card in the draft comes in a rarity: Common, Rare or Epic. A rarer card is the same augment with stronger numbers (a Rare Rapid attacks faster than a Common one), and a few rule-changing augments only ever come as Epic. Rarity shows everywhere the augment does: the card's frame and a small gem row on the draft, hand and tower-panel cards, and on the tower itself (its slot pip). Rarer cards turn up more often the further the run gets; the odds are shown in the draft.
**Breakdown:**
- T0002 (asus, L) — the tiers: Common/Rare/Epic numbers for the five augments, the 70/25/5 draft roll, card frame + gem row, odds line — **done** (2026-10-28)
- T0008 (narcissus, M) — rarity on hand cards and the tower panel — in flight (unblocked by T0002)
- T0010 (yoga, S) — tier pip per slot on the tower — **done** (2026-10-28)
- T0011 (asus, M, cycle 2) — the odds shift: rarer cards the deeper the run, live odds line — **done** (2026-10-28)
- T0012 (asus, L, cycle 2) — Mark: the rule-changing augment that only ever comes as Epic — **done** (2026-10-28)
- T0020 (asus, L, cycle 5) — Rally: the second rule-changing Epic; towers within 2 cells of a Rally tower attack 10% faster, rewarding clusters — **done** (2026-10-28)
- T0021 (asus, L, cycle 6) — Mint: the third rule-changing Epic; kills within 2 cells of a Mint tower drop +1 extra gold, and each Mint in a tower makes that tower's kills drop +1 more — in queue (T0020 landed)
- T0023 (asus, L, cycle 7) — Anchor: a pool rooting augment; every 3 s it roots (fully stops) everything within 2.5 cells for 0.75 s, added hits root 0.5 s (+0.25 s per extra copy) — the first new behavior after the three Epics — in queue
- T0024 (yoga, S, cycle 7) — the draft reveal: the three offered cards flip face-up when the draft opens, the Epic card holding its flip a beat longer — **done** (2026-10-28)
- T0025 (asus, L, cycle 8) — Chain: the leap-zap augment (pool, all tiers): first, a zap that strikes the enemy furthest along and leaps to the nearest unstruck enemy (3 leaps, 2.5-cell leaps, 15/18/20 damage per leap, every 1.2/1.05/0.9 s); added, +1 leap to any first augment's attack — the first attack that changes target mid-attack — in queue
- T0026 (yoga, S, cycle 8) — the tier word on the draft card: the name line of Rare and Epic cards reads "Name · Rare" / "Name · Epic" (Common unchanged), the same line the tower panel shows — **done** (2026-10-28)
- T0027 (asus, L, cycle 9) — Push: a pool gust augment (all tiers, offered from the opening draft): first, a gust that pushes everything within 2.5 cells back along the road with no damage (Common 0.8 cells every 2.4 s, Rare 1.0/2.0 s, Epic 1.2/1.8 s); added, hits push back 0.4 cells (+0.4 per Push) — the first augment that moves enemies along the road — in queue
- T0028 (asus, L, cycle 10) — Ember: a pool burning augment (all tiers, offered from the opening draft): first, sets ablaze the enemy furthest along every 1.5 s (3/4/5 damage per second for 3 s by tier; re-ignition refreshes the duration and keeps the higher rate); added, hits set ablaze at the tower's tier rate — the first damage over time; the ticks are the source tower's damage, so Mark amplifies them and a killing tick is its kill — in queue
- T0029 (asus, L, cycle 10) — Beam: a pool beam augment (all tiers, offered from the opening draft): first, a continuous beam on the enemy furthest along (6/8/10 damage per second by tier, no shots, retargeting the instant its target dies or leaves range); added, a second beam on the enemy nearest the main target at half the per-second rate — the first sustained second target, on any first augment — asus's own, waits on Lance (T0004, in flight)
- T0032 (yoga, S, cycle 11) — the tier chime: each draft card lands with a short chime on the reveal flip (T0024) — one note Common (C5), a third higher Rare (+E5), the highest Epic (+G5), all at the soft UI-blip volume — done (2026-10-28)

Progress: the tiers (T0002), the odds shift (T0011), the tower pips (T0010), Mark (T0012, the first rule-changer), Rally (T0020, the first tower-to-tower interaction), the card flip (T0024) and the tier word (T0026) are done; the rarity display is nearly complete (T0008 on the hand and panel in queue). The new-augment backlog is deep: Lance (T0004) in flight on asus; behind it, in queue, Ember (T0028, a pool burn: the first damage over time in the game), Mint (T0021, the economy rule: kills near a Mint tower pay +1 gold), Chain (T0025, a pool leap-zap: the first attack that changes target mid-attack), Anchor (T0023, a pool rooting augment: a timed full stop, the behavior gap Frost's partial slow leaves) and Push (T0027, the first augment that moves enemies along the road); Beam (T0029, a pool beam: a continuous line and the first sustained second target) is asus's own and waits on Lance. asus and desktop both take L, so expect at most two new-augment edits in flight at once; the rest build in queue order. Rarity also has an ear: the tier chime (T0032, yoga) has landed — each offered card now lands face-up with a short rising chime, one note Common, two a third higher Rare, three the highest Epic, so the tier is heard as well as seen.

## Later

Ideas that may become epics or tasks of one.

- Selling a tower, or taking an augment back out (for part of the gold)
- Targeting modes per tower (first, strongest, closest)
- More augments with new attacks and changes (a shot that bounces off the board's rocks, a gust that pushes enemies back — T0027, a root that stops the road — T0023; the IDEAS backlog holds the list)
- Enemies with new behaviors (e.g. one that speeds up when hit — built as T0006 (desktop); one that dashes in bursts, one that shields neighbours, one that splits)
- Wave preview: what the next wave sends, shown during the build phase — T0015 (in flight)
- Bosses every 10 waves, each with its own mechanic
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger
- Run summary: damage per tower, leaks per wave
