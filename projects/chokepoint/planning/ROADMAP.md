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

### E1 — Rewards that carry over (active — started 2026-10-28, 10 of 14 done)
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
- T0018 (M, cycle 3) — the menu remembers your last four runs (a "Recent" line under the profile card) — **done** (2026-10-28, desktop)
- T0019 (M, cycle 4) — fast-forward: a 2x speed button for the wave phase — in queue, waits on T0015 (wave preview, in flight)
- T0030 (yoga, S, cycle 10) — the pause screen's run-so-far line: wave, lives, gold and the run's coins on one line above the key list — in queue, waits on T0019
- T0033 (yoga, S, cycle 14) — a "Clean N" line on the rewards card: green when N > 0, counting up with the other lines, mirroring the game-over card's line (T0005) — **done** (2026-10-28, yoga)
- T0035 (S, cycle 16) — the pause screen's sound row: a "Sound" row with a speaker glyph and an On/Off state at the bottom of the pause card, silencing everything when off, kept in the profile (default on) — in queue, ready now
- T0037 (S, cycle 18) — the Recent line's best-run star: each of the menu's last-four run entries that reached your best wave gets the same small yellow star the profile card shows (T0016), so the trend line shows which run set the record — in flight (yoga)

Progress: the profile, the menu card (with its recent-runs line, T0018), the live coin tally (and its pop), the best-run star, the rewards scene, the clean-wave chip (T0005) and the coin chime (T0009) are in — a run now ends on a claim card that counts up waves held, stopped and, when any, a green "Clean N" line (T0033) with a two-note chime, a perfectly held wave pops a green "Clean" chip at the exit and turns the game-over line green, the tally pops as it grows, and the menu lists your last four runs. In the queue: the pause screen's sound row (T0035, ready for a small machine), fast-forward (T0019, one hop behind the wave preview T0015, in flight), the pause screen's run-so-far line (T0030, two hops behind fast-forward) and the Recent line's best-run star (T0037, a small star on the trend line, in flight on yoga). E1 closes when T0019, T0030, T0035 and T0037 land.

### E2 — Tech tree (not started; needs E1)
**Goal:** a reason to play one more run: spend what runs earn on lasting upgrades.
**When done:** a tech tree screen reached from the menu, a few branches of nodes bought with the currency from E1, each node a lasting change shown on its card: more starting gold, a cheaper second slot, an extra augment pick before wave 1, new augments unlocked into the draft pool, more lives. Bought nodes stay bought.

### E3 — Levels: a run is a journey (not started)
**Goal:** a run has a shape: a few boards in a row, each harder, and a build that grows across them.
**Groundwork (outside the epic):** T0015 (wave preview, in flight) becomes the per-level wave preview once levels exist; T0014 (leak warning) teaches what a leak is before levels make leaking costlier; T0019 (fast-forward 2x) keeps runs in flow and pays off once a run spans several levels; the lives danger-pip idea was rejected as T0022 (the stats card has no room — see IDEAS) and is the one to revisit if levels make leaking costlier.
**When done:** a run goes through levels, like the acts of a roguelite: each level is its own board with a set number of waves, ending in a tougher final wave. Clear it and the run moves on to the next level: a new, harder board (a longer or more winding road, tougher enemies) that starts empty. What you carry is your **pool**: the run starts with a small pool of augments that the drafts offer from, and every time you clear a level you pick one new augment to add to it, so each level offers more to combine. The HUD shows the level ("Level 2 · Wave 3/8"), the pick between levels is its own moment, and the game-over screen says how far you got. Clearing the last level wins the run.

### E4 — Augment rarity (active — started 2026-10-28, 10 of 19 done)
**Goal:** the draft is exciting: sometimes a card is something special.
**When done:** every augment card in the draft comes in a rarity: Common, Rare or Epic. A rarer card is the same augment with stronger numbers (a Rare Rapid attacks faster than a Common one), and a few rule-changing augments only ever come as Epic. Rarity shows everywhere the augment does: the card's frame and a small gem row on the draft, hand and tower-panel cards, and on the tower itself (its slot pip). Rarer cards turn up more often the further the run gets; the odds are shown in the draft.
**Breakdown:**
- T0002 (asus, L) — the tiers: Common/Rare/Epic numbers for the five augments, the 70/25/5 draft roll, card frame + gem row, odds line — **done** (2026-10-28)
- T0008 (desktop, M) — rarity on the hand and the tower panel: a shared tier card look (frame, gems, tier word), a tier frame plus gem row on hand cards, one row-card per augment in the tower panel — **done** (2026-10-28)
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
- T0036 (M, cycle 16) — reroll: once per run, three new draft cards for 15 gold — a bright "Reroll · 15" button under the cards, dimmed "Reroll · used" after the one use, red price while gold is short — **done** (2026-10-28, desktop)
- T0038 (L, cycle 19) — Ricochet: a pool bouncing augment (all tiers, offered from the opening draft): first, a mid-tempo shot (7/9/12 damage every 0.8/0.7/0.6 s, range 4.5) that deflects off the first rock in its way and strikes the first enemy it touches behind it — the first augment that uses the board's shape in combat; added, shots bounce off one more rock per Ricochet — in queue, waits on Lance (T0004)
- T0039 (S, cycle 20) — Mint's gold pop: when a kill pays a Mint's +1 extra gold, a small gold "+1" pops at the kill spot ~100 ms after the normal kill gold, one per bonus — the aura's income visible where it happens — in queue, waits on Mint (T0021), Ember (T0028) and the combo milestone (T0034) so it never builds on an in-flight edit to the kill flow
- T0040 (M, cycle 20) — Lead: a pool predictive augment (all tiers, offered from the opening draft): first, a heavy shot (16/20/24 damage every 1.2/1.05/0.9 s, range 4.5) that aims where the enemy will be when the shot arrives (lead = travel time × current speed, capped at 1.2 cells ahead — no whiff at a still enemy); added, each extra Lead raises the cap +0.6 cells, leading any first augment's aimed shots — the first predictive attack, the counter to Sprinters — ready now

Progress: the tiers (T0002), the odds shift (T0011), the tower pips (T0010), Mark (T0012, the first rule-changer), Rally (T0020, the first tower-to-tower interaction), the card flip (T0024), the tier word (T0026) and the hand/panel rarity (T0008, desktop) are done — rarity now shows everywhere an augment does: the draft's frame and gem row, the hand cards, the tower panel's row-cards, and the slot pips on the towers. The new-augment backlog is deep: Lance (T0004) in flight on asus; behind it, in queue, Mint (T0021, the economy rule: kills near a Mint tower pay +1 gold), Anchor (T0023, a pool rooting augment: a timed full stop, the behavior gap Frost's partial slow leaves), Chain (T0025, a pool leap-zap: the first attack that changes target mid-attack), Push (T0027, the first augment that moves enemies along the road) and Ember (T0028, a pool burn: the first damage over time in the game); Beam (T0029, a pool beam: a continuous line and the first sustained second target) is asus's own and waits on Lance; Ricochet (T0038, a pool shot that bounces off the board's rocks — the first augment that uses the board's shape in combat) is the newest in the queue and waits on Lance too. asus and desktop both take L, so expect at most two new-augment edits in flight at once; the rest build in queue order. Rarity also has an ear: the tier chime (T0032, yoga) has landed — each offered card now lands face-up with a short rising chime, one note Common, two a third higher Rare, three the highest Epic, so the tier is heard as well as seen. The draft also got a reroll (T0036, desktop, this cycle): once per run, three new cards for 15 gold, so a bad roll is a decision, not a fate. This cycle the queue gained the first predictive attack: Lead (T0040, M — a heavy shot that lands where the enemy will be, lead capped at 1.2 cells, +0.6 per extra copy, aimed shots only — the counter to Sprinters, and the first added form that changes where an attack aims), and a small follow-up: Mint's gold pop (T0039, S — the aura's +1 pops at the kill spot once Mint, Ember and the combo milestone have all landed, so it never builds on an in-flight edit to the kill flow).

## Later

Ideas that may become epics or tasks of one.

- Selling a tower, or taking an augment back out (for part of the gold)
- Targeting modes per tower (first, strongest, closest)
- More augments with new attacks and changes (a shot that bounces off the board's rocks — T0038, a gust that pushes enemies back — T0027, a root that stops the road — T0023; the IDEAS backlog holds the list)
- Enemies with new behaviors (e.g. one that speeds up when hit — built as T0006 (desktop); one that dashes in bursts, one that shields neighbours, one that splits)
- Wave preview: what the next wave sends, shown during the build phase — T0015 (in flight)
- Bosses every 10 waves, each with its own mechanic
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger
- Run summary: damage per tower, leaks per wave
