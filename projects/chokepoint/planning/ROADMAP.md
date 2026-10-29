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
**When done:** a tech tree screen reached from the menu, a few branches of nodes bought with the currency from E1, each node a lasting change shown on its card: more starting gold, a cheaper second slot, an extra augment pick before wave 1, new augments unlocked into the draft pool, more lives, a richer clean-wave payout, and a new run's road that winds further or runs longer (the board branch). Bought nodes stay bought.
**Breakdown:**
- T0103 (L, priority 1) — the screen, branch one “Run start” (gold +5 ×3, life +1) and the node card's states — **done** (2026-10-29, asus)
- T0110 (M, cycle 55, depends_on T0103) — branch two, "The draft": "Slot II −5" ×2 (10/20 coins; the second slot's price never below 5) and "Fourth card" (15 coins: the pre-wave-1 draft and its reroll offer four, T0048's Bolt floor kept, T0065's flip and fit) — **done** (2026-10-29, desktop-4070)
- T0153 (M, priority 2, depends_on T0103) — branch three “The pool”: the “Haste” node (25 coins), gated on T0152 — **done** (2026-10-29, desktop)
- T0209 (M, priority 2, depends_on T0103) — branch three, node two: “Momentum” (30 coins), the same gate pattern — **done** (2026-10-29, cachyos-x8664); the draft gate is T0064's line
- T0208 (L, priority 2, depends_on T0103) — branch four “The board”: “One more bend” (30 coins) — a new run's road winds one turn further (the generator's bend target +1; the bend-adjacent worth-more cells come with it); ghost and resumed runs keep their exact board; the row is T0153's look — **done** (2026-10-29, inet-racing)
- T0230 (M, priority 2, depends_on T0208) — branch four, node two: “The long way” (30 coins) — a new run's road is 25% longer (the generator's length target ×1.25, the bend target unchanged); ghost and resumed runs keep their exact board — in the pool; E2's last task
- T0211 (L, priority 2, depends_on T0153) — branch five “The claim”: “Clean ×2” (30 coins) — each clean wave pays 2 coins instead of 1; the one pure coin formula (T0001) carries it to the live tally, the pause worth line and the claim card's recipe — **done** (2026-10-29, desktop)
- T0212 (M, priority 2, depends_on T0153, T0209) — branch three, node three: “Mend” (30 coins), T0209's pattern for T0095's Epic; the draft gate is T0095's line — **done** (2026-10-29, inet-racing)
- T0213 (S, priority 2, depends_on T0103) — the menu's Tech button wears a small yellow dot while any unowned node is in reach — **done** (2026-10-29, yoga)
- T0214 (M, priority 2, depends_on T0103) — the branch discount: the 2nd node of a branch costs 5 less, the 3rd and later 10 less (floor 5); the card shows the struck-through old price — **done** (2026-10-29, cachyos-x8664)
- T0215 (M, priority 2, depends_on T0103) — the run-start's fifth node, a second “Life +1” (40 coins), and a small done mark on a fully-owned branch — **done** (2026-10-29, asus)

Status: the run-start branch (with the fifth node, T0215), the draft branch (T0110), the pool branch (T0153, T0209, T0212) and the claim branch (T0211) are done, as is the menu dot (T0213); the branch discount (T0214) and the board branch's “One more bend” (T0208) are done; the board branch's second node, “The long way” (T0230), is in the pool — E2 closes when it lands.

### E3 — Levels: a run is a journey (not started)
**Goal:** a run has a shape: a few boards in a row, each harder, and a build that grows across them.
**Groundwork (outside the epic):** T0015 (wave preview — done, 2026-10-28, narcissus) becomes the per-level wave preview once levels exist; T0014 (leak warning) teaches what a leak is before levels make leaking costlier; T0019 (fast-forward 2x) keeps runs in flow and pays off once a run spans several levels; the lives danger-pip idea was rejected as T0022 (the stats card has no room — see IDEAS) and is the one to revisit if levels make leaking costlier.
**When done:** a run goes through levels, like the acts of a roguelite: each level is its own board with a set number of waves, ending in a tougher final wave. Clear it and the run moves on to the next level: a new, harder board (a longer or more winding road, tougher enemies) that starts empty. What you carry is your **pool**: the run starts with a small pool of augments that the drafts offer from, and every time you clear a level you pick one new augment to add to it, so each level offers more to combine. The HUD shows the level ("Level 2 · Wave 3/8"), the pick between levels is its own moment, and the game-over screen says how far you got. Clearing the last level wins the run.

### E4 — Augment rarity (active — started 2026-10-28)
**Goal:** the draft is exciting: sometimes a card is something special.
**When done:** every augment card in the draft comes in a rarity: Common, Rare or Epic. A rarer card is the same augment with stronger numbers (a Rare Rapid attacks faster than a Common one), and a few rule-changing augments only ever come as Epic. Rarity shows everywhere the augment does: the card's frame and a small gem row on the draft, hand and tower-panel cards, and on the tower itself (its slot pip). Rarer cards turn up more often the further the run gets; the odds are shown in the draft.
**Breakdown:**
- T0002 (asus, L) — the tiers: the draft roll, card frame + gem row, odds line — **done** (2026-10-28)
- T0004 (asus, L) — Lance — **done** (2026-10-28)
- T0008 (desktop, M) — rarity on the hand and the tower panel — **done** (2026-10-28)
- T0010 (yoga, S) — the tier pip per slot on the tower — **done** (2026-10-28)
- T0011 (asus, M) — the odds shift deeper into the run — **done** (2026-10-28)
- T0012 (asus, L) — Mark: the first rule-changing Epic — **done** (2026-10-28)
- T0020 (asus, L) — Rally: the cluster Epic — **done** (2026-10-28)
- T0021 (desktop, L) — Mint: the economy Epic — **done** (2026-10-28)
- T0023 (asus, L) — Anchor: the root Epic — **done** (2026-10-28)
- T0024 (yoga, S) — the draft reveal flip — **done** (2026-10-28)
- T0025 (asus, L) — Chain: the leap-zap augment (pool, all tiers): first, a zap that strikes the enemy furthest along and leaps to the nearest unstruck enemy; added, +1 leap to any first augment's attack — the first attack that changes target mid-attack — in the pool
- T0026 (yoga, S) — the tier word on the draft card — **done** (2026-10-28)
- T0027 (asus, L) — Push: the first augment that moves enemies along the road — **done** (2026-10-28)
- T0028 (asus, L) — Ember: the first damage over time — **done** (2026-10-28)
- T0029 (asus, L) — Beam: **failed three times**; landed as T0073 — superseded
- T0032 (yoga, S) — the tier chime on the draft reveal — **done** (2026-10-28)
- T0036 (M) — reroll: once per run, three new draft cards for 15 gold — **done** (2026-10-28, desktop)
- T0038 (L) — Ricochet: **rejected** — shots home, there is no line of sight; don't re-propose unless rocks start blocking shots
- T0039 (S) — Mint's gold pop — **done** (2026-10-28, baby-mama)
- T0040 (M) — Lead: **removed by hand the same day** — shots home and never miss; don't re-propose an aimed or predictive shot
- T0041 (S) — the Epic frame shimmer on the reveal — **done** (2026-10-28, yoga)
- T0043 (S) — the beam hum: **landed as T0112** (three attempts were blocked on the Beam missing)
- T0044 (S) — the owned dot on the draft card — **done** (2026-10-28, yoga)
- T0048 (S) — the first draft always offers a Common Bolt — **done** (2026-10-28, baby-mama)
- T0052 (S) — the draft never repeats the previous offer — **done** (2026-10-28, inet-racing)
- T0055 (S) — the working-aura ring under support towers — **done** (2026-10-28, desktop)
- T0058 (S) — the Push wind-up ring — **done** (2026-10-28, yoga)
- T0059 (S) — the burn jumps once to the nearest on death — **done** (2026-10-28, yoga)
- T0062 (M) — Trap (a bomb that springs on the road: the first triggered attack — the spring is the enemy's proximity, not the tower's cadence; added, kills leave a trap at the kill spot): the design stands as written (its one failure was an environment failure before any design); in the pool (todo), claim-order behind Momentum (T0064) so the pool lands one registration at a time
- T0064 (L) — Momentum (the fourth rule-changing Epic, Epic-only: each clean wave makes every tower deal +5% more damage for the rest of the run; added, each extra copy adds +5% more; a low wide yellow disc with a notch per copy) — in the pool (todo); claim-order keeps the shared augment files at one registration at a time
- T0065 (M) — second pick: every 5th draft offers a fourth card — **done** (2026-10-29, asus)
- T0073 (L) — Beam: the first sustained attack (the T0029 re-task) — **done** (2026-10-29, asus)
- T0084 (M) — the "≈ N/s" DPS line in the tower panel — **done** (2026-10-29, cachyos-x8664)
- T0088 (S) — the tier chime plays on the build commit — **done** (2026-10-29, desktop-4070)
- T0089 (L) — Pulse: **dropped** — Splash without the cap plus Reach's added form; fails the content bar, don't re-task it or a variant
- T0093 (L) — Mend: **rejected** on the 56-char tier-line cap; re-filed as T0095
- T0094 (S) — the owned dot counts copies (×N) — **done** (2026-10-29, narcissus)
- T0095 (L) — **Mend: the Epic that buys a life back (the T0093 re-file)**: Epic-only, a support with no attack of its own — every 12 kills this run the run regains 1 life (a pay at the starting lives is held and pays at the next leak); added, −2 kills per extra copy (12, 10, 8, 6, 4 floor) — the only change from the rejected T0093 is the shortened Added line; in the pool (priority 3)
- T0096 (M) — the what-if preview of the held card — **done** (2026-10-29, asus)
- T0099 (M) — the mark shows on the enemy (first telegraph slice) — **done** (2026-10-29, desktop-4070)
- T0100 (S) — the tier word wears its tier's color — **done** (2026-10-29, yoga)
- T0101 (L) — Spray: the pool's aimed spread — **done** (2026-10-29, desktop)
- T0104 (S) — the Sprinter shows its ramp (telegraph slice) — **done** (2026-10-29, baby-mama)
- T0105 (S) — the Splitter's crack widens at half hp (telegraph slice) — **done** (2026-10-29, inet-racing)
- T0112 (S) — the beam hum (the T0043 re-file) — **done** (2026-10-29, asus)
- T0113 (S) — the burn shows on the enemy (telegraph slice) — **done** (2026-10-29, baby-mama)
- T0130 (M, priority 1) — Beam combos I: Bolt adds a ray, Rapid and Rally feed the beam — **done** (2026-10-29, desktop)
- T0131 (M, priority 2) — Beam combos II: Lance pierces, Splash scorches, Spray splits a beam kill — **failed** (2026-10-29, the architect's prompt overflowed cachyos's context before any design) — re-filed tighter: Lance + Splash as T0210; the needle clause (a beam kill splits into Spray needles) parked in IDEAS until T0210 lands
- T0210 (M, priority 2) — Beam combos II (the re-file): Lance pierces the beam's main line, Splash scorches its target — in the pool
- T0132 (M, priority 2) — Beam combos III: the beam carries Ember, Anchor, Push and Mark (Frost only if the 16-cap hasn't removed it) — **done** (2026-10-29, desktop)
- T0133 (M, priority 2) — A new look for the Beam tower: a tower with a circle on top — **done** (2026-10-29, desktop)
- T0134 (L, priority 2) — Spray becomes a shotgun: a cone of pellets — **done** (2026-10-29, inet-racing)
- T0135 (S) — Spray gets its own look, not Beam's — **done** (2026-10-29, yoga)
- T0152 (L, priority 2) — Haste: the Epic that hastens everything it touches (2-cell aura: enemies walk +30% faster, towers attack +30% faster, +15% to both per extra copy, no cap; Epic-only; gated — absent from the draft roll until the tech tree's pool node, T0153, is bought) — in the pool, next registration behind the pool augments
- T0138 (S) — the slow shows on the enemy (telegraph slice) — **done** (2026-10-29, narcissus)
- T0139 (S) — the root shows on the enemy (telegraph slice) — **done** (2026-10-29, yoga)
- T0221 (L, priority 2) — the Augments codex: a menu screen that shows every augment in the pool (icon, name, a purple “Epic” word for the Epic-only ones, the first and added rows) — **done** (2026-10-29, desktop; the menu row it added overflows 1280x720 with Resume + Ghost — T0222's column must take it in)
- T0228 (S, priority 2) — the end card's towers wear their tier: T0010's pip on each by-tower chip — **done** (2026-10-29, asus)
- T0234 (M, priority 2) — Toll: the Epic that pays gold when a leak gets through (the first augment whose income comes from losing) — in the pool
- T0235 (L, priority 2) — Feast: the Epic that feeds on the kill chain (its added form lengthens the chain's window) — in the pool

Progress: the pool's registrations are T0025, T0062, T0064, T0095, T0152, T0234 and T0235 (one at a time, in claim order, under the 16-cap); the beam work is T0130 and T0132 (done) with T0210 (the T0131 re-file) in flight; the telegraph slices are done; T0150 rides behind T0025; the codex (T0221) is done; the by-tower pip (T0228) is done.

**E4 closes when T0025, T0062, T0064, T0095, T0152, T0210 (+ its parked needle follow-up), T0234 and T0235 land** (T0130, T0132, T0133, T0228 done; T0131 failed → T0210; T0150 waits on T0025; T0089 is dropped).

**16-cap (protocol):** the pipeline holds 21 augments (14 in + T0025, T0062, T0064, T0095, T0152, T0234, T0235); the cap is 16. Every queued registration, after registering, removes one more if the pool is over 16 — the first still in the index of **Frost, then Rally, then Mint** — and says which in its result (the canonical statement is in T0064's task).

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
- Splitter (T0068, M) — **done** (2026-10-28, desktop-4070): breaks into two fast splinters at its spot.
- Hauler (T0057, M) — **done** (2026-10-28, cachyos-x8664): a big slow hexagon — worth 10 gold, a leak costs a life plus 5 gold.
- Mute (T0074, M) — **done** (2026-10-29, desktop-4070): silences every tower within 2 cells. Lesson for all future enemies: the warm color family is closed — a new enemy repeats a family color and brings a new silhouette.
- Feeder (IDEAS) — parked (from wave 13); see the queue order below.
- Wall (IDEAS, new cycle 38) — parked at the back of the queue (from wave 16): slows the group it leads.

Queue order: the Bulwark (T0102) and the Ward (T0111) are done, so the front is clear — but the regular-enemy cap is at 10 (the bar in modules/enemies.md), so the next enemy (the Feeder, IDEAS) needs one existing enemy removed or merged in the same or a prior task before it lands; the Wall parks behind it. The queue lands one enemy at a time. (The old panic-removal file also carries id T0102 — the live T0102 is the Bulwark; flagged for the runner.)

## Later

Ideas that may become epics or tasks of one.

- Selling a tower, or taking an augment back out (for part of the gold)
- Targeting modes per tower (first, strongest, closest) — **tasked as T0114 (L, non-epic, in the pool)** — the spec and its parked follow-ups (the plinth notch, the chip's teach line) stand in IDEAS
- More augments with new attacks and changes (the IDEAS backlog holds the list)
- Enemies with new behaviors (one that dashes in bursts, one that shields neighbours, one that splits — the enemy queue holds the live list)
- Bosses every 10 waves, each with its own mechanic — now **E5** (not started; sketched in the epics above; the first boss design is in IDEAS)
- Panic pulse: the in-wave gasp — **built as T0063 (2026-10-28), removed 2026-10-29 (by hand)**
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger
- Run summary: damage per tower, leaks per wave — **first slice built as T0216 (kills by tower on the end card, 2026-10-29, asus)**
- The board shows its corners: a notch on the bend cells — **built as T0140 (S, non-epic, 2026-10-29, narcissus)**
- Every board has a choke: the guaranteed double-cover cell (groundwork under E3's winding roads and E5's boss to hold) — **tasked as T0217 (L, non-epic, in the pool)**
- The quiet tower: a small dim dot on a tower that is idle mid-wave (groundwork for E5's untargetable boss phase) — **tasked as T0233 (S, non-epic, in the pool)**
