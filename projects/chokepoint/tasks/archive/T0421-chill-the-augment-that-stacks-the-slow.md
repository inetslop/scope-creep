---
id: T0421
title: "Chill: the augment that stacks the slow"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-11-02T11:43:00Z
claimed_at: 2026-11-02T12:03:47Z
finished_at: 2026-11-02T12:09:05Z
design_attempts: 1
---

## Goal
The pool has had no slow since Frost retired: Chill brings the slow back as a stack that builds on every hit and outlasts it — a tower whose value is the target's pace, not its damage. Its registration retires Toll (the 16-cap's sixth removal).

## Details
- New pool augment `chill`, opening-eligible (can be offered in the first draft), all tiers (Common/Rare/Epic).
- **Card lines** (exact, each tier states its own numbers):
  - asTower (Common): "A chill shot at the furthest enemy: 4 damage, 1 chill per hit — the hit enemy slows 10% per stack, up to 5 stacks (50%), clearing 2 s after the last chill hit."
  - asTower (Rare): same with "5 damage, 2 chill per hit."
  - asTower (Epic): same with "7 damage, 3 chill per hit."
  - asAdded (Common): "Its hits apply 1 chill: the struck enemy slows 10% per stack, up to 5 stacks (50%), clearing 2 s after the last chill hit."
  - asAdded (Rare): same with "Its hits apply 2 chill."
  - asAdded (Epic): same with "Its hits apply 3 chill."
- **First form:** kind `shot` — a blue droplet shot at the furthest enemy in range: 4 damage (5 Rare, 7 Epic), every 1.25 s (Rare every 1.06 s, Epic every 0.875 s), range 3.2, projectileSpeed 8, applying its tier's stacks (1/2/3) on hit.
- **The chill rule** (new pure core): an enemy holds up to 5 chill stacks; each stack is −10% of its speed; a chill hit adds stacks (more than 5 is wasted); every chill hit resets a 2 s clock; when the clock runs out the stacks clear at once and the enemy's speed returns fully. Stacks from different chill sources sum on the same enemy.
- **Added form:** the tower's damaging hits apply stacks (Mark's "hits apply" rule, tier of the Chill card): a shot per shot (a Lance line applies to every enemy it strikes), each spray pellet, each beam tick held (a held target rides at the 5-stack cap while held), each burn tick, each enemy a pulse blast strikes. On a tower with no damaging hits (Mark, Mint, Toll, Feast, Rally, Haste, a 0-damage Push or Anchor pulse) Chill does nothing — say so in the card's wording.
- The slow applies to the Flyer's flight speed; the Ward ignores it (the control path — the Ward's immunity ring plays when stacks are refused, the push/root's own moment).
- **Look:** a blue droplet (a new `droplet` shape: a circle with a short rounded tail, icon size 0.22) as the icon and as the tower's barrel, one blue tick per copy on the plinth; the what-if ghost shows a small blue droplet marker on the tower's next free slot. No mark on the chilled enemy (status chips over enemies are out — the slow is read in the pace).
- **16-cap:** after Chill registers, if the pool is over 16, remove **Toll** from the index (the sixth removal; order-independent with the other five — none of them names Toll). After all six land the index is: Beam, Bolt, Chill, Ember, Haste, Lance, Mend, Momentum, Push, Rapid, Reach, Splash, Spray, Trap, Feast, Herd.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | `kind shot`, shot at the furthest | Bolt's shots deal damage only (and add shots); a chill shot's value is the lingering slow it applies on hit, which no shot augment has |
| Lance | `kind shot` | Lance's value is the piercing line; chill applies a slow that outlasts the hits and that rides on every attack kind, not only its own line |
| Rapid | `kind shot` | Rapid changes the tower (its rate, its hits' weight); chill changes the struck enemy (its speed) — and it feeds Rapid: the faster the hits, the faster the stacks build |
| Reach | `kind shot` | Reach changes the tower's range; chill changes the enemy's speed per hit |
| Push | per-hit control on the tower's hits | a push is a one-shot displacement back along the road (fatigued, and it needs a road); a chill is a lingering slow that stacks across hits and sources and decays 2 s after the last — cumulative over time — and it slows the flyer's flight, where a road push has nothing to push along |
| Anchor | control on the enemy | a root is a flat full-stop around the tower (no hits, no targeting, fatigued, with root immunity after); a chill is a partial slow applied per hit to a targeted enemy, stacking to 50%, with no full stop and no fatigue |
| Haste | the enemy's speed | Haste is a passive aura that speeds enemies in 2 cells (and towers) — no hits, no targeting; a chill is applied per hit to a targeted enemy at range, and slows instead of speeds |

## Acceptance criteria
- [ ] The draft offers Chill in all tiers, opening-eligible; the card shows its tier's line with its own numbers; the codex lists it with the blue droplet icon; after registration the pool's index is 16 augments with Toll out.
- [ ] A Chill-first tower fires the blue droplet at the furthest enemy in 3.2 cells: 4/5/7 damage (Common/Rare/Epic), every 1.25/1.06/0.875 s.
- [ ] A chilled enemy walks 10% slower per stack, up to 5 stacks (50%); 2 s after its last chill hit the stacks clear and its speed returns fully.
- [ ] Any damage tower with Chill added applies stacks on each damaging hit — a shot (a Lance line applies to every enemy it strikes), a pellet, a held beam tick, a burn tick, a pulse blast; a Chill on Mark, Mint, Toll, Feast, Rally, Haste or a 0-damage Push/Anchor does nothing.
- [ ] Chill stacks do not take on the Ward (its immunity ring plays); a chill slow works on the Flyer's flight.
- [ ] A Chill tower wears the blue droplet barrel and one blue tick per copy; the what-if ghost shows the blue droplet marker on the next free slot; no mark appears over the chilled enemy.
- [ ] Unit tests cover the stack apply/cap/fade math, per-tier stacks-per-hit, per-kind application, the Ward ignore and the pool removal.

## Rejected by architect (desktop)

The exact card lines (~161/123 chars) exceed the 70/56-char card limits enforced by tests/content.test.ts and overflow the three-card draft at 412x915; re-issue with shorter per-tier lines within the card budget.
