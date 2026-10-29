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

### E2 — Tech tree (active — started 2026-10-29; E1 closed, and this is the epic it was waiting for)
**Goal:** a reason to play one more run: spend what runs earn on lasting upgrades.
**When done:** a tech tree screen reached from the menu, a few branches of nodes bought with the currency from E1, each node a lasting change shown on its card: more starting gold, a cheaper second slot, an extra augment pick before wave 1, new augments unlocked into the draft pool, more lives. Bought nodes stay bought.
**Breakdown:**
- T0103 (L, priority 1) — the screen and branch one “Run start” (three “Gold +5” 5/10/15 coins, one “Life +1” 30 coins): the node card's states, the purchase pop + chime, the profile's purchased list, the start bonuses from a new pure module (new and ghost runs) — **done** (2026-10-29, asus)
- T0110 (M, cycle 55, depends_on T0103) — branch two, "The draft": "Slot II −5" ×2 (10/20 coins; the second slot's price never below 5) and "Fourth card" (15 coins: the pre-wave-1 draft and its reroll offer four, T0048's Bolt floor kept, T0065's flip and fit) — in the pool
- T0153 (M, priority 2, depends_on T0103) — branch three “The pool”: one “Haste” node (25 coins), locked with a muted “not in the game yet” while the Haste augment (T0152) is out of the game, then buyable; buying it adds Haste to the draft pool (the gate is T0152's, so either task can land first) — in the pool
- (sketch — branch four, "The board": lasting board changes bought with coins — a longer road, one more bend — a node card in branch one's (T0103) look, a board-growth parameter a new run reads; sketch only, tasks after branch three (the pool, the Haste node) so the tree grows one branch at a time)

Status: the foundation (T0103) is done; the draft branch (T0110) and the pool's node (T0153) are in the pool; branch four (the board) stays a sketch until the pool is in.

### E3 — Levels: a run is a journey (not started)
**Goal:** a run has a shape: a few boards in a row, each harder, and a build that grows across them.
**Groundwork (outside the epic):** T0015 (wave preview — done, 2026-10-28, narcissus) becomes the per-level wave preview once levels exist; T0014 (leak warning) teaches what a leak is before levels make leaking costlier; T0019 (fast-forward 2x) keeps runs in flow and pays off once a run spans several levels; the lives danger-pip idea was rejected as T0022 (the stats card has no room — see IDEAS) and is the one to revisit if levels make leaking costlier.
**When done:** a run goes through levels, like the acts of a roguelite: each level is its own board with a set number of waves, ending in a tougher final wave. Clear it and the run moves on to the next level: a new, harder board (a longer or more winding road, tougher enemies) that starts empty. What you carry is your **pool**: the run starts with a small pool of augments that the drafts offer from, and every time you clear a level you pick one new augment to add to it, so each level offers more to combine. The HUD shows the level ("Level 2 · Wave 3/8"), the pick between levels is its own moment, and the game-over screen says how far you got. Clearing the last level wins the run.

### E4 — Augment rarity (active — started 2026-10-28)
**Goal:** the draft is exciting: sometimes a card is something special.
**When done:** every augment card in the draft comes in a rarity: Common, Rare or Epic. A rarer card is the same augment with stronger numbers (a Rare Rapid attacks faster than a Common one), and a few rule-changing augments only ever come as Epic. Rarity shows everywhere the augment does: the card's frame and a small gem row on the draft, hand and tower-panel cards, and on the tower itself (its slot pip). Rarer cards turn up more often the further the run gets; the odds are shown in the draft.
**Breakdown:**
- T0002 (asus, L) — the tiers: Common/Rare/Epic numbers for the five augments, the 70/25/5 draft roll, card frame + gem row, odds line — **done** (2026-10-28)
- T0004 (asus, L) — Lance: a pool piercing augment (all tiers): first, a long thin shot that keeps going; added, +1 pierce — **done** (2026-10-28)
- T0008 (desktop, M) — rarity on the hand and the tower panel: a shared tier card look (frame, gems, tier word) — **done** (2026-10-28)
- T0010 (yoga, S) — tier pip per slot on the tower — **done** (2026-10-28)
- T0011 (asus, M, cycle 2) — the odds shift: rarer cards the deeper the run, live odds line — **done** (2026-10-28)
- T0012 (asus, L, cycle 2) — Mark: the rule-changing augment that only ever comes as Epic — **done** (2026-10-28)
- T0020 (asus, L, cycle 5) — Rally: the second rule-changing Epic; towers within 2 cells of a Rally tower attack 10% faster, rewarding clusters — **done** (2026-10-28)
- T0021 (desktop, L, cycle 6) — Mint: the third rule-changing Epic; kills within 2 cells of a Mint tower drop +1 extra gold, and each Mint in a tower makes that tower's kills drop +1 more — **done** (2026-10-28, desktop)
- T0023 (asus, L) — Anchor: a pool rooting augment (Epic-only); every 3 s it roots (fully stops) everything within 2.5 cells, added hits root too — the first new behavior after the three Epics — **done** (2026-10-28, asus)
- T0024 (yoga, S, cycle 7) — the draft reveal: the three offered cards flip face-up when the draft opens, the Epic card holding its flip a beat longer — **done** (2026-10-28)
- T0025 (asus, L) — Chain: the leap-zap augment (pool, all tiers): first, a zap that strikes the enemy furthest along and leaps to the nearest unstruck enemy; added, +1 leap to any first augment's attack — the first attack that changes target mid-attack — in the pool
- T0026 (yoga, S, cycle 8) — the tier word on the draft card: the name line of Rare and Epic cards reads "Name · Rare" / "Name · Epic" (Common unchanged), the same line the tower panel shows — **done** (2026-10-28)
- T0027 (asus, L) — Push: a pool gust augment (all tiers, opening): a gust that pushes everything within 2.5 cells back along the road with no damage; added, hits push back 0.4 cells (+0.4 per Push) — the first augment that moves enemies along the road — **done** (2026-10-28, desktop)
- T0028 (asus, L) — Ember: a pool burning augment (all tiers, opening): first, sets ablaze the enemy furthest along; added, hits set ablaze — the first damage over time; the ticks are the source tower's damage, so Mark amplifies them and a killing tick is its kill — **done** (2026-10-28, asus)
- T0029 (asus, L) — Beam: a pool beam augment (all tiers) — **failed three times** on merge conflicts in the shared augment files (the work is saved to tasks/salvage/T0029.diff); re-tasked as T0073, which landed — superseded
- T0032 (yoga, S) — the tier chime: each draft card lands with a short chime on the reveal flip (T0024) — one note Common, a third higher Rare, the highest Epic — **done** (2026-10-28)
- T0036 (M) — reroll: once per run, three new draft cards for 15 gold — a "Reroll · 15" button under the cards, dimmed "used" after the one use, red price while gold is short — **done** (2026-10-28, desktop)
- T0038 (L) — Ricochet (a shot that bounces off the board's rocks): **rejected** — shots fly over rocks and home in on their target (there is no line of sight), so there is never an enemy behind a rock a tower can't already hit (the Lead lesson, T0040); not re-proposed unless rocks start blocking shots
- T0039 (S) — Mint's gold pop: when a kill pays a Mint's +1 extra gold, a small gold "+1" pops at the kill spot ~100 ms after the normal kill gold — **done** (2026-10-28, baby-mama)
- T0040 (M) — Lead (a heavy shot that aims where the enemy will be): done, then **removed by hand the same day** — every shot already homes in and never misses, so aiming ahead only added a way to miss and it played as a weaker Reach; don't re-propose a predictive or aimed shot
- T0041 (S) — Epic frame shimmer: when an Epic card lands face-up on the draft reveal flip (T0024), its purple frame runs a one-shot ~150 ms white shimmer, left to right; plays on the reroll re-flip too — **done** (2026-10-28, yoga)
- T0043 (S) — beam hum (110 Hz sine, volume 0.05, 200 ms fades, one per beam tower, continuous through retargets, at most 3 at once): **re-filed as T0112** after three attempts were blocked on the Beam (T0073) not being in yet; the complete design stands in tasks/archive/T0043-…
- T0044 (S) — the owned dot: a draft card whose augment the run already has shows a small muted-gray dot in its top-right corner, so "stack this one" vs "branch this one" reads at a glance — **done** (2026-10-28, yoga)
- T0048 (S) — the first draft always offers the default shot: the pre-wave-1 draft (and a reroll of it) always includes at least one Common Bolt; drafts from wave 2 on roll normally — **done** (2026-10-28, baby-mama)
- T0052 (S) — the draft never offers the same augment twice in a row: the offer roll excludes the augments of the immediately previous offer, a reroll excludes the offer it replaces — **done** (2026-10-28, inet-racing)
- T0055 (S) — working aura: a tower whose first augment has no attack of its own (Anchor, Mint) plays a quiet ~1 s ring at its base in its own color each time its aura works; Rally shows no ring — **done** (2026-10-28, desktop)
- T0058 (S) — Push wind-up: while the next gust charges, a thin ring in Push's own color sweeps 0°→360° once per charge interval around the base, completing and fading at each gust — the next shove is readable before it lands — **done** (2026-10-28, yoga)
- T0059 (S) — burn on death: when a burning enemy (T0028) dies, its burn jumps to the nearest enemy within 2 cells (one hop per burn at most) — **done** (2026-10-28, yoga)
- T0062 (M) — Trap (a bomb that springs on the road: the first triggered attack — the spring is the enemy's proximity, not the tower's cadence; added, kills leave a trap at the kill spot): the design stands as written (its one failure was an environment failure before any design); in the pool (todo), claim-order behind Momentum (T0064) so the pool lands one registration at a time
- T0064 (L) — Momentum (the fourth rule-changing Epic, Epic-only: each clean wave makes every tower deal +5% more damage for the rest of the run; added, each extra copy adds +5% more; a low wide yellow disc with a notch per copy) — in the pool (todo); claim-order keeps the shared augment files at one registration at a time
- T0065 (M) — second pick: every 5th draft (counting pre-wave-1 as draft 1) offers a fourth card that rolls like the others, flips in last with its own tier chime, and fits the row area; the reroll re-rolls all four — **done** (2026-10-29, asus)
- T0073 (L) — Beam: the T0029 re-task (the first sustained attack — a continuous line on the enemy furthest along in range 4.5, 6/8/10 per second by tier, retargeting the instant its target is gone; added, a second line at half rate on the nearest) — **done** (2026-10-29, asus): the salvage re-based as a short branch held in one attempt; the beam hum's (T0112) wait resolved with it
- T0084 (M) — the panel says how hard a tower hits: a muted "≈ N/s" DPS line at the bottom of the tower panel (a new pure module with unit tests; Chain and Beam add their primary-strike term when they land) — **done** (2026-10-29, cachyos-x8664)
- T0088 (S) — the build says its tier: the tier chime (T0032) plays once the moment an augment is committed to a tower (never on a failed placement) — **done** (2026-10-29, desktop-4070)
- T0089 (L) — Pulse: **dropped** (by hand, while in progress) — as a first augment it was Splash without the 3-enemy cap and with other numbers, and its added form (+0.5 cells range) was Reach's; fails the content bar, don't re-task it or a variant
- T0093 (L) — Mend (the Epic that buys a life back): **rejected** — the Added card line (91 chars) exceeded the 56-char tier-line cap; the mechanic, panel, art, sound and state design were approved as sound — re-filed as T0095 with a shortened Added line, the only change
- T0094 (S) — the card says how many: a draft card whose augment the run already holds (the owned dot, T0044) shows a small muted "×N" beside the dot — N the copies in the hand and every tower's slots, shown only for N ≥ 2 — **done** (2026-10-29, narcissus)
- T0095 (L) — **Mend: the Epic that buys a life back (the T0093 re-file)**: Epic-only, a support with no attack of its own — every 12 kills this run the run regains 1 life (a pay at the starting lives is held and pays at the next leak); added, −2 kills per extra copy (12, 10, 8, 6, 4 floor) — the only change from the rejected T0093 is the shortened Added line; in the pool (priority 3)
- T0096 (M) — the what-if preview: while a hand card is selected, a tower with a free slot wears a ghost of the held augment's marker at its next free slot (desktop hover; mobile shows the marker on every tower with a free slot) and previews a reach change in the range ring; display-only — **done** (2026-10-29, asus)
- T0099 (M) — the mark shows on the enemy: while an enemy is marked (Mark, T0012) a small pink tick rides above it, cleared the instant the mark falls off; display only, a new enemy-hook file — the first slice of the enemy-telegraph idea — **done** (2026-10-29, desktop-4070)
- T0100 (S) — the tier word wears its tier: on a draft card the "· Rare" / "· Epic" word (T0026) is drawn in the tier's own color — blue for Rare, purple for Epic — while Common stays the plain name — **done** (2026-10-29, yoga)
- T0101 (L) — Spray (the pool's aimed spread: a mid-tempo shot that on its first hit splits into 3 + (extra Sprays) lighter needles homing to different nearest enemies; closest is Splash — new is that the spread is aimed) — **done** (2026-10-29, desktop)
- T0104 (S) — the sprinter shows its ramp: while a Sprinter is above its base speed a small orange tick rides above it, clearing when it dies; display only, a new enemy-hook file — the second telegraph slice — **done** (2026-10-29, baby-mama)
- T0105 (S) — the splitter's crack widens as it weakens: while a Splitter is at 50% hp or less its own crack is painted 2× as thick, above 50% byte-identical to today; the split itself is untouched (T0068) — the third telegraph slice — **done** (2026-10-29, inet-racing)
- T0112 (S, priority 2) — the beam hum (the T0043 re-file): a very quiet 110 Hz sine under each active beam, one per beam tower, at most 3 at once, silent with sound off; T0043’s complete design stands in its archive — **in progress (asus)**
- T0113 (S, priority 3) — the burn shows on the enemy: while an enemy is burning (Ember, T0028) a small orange chip rides above it, cleared the instant the burn ends; a jumped burn (T0059) shows on the enemy it jumps to — the fourth telegraph slice, the first for a damage-over-time state — **done** (2026-10-29, baby-mama)
- T0130 (M, priority 1) — Beam combos I: Bolt adds a ray, Rapid and Rally feed the beam — designing
- T0131 (M, priority 2) — Beam combos II: Lance pierces, Splash scorches, Spray splits a beam kill — designing
- T0132 (M, priority 2) — Beam combos III: the beam carries Frost, Ember, Anchor, Push and Mark — in the pool
- T0133 (M, priority 2) — A new look for the Beam tower: a tower with a circle on top — in the pool
- T0134 (L, priority 2) — Spray becomes a shotgun: a cone of pellets — **in progress (inet-racing)**
- T0135 (S) — Spray gets its own look, not Beam's — **done** (2026-10-29, yoga)
- T0152 (L, priority 2) — Haste: the Epic that hastens everything it touches (2-cell aura: enemies walk +30% faster, towers attack +30% faster, +15% to both per extra copy, no cap; Epic-only; gated — absent from the draft roll until the tech tree's pool node, T0153, is bought) — in the pool, next registration behind the pool augments
- T0138 (S, priority 2) — the slow shows on the enemy: a chip over the slowed, cleared when the slow ends — the fifth telegraph slice; a new enemy-hook file on the markTick pattern (T0099) — in the pool
- T0139 (S, priority 2) — the root shows on the enemy: a chip over the rooted, cleared when the root wears off — the sixth telegraph slice; a new enemy-hook file on the markTick pattern (T0099) — in the pool

Progress: the pool's registrations are T0025, T0062, T0064, T0095 and T0152 (they land one at a time, in claim order); the beam work is T0130–T0133, T0134 and T0112; the telegraph slices are T0138 and T0139; T0150 rides behind T0025.

**E4 closes when T0025, T0062, T0064, T0095, T0112, T0130, T0131, T0132, T0133, T0138, T0139 and T0152 land** (T0150 waits on T0025; T0089 is dropped).

**16-cap watch:** the pipeline holds 19 augments (14 in + T0025, T0062, T0064, T0095, T0152); the first to land past 16 (Momentum, T0064) must remove or merge one and say which — the PO's leaning is a Frost + Haste merge (the same enemy-speed stat, opposite signs), spec'd before T0064's claim.

### E5 — Bosses: every 10th wave is something you remember (not started; starts when E4 closes)
**Goal:** the run has a peak: the deep waves bring one big shape with its own mechanic, not just more of the same.
**When done:** every 10th wave the road sends a boss instead of a crowd: a single big shape (6× Block's hp, Block's speed, one life on a leak) under its own health bar (a small white card pinned to the top edge, counting down as it is hit). The wave-10 boss phases at 50% hp — translucent and untargetable for 2.5 s, every 8 s — so a one-trick single-target build needs a second line (Splash, Lance, Chain, Beam and Ember all answer it). The wave preview (T0015) shows it coming, and a boss death is a moment: a big chip burst, a Block's double in gold, and a card that names it. Later bosses swap the mechanic (one shields its escort, one splits at half hp).
**Breakdown (sketch — tasked when E4 closes, in this order):**
- (L) the first boss: the wave-10 shape, the top-center health bar, the 50% untargetable phase — a new enemy behavior (timed untargetable) and a new HUD element
- (S) the preview says "boss": the wave preview card shows the boss token with a small muted tag for wave 10
- (M) the boss moment: the death burst, its gold, the name card
- (L) the second boss (wave 20): a different mechanic from the pair in the design (escort shield / half-hp split)

### Enemy queue (non-epic)

New enemies land one at a time: each new-enemy task chains behind the one before it so the enemy system, the wave mix and the art settle between additions.

- Dasher (T0046, M) — **done** (2026-10-28, desktop-4070): telegraphs, then surges.
- Splitter (T0068, M) — **done** (2026-10-28, desktop-4070): breaks into two — a bigger cracked Dot that, on death from any source, splits into two fast splinters at its spot, from wave 9 (one per seven of the wave's other enemies, no randomness); the enemy system, wave mix and art are settled for the next addition.
- Hauler (T0057, M) — **done** (2026-10-28, cachyos-x8664): a big slow hexagon at 1.3× Block's size, red, 3× Block's hp — worth 10 gold when killed (the normal gold pop) and costs 1 life plus 5 gold (floored at 0) when it leaks, with a red "−5" pop at the exit; waves 9, 13, 17, …, exactly one per such wave, reserved in the wave plan and kept out of the budget picks. Its icon, wave preview, sounds and HUD were picked up automatically.
- Mute (T0074, M) — **done** (2026-10-29, desktop-4070): a slow Block-speed walker in a hollow ring (purple) that, while alive, silences every tower within 2 cells (the tower holds still and never attacks; a jammed tower still counts for Rally's range); from wave 11, one every 3 waves. (The first filing, T0053, was rejected on the unsatisfiable color rule; the rewrite landed.) Lesson for all future enemies: the warm color family is closed — a new enemy repeats a family color and brings a new silhouette; never spec "a free warm color" without checking what landed last.
- Feeder (IDEAS) — parked (from wave 13); see the queue order below.
- Wall (IDEAS, new cycle 38) — parked at the back of the queue (from wave 16): slows the group it leads.

Queue order: the Bulwark (T0102) is in progress on desktop-4070 — the next new enemy to land; the Ward (T0111) is in the pool behind it; behind them Feeder → Wall, parked in IDEAS. The queue lands one enemy at a time. (The finished “Remove the panic pulse” task file also carries id T0102 — the live T0102 is the Bulwark; flagged for the runner.)

## Later

Ideas that may become epics or tasks of one.

- Selling a tower, or taking an augment back out (for part of the gold)
- Targeting modes per tower (first, strongest, closest) — tasked as T0114 (cycle 58, L, non-epic) — the spec and its parked follow-ups (the plinth notch, the chip's teach line) stand in IDEAS
- More augments with new attacks and changes (the IDEAS backlog holds the list)
- Enemies with new behaviors (one that dashes in bursts, one that shields neighbours, one that splits — the enemy queue holds the live list)
- Wave preview: what the next wave sends, shown during the build phase — done (T0015, 2026-10-28, narcissus)
- Bosses every 10 waves, each with its own mechanic — now **E5** (not started; sketched in the epics above; the first boss design is in IDEAS)
- Panic pulse: the in-wave gasp — a "Panic · 25" button under the stats card clears every enemy on the board for 25 gold, once per wave (a paid wipe: no gold, no leak, no combo, not "stopped"; the wave's remaining spawns continue) — a player-facing economy mechanic, no epic — **built as T0063 (2026-10-28), removed 2026-10-29 (by hand)**
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger
- Run summary: damage per tower, leaks per wave
- The board shows its corners: build cells that touch a bend carry a small muted notch, so the worth-more cells are seen before the first placement — tasked as T0140 (S, non-epic)
