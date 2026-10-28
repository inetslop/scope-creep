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

### E1 — Rewards that carry over (active — started 2026-10-28)
**Goal:** a run is never wasted: every run earns something you keep.
**When done:** the game remembers you between runs (a profile saved on the device). Every run ends on a rewards screen: waves held, enemies stopped, clean waves, and coins earned from them, kept in the profile. The menu shows what you have.
**Breakdown (cycle 1):**
- T0001 (asus, L) — the profile + run ledger: device-saved profile, run stats, coin formula, game-over lines, menu best wave — todo
- T0003 (desktop, L) — the rewards scene: a claim moment after game over, with a count-up — todo, after T0001
- T0007 (narcissus, M) — the menu profile card: coins, best wave, runs, last run — todo, after T0001
- T0005 (inet-racing, M) — clean waves: green chip at the exit + green game-over line — todo, after T0001
- T0009 (yoga, S) — coin chime + pop on payout — todo, after T0001

### E2 — Tech tree (not started; needs E1)
**Goal:** a reason to play one more run: spend what runs earn on lasting upgrades.
**When done:** a tech tree screen reached from the menu, a few branches of nodes bought with the currency from E1, each node a lasting change shown on its card: more starting gold, a cheaper second slot, an extra augment pick before wave 1, new augments unlocked into the draft pool, more lives. Bought nodes stay bought.

### E3 — Levels: a run is a journey (not started)
**Goal:** a run has a shape: a few boards in a row, each harder, and a build that grows across them.
**When done:** a run goes through levels, like the acts of a roguelite: each level is its own board with a set number of waves, ending in a tougher final wave. Clear it and the run moves on to the next level: a new, harder board (a longer or more winding road, tougher enemies) that starts empty. What you carry is your **pool**: the run starts with a small pool of augments that the drafts offer from, and every time you clear a level you pick one new augment to add to it, so each level offers more to combine. The HUD shows the level ("Level 2 · Wave 3/8"), the pick between levels is its own moment, and the game-over screen says how far you got. Clearing the last level wins the run.

### E4 — Augment rarity (active — started 2026-10-28)
**Goal:** the draft is exciting: sometimes a card is something special.
**When done:** every augment card in the draft comes in a rarity: Common, Rare or Epic. A rarer card is the same augment with stronger numbers (a Rare Rapid attacks faster than a Common one), and a few rule-changing augments only ever come as Epic. Rarity shows everywhere the augment does: the card's frame and a small gem row on the draft, hand and tower-panel cards, and on the tower itself (its slot pip). Rarer cards turn up more often the further the run gets; the odds are shown in the draft.
**Breakdown (cycle 1):**
- T0002 (asus, L) — the tiers: Common/Rare/Epic numbers for the five augments, the 70/25/5 draft roll, card frame + gem row, odds line — todo
- T0008 (narcissus, M) — rarity on hand cards and the tower panel — todo, after T0002
- T010 (yoga, S) — tier pip per slot on the tower — todo, after T0002
- Later: the odds shift as the run progresses (rarer cards more often the further in); the rule-changing augments that only ever come as Epic.

## Later

Ideas that may become epics or tasks of one.

- Selling a tower, or taking an augment back out (for part of the gold)
- Targeting modes per tower (first, strongest, closest)
- More augments with new attacks and changes (e.g. a piercing line, a chain that jumps between enemies, a mark that makes enemies take more damage)
- Enemies with new behaviors (e.g. one that speeds up when hit, one that shields neighbours, one that splits)
- Wave preview: what the next wave sends, shown during the build phase
- Bosses every 10 waves, each with its own mechanic
- Board modifiers: two entrances, a path that forks, cells that boost a tower placed on them
- Rare augments that change rules, not numbers (e.g. towers next to each other share their slows)
- Music that follows the wave and the danger
- Run summary: damage per tower, leaks per wave
