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
**16-cap (sixth removal):** the sixth is **Toll**, carried outside E4 by the Chill registration (T0391's file lost 2026-11-02, re-file pending — non-epic) — order-independent with the five (none of them names Toll). After all six land the index is: Beam, Bolt, Chill, Ember, Haste, Lance, Mend, Momentum, Push, Rapid, Reach, Splash, Spray, Trap, Feast, Herd.

### E5 — Bosses: every 10th wave is something you remember (done; history in planning/archive/ROADMAP.md)

### E6 — Iron run: one life, double coins (done; history in planning/archive/ROADMAP.md)

### E7 — Changing your mind: a misplaced tower is not permanent (done; history in planning/archive/ROADMAP.md)

### E8 — A run you can show (dropped — 2026-10-30, by hand)
Cancelled by the player: T0278 (the claim card's Copy) is dropped and the shared-seed replay is not to be tasked.

### E9 — Level augments: harder runs for a bigger payout (done; history in planning/archive/ROADMAP.md)

### E10 — The sky: not everything walks the road (active — all but T0346 landed 2026-11-02)
**Goal:** the road stops being the only line on the board: something crosses the island over it, and a build that only covers the road stops being enough.
**When done:** the wave-50 boss never touches the road — it crosses the island in a straight line and banks to a new one at half health — and a small regular flyer in the wave mix teaches the same read; the flight line's telegraph is the enemy's own language, and the player learns to cover the island, not just the road.
**Breakdown:**
- The Flyer, the wave-50 boss: the fifth every-10 boss, the first that doesn't walk the road — a straight-line crossing from the island's edge to the exit, a bank at half health — **done as T0317 (L, 2026-11-02, asus)**
- the build phase shows the line: before the flyer's wave, its route is on the board through the build — the crossing's cover is chosen in the build, not learned at the wave's door — **tasked as T0346 (M, in the pool; T0317 landed, so it can start)**
- the regular Flyer in the wave mix: the first enemy that doesn't walk the road — a small fast shape that crosses the island in a straight line from its edge to the exit, one on the Feeder's old waves (13, 17, 21, …); carries the Feeder's removal, the regular cap stays 10 of 10 — **done as T0353 (L, 2026-11-01, asus)**; its one-time preview teach — **done as T0373 (S, 2026-11-01, yoga)**
- the Flyer's motion reads as flight: a short fading streak in its own color trails the regular Flyer through the sky — **done as T0375 (S, 2026-11-01, yoga)**
- the sky wears its own note: one soft sustained tone plays while any regular Flyer is in the air, heard as distinct from the road's thuds — **done as T0376 (M, 2026-11-01, inet-racing)**
- the crossing learns: at 50% hp the bank's line is chosen to cross where the run's towers cover least — the boss banks into the uncovered ground, the 0.8 s preview keeping it fair — **done as T0379 (L, 2026-11-02, desktop)**

### E11 — First run teaches itself (done; history in planning/archive/ROADMAP.md)

### E12 — The run's story: a run you can look back on (done; history in planning/archive/ROADMAP.md)

### E13 — The island opens up: the road comes in from more than one gate (done; history in planning/archive/ROADMAP.md)

### E14 — The wave: a tech branch for what a wave does (active — fully tasked 2026-11-01, closing on the pool's landings)
**Goal:** the tech tree has covered the run start, the board, the pool and the payout — but not the wave itself: a fifth branch lets between-run coins buy how a run plays.
**When done:** the tree's "The wave" branch has three nodes, each bought once and on for every run after: The door (the far gate on every board), The thin road (every enemy 10% slower) and The breather (quiet waves pay double the wave bonus).
**Breakdown:**
- the branch and its first node, The door: the tech screen's fifth branch plus a 30-coin node that puts the far gate (T0338) on every board — **done as T0358 (M, 2026-11-01, desktop)** (the demo clause is out: the demo's own gate is parked in IDEAS)
- The thin road: 85 coins by the depth rule, every enemy 10% slower — **done as T0369 (M, 2026-11-02, asus)**
- The breather: 155 coins by the depth rule, quiet waves pay 2× the wave bonus — **tasked as T0370 (S, in the pool)** (no buy-gate inside the branch: each node buys independently at its depth price)
- The door's teach: the run's first far-gate send says what the gate is — a one-time chip at the gate (the send ring's moment, T0360), once per run — **done as T0384 (S, 2026-11-01, yoga)**

#### E15 — The move: a misplaced tower goes where it should (active — re-filed 2026-11-02 after T0382's architect overflow)
**Goal:** a misplaced tower is not permanent, and it doesn't have to be sold: in the build phase a tower can move to a free build cell for a fee, keeping its augments and kills — repositioning against the wave preview is a real decision with a price, not a free reposition or a sell-and-rebuild.
**When done:** the tower panel wears a "Move · −N" line (N = 60% of its slots' cost, floored, minimum 5, the sell's own rule); tapping it opens the move state — the tower dims, the free build cells outline, and the what-if's range ring shows at the tapped cell with the placement's own ✓/✗ — and ✓ slides the tower over in ~300 ms and pays the fee (the −N chip at the old cell, the drop-in bounce, the place haptic); one move per tower per build phase, the line reading "moved" until the next; a tap elsewhere cancels.
**Breakdown:**
- the move itself, the core: the panel line, the move state, the slide, the fee, the cancel — **done as T0394 (M, 2026-11-02, asus)**
- the move's limit and its teach: one move per tower per build phase (the line reads "moved" until the next build phase) and the one-time teach line — **T0394 landed; task when the move's files are free (T0235 builds on Tower.ts, T0389 on the run's files)**
- the move's note: one quiet blip on the commit (the speed toggle's note pattern, T0315) — **done as T0392 (S, 2026-11-02, yoga)**

### E16 — The tower: a tech branch for how towers are managed (active — opened 2026-11-01)
**Goal:** the tech tree has covered run start, the board, the pool, the claim and the wave — but not the tower itself: a sixth branch lets between-run coins buy how towers are managed.
**When done:** the tree's "The tower" branch has three nodes, each bought once and on for every run after: Soft sell (a sell refunds 80% of slot cost, not 70%), The light move (a move's fee 30% instead of 60%) and The rich cell (the marked cell's buff 1.25× → 1.5×).
**Breakdown:**
- the branch and its first node, Soft sell: the tech screen's sixth row plus a 30-coin node that raises the sell's refund 70% → 80% of slot cost — **done as T0383 (M, 2026-11-01, desktop)**
- The rich cell: the branch's second node, 85 coins by the depth rule, the marked cell's buff 1.25× → 1.5× — **tasked as T0386 (M, in the pool)**
- The panel line: the tower panel says which tower rides the marked cell — a muted "marked · +N% damage" line (N 25 plain, 50 with the node) on a marked-cell tower, reading the live buff — **done as T0387 (S, 2026-11-02, desktop-4070)**
- The light move: the branch's third node, 155 coins by the depth rule, a move's fee 60% → 30% — **tasked as T0412 (M, in the pool, 2026-11-02)**

### E17 — The storm: a third mode off the menu (active — opened 2026-11-02)
**Goal:** the menu has Play and Iron; a third card, Storm, sells tempo for in-run gold — every wave rushes and pays double the wave bonus: a run that plays faster and richer, not harder, and not richer between runs.
**When done:** the menu offers a Storm card in the Iron card's language; a storm run has no quiet waves, every non-boss wave rushes (walkers 1.5×, the chip on the banner and the preview) and every wave pays 2× the wave bonus gold; boss waves keep the boss's own pace; normal and Iron runs are byte-identical; the claim card says "Storm".
**Breakdown:**
- the mode and its menu card: the Storm card under Iron, the mode flag (save/resume keeps it), the wave rules (no quiet, rush on every non-boss wave, the bonus ×2) and the claim's "Storm" line — **tasked as T0403 (L, in the pool)**
- the profile remembers the storm's best wave: a muted "Storm wave N" line on the profile card with a muted star (the Iron line's pattern, T0249) — **task when T0403 lands**

### E18 — The history: every run, on the menu (active — opened 2026-11-03)
**Goal:** the menu shows the last four runs at a glance; a history card lists the last twelve, so the whole climb is one tap away and the trend the last-four line hints at is readable.
**When done:** the menu has a History button in the Tech/How row; its card lists the last twelve runs, most recent first — wave, coins, a muted "iron" mark on Iron runs, the yellow star on the best-wave run — and the profile card's last-four line has moved into it (one in, one out), the card keeping its coins, best wave and runs · avg wave line.
**Breakdown:**
- the history card: the menu's History button and its card (the last twelve runs, most recent first, with the iron mark and the best star), the profile card's last-four line moved into it, the profile storing twelve runs — **done as T0410 (M, 2026-11-02, inet-racing)**
- the records block: a muted "Records" line at the card's foot — best combo ×N, longest clean streak, most clean waves in one run (the run ledger's own values) — **tasked as T0415 (M, in the pool)**
- the storm's rows: a storm run's row wears a muted "storm" mark (the iron mark's own language) — **waits on T0403 (E17); task when it lands**

### E19 — The island remembers: the ground keeps the fight's marks (active — opened 2026-11-02)
**Goal:** the board shows where the run's fight happened: a cell that has seen enough kills keeps a small mark, and a tower built there is a little stronger — the next placement reads the run's own history, and the fight's hot spots become an advantage.
**When done:** a build cell where 12+ enemies died this run keeps a small dark chip on the ground for the rest of the run, a tower built on it deals 5% more damage, and the run's first scorch says what the mark means once.
**Breakdown:**
- the scorch cell: the per-cell kill count, the chip at 12 kills, the +5% on a tower built there, the first-scorch teach, the run save — **tasked as T0414 (M, in the pool)**
- the deep scorch: a cell at 24+ kills burns deeper — a thin second ring on the chip and +10% instead of +5% for a tower built there (the build-time read, the scorch's own rule) — **task when T0414 lands**

## Enemy queue (non-epic)

New enemies land one at a time: each new-enemy task chains behind the one before it so the enemy system, the wave mix and the art settle between additions.

- Dasher (T0046, M) — **done** (2026-10-28, desktop-4070): telegraphs, then surges.
- Splitter (T0068, M) — **done** (2026-10-28, desktop-4070): breaks into two fast splinters at its spot.
- Hauler (T0057, M) — **done** (2026-10-28, cachyos-x8664): a big slow hexagon — worth 10 gold, a leak costs a life plus 5 gold.
- Mute (T0074, M) — **done** (2026-10-29, desktop-4070): silences every tower within 2 cells. Lesson for all future enemies: the warm color family is closed — a new enemy repeats a family color and brings a new silhouette.
- Feeder (IDEAS) — **done as T0334 (2026-11-01, desktop, the T0309 re-file)**: from wave 13, one on 13, 17, 21, …, the 2-cell haste ring — the regular-enemy cap is 10 of 10; its slot and removal ride the Flyer (T0353, tasked 2026-11-01).
- The Hive (IDEAS) — **done as T0292 (L, 2026-11-01, desktop)**: the wave-40 boss, the next peak after the Orb — the first boss that grows the group (a Dot every 6 s, up to 5); `spawnOnly`, so the 10-regular cap is untouched (the Feeder fills it).
- The Blinker (IDEAS) — **tasked as T0402 (M, 2026-11-02, the T0364 re-file, smaller)**: the wave-60 boss — blinks 2.5 cells forward every 4 s on a 1 s telegraph (committed); the boss lane, spawnOnly, the regular cap untouched.
- Wall (IDEAS, new cycle 38) — parked at the back of the queue (from wave 16): slows the group it leads.

Queue order: the Bulwark (T0102), the Ward (T0111), the Dart's removal (T0237) and the Feeder (T0334) are done — the regular-enemy cap (10, the bar in modules/enemies.md) is 10 of 10; the Flyer (T0353) takes the Feeder's slot and carries its removal, so the Wall (parked, IDEAS) stays parked behind it — it needs a slot. The queue lands one enemy at a time. (The old panic-removal file also carries id T0102 — the live T0102 is the Bulwark; flagged for the runner.)

## Augment queue (non-epic)

New augments land one at a time, the enemy queue's way: each registration keeps the draft at the 16-cap and says which augment it retires.

- Herd (T0361, M) — **in the pool (2026-11-01)**: the first augment that scales with the crowd — +5%/+8% (Rare/Epic) damage per enemy within 2 cells, cap 5; its registration retires Anchor (the fifth removal, after E4's four).
- Chill (the T0391 re-file, M) — **re-file when the augment's files are free (T0235 is on the augment's core)**: the shot that adds chill stacks — each hit slows 10% per stack, up to 5 (50%), fading 2 s after the last hit; Rare hits add 2, Epic 3; works on the Flyer's flight, the Ward ignores it; its registration retires Toll (the sixth removal, order-independent with the five).

## Later

Ideas that may become epics or tasks of one.

- Selling a tower (for part of the gold) — **built as T0274 (2026-10-30, desktop); E7 done 2026-10-30**
- Targeting modes per tower (first, strongest, closest) — **built as T0114 (L, non-epic, 2026-11-01, inet-racing)**; its follow-up (the plinth notch, the one-time chip) — **tasked as T0368 (S, non-epic, in the pool, 2026-11-01)**
- More augments with new attacks and changes (the IDEAS backlog holds the list)
- Enemies with new behaviors (one that dashes in bursts, one that shields neighbours, one that splits — the enemy queue holds the live list)
- Bosses every 10 waves, each with its own mechanic — **E5 done; the queue: the Hive (T0292) and the Flyer (T0317) done, the Blinker (T0402), the Mender (T0404) and the Leech (T0405) in the pool**
- Panic pulse: the in-wave gasp — **built as T0063 (2026-10-28), removed 2026-10-29 (by hand)**
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them — **E13 done 2026-11-01** (far gate T0338, fork T0352, marked cell T0340, boards reference T0350); the cove — a bay in the island's edge whose pocket cells double-cover the road's curve — **done as T0409 (2026-11-02)**; the slow stretch — ~1-in-4 boards, a 3-cell run of road where walkers cross at 70% — **tasked as T0416 (M, 2026-11-02)**
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger — **built as T0239 (L, non-epic, 2026-10-30, asus)**: a quiet generative bed under the wave phase that quickens on the exit warning's own state
- The Mute's silence gets its note — one soft held tone while any Mute holds a tower (the sky note's pattern, T0376) — **tasked as T0419 (M, non-epic, 2026-11-02)**
- Run summary — **all built (T0216, T0306, T0333, T0336, T0345)**: kills and damage per tower, leaks per wave, the mid-run story line
- The board shows its corners: a notch on the bend cells — **built as T0140 (2026-10-29), removed as T0227 (2026-10-29)**
- Every board has a choke: the guaranteed double-cover cell (groundwork under E3's winding roads and E5's boss to hold) — **built as T0217 (2026-10-30, asus)**
- The quiet tower: a small dim dot on a tower that is idle mid-wave (groundwork for E5's untargetable boss phase) — **built as T0233 (S, non-epic, 2026-10-30, yoga)**
- The claim branch's third node: **Held pays** — a wave that leaks pays 1 coin per life it lost (155 coins, the depth-3 price on the branch's re-priced curve) — **done as T0348 (M, 2026-11-01, asus)**
- More level augments and ranks (Tough I/II/III) once the slots outgrow the set — **E9's later slice, parked**
- Bank interest: at every wave start the gold bank pays 5% of itself, capped at +10 per build phase (the build phase gains a spend-now-vs-bank decision; gold, never coins) — **built as T0363 (M, non-epic, 2026-11-01, desktop)**; the live "bank +N" line — **built as T0374 (M, non-epic, 2026-11-01)**; the first-pay chip — **dropped (rejected as T0380: the line already teaches the rule)**; the pay's coin blip — **already played (rejected as T0381)**; the pay's gold pop at the number — **done as T0395 (2026-11-02)**
- The storm: a third menu mode — no breather, every wave rushes, 2× the wave bonus for the run (IDEAS holds the full text) — **now E17 (active, 2026-11-02)**
- The run history: the menu's last-four line grows into a History card of the last twelve runs — **now E18 (active, 2026-11-03)**
