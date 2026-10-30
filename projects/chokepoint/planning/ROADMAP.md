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
The level rule (T0260) and its wave-card line (T0262) landed and played badly: re-growing the board empty every 10 waves throws away the build. Both are being removed by T0283 (in the pool, priority 1); T0261 is dropped with them. Do not re-task levels, the level-clear pick or the level-clear sting. The difficulty-for-reward idea lives on as **E9**.

### E4 — Augment rarity (active — started 2026-10-28)
**Goal:** the draft is exciting: sometimes a card is something special.
**When done:** every augment card in the draft comes in a rarity: Common, Rare or Epic. A rarer card is the same augment with stronger numbers (a Rare Rapid attacks faster than a Common one), and a few rule-changing augments only ever come as Epic. Rarity shows everywhere the augment does: the card's frame and a small gem row on the draft, hand and tower-panel cards, and on the tower itself (its slot pip). Rarer cards turn up more often the further the run gets; the odds are shown in the draft.
**Breakdown:**
- T0002 (L) — the tiers: the draft roll, card frame + gem row, odds line — done
- T0004 (L) — Lance — done
- T0008 (M) — rarity on the hand and the tower panel — done
- T0010 (S) — the tier pip per slot on the tower — done
- T0011 (M) — the odds shift deeper into the run — done
- T0012 (L) — Mark: the first rule-changing Epic — done
- T0020 (L) — Rally: the cluster Epic — done
- T0021 (L) — Mint: the economy Epic — done
- T0023 (L) — Anchor: the root Epic — done
- T0024 (S) — the draft reveal flip — done
- T0025 (L) — Chain: the leap-zap augment — the first attack that changes target mid-attack — in the pool (todo)
- T0026 (S) — the tier word on the draft card — done
- T0027 (L) — Push: moves enemies back along the road — done
- T0028 (L) — Ember: the first damage over time — done
- T0029 (L) — Beam: failed three times — superseded by T0073
- T0032 (S) — the tier chime on the draft reveal — done
- T0036 (M) — reroll: once per run, three new cards for 15 gold — done
- T0038 (L) — Ricochet: rejected (shots home) — don't re-propose unless rocks block shots
- T0039 (S) — Mint's gold pop — done
- T0040 (M) — Lead: removed (shots home and never miss) — don't re-propose an aimed shot
- T0041 (S) — the Epic frame shimmer on the reveal — done
- T0043 (S) — the beam hum: landed as T0112 — done
- T0044 (S) — the owned dot on the draft card — done
- T0048 (S) — the first draft always offers a Common Bolt — done
- T0052 (S) — the draft never repeats the previous offer — done
- T0055 (S) — the working-aura ring under support towers — done
- T0058 (S) — the Push wind-up ring — done
- T0059 (S) — the burn jumps once to the nearest on death — done
- T0062 (M) — Trap: the bomb that springs on the road, the first triggered attack — in the pool (todo)
- T0064 (L) — Momentum: each clean wave, +5% damage to every tower (Epic-only, gated) — in the pool (todo)
- T0065 (M) — second pick: every 5th draft offers a fourth card — done
- T0073 (L) — Beam: the first sustained attack — done
- T0084 (M) — the "≈ N/s" DPS line in the tower panel — done
- T0088 (S) — the tier chime plays on the build commit — done
- T0089 (L) — Pulse: dropped (fails the content bar) — don't re-task it or a variant
- T0093 (L) — Mend: rejected on the 56-char tier-line cap — re-filed as T0095
- T0094 (S) — the owned dot counts copies (×N) — done
- T0095 (L) — Mend: the Epic that buys a life back (every 12 kills, +1 life; −2 per extra copy, floor 4) — in the pool (todo, priority 3)
- T0096 (M) — the what-if preview of the held card — done
- T0099 (M) — the mark shows on the enemy — done
- T0100 (S) — the tier word wears its tier's color — done
- T0101 (L) — Spray: the pool's aimed spread — done
- T0104 (S) — the Sprinter shows its ramp — done
- T0105 (S) — the Splitter's crack widens at half hp — done
- T0112 (S) — the beam hum — done
- T0113 (S) — the burn shows on the enemy — done
- T0130 (M) — Beam combos I: Bolt adds a ray, Rapid and Rally feed the beam — done
- T0131 (M) — Beam combos II: failed (context overflow) — re-filed as T0210, the needle clause parked for T0242
- T0210 (M) — Beam combos II: Lance pierces the beam's main line, Splash scorches its target — done
- T0242 (M) — Beam combos IIb: a beam kill splits into one homing needle per added Spray — in the pool (todo)
- T0248 (S) — the codex lock: a muted lock on the gated augments' codex cards — in the pool (todo, waits on T0062 and T0095)
- T0132 (M) — Beam combos III: the beam carries Ember, Anchor, Push and Mark — done
- T0133 (M) — a new look for the Beam tower — done
- T0134 (L) — Spray becomes a shotgun: a cone of pellets — done
- T0135 (S) — Spray gets its own look — done
- T0152 (L) — Haste: the Epic that hastens everything it touches (2-cell aura, +30% to both sides, +15% per copy; gated by its tech node) — done (2026-10-30)
- T0138 (S) — the slow shows on the enemy — done
- T0139 (S) — the root shows on the enemy — done
- T0221 (L) — the Augments codex: every augment in the pool, one card each — done
- T0228 (S) — the end card's towers wear their tier — done
- T0234 (M) — Toll: the Epic that pays gold when a leak gets through — done (2026-10-30)
- T0235 (L) — Feast: the Epic that feeds on the kill chain (its added form lengthens the chain's window) — in the pool (todo)
- T0236 (S) — the what-if says "nothing": failed on a wrong premise — dropped, don't re-propose a hits-card dim
- T0238 (L) — the draft shows where the card lands: failed (wrong premise) — re-filed as T0243
- T0243 (L) — the draft shows where the card lands (the re-file): each offered card shows the towers a pick would land on — done (2026-10-30)
- T0276 (M) — endless rerolls: every reroll costs more — **done** (2026-10-30, desktop)
- T0279 (S) — balance: Beam hits too softly — in progress (yoga)
- T0280 (M) — Beam added is a damage boost, not another beam — in the pool (todo)
- T0281 (L) — Beam and burn deal damage in ticks — in the pool (todo)
- T0282 (M) — Spray crits: the shotgun rolls for double damage — in design

Progress: Haste (T0152), Toll (T0234) and the endless rerolls (T0276) landed 2026-10-30; the pool's registrations are T0025, T0062, T0064, T0095 and T0235 (one at a time, in claim order, under the 16-cap); also in the pool: T0242, T0248 (waits on T0062 and T0095), T0281 and the Beam/Spray pass T0279, T0280, T0282; T0150 rides behind T0025.

**E4 closes when T0025, T0062, T0064, T0095, T0235, T0242, T0248, T0279, T0280, T0281 and T0282 land.**

**16-cap (protocol):** the pool is 16 (Haste landed with no removal triggered); the five queued registrations (T0025, T0062, T0064, T0095, T0235) land exactly five removals. The rule: after registering, if the pool is over 16, remove the first still in the index of **Frost, then Rally, then Mint, then Mark, then Anchor**, and say which in the result (the canonical statement is in T0064's task). Everything else — the draft floor (T0048), the beam-combo web (T0210, T0242), the gated Haste (T0152) — never leaves the index.

### E5 — Bosses: every 10th wave is something you remember (active — opened 2026-10-30; the eight slices written, the arrival and escape moments added 2026-10-30, the bosses reference (T0277) added 2026-10-30)
**Goal:** the run has a peak: the deep waves bring one big shape with its own mechanic, not just more of the same.
**When done:** every 10th wave the road sends a boss instead of a crowd: a single big shape (6× Block's hp, Block's speed, one life on a leak) under its own health bar (a small white card pinned to the top edge, counting down as it is hit). The wave-10 boss phases at 50% hp — translucent and untargetable for 2.5 s, every 8 s — so a one-trick single-target build needs a second line (Splash, Lance, Chain, Beam and Ember all answer it). The wave preview (T0015) shows it coming, and a boss death is a moment: a big chip burst, a Block's double in gold, and a card that names it. The boss's arrival is a moment too (a deep horn and a pulse at the gate), and its escape — letting the peak through — is the run's worst moment, heard as a distinct low note. Later bosses swap the mechanic (one shields its escort, one splits at half hp).
**Breakdown (in this order):**
- T0253 (L, priority 1) — the Colossus: the wave-10 shape (6× Block's hp, Block's speed, 1 life on a leak, 20 gold, purple square at 0.45) with the timed untargetable phase — **done** (2026-10-30, inet-racing)
- T0257 (S, priority 2, behind T0253) — the preview says "boss": the every-10 plan's "boss" tag, the preview chip, a one-time teach line (T0092's pattern), the banner chip (T0080's pattern) — **done** (2026-10-30, yoga)
- T0256 (M, priority 2, behind T0253) — the boss card: a small white card pinned to the top edge — the token, the name, a thin hp bar with a notch at 50%, so the phase is read on the bar before it happens — written 2026-10-30
- T0258 (M, priority 2, behind T0253) — the boss moment: the death — the 24-chip burst (2× the milestone count) in the boss's own color and the two-line name card (topBanner's pattern) — **failed** (2026-10-30, the architect's context overflowed before any design); the design stands as written — re-filed as T0273 (with T0266's Orb split carve-out)
- T0273 (M, priority 2) — the boss moment: the death (the T0258 re-file) — in the pool (todo)
- T0259 (L, priority 2, behind T0256) — the second boss (wave 20): the Titan (a red square at 0.5, 6× Block) and its Guard (a red diamond carrying an orange disc) — while the Guard lives, every hit on the Titan is halved; the escort-shield member of the pair — unblocked 2026-10-30 (the failed T0258 dep becomes T0273; its design is written)
- T0266 (L, priority 2) — the third boss (wave 30): the Orb (a purple hexagon at 0.5 with the crack) splits into two faster Shards at half health, unless it dies to a single hit first; the "splits at half hp" later boss — **done** (2026-10-30, inet-racing)
- T0268 (M, priority 2, behind T0253) — the boss's arrival: a deep horn and a pulse at the entrance gate the moment the boss walks in — **done** (2026-10-30, desktop)
- T0269 (M, priority 2, behind T0253) — the boss's escape: when the boss leaks, a distinct low note — the run's worst moment, heard — **done** (2026-10-30, baby-mama)
- T0277 (M, priority 2) — the bosses reference: a pause row (with Enemies / Waves) that lists the boss encounters in wave order — token, name, wave, trick in the teach language — read from the boss defs so it grows as they do — **done** (2026-10-30, desktop)
- T0284 (S, priority 2) — the boss's phase gets its note: a quiet tone the instant the out-of-reach boss (the Colossus, T0253) flashes white and goes out of reach — a 120 ms sine 220→180 Hz, vol 0.08 (T0091's shape reduced to one note) — once per beat, the return to targetable silent; a new enemy-hook file on the bossArrival pattern (T0268), silent with sound off, no HUD or board mark — in the pool (todo)
- T0286 (M, priority 2) — the boss's phase wind-up: at half health or below, a thin purple ring under the Colossus's token sweeps 0°→360° over the 8 s between phases, completing as the telegraph flashes and resting dim through the out-of-reach beat (the Push wind-up's sweep, T0258, at the Mute ring's ground, T0219) — a new enemy-mark hook file — in the pool (todo)

### E6 — Iron run: one life, double coins (done; history in planning/archive/ROADMAP.md)

### E7 — Changing your mind: a misplaced tower is not permanent (active — opened 2026-10-30)
**Goal:** a mistake can be fixed mid-run: a misplaced tower is sold back, a wrong augment is pulled back into the hand.
**When done:** in the build phase the tower panel wears a bottom line, "Sell · +N": tap it and the tower lifts out and pays 70% of what its slots cost (the augments are gone — selling is a refund, not a retrieve; the cell frees, the gold pops at the plinth and slides to the tally). A second line, "Take out · 5", pulls the tower's last augment back into the hand for 5 gold (the card returns to the hand, the tower stays, its attack reverting to what the rest make it; a one-slot tower only sells). Both lines are build-phase only, both are on the pause's controls line, and the end card's by-tower list shows only towers standing at run end (a sold tower's kills stay in the run's totals). Selling costs 30% of the tower, so it is a fix, not a free repick.
**Breakdown:**
- T0274 (M, priority 2) — sell: the panel's "Sell · +N" line (build phase only; 70% of the slots' cost, floored; gold pop + coin trail; sold supports stop working; the pause's controls line) — the T0263 re-file (T0263 failed 2026-10-30 on an architect context overflow before any design; the line stood as written) — in design
- T0275 (M, priority 2, behind T0274) — take out: "Take out · 5" — the last augment back into the hand for 5 gold, the vacated slot stays the tower's (free to refit); a one-augment tower shows only the sell line — in the pool (todo, waits on T0274)

### E8 — A run you can show (active — opened 2026-10-30)
**Goal:** a finished run is a result you can keep and share, not a number that fades with the claim card.
**When done:** the claim card's result is one copyable line (wave, board, coins, mode) a player pastes where runs are shared, and a shared line's seed plays back the exact board (the ghost run, extended from "your best seed" to any seed); the leaderboard (Today / Forever) is where the lines land.
**Breakdown:**
- T0278 (M, priority 2) — the claim card's "Copy": one tap puts "Chokepoint · Wave N · Board SEED · +C coins" (· Iron) on the clipboard — written 2026-10-30
- (parked) replay a shared seed: the ghost run (T0078) grows to take a pasted board seed, not only your own best — task it when the pool has room

### E9 — Level augments: harder runs for a bigger payout (active — opened 2026-10-30, by hand)
**Goal:** once a player can reach wave 30, they can make future runs harder by choice, and are paid for it with a bigger score and more coins for the tech tree. This is the game's long-term ladder, like Slay the Spire's Ascension or Hades' Heat.
**When done:**
- **Unlock, a slot ladder:** level augments are picked into **slots**, and slots are earned one at a time.
  - Reaching wave 30 in any run, normal or Iron, unlocks the **first** slot.
  - Reaching wave 30 with **all** your unlocked slots filled unlocks the next one. Wave 30 with 1 level augment on gives 2 slots, wave 30 with 2 on gives 3, and so on, up to the size of the set.
  - The slot count is saved in the profile and never goes down.
  - Before the first unlock the menu doesn't show level augments, apart from one muted "reach wave 30 to unlock" teaser line.
  - With slots unlocked, the picker shows the next goal, for example "wave 30 with 2 on unlocks a 3rd".
- **The choice:** before a run, the menu offers a small set of level augments. Switch on up to as many as you have slots for. Each one makes the run harder in one plain way and adds its own bonus.
  - Examples: **Tough** (enemies have +25% health), **Swift** (enemies move 15% faster), **Crowded** (+20% enemies per wave), **Lean** (−25% kill gold), **Short fuse** (−30% build time).
  - Each carries a number such as "+20%". The chosen augments' bonuses add up into one run multiplier, shown on the menu before starting.
- **The payout:** the run multiplier scales the run's **score** and the **coins** it pays into the tech tree. It stacks multiplicatively with Iron's doubled coins.
  - The HUD shows the active level augments as small chips.
  - The claim card shows the multiplier in its recipe line ("×1.6 level augments").
  - The leaderboard row shows the multiplier, so a boosted score reads as one.
- **Deeper tech tree, steeper prices:** more coins flow in, so tech node prices grow with depth in a branch: more than linear but not exponential.
  - For example, price = base × depth^1.5, rounded to 5 (10, 30, 50, 80, 110, …).
  - The current branch discount (`branchPrice`: 5 or 10 off once nodes are owned) works against this and is replaced.
  - New deeper nodes get added so the extra coins have something worth buying.
- Choices are saved and preselected for the next run. The run's save records them, so a resumed run keeps its level augments and multiplier.

**Breakdown (to task, in this order):**
- the unlock and the menu choice: wave 30 unlocks the first slot (a slot count in the profile), the menu's level-augment picker capped at the slot count, the chosen set saved in the profile and the run save, the run multiplier shown before starting — no augments yet beyond one (Tough), so the slice is small and playable — **tasked as T0285 (L, in the pool)**
- the payout: the run multiplier applied to score and coins (core coin and score formulas, pure, tested), the HUD chips, the claim card's recipe line, the leaderboard row's multiplier
- the rest of the first set: Swift, Crowded, Lean, Short fuse, each a pure rule with tests and its own percentage
- the tech tree reprice: price by depth (superlinear, not exponential) replacing the branch discount, one pure function with tests; owned nodes stay owned
- deeper tech nodes: a third node in each branch priced on the new curve, so the bigger payout has a sink
- the slot ladder: wave 30 with every unlocked slot filled unlocks one more (pure rule with tests, a "new slot" moment on the claim card, the picker's next-goal line)
- (later) more level augments and ranks (Tough I/II/III) once the slots outgrow the set

### Enemy queue (non-epic)

New enemies land one at a time: each new-enemy task chains behind the one before it so the enemy system, the wave mix and the art settle between additions.

- Dasher (T0046, M) — **done** (2026-10-28, desktop-4070): telegraphs, then surges.
- Splitter (T0068, M) — **done** (2026-10-28, desktop-4070): breaks into two fast splinters at its spot.
- Hauler (T0057, M) — **done** (2026-10-28, cachyos-x8664): a big slow hexagon — worth 10 gold, a leak costs a life plus 5 gold.
- Mute (T0074, M) — **done** (2026-10-29, desktop-4070): silences every tower within 2 cells. Lesson for all future enemies: the warm color family is closed — a new enemy repeats a family color and brings a new silhouette.
- Feeder (IDEAS) — next in line (from wave 13): the cap is open (T0237's Dart removal landed); task it when the pool has room.
- Wall (IDEAS, new cycle 38) — parked at the back of the queue (from wave 16): slows the group it leads.

Queue order: the Bulwark (T0102), the Ward (T0111) and the Dart's removal (T0237) are done — the regular-enemy cap (10, the bar in modules/enemies.md) is open, so the Feeder (from wave 13) is the next enemy to task when the pool has room; the Wall parks behind it. The queue lands one enemy at a time. (The old panic-removal file also carries id T0102 — the live T0102 is the Bulwark; flagged for the runner.)

## Later

Ideas that may become epics or tasks of one.

- Selling a tower, or taking an augment back out (for part of the gold) — now **E7** (active, opened 2026-10-30; both slices written: T0274 the sell, T0275 the take-out behind it)
- Targeting modes per tower (first, strongest, closest) — **tasked as T0114 (L, non-epic, in the pool)** — the spec and its parked follow-ups (the plinth notch, the chip's teach line) stand in IDEAS
- More augments with new attacks and changes (the IDEAS backlog holds the list)
- Enemies with new behaviors (one that dashes in bursts, one that shields neighbours, one that splits — the enemy queue holds the live list)
- Bosses every 10 waves, each with its own mechanic — now **E5** (active, fully tasked 2026-10-30; the first boss design is in IDEAS)
- Panic pulse: the in-wave gasp — **built as T0063 (2026-10-28), removed 2026-10-29 (by hand)**
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger — **tasked as T0239 (L, non-epic)**: a quiet generative bed under the wave phase that quickens on the exit warning's own state
- Run summary: damage per tower, leaks per wave — **first slice built as T0216 (kills by tower on the end card, 2026-10-29, asus)**
- The board shows its corners: a notch on the bend cells — **built as T0140 (2026-10-29), removed as T0227 (2026-10-29)**
- Every board has a choke: the guaranteed double-cover cell (groundwork under E3's winding roads and E5's boss to hold) — **built as T0217 (2026-10-30, asus)**
- The quiet tower: a small dim dot on a tower that is idle mid-wave (groundwork for E5's untargetable boss phase) — **built as T0233 (S, non-epic, 2026-10-30, yoga)**
