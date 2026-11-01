---
id: T0361
title: "Herd: the augment that grows with the crowd"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T13:25:34Z
claimed_at: 2026-11-01T13:49:55Z
design_attempts: 1
designer: desktop
---

## Goal
A new support augment — Herd, Rare or Epic — whose buff grows with the number of enemies inside its 2-cell ring: the first augment that scales with how crowded the board is. A cluster built around a Herd tower hits harder on exactly the waves that pack the road (tight, rush, a boss's escort) and eases off when the wave thins. Its registration retires Anchor to keep the draft at 16.

## Card lines
Herd is `minTier: rare` (Rare or Epic, never Common) and not `opening` (never in the first draft).
- asTower (Rare): "Towers within 2 cells deal +5% damage per enemy within 2 cells, up to 5. Does not attack itself."
- asTower (Epic): "Towers within 2 cells deal +8% damage per enemy within 2 cells, up to 5. Does not attack itself."
- asAdded (Rare): "This tower deals +5% damage per enemy within 2 cells, up to 5. Each extra Herd +5% per enemy."
- asAdded (Epic): "This tower deals +8% damage per enemy within 2 cells, up to 5. Each extra Herd +8% per enemy."

## Details
- **The feed (every copy, host-local, live per frame like Haste):** every Herd copy in a tower T makes T's own damage × (1 + per-enemy amount × min(enemies in T's 2-cell ring, 5)), per-enemy amount the copy's own tier (Rare 5%, Epic 8%), one per copy (two copies on T → +10%/+16% per enemy). Ring reach is the 2-cell circle, center inside the ring (the Rally/Mint reach, T0050's fix). With no enemy in the ring the feed is 0: the tower hits at its plain damage.
- **The aura (first form only):** when Herd is the tower's first augment, the same feed applies to every other tower in the Herd tower's ring, with the crowd read from the Herd tower's ring (per-enemy amount the Herd tower's first Herd's tier). The Herd tower's own feed is a no-op for it (it never attacks — the Haste pattern: a support whose own included buff has nothing to buff).
- **Stacking and growth:** a tower's own Herd copies and the auras around it add (each read caps at 5 independently). Reach on any tower with a Herd copy grows its ring the way it grows a Rally's (T0103). As with a Rally stacked on a Rally, a second Herd in a Herd tower's free slot does nothing (the feed has no damage to feed) — the copy belongs in an attack tower.
- **What the feed applies to:** the fed tower's own attack damage — shots (Bolt, Lance, Rapid, Reach), Spray's pellets (a crit's double applies to the buffed base), Splash's blast, Beam's per-second, and the fed tower's own Ember burn ticks (a burn is that tower's damage, as on the DPS line, T0084). Not buffed: 0-damage supports (Frost, Push, Anchor, Mint, Toll, Mark, Rally, Haste, Herd — a percent of 0; the stated acceptable no-op, the what-if's marker still shows what the card would do on an attack tower), and kill-spawned secondaries (a jumped burn T0059, beam-kill needles T0242, traps T0062). Stacks with Mark's mark (the mark multiplies the buffed damage — it "takes more damage from everything").
- **Look:** icon a green hexagon, size 0.22 — a shape-and-color pair no other augment uses. On the tower: no barrel (a support, like Rally and Mint); a thin green ring at the plinth with five tick marks around it, one tick lit green per enemy in the ring (cap 5), a tick clearing the instant its enemy leaves, and the ring's quiet working-aura shimmer in its own green (T0055's ring, T0354's live pattern: on while at least one tick is lit, gone when the ring is empty). The what-if (T0096) shows a compact marker for a held Herd following the existing per-augment marker vocabulary.
- **Registration and the 16 cap:** the draft index caps at 16 (the E4 protocol). When Herd registers, if the index is over 16, remove **Anchor** — the fifth removal, after E4's four (Frost, Rally, Mint, Mark, canonical in T0064); order-independent, since none of the four names Anchor. Anchor's removal: the draft no longer offers it, the codex (T0221) drops its card (its render reads the index — no new UI), and a tower that already holds an Anchor keeps it and works exactly as before (pulse and hits-root). The first-draft floor (T0048), the tier odds (T0011) and the no-repeat rule (T0052) are unchanged: Herd offers when the roll lands Rare or Epic with the normal index share.
- **No new key, button or HUD element;** the pause's controls list is untouched. The panel's existing lines carry it (the card lines state both forms; the ticks on the tower show the live count — no new readout, nothing shown twice).
- The work lives in new files: the augment's content file (beside `src/content/augments/`) and the aura's system (a new systems file beside `RallySystem`/`HasteSystem` for the live per-frame reads); registrations, the tower look and the what-if marker follow the existing augment pattern.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Rally | `kind rally`: a support that buffs towers within 2 cells | Rally's +10% attack speed is flat: it does not change while the wave passes. Herd's damage bonus rises and falls with the enemies in the ring — the same cluster is a different tower on a tight wave than on a quiet one |
| Haste | `kind rally`: a support that buffs towers within 2 cells (and the enemies) | Haste's buff is flat per copy and acts on speed; Herd's is driven by the crowd and acts on damage |
| Momentum | named similar: a damage buff for towers | Momentum's +5% is run-wide, permanent and driven by clean waves; Herd's is local (its ring), live (with the crowd) and only for the towers in and around it |
| Mark | named similar: amplifies damage | Mark marks one enemy (the furthest) to take +25% from all towers; Herd buffs the fed towers' own output and scales with how many enemies are in the ring — no mark, no single target |

## Acceptance criteria
- [ ] The draft offers Herd as a Rare or Epic card, never Common, and never in the first draft; the card, hand, tower panel and codex show its green hexagon and its tier's card lines.
- [ ] A Herd tower shows the five-tick green ring at its plinth: one tick lights per enemy inside its 2-cell ring, clears the instant its enemy leaves, and the working-aura shimmer (T0055/T0354) is on while at least one tick is lit and off when the ring is empty.
- [ ] A tower inside a Herd ring deals its plain damage × (1 + per-enemy amount × min(enemies in the Herd ring, 5)); with no enemy in the ring it deals its plain damage; a tower's own Herd copies and the auras around it add.
- [ ] A Herd copy in a later slot of an attack tower feeds that tower on the crowd around itself; on a 0-damage support tower an added Herd changes nothing (the stated no-op).
- [ ] The feed multiplies the fed tower's own damage: shots, pellets (crits double the buffed base), blasts, beam per-second and its own burn ticks; 0-damage supports, a jumped burn, beam-kill needles and traps are not buffed; a marked enemy takes the mark on top of the buff; Reach on a Herd-fed tower grows its ring.
- [ ] On registration, if the index is over 16, Anchor is removed from the draft index and the codex; a tower that already has an Anchor keeps it and works as before; the four E4 removals (Frost, Rally, Mint, Mark) are untouched.
- [ ] The game is playable menu to game over with a Herd card in the draft, on desktop and mobile.
