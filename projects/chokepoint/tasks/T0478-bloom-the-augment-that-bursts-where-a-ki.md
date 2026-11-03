---
id: T0478
title: "Bloom: the augment that bursts where a kill lands"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T07:13:15Z
claimed_at: 2026-11-03T08:49:44Z
design_attempts: 1
designer: cachyos-x8664
---

## Goal
The draft's queue lands its third augment, Bloom: a shot whose second strike is the kill itself — when it kills, a burst pops at the kill spot and hits the neighbours, so holding a crowd snowballs instead of just surviving it. Its registration keeps the draft at the 16-cap: Bloom retires Rapid (the seventh removal, after Herd's Anchor and Chill's Toll).

## Details
- **First form (asTower):** kind `shot` — shoots the enemy furthest along; when that shot kills, a burst at the kill spot deals damage to the N nearest enemies within 1 cell of it.
  - Common: 10 damage per shot, range 2.6, rate 1.5/s, projectile speed 10; burst: 10 damage to the 2 nearest.
  - Rare: 13 damage, cooldown ×0.85; burst: 15 damage to the 2 nearest.
  - Epic: 17 damage, cooldown ×0.7; burst: 20 damage to the 3 nearest.
- **Added form (asAdded):** every kill this tower caused — its own shots, a beam it held to death, a burn it set (the same kill attribution Mint's "this tower's kills" uses) — pops a burst at the kill spot:
  - Common: +1 enemy, +5 burst damage.
  - Rare: +1 enemy, +10 burst damage.
  - Epic: +2 enemies, +10 burst damage.
  - By attack kind: shot, spray, pulse and beam kills all pop the burst; a burn kill pops it at the burning enemy's death; on a 0-damage tower (a Rally, Haste, Mark, Mint, Toll, Feast, Anchor or Push first) it does nothing — the card says "kills burst" and the tower never kills; that is the read, not a bug.
- **Card lines:**
  - asTower: "Shoots the furthest. When it kills, it bursts: 10 to the 2 nearest within 1 cell." (Rare: 15 to the 2 nearest. Epic: 20 to the 3 nearest.)
  - asAdded: "This tower's kills burst: +1 enemy, +5 damage." (Rare: +1 enemy, +10 damage. Epic: +2 enemies, +10 damage.)
- **Look:** icon hexagon, pink, size 0.22 (a shape-and-color pair no augment has). On the tower the first augment's mark wears it on its barrel (T0469's vocabulary); when a burst pops, one soft ring in Bloom's pink at the kill spot, ~1 cell radius, quick fade (the FxSystem ring, the working-aura's class) — the only board mark the augment adds.
- **The burst goes through the normal damage path:** Mark's +25% applies to it, Spray's added crit can double it, and a kill the burst causes is a normal kill (its gold, the combo chain, Mint's auras and the tower's milestones all apply) — the snowball is the point.
- **The 16-cap:** Rapid leaves the draft's index (codex shows 16 cards, Bloom in, Rapid out); a save holding a Rapid tower loads (the Lead-removal's save path).

## Compared with what exists
| Existing | What it shares | What Bloom does that it can't |
| --- | --- | --- |
| Bolt | first `kind shot`, targets the furthest | Bolt's damage lands on hit, on its own target only; Bloom's second strike lands on kill, at the kill spot, on the neighbours |
| Lance | first `kind shot` | Lance's line pierces on hit; Bloom pops a radius only when its target dies — Lance never hits the crowd around a kill |
| Rapid | first `kind shot` | Rapid trades per-hit damage for hit frequency on every hit; Bloom's burst exists only when the hit kills, and its size grows with copies Rapid's rate swap can't |
| Reach | first `kind shot` | Reach is one heavy shot on its target; Bloom adds a kill-triggered pop on top of a shot heavy or light |
| Splash | a burst around its hits | Splash bursts every hit, on hit, capped at 3; Bloom bursts only on kill, at the kill spot, with a count that grows per copy — on a target that survives, Bloom is a plain shot |
| Mint | "this tower's kills" attribution | Mint turns kills into gold; Bloom turns kills into a damage burst on the survivors |
| Ember | an on-death effect (the burn leap, T0059) | the leap copies one burn to one neighbour on a burning death; Bloom pops a radius on any kill the tower caused, for damage |

## Acceptance criteria
- [ ] The draft can offer Bloom at the pool's tier odds (Common/Rare/Epic), never twice in one offer; the owned dot, the ×N count and the tier chime treat it like every card.
- [ ] A Common Bloom tower shoots the furthest at 10 per shot (range 2.6, 1.5/s); when that shot kills, a pink ring pops at the kill spot and the 2 nearest enemies within 1 cell take 10.
- [ ] The Rare and Epic firsts read 13 (burst 15) and 17 (burst 20 to 3).
- [ ] Bloom added to a damage tower: every kill it causes pops the burst at +1 enemy/+5 (Common), +1/+10 (Rare), +2/+10 (Epic); on a Beam tower the burst pops when the beamed enemy dies; on a pure support tower it does nothing.
- [ ] A burst kill is a normal kill: it pays its gold, extends the combo chain, pays Mint auras and counts for the tower's milestones.
- [ ] Rapid is out of the draft, the hand and the codex; the codex shows 16 cards; a save holding a Rapid tower loads; a full run plays end to end on the new 16.
