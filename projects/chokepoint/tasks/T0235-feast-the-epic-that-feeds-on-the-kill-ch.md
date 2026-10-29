---
id: T0235
title: "Feast: the Epic that feeds on the kill chain"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T22:31:19Z
epic: E4
---

## Goal
A new Epic-only augment with a new source of power: the kill chain itself. Quick kills sharpen every tower for as long as the chain lives, and the chain's clock can be bought longer.

## Details
- **Rolls only as an Epic card**, the same Epic-only roll as Mark, Rally, Mint and Anchor (T0012, T0020, T0021, T0023): Epic frame, gem row, "· Epic" name line, tier chime; **not offered in the pre-wave-1 draft** (no opening, like Mint); **no tech gate**; the codex (T0221), the what-if preview (T0096, ghosts the tick like the other supports), the panel's DPS line (T0084, reads 0 like the other supports) and the end card's by-tower chip (T0216, "kills 0") cover it with no change of their own.
- **Card lines** (both forms, exact):
  - First: "Kills chain: every tower +4% damage per chain level."
  - Added: "Each extra Feast: the combo window +0.4 s."
- **First form (a support with no attack of its own, like Momentum):** while at least one Feast tower stands on the board **and** the run's kill chain (the ×N counter, T0031) is alive, every damage a tower deals — shots, Lance pierce, Spray pellets, Beam per-second, Ember ticks, Trap springs — is multiplied by **(1 + 0.04 × the chain's current level)**: ×2 → +8%, ×5 → +20%, ×10 → +40%. The bonus is live per hit: it applies to each damage event while the chain is alive and is off (×1) the moment the chain breaks (window expiry, or a leak per T0207). The chain's count, its gold milestones (T0066) and its milestone yellow (T0034) are unchanged; the damage path reads the live chain level the way Momentum's bonus is read (T0064).
- **Added form (new: it lengthens a system's timing instead of adding damage, which no added form does):** each Feast copy on the board **beyond the first** lengthens the kill chain's window by **+0.4 s**, additive, no cap — one Feast copy: the base 1.5 s; two copies: 1.9 s; three: 2.3 s. Everything that reads the window uses the effective one: the ×N counter itself, the drain bar under it (T0220, which must drain over 1.5 s today), and nothing else changes (the bar still refills on each kill, and the 2× fast-forward still scales it with the sim, T0019).
- **Look:** a Feast-first tower is a **low open ring (a plate — a stroke, no fill) at the tower's base in yellow**, one short tick per copy on the ring. It must read as a ring, not as Momentum's filled yellow disc (T0064) — different shape, same color family is acceptable because the shapes differ. The ring is **lit (full opacity) while the kill chain is alive and dim (half opacity) while it is broken**, so the buff's state is visible on the tower where it is spent; the slot pip is Epic purple as usual (T0010).
- **Closest existing augment: Momentum** (a passive Epic whose power comes from how the run went). New: Momentum's bonus is granted per clean wave and never comes back; Feast's is live per hit while the kill chain is alive — momentary, per-hit, off the instant the chain breaks — and its added form lengthens the chain's window instead of growing a bonus.
- **16-cap (the augments module):** the pool caps at 16 augments — after registering, if the pool has more than 16, also remove the first of **Frost, then Rally, then Mint** that is still in the AUGMENTS index (a mechanical deletion, T0192's pattern; the full protocol is in T0064's task) and say which in the result.

## Compared with what exists

| Existing | What it shares | What Feast does that it can't (not numbers) |
| --- | --- | --- |
| Momentum | 0-damage Epic support; a damage bonus that comes from how the run went | Momentum's bonus is granted per clean wave and is permanent; Feast's is live per hit while the kill chain is alive, off the moment it breaks, and its added form lengthens the chain's window instead of growing a bonus |
| Rapid | an added form that changes a tower's combat stat | Rapid changes the host tower's own attack rate (a stat of its attack); Feast changes every tower's damage from a run state no tower controls |
| Mark | damage amplification | Mark adds a flat % to one marked enemy (per enemy, applied by a hit); Feast adds a % to every enemy from the chain state — no target, no mark |
| Mint | `kind pulse` first form, 0 damage | Mint's pulse is a per-kill gold radius around itself; Feast reads the kill chain — no enemy, no radius, no gold |
| Splash | `kind pulse` first form | Splash's pulse damages around the tower; Feast's "pulse" does nothing to any enemy |
| Frost | `kind pulse` first form | Frost's pulse slows enemies on the road; Feast never slows an enemy |
| Push | `kind pulse` first form | Push's pulse pushes enemies back along the road; Feast never moves an enemy |
| Anchor | `kind pulse` first form | Anchor's pulse roots enemies; Feast never stops an enemy |

## Acceptance criteria
- [ ] The draft offers Feast only as an Epic card (Epic frame, gem row, "· Epic" name line, tier chime), never in the pre-wave-1 draft; the codex lists it with both lines.
- [ ] With a Feast tower on the board, while the ×N counter is alive at ×2, every tower deals 1.08× its undamaged-against value (same tower, target and tier as without the chain); at ×10 it deals 1.40×; the moment the counter breaks (window expiry or a leak), damage is back to ×1.
- [ ] With no Feast tower on the board, the chain changes nothing about damage — byte-identical to today.
- [ ] Two Feast copies on the board: the chain window is 1.9 s (the ×N counter lives 1.9 s after each kill and the drain bar, T0220, drains over 1.9 s); three copies: 2.3 s; one copy: 1.5 s, as today.
- [ ] Combo gold (T0066) and the milestone yellow (T0034) still key on the chain level and are unchanged; a leak still breaks the chain (T0207) and the 2× fast-forward (T0019) still scales the window with the sim.
- [ ] A Feast-first tower is the yellow open ring (a plate, not a disc) with one tick per copy, lit while the chain is alive and dim while it is broken; the Epic purple pip is as usual; works at 412x915 and 1280x720.
