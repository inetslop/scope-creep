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
- The first pass: 155 coins by the depth rule, the run's first leak costs no life (a per-run flag the run save carries; the Hauler's 5 gold still pays) — **tasked as T0433 (M, in the pool; the T0427 re-file)**

### E21 — The levels: more ways to make a run harder (active — opened 2026-11-02)
**Goal:** the run-setup step's level set is five (Crowded, Lean, Short fuse, Swift, Tough) and the run's coin multiplier pays for the handicap the player picks; the set grows past five with a new dimension each time, so the run the player sets up is a pick, not a default.
**When done:** the set has more than five levels with dimensions the five don't touch — information (Blind: no preview of the next wave) and the board's face (no marked cell, no guaranteed choke) — each with its own dry one-liner on the run-setup step, its own multiplier notch and its own chip; the ranks (Tough I/II/III) once the set outgrows the run's slots.
**Breakdown:**
- Blind: the sixth level — the run's build phase has no wave preview (the preview card and the flyer's line stay hidden) — **done as T0446 (M, 2026-11-03)**
- the board's face: a level whose boards carry no marked cell and no guaranteed choke — **tasked as T0452 (M, in the pool)** (the long straight re-filed as T0453; the board's files are settled)
- the ranks: Tough I/II/III once the set outgrows the run's slots — parked

### E22 — The march: the wave walks in more than one way (active — fully tasked 2026-11-03, closing on the pool's landings)
**Goal:** the wave's tag set is four (quiet, tight, rush, short cut); it grows with a new march each time — a new rhythm the wave takes, with its own chip, its own answer and its own line in the waves reference — and on mobile a special wave is felt before it happens.
**When done:** the set has six tags: the double (two fronts, a 6 s lull, the second at 1.2×) — done as T0447 — and the clumps (clumps of 2–3 with 4 s gaps that break the chain); the preview and the banner wear each chip, the waves reference names each, and a non-quiet tagged wave buzzes once on mobile at the banner (the quiet breather stays silent).
**Breakdown:**
- the double: the fifth tag — two fronts, a 6 s lull, the second at 1.2× — **done as T0447 (L, 2026-11-02)**
- the clumps: the sixth tag — clumps of 2–3 with 4 s gaps that break the chain — **done as T0448 (M, 2026-11-03)**
- the tag's haptic: a non-quiet tagged wave gets one 30 ms guarded buzz on mobile at the banner (the quiet breather never buzzes) — **done as T0449 (S, 2026-11-02)**
- the next tag, whose answer is the move: **tasked as T0461 (M, in the pool, 2026-11-03)** — the halt: the walkers stop 3 s at the middle of their own road, the middle becomes the wave's choke, and the move re-points an old tower at it

### E23 — The draft: nodes for how the run's cards come (active — fully tasked 2026-11-03, closing on the pool's landings)
**Goal:** the tech tree's "The draft" branch (the tech screen's existing 2nd row — the Slot II and fourth-card nodes in `content/tech/draft.ts`) covers the hand's slots and cards, but not how the offer comes: three more nodes on that branch let between-run coins buy how the run's cards come.
**When done:** the branch carries three more nodes, each bought once and on for every run after: The early odds (the tier-odds shift starts at wave 1 instead of wave 5), A cheaper roll (the reroll's cost curve starts 25 lower) and Opening wild (the first draft always offers a Rare or Epic alongside its Common Bolt floor).
**Breakdown:**
- The early odds: the branch's depth-4 node at 80 coins by the branch's own depth rule (base 10 — 30 at depth 2, 80 at depth 4), the tier-odds shift (T0011) starts at wave 1 instead of wave 5 — **tasked as T0458 (M, in the pool, 2026-11-03)** (the T0450 re-file: a node on the branch's existing row, not a new eighth row)
- A cheaper roll: the reroll's curve starts 25 lower — today's reroll is unlimited on a 50, 70, 100, … curve, so the node makes it 25, 45, 65, … (T0451's "second reroll for 25 gold" premise was stale); priced one depth deeper than The early odds — depth 5, 110 coins by the branch's depth rule — **tasked as T0459 (M, in the pool, 2026-11-03)** (the T0451 re-file)
- Opening wild: the branch's third new node, 145 coins by the branch's depth rule (depth 6), the first draft always offers a Rare or Epic alongside its Common Bolt floor (T0048) — the floor is on one non-Bolt slot of the pre-wave-1 offer and its rerolls, no run state (a resumed run never re-rolls the opening draft) — **tasked as T0462 (M, in the pool, 2026-11-03)**

### E24 — The reserve: the heavy card (active — opened 2026-11-03)
**Goal:** the run's gold buys slots and rerolls; now it also buys the shape of the next wave — three heavy cards, each once per run, bought in the build phase: the surge (the next wave's towers attack 50% faster, 60 gold), the wall (the next wave's walkers walk 0.7×, 80 gold) and the harvest (the next wave's kills pay 2× gold, 50 gold). A run saves up like it builds.
**When done:** the build phase shows the reserve — a small white card (the stats card's width) under the level chips: one bold line per heavy card with its price (the unbought "Name · N" with the coin glyph, the bought "Name · used") and its muted one-liner (the iron card's subline, T0406), the card hides when all three are spent; a buy pays the gold and the next wave wears its muted chip ("surged" / "walled" / "harvested") under the wave card's number for that wave only; the claim card's muted line names the heavy cards bought; the pause's controls list names the card.
**Breakdown:**
- the reserve and its first card, the surge: the card, the 60-gold once-per-run buy, the next wave's towers +50% attack speed (additive with Haste, the beam's per-second untouched), the wave's "surged" chip, the run save — **tasked as T0463 (M, in the pool, 2026-11-03)**
- the wall: the reserve's second entry, 80 gold, the next wave's walkers 0.7× (crawl, dash, ramp and boss; the Ward ignores it, the crosser keeps its pace) — parked (tasked once T0463 lands, the entries land one at a time)
- the harvest: the reserve's third entry, 50 gold, the next wave's kills pay 2× gold (the gold pop reads the doubled number, the last stand's look) — parked
- the claim's line: the claim card's muted "reserve" line naming the heavy cards bought (no line when none was bought) — parked

### E25 — The kill: a tech branch for how a kill pays (active — opened 2026-11-03)
**Goal:** the tech tree has covered run start, board, pool, claim, wave, tower, exit and the draft — but not the kill itself: a branch on the tech screen's next row lets between-run coins buy how a kill pays.
**When done:** the tree's "The kill" branch has three nodes, each bought once and on for every run after: The bounty (every kill pays +1 gold, doubled by the quiet ×2 and the last stand ×2), The window (the kill-chain window +0.5 s, 1.5 s → 2.0 s, additive with Feast's +0.4 s per copy) and The milestone (the chain's milestone pay ×2: the 5th and 10th kill of a chain pay +4 and +8).
**Breakdown:**
- the branch and its first node, The bounty: the tech screen's next row (after The exit) plus a 30-coin node, every kill +1 gold on the bounty before the quiet and last-stand ×2 — **tasked as T0466 (M, in the pool, 2026-11-03)**
- The window: 85 coins by the depth rule, the kill-chain window +0.5 s — parked (tasked once the row lands)
- The milestone: 155 coins by the depth rule, the chain's milestone pay ×2 (the 5th and 10th kill of a chain pay +4 and +8) — parked

### E26 — The patterns: the board reads without color (active — opened 2026-11-03)
**Goal:** shape and color carry meaning (Pillar 3); a player who can't trust color can't read the board: a "Patterns" toggle beside the pause screen's Sound row (off by default, remembered) paints a small muted-ink mark on every enemy token and every tower — the mark's shape distinct per enemy type and per first augment — so the board reads by shape alone.
**When done:** with the toggle on, every enemy token and every tower wears one small muted-ink mark (one color for all, the shape is the information): the 10 regulars, the 16 first augments, the bosses and the split pieces each read apart without color; the mark replaces color as the identity channel, nothing else on screen changes, and with the toggle off the board is byte-identical to today.
**Breakdown:**
- the toggle and the enemy tokens: the pause row (the Sound row's pattern, T0035), the profile flag, the pattern module, the 10 regular marks — **tasked as T0465 (L, in the pool, 2026-11-03)**
- the towers: a tower wears its first augment's mark on its barrel (the 16 marks, the same vocabulary; the tier pips untouched) — parked (tasked once the tokens land)
- the rest of the board and the references: the bosses' own 8 marks, the Shard and the Splinter wearing the parent's mark smaller, the enemies reference and the codex's tokens matching — parked

## Enemy queue (non-epic)

New enemies land one at a time: each new-enemy task chains behind the one before it so the enemy system, the wave mix and the art settle between additions.

- Dasher, Splitter, Hauler, Mute — **done** (2026-10-28/29): the burst mover, the splitter, the 10-gold leak, the tower-silencer. Lesson for all future enemies: the warm color family is closed — a new enemy repeats a family color and brings a new silhouette.
- Feeder — **done as T0334, removed with the Flyer (T0353)**; the regular-enemy cap is 10 of 10.
- The Hive (T0292, wave 40) and the Blinker (T0402, wave 60) — **done** (2026-11-01/02), the boss lane, `spawnOnly`, the cap untouched.
- Wall (IDEAS) — parked at the back of the queue (from wave 16): slows the group it leads; it needs a cap slot, so it stays parked.

The queue lands one enemy at a time.

## Augment queue (non-epic)

New augments land one at a time, the enemy queue's way: each registration keeps the draft at the 16-cap and says which augment it retires.

- Herd (T0361, M) — **in the pool (2026-11-01)**: the first augment that scales with the crowd — +5%/+8% (Rare/Epic) damage per enemy within 2 cells, cap 5; its registration retires Anchor (the fifth removal, after E4's four).
- Chill (the T0391 re-file, M) — **tasked as T0456 (M, in the pool, 2026-11-03)**, the card lines within the 70/56 budget this time: the shot that adds chill stacks — each hit slows 10% per stack, up to 5 (50%), fading 2 s after the last hit; Rare hits add 2, Epic 3; works on the Flyer's flight, the Ward ignores it; its registration retires Toll (the sixth removal, order-independent with the five).

## Later

Ideas that may become epics or tasks of one.

- More augments with new attacks and changes — the IDEAS backlog holds the list
- Enemies with new behaviors — the enemy queue holds the live list
- Bosses every 10 waves, each with its own mechanic — the wave-10 to wave-90 bosses all landed; the Fracture (T0435, the wave-100 boss, splits when it dies) is in the pool, the Tide (wave 110, IDEAS) parked behind it
- Board modifiers — the slow stretch (T0455) and the long straight (T0453) are in the pool
- The gauntlet: a fourth mode off the menu — a run of exactly 10 waves, each wave the boss of its slot (the wave-10 to wave-100 ladder), ending in the game's first win and its own claim line; opened once the run's files settle (a mode flag is the run's core, and T0403's storm is ahead of it in the pool)
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
