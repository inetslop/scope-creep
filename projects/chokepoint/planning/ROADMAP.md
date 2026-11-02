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
**Breakdown:** everything landed (the rarity T0002, the augments, the card/hand/panel/tower reads, the odds shift T0011, the rerolls, the codex T0221, the beam-combo web) except the pool's registrations — T0062 (M) Trap · T0064 (L) Momentum · T0095 (L) Mend, one at a time in claim order; behind them T0248 (S, the codex lock, waits on T0062 and T0095). Chain (T0025) failed, its re-tune T0150 died with it — dropped; the wildcard (T0298) landed as T0439 (2026-11-02).

**E4 closes when T0062, T0064, T0095 and T0248 land; every E4 task is written, so it counts as finished while the pool lands.**

**16-cap (removals):** the registrations land one at a time, each retiring one — E4's three retire **Rally, then Mint, then Mark** (the canonical statement is in T0064's task), then **Anchor** (T0361's Herd, non-epic) and **Toll** (the Chill re-file, non-epic), order-independent across the five. After all six land the index is: Beam, Bolt, Chill, Ember, Haste, Lance, Mend, Momentum, Push, Rapid, Reach, Splash, Spray, Trap, Feast, Herd. The draft floor (T0048), the beam-combo web (T0210, T0242) and the gated Haste (T0152) never leave the index.

### E5 — Bosses: every 10th wave is something you remember (done; history in planning/archive/ROADMAP.md)

### E6 — Iron run: one life, double coins (done; history in planning/archive/ROADMAP.md)

### E7 — Changing your mind: a misplaced tower is not permanent (done; history in planning/archive/ROADMAP.md)

### E8 — A run you can show (dropped — 2026-10-30, by hand)
Cancelled by the player: T0278 (the claim card's Copy) is dropped and the shared-seed replay is not to be tasked.

### E9 — Level augments: harder runs for a bigger payout (done; history in planning/archive/ROADMAP.md)

### E10 — The sky: not everything walks the road (done; history in planning/archive/ROADMAP.md)

### E11 — First run teaches itself (done; history in planning/archive/ROADMAP.md)

### E12 — The run's story: a run you can look back on (done; history in planning/archive/ROADMAP.md)

### E13 — The island opens up: the road comes in from more than one gate (done; history in planning/archive/ROADMAP.md)

### E14 — The wave: a tech branch for what a wave does (active — fully tasked 2026-11-01, closing on the pool's landings)
**Goal:** the tech tree has covered the run start, the board, the pool and the payout — but not the wave itself: a fifth branch lets between-run coins buy how a run plays.
**When done:** the tree's "The wave" branch has three nodes, each bought once and on for every run after: The door (the far gate on every board), The thin road (every enemy 10% slower) and The breather (quiet waves pay double the wave bonus).
**Breakdown:**
- the branch and its first node, The door: the tech screen's fifth branch plus a 30-coin node that puts the far gate (T0338) on every board — **done as T0358 (2026-11-01)**
- The thin road: 85 coins by the depth rule, every enemy 10% slower — **done as T0369 (M, 2026-11-02, asus)**
- The breather: 155 coins by the depth rule, quiet waves pay 2× the wave bonus — **tasked as T0370 (S, in the pool)** (no buy-gate inside the branch: each node buys independently at its depth price)
- The door's teach: the run's first far-gate send says what the gate is — a one-time chip at the gate (the send ring's moment, T0360), once per run — **done as T0384 (S, 2026-11-01, yoga)**

#### E15 — The move: a misplaced tower goes where it should (active — fully tasked 2026-11-02, closing on the pool's landings)
**Goal:** a misplaced tower is not permanent, and it doesn't have to be sold: in the build phase a tower can move to a free build cell for a fee, keeping its augments and kills — repositioning against the wave preview is a real decision with a price, not a free reposition or a sell-and-rebuild.
**When done:** the tower panel's "Move · −N" line (N = 60% of slot cost, floored, minimum 5): tap it, the tower dims, the free cells outline with the what-if's range ring, ✓ slides it over in ~300 ms and pays the fee; one move per tower per build phase, the line reading "moved" until the next.
**Breakdown:**
- the move itself, the core: the panel line, the move state, the slide, the fee, the cancel — **done as T0394 (M, 2026-11-02, asus)**
- the move's limit and its teach: one move per tower per build phase (the line reads "moved" until the next build phase) and the one-time teach line — **tasked as T0443 (M, 2026-11-02, waits on T0389)**
- the move's note: one quiet blip on the commit (the speed toggle's note pattern, T0315) — **done as T0392 (S, 2026-11-02, yoga)**

### E16 — The tower: a tech branch for how towers are managed (active — fully tasked 2026-11-02, closing on the pool's landings)
**Goal:** the tech tree has covered run start, the board, the pool, the claim and the wave — but not the tower itself: a sixth branch lets between-run coins buy how towers are managed.
**When done:** the tree's "The tower" branch has three nodes, each bought once and on for every run after: Soft sell (a sell refunds 80% of slot cost, not 70%), The light move (a move's fee 30% instead of 60%) and The rich cell (the marked cell's buff 1.25× → 1.5×).
**Breakdown:**
- the branch and its first node, Soft sell: the tech screen's sixth row plus a 30-coin node that raises the sell's refund 70% → 80% of slot cost — **done as T0383 (M, 2026-11-01, desktop)**
- The rich cell: the branch's second node, 85 coins by the depth rule, the marked cell's buff 1.25× → 1.5× — **tasked as T0386 (M, in the pool)**
- The panel line: the tower panel says which tower rides the marked cell — a muted "marked · +N% damage" line (N 25 plain, 50 with the node) on a marked-cell tower, reading the live buff — **done as T0387 (S, 2026-11-02, desktop-4070)**
- The light move: the branch's third node, 155 coins by the depth rule, a move's fee 60% → 30% — **tasked as T0412 (M, in the pool, 2026-11-02)**

### E17 — The storm: a third mode off the menu (active — fully tasked 2026-11-02, closing on the pool's landings)
**Goal:** the menu has Play and Iron; a third card, Storm, sells tempo for in-run gold — every wave rushes and pays double the wave bonus: a run that plays faster and richer, not harder, and not richer between runs.
**When done:** the menu's Storm card (the Iron card's language): a storm run has no quiet waves, every non-boss wave rushes (1.5×, the chip), every wave pays 2× the bonus gold, bosses keep their pace; normal and Iron runs are byte-identical; the claim says "Storm".
**Breakdown:**
- the mode and its menu card: the Storm card under Iron, the mode flag (save/resume keeps it), the wave rules (no quiet, rush on every non-boss wave, the bonus ×2) and the claim's "Storm" line — **tasked as T0403 (L, in the pool)**
- the profile remembers the storm's best wave: a muted "Storm wave N" line on the profile card with a muted star (the Iron line's pattern, T0249) — **tasked as T0434 (S, waits on T0403)**

### E18 — The history: every run, on the menu (active — fully tasked 2026-11-02, closing on the pool's landings)
**Goal:** the menu shows the last four runs at a glance; a history card lists the last twelve, so the whole climb is one tap away and the trend the last-four line hints at is readable.
**When done:** the menu has a History button in the Tech/How row; its card lists the last twelve runs, most recent first — wave, coins, a muted "iron" mark on Iron runs, the yellow star on the best-wave run — and the profile card's last-four line has moved into it (one in, one out), the card keeping its coins, best wave and runs · avg wave line.
**Breakdown:**
- the history card: the menu's History button and its card (the last twelve runs, most recent first, with the iron mark and the best star), the profile card's last-four line moved into it, the profile storing twelve runs — **done as T0410 (M, 2026-11-02, inet-racing)**
- the records block: a muted "Records" line at the card's foot — best combo ×N, longest clean streak, most clean waves in one run (the run ledger's own values) — **tasked as T0415 (M, in the pool)**
- the storm's rows: a storm run's row wears a muted "storm" mark (the iron mark's own language) — **tasked as T0444 (M, 2026-11-02, waits on T0403)**

### E19 — The island remembers: the ground keeps the fight's marks (active — fully tasked 2026-11-02, closing on the pool's landings)
**Goal:** the board shows where the run's fight happened: a cell that has seen enough kills keeps a small mark, and a tower built there is a little stronger — the next placement reads the run's own history, and the fight's hot spots become an advantage.
**When done:** a build cell where 12+ enemies died this run keeps a small dark chip on the ground for the rest of the run, a tower built on it deals 5% more damage, and the run's first scorch says what the mark means once.
**Breakdown:**
- the scorch cell: the per-cell kill count, the chip at 12 kills, the +5% on a tower built there, the first-scorch teach, the run save — **tasked as T0414 (M, in the pool)**
- the deep scorch: a cell at 24+ kills burns deeper — a thin second ring on the chip and +10% instead of +5% for a tower built there (the build-time read, the scorch's own rule) — **tasked as T0432 (M, waits on T0414)**

### E20 — The exit: a tech branch for surviving the leak (fully tasked 2026-11-02, closing on the pool's landings)
**Goal:** the tech tree has covered run start, board, pool, claim, wave and tower — but not surviving a leak: a seventh branch lets between-run coins buy how the run withstands the exit.
**When done:** the tree's "The exit" branch has three nodes, each bought once and on for every run after: The long watch (the leak warning starts 5 s out instead of 3 s), One life a Block (a Block that leaks costs 1 life instead of 2) and The first pass (the run's first leak costs no life).
**Breakdown:**
- the branch and its first node, The long watch: the tech screen's seventh row plus a 30-coin node that starts the leak warning at 5 s instead of 3 s — **done as T0423 (M, 2026-11-02, asus)**
- One life a Block: 85 coins by the depth rule, a Block that leaks costs 1 life instead of 2 — **done as T0429 (M, 2026-11-02, inet-racing)** (the first pass is tasked behind it as T0433)
- The first pass: 155 coins by the depth rule, the run's first leak costs no life (a per-run flag the run save carries; the Hauler's 5 gold still pays) — **tasked as T0433 (M, waits on T0429; the T0427 re-file)**

### E21 — The levels: more ways to make a run harder (active — opened 2026-11-02)
**Goal:** the run-setup step's level set is five (Crowded, Lean, Short fuse, Swift, Tough) and the run's coin multiplier pays for the handicap the player picks; the set grows past five with a new dimension each time, so the run the player sets up is a pick, not a default.
**When done:** the set has more than five levels with dimensions the five don't touch — information (Blind: no preview of the next wave) and the board's face (no marked cell, no guaranteed choke) — each with its own dry one-liner on the run-setup step, its own multiplier notch and its own chip; the ranks (Tough I/II/III) once the set outgrows the run's slots.
**Breakdown:**
- Blind: the sixth level — the run's build phase has no wave preview (the preview card and the flyer's line stay hidden) — **tasked as T0446 (M, 2026-11-02)**
- the board's face: a level whose boards carry no marked cell and no guaranteed choke — **tasked as T0452 (M, in the pool)** (the long straight re-filed as T0453; the board's files are settled)
- the ranks: Tough I/II/III once the set outgrows the run's slots — parked

### E22 — The march: the wave walks in more than one way (active — opened 2026-11-02)
**Goal:** the wave's tag set is four (quiet, tight, rush, short cut); it grows with a new march each time — a new rhythm the wave takes, with its own chip, its own answer and its own line in the waves reference — and on mobile a special wave is felt before it happens.
**When done:** the set has six tags: the double (two fronts, a 6 s lull, the second at 1.2×) — done as T0447 — and the clumps (clumps of 2–3 with 4 s gaps that break the chain); the preview and the banner wear each chip, the waves reference names each, and a non-quiet tagged wave buzzes once on mobile at the banner (the quiet breather stays silent).
**Breakdown:**
- the double: the fifth tag — from wave 21, every 8th non-quiet/tight/rush/short-cut/boss wave, the plan comes in two pulses (first half, 6 s lull, second half's walkers at 1.2×; chip "double"; the first double's preview says "the wave comes twice — the second front walks faster") — **tasked as T0447 (L, in the pool)**
- the clumps: the sixth tag — from wave 26, every 11th non-quiet/tight/rush/short-cut/double/boss wave, the plan walks in clumps of 2–3 with a 4 s gap between clumps (the gap always breaks the kill chain — 1.5 s + 0.4 s per Feast is still under 4 s; chip "clumps"; the first clumps' preview says "the wave comes in clumps — the gaps break the chain") — **tasked as T0448 (M, in the pool)**
- the tag's haptic: a non-quiet tagged wave (tight, rush, short cut, and double and clumps as they land) gets one 30 ms guarded buzz on mobile at the banner (T0265's guarded pattern, T0428's hook shape; the quiet breather never buzzes) — **tasked as T0449 (S, in the pool)**
- the next tag once double and clumps land (a tag whose answer is the move — parked)

### E23 — The draft: a tech branch for what the draft offers (active — opened 2026-11-02)
**Goal:** the tech tree has covered run start, board, pool, claim, wave, tower and exit — but not the draft: an eighth branch lets between-run coins buy how the run's cards come.
**When done:** the tree's "The draft" branch has three nodes, each bought once and on for every run after: The early odds (the tier-odds shift starts at wave 1 instead of wave 5), The second roll (the reroll is twice per run, the second 25 gold) and Opening wild (the first draft always offers a Rare or Epic alongside its Common Bolt floor).
**Breakdown:**
- the branch and its first node, The early odds: the tech screen's eighth row plus a 30-coin node that moves the draft's tier-odds shift (T0011) from wave 5 to wave 1 — **tasked as T0450 (M, 2026-11-02)**
- The second roll: 85 coins by the depth rule, the run's once reroll becomes twice — the second costs 25 gold — **tasked as T0451 (M, 2026-11-02, waits on T0450)**
- Opening wild: 155 coins by the depth rule, the first draft always offers a Rare or Epic alongside its Common Bolt floor (T0048) — the next slice once the branch lands

## Enemy queue (non-epic)

New enemies land one at a time: each new-enemy task chains behind the one before it so the enemy system, the wave mix and the art settle between additions.

- Dasher (T0046, M) — **done** (2026-10-28, desktop-4070): telegraphs, then surges.
- Splitter (T0068, M) — **done** (2026-10-28, desktop-4070): breaks into two fast splinters at its spot.
- Hauler (T0057, M) — **done** (2026-10-28, cachyos-x8664): a big slow hexagon — worth 10 gold, a leak costs a life plus 5 gold.
- Mute (T0074, M) — **done** (2026-10-29, desktop-4070): silences every tower within 2 cells. Lesson for all future enemies: the warm color family is closed — a new enemy repeats a family color and brings a new silhouette.
- Feeder — **done as T0334 (2026-11-01)**: its slot and removal rode the Flyer (T0353, done); the regular-enemy cap is 10 of 10.
- The Hive — **done as T0292 (2026-11-01)**: the wave-40 boss, the first boss that grows the group (a Dot every 6 s, up to 5); `spawnOnly`, the cap untouched.
- The Blinker — **done as T0402 (2026-11-02)**: the wave-60 boss — blinks 2.5 cells forward every 4 s on a 1 s telegraph (committed); the boss lane, spawnOnly.
- Wall (IDEAS, new cycle 38) — parked at the back of the queue (from wave 16): slows the group it leads.

Queue order: the regular-enemy cap is 10 of 10, so the Wall (parked, IDEAS) stays parked — it needs a slot. The queue lands one enemy at a time.

## Augment queue (non-epic)

New augments land one at a time, the enemy queue's way: each registration keeps the draft at the 16-cap and says which augment it retires.

- Herd (T0361, M) — **in the pool (2026-11-01)**: the first augment that scales with the crowd — +5%/+8% (Rare/Epic) damage per enemy within 2 cells, cap 5; its registration retires Anchor (the fifth removal, after E4's four).
- Chill (the T0391 re-file, M) — **T0421 rejected 2026-11-02 (card lines over the 70/56 card budget); re-file when the augment files are free, lines within the budget**: the shot that adds chill stacks — each hit slows 10% per stack, up to 5 (50%), fading 2 s after the last hit; Rare hits add 2, Epic 3; works on the Flyer's flight, the Ward ignores it; its registration retires Toll (the sixth removal, order-independent with the five).

## Later

Ideas that may become epics or tasks of one.

- Selling a tower (for part of the gold) — **built as T0274 (2026-10-30, desktop); E7 done 2026-10-30**
- Targeting modes per tower (first, strongest, closest) — **built as T0114 (L, non-epic, 2026-11-01, inet-racing)**; its follow-up (the plinth notch, the one-time chip) — **done as T0368 (S, 2026-11-01, cachyos-x8664)**
- More augments with new attacks and changes (the IDEAS backlog holds the list)
- Enemies with new behaviors (one that dashes in bursts, one that shields neighbours, one that splits — the enemy queue holds the live list)
- Bosses every 10 waves, each with its own mechanic — **E5 done; the wave-10 to wave-90 bosses all landed (Colossus, Titan, Orb, Hive, Flyer, Blinker, Mender, Leech, Gorge); the Fracture (T0435, the wave-100 boss, splits into 3 Shards when it dies) is in the pool; the Tide (the wave-110 boss, IDEAS) is parked behind it**
- Panic pulse: the in-wave gasp — **built as T0063 (2026-10-28), removed 2026-10-29 (by hand)**
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them — **E13 done 2026-11-01** (far gate T0338, fork T0352, marked cell T0340, boards reference T0350); the cove — a bay in the island's edge whose pocket cells double-cover the road's curve — **done as T0409 (2026-11-02)**; the slow stretch — ~1-in-4 boards, a 3-cell run of road where walkers cross at 70% — **T0416's file lost 2026-11-02; re-file when the enemy's files are free**; the double mark — ~1-in-4 boards, a second marked cell with the marked cell's own mark and buff — **done as T0436 (M, 2026-11-02, cachyos-x8664)**; the long straight — ~1-in-5 boards (exclusive with the fork and the loop), the road's longest straight run is 7+ cells — **T0438 failed at the design (no design produced); re-filed as T0453 (L, in the pool)**
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger — **built as T0239 (L, non-epic, 2026-10-30, asus)**: a quiet generative bed under the wave phase that quickens on the exit warning's own state
- The Mute's silence gets its note — one soft held tone while any Mute holds a tower (the sky note's pattern, T0376) — **done as T0419 (M, 2026-11-02, asus)**
- Run summary — **all built (T0216, T0306, T0333, T0336, T0345)**: kills and damage per tower, leaks per wave, the mid-run story line
- The board shows its corners: a notch on the bend cells — **built as T0140 (2026-10-29), removed as T0227 (2026-10-29)**
- Every board has a choke: the guaranteed double-cover cell (groundwork under E3's winding roads and E5's boss to hold) — **built as T0217 (2026-10-30, asus)**
- The quiet tower: a small dim dot on a tower that is idle mid-wave (groundwork for E5's untargetable boss phase) — **built as T0233 (S, non-epic, 2026-10-30, yoga)**
- The claim branch's third node: **Held pays** — a wave that leaks pays 1 coin per life it lost (155 coins, the depth-3 price on the branch's re-priced curve) — **done as T0348 (M, 2026-11-01, asus)**
- More level augments and ranks (Tough I/II/III) once the slots outgrow the set — **now E21 (active, 2026-11-02); the first level tasked as T0446 (M, in the pool)**
- Bank interest: 5% of the gold bank at every wave start, capped at +10 per build phase (gold, never coins) — **built as T0363**; the live "bank +N" line as T0374; the first-pay chip dropped (T0380: the line already teaches it); the pay's coin blip already played (T0381); the pay's gold pop done as T0395 (2026-11-02)
- The storm: a third menu mode — no breather, every wave rushes, 2× the wave bonus for the run (IDEAS holds the full text) — **now E17 (active, 2026-11-02)**
- The run history: the menu's last-four line grows into a History card of the last twelve runs — **now E18 (active, 2026-11-02)**
- The short cut: the fourth wave tag — the walkers come in 40% down their own road; the answer is placement, where the rush's answer is none — **done as T0440 (2026-11-02)**
- The codex at the pause: the pause's reference set gains the family the draft is about — an "Augments" row opening the codex (T0221) over the dimmed pause, back to the pause (the How row's cross-context pattern; the menu's codex stays) — **tasked as T0441 (M, non-epic, 2026-11-02)**
