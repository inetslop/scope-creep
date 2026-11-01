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

### E1 — Rewards that carry over (done; history in planning/archive/ROADMAP.md)

### E2 — Tech tree (done; history in planning/archive/ROADMAP.md)

### E3 — Levels: a run is a journey (dropped — 2026-10-30, by hand)
The level rule (T0260) and its wave-card line (T0262) landed and played badly: re-growing the board empty every 10 waves throws away the build. Both are removed by T0283 (done 2026-10-30); T0261 is dropped with them. Do not re-task levels, the level-clear pick or the level-clear sting. The difficulty-for-reward idea lives on as **E9**.

### E4 — Augment rarity (fully tasked 2026-10-31 — closing on the pool's landings)
**Goal:** the draft is exciting: sometimes a card is something special.
**When done:** every augment card in the draft comes in a rarity: Common, Rare or Epic. A rarer card is the same augment with stronger numbers (a Rare Rapid attacks faster than a Common one), and a few rule-changing augments only ever come as Epic. Rarity shows everywhere the augment does: the card's frame and a small gem row on the draft, hand and tower-panel cards, and on the tower itself (its slot pip). Rarer cards turn up more often the further the run gets; the odds are shown in the draft.
**Breakdown:** everything landed — the rarity (T0002), the augments (Lance T0004, Mark T0012, Rally T0020, Mint T0021, Anchor T0023, Push T0027, Ember T0028, Beam T0073, Spray T0101, Haste T0152, Toll T0234), the card, hand, panel and tower reads, the odds shift (T0011), the rerolls (T0036, T0276), the codex (T0221) and the beam-combo web (T0130, T0210, T0242, T0132) — except the pool's registrations: T0062 (M) Trap · T0064 (L) Momentum · T0095 (L) Mend · T0235 (L) Feast, one at a time in claim order (T0025 (L) Chain failed and its file is gone — dropped, no re-file; T0150, its leap re-tune, dies with it — file closed by the PO 2026-11-01); behind them T0248 (S, the codex lock, waits on T0062 and T0095). T0298 (Wildcard) is out of the pool (its file is gone) — re-task it if it is still wanted.

**E4 closes when T0062, T0064, T0095, T0235 and T0248 land — every E4 task is written (Chain and its re-tune dropped with T0025's failure); it counts as finished while the pool lands.**

**16-cap (protocol):** the four queued registrations (T0062, T0064, T0095, T0235) land exactly four removals: after registering, if the pool is over 16, remove the first still in the index of **Frost, then Rally, then Mint, then Mark**, and say which in the result (the canonical statement is in T0064's task; Anchor is out of reach at four registrations). Everything else — the draft floor (T0048), the beam-combo web (T0210, T0242), the gated Haste (T0152) — never leaves the index.
**16-cap (fifth removal):** the fifth is **Anchor**, carried outside E4 by T0361 (Herd's registration, non-epic, 2026-11-01) — order-independent with the four (none of them names Anchor). After all five land the index is: Beam, Bolt, Ember, Haste, Lance, Mend, Momentum, Push, Rapid, Reach, Splash, Spray, Toll, Trap, Feast, Herd.

### E5 — Bosses: every 10th wave is something you remember (done; history in planning/archive/ROADMAP.md)

### E6 — Iron run: one life, double coins (done; history in planning/archive/ROADMAP.md)

### E7 — Changing your mind: a misplaced tower is not permanent (done; history in planning/archive/ROADMAP.md)

### E8 — A run you can show (dropped — 2026-10-30, by hand)
Cancelled by the player: T0278 (the claim card's Copy) is dropped and the shared-seed replay is not to be tasked.

### E9 — Level augments: harder runs for a bigger payout (done; history in planning/archive/ROADMAP.md)

### E10 — The sky: not everything walks the road (active — opened 2026-10-31)
**Goal:** the road stops being the only line on the board: something crosses the island over it, and a build that only covers the road stops being enough.
**When done:** the wave-50 boss never touches the road — it crosses the island in a straight line and banks to a new one at half health — and a small regular flyer in the wave mix teaches the same read; the flight line's telegraph is the enemy's own language, and the player learns to cover the island, not just the road.
**Breakdown:**
- The Flyer, the wave-50 boss: the fifth every-10 boss, the first that doesn't walk the road — a straight-line crossing from the island's edge to the exit, a bank at half health — **T0317 (L, priority 2, in progress, asus)**
- the build phase shows the line: before the flyer's wave, its route is on the board through the build — the crossing's cover is chosen in the build, not learned at the wave's door — **tasked as T0346 (M, in the pool, waits on T0317)**
- the regular Flyer in the wave mix: the first enemy that doesn't walk the road — a small fast shape that crosses the island in a straight line from its edge to the exit, one on the Feeder's old waves (13, 17, 21, …); carries the Feeder's removal, the regular cap stays 10 of 10 — **done as T0353 (L, 2026-11-01, asus)**; its one-time preview teach — **tasked as T0373 (S, in the pool, 2026-11-01)**
- (to task) the crossing learns: the bank's line is chosen to cross where the run's towers don't reach — the boss banks into uncovered ground, its telegraph keeping it fair (waits on T0317)

### E11 — First run teaches itself (done; history in planning/archive/ROADMAP.md)

### E12 — The run's story: a run you can look back on (done; history in planning/archive/ROADMAP.md)

### E13 — The island opens up: the road comes in from more than one gate (active — fully tasked 2026-11-01, closing on the pool's landings)
**Goal:** "every board is different" (Pillar 2) goes past the rock scatter and the path's shape: the road itself varies, so a build that held one island fails on the next for a new reason.
**When done:** on some boards the road has a second gate partway along, and a share of every wave's enemies comes in through it — the player covers the road from two entry points, and the far gate's shorter run shifts where the pressure lands. Later slices: a road that forks into two lanes, and a marked cell that makes its tower stronger.
**Breakdown:**
- the far gate: a second entrance partway down the road; a third of each non-boss wave comes through it; the board, the board preview and the next-wave preview show it — **T0338 (M, done 2026-11-01)**
- the fork: the road splits into two lanes and re-joins; enemies take either lane — **done as T0352 (L, 2026-11-01, asus)**
- the marked cell: one build cell that makes a tower built on it stronger — **tasked as T0340 (M, in the pool)**
- the boards reference: the pause screen names the board's modifiers — mark, name, one dry line, and where each comes from (always / tech / some boards) — the vocabulary for the new islands — **done as T0350 (M, 2026-11-01, cachyos-x8664)**
- the preview says which gate sends what: on a far-gate board the next-wave preview names the wave's far-gate share — the two lanes' cover is chosen in the build — **T0371 (M) rejected 2026-11-01: the preview already shows the far-gate share — the slice is done**

### E14 — The wave: a tech branch for what a wave does (active — fully tasked 2026-11-01, closing on the pool's landings)
**Goal:** the tech tree has covered the run start, the board, the pool and the payout — but not the wave itself: a fifth branch lets between-run coins buy how a run plays.
**When done:** the tree's "The wave" branch has three nodes, each bought once and on for every run after: The door (the far gate on every board), The thin road (every enemy 10% slower) and The breather (quiet waves pay double the wave bonus).
**Breakdown:**
- the branch and its first node, The door: the tech screen's fifth branch plus a 30-coin node that puts the far gate (T0338) on every board — **done as T0358 (M, 2026-11-01, desktop)** (the demo clause is out: the demo's own gate is parked in IDEAS)
- The thin road: 85 coins by the depth rule, every enemy 10% slower — **tasked as T0369 (M, in the pool)**
- The breather: 155 coins by the depth rule, quiet waves pay 2× the wave bonus — **tasked as T0370 (S, in the pool)** (no buy-gate inside the branch: each node buys independently at its depth price)

### Enemy queue (non-epic)

New enemies land one at a time: each new-enemy task chains behind the one before it so the enemy system, the wave mix and the art settle between additions.

- Dasher (T0046, M) — **done** (2026-10-28, desktop-4070): telegraphs, then surges.
- Splitter (T0068, M) — **done** (2026-10-28, desktop-4070): breaks into two fast splinters at its spot.
- Hauler (T0057, M) — **done** (2026-10-28, cachyos-x8664): a big slow hexagon — worth 10 gold, a leak costs a life plus 5 gold.
- Mute (T0074, M) — **done** (2026-10-29, desktop-4070): silences every tower within 2 cells. Lesson for all future enemies: the warm color family is closed — a new enemy repeats a family color and brings a new silhouette.
- Feeder (IDEAS) — **done as T0334 (2026-11-01, desktop, the T0309 re-file)**: from wave 13, one on 13, 17, 21, …, the 2-cell haste ring — the regular-enemy cap is 10 of 10; its slot and removal ride the Flyer (T0353, tasked 2026-11-01).
- The Hive (IDEAS) — **done as T0292 (L, 2026-11-01, desktop)**: the wave-40 boss, the next peak after the Orb — the first boss that grows the group (a Dot every 6 s, up to 5); `spawnOnly`, so the 10-regular cap is untouched (the Feeder fills it).
- Wall (IDEAS, new cycle 38) — parked at the back of the queue (from wave 16): slows the group it leads.

Queue order: the Bulwark (T0102), the Ward (T0111), the Dart's removal (T0237) and the Feeder (T0334) are done — the regular-enemy cap (10, the bar in modules/enemies.md) is 10 of 10; the Flyer (T0353) takes the Feeder's slot and carries its removal, so the Wall (parked, IDEAS) stays parked behind it — it needs a slot. The queue lands one enemy at a time. (The old panic-removal file also carries id T0102 — the live T0102 is the Bulwark; flagged for the runner.)

## Augment queue (non-epic)

New augments land one at a time, the enemy queue's way: each registration keeps the draft at the 16-cap and says which augment it retires.

- Herd (T0361, M) — **in the pool (2026-11-01)**: the first augment that scales with the crowd — +5%/+8% (Rare/Epic) damage per enemy within 2 cells, cap 5; its registration retires Anchor (the fifth removal, after E4's four).

## Later

Ideas that may become epics or tasks of one.

- Selling a tower (for part of the gold) — **built as T0274 (2026-10-30, desktop); E7 done 2026-10-30**
- Targeting modes per tower (first, strongest, closest) — **built as T0114 (L, non-epic, 2026-11-01, inet-racing)**; its follow-up (the plinth notch, the one-time chip) — **tasked as T0368 (S, non-epic, in the pool, 2026-11-01)**
- More augments with new attacks and changes (the IDEAS backlog holds the list)
- Enemies with new behaviors (one that dashes in bursts, one that shields neighbours, one that splits — the enemy queue holds the live list)
- Bosses every 10 waves, each with its own mechanic — now **E5** (done 2026-10-30; the boss queue continues — the wave-40 Hive is **done as T0292 (2026-11-01, desktop)**; the wave-50 Flyer, the first boss that doesn't walk the road, is **E10's T0317 (in progress, asus)**; the wave-60 Blinker, the first that skips the road, **failed as T0364 (L, 2026-11-01: architect context overflow, not a design rejection) — re-file smaller after T0317 lands (the enemy's files are busy with the Flyer)**)
- Panic pulse: the in-wave gasp — **built as T0063 (2026-10-28), removed 2026-10-29 (by hand)**
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them — **now E13**: the far gate is done (T0338); the boards reference is done (T0350); the marked cell (T0340) and the fork (T0352) are in the pool
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger — **built as T0239 (L, non-epic, 2026-10-30, asus)**: a quiet generative bed under the wave phase that quickens on the exit warning's own state
- Run summary: damage per tower, leaks per wave — **first slice built as T0216 (kills by tower on the end card, 2026-10-29, asus)**; the mid-run page **built as T0306 (2026-10-30, inet-racing)**; the per-wave leaks record landed with **E12's T0333 (2026-11-01)** and the mid-run story line with **T0336 (2026-11-01, inet-racing)**; damage per tower is **built as T0345 (2026-11-01, asus)**
- The board shows its corners: a notch on the bend cells — **built as T0140 (2026-10-29), removed as T0227 (2026-10-29)**
- Every board has a choke: the guaranteed double-cover cell (groundwork under E3's winding roads and E5's boss to hold) — **built as T0217 (2026-10-30, asus)**
- The quiet tower: a small dim dot on a tower that is idle mid-wave (groundwork for E5's untargetable boss phase) — **built as T0233 (S, non-epic, 2026-10-30, yoga)**
- The claim branch's third node: **Held pays** — a wave that leaks pays 1 coin per life it lost (155 coins, the depth-3 price on the branch's re-priced curve) — **done as T0348 (M, 2026-11-01, asus)**
- More level augments and ranks (Tough I/II/III) once the slots outgrow the set — **E9's later slice, parked**
- Bank interest: at every wave start the gold bank pays 5% of itself, capped at +10 per build phase (the build phase gains a spend-now-vs-bank decision; gold, never coins) — **built as T0363 (M, non-epic, 2026-11-01, desktop)**; the choice's payoff as a live line — "bank +N" on the stats card, build phase only — **tasked as T0374 (M, non-epic, in the pool, 2026-11-01)**
