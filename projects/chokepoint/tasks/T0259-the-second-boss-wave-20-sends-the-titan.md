---
id: T0259
title: "The second boss: wave 20 sends the Titan and its Guard, and the Guard carries the shield"
size: L
priority: 2
status: designing
depends_on: [T0253, T0256, T0258]
attempts: 0
created: 2026-10-30T05:08:57Z
claimed_at: 2026-10-30T05:09:00Z
epic: E5
designer: desktop
---

## Goal
The run's second peak swaps the mechanic (E5: "later bosses swap the mechanic"): wave 20 sends the Titan with its Guard, and the Titan's damage resistance is carried by another living enemy — so the wave's decision is where the fire goes, not just how much of it.

## Details
**The enemies** (two new content files, like the others in src/content/enemies/; both spawnOnly in the Colossus's sense — never in a normal mix, the regular 10-cap untouched):

- **The Titan** (the wave's boss):
  - Description: "A bigger wall of Block: while its Guard lives, every hit on it is halved."
  - Behavior walk, steady on the road. No timed phase — T0253's outOfReach is the Colossus's mechanic; the Titan swaps it for the shield.
  - Numbers: hp 720 (the Colossus's 6× Block, wave-scaled like everything — at wave 20 the scaling makes it the run's biggest shape by far), speed 0.9 (Block's), gold 20 (the boss bounty, the Colossus's), livesCost 1, threat 95, fromWave 20, size 0.5.
  - Look: a red square at 0.5 — the Colossus's wall in the family's other color. No new marks; the mechanic lives on the Guard.
  - The shield: while a Guard is alive on the board, every damage the Titan takes is halved — the Bulwark plate's 0.5, but from every direction and every source (a Bolt shot, a Splash burst, a Lance pierce, a Chain leap, a Beam's per-second rate, an Ember tick), with the 0.5 landing after every other damage modifier. It is a damage rule, not a target rule: the Titan is always an ordinary target and fully controllable (slow, root and push all apply).
- **The Guard** (the Titan's escort):
  - Description: "Carries the Titan's shield: kill it to make the Titan take full damage."
  - Behavior walk. Numbers: hp 60, speed 0.9 (the Titan's, so the two hold their gap), gold 8, livesCost 1, threat 5, fromWave 20, size 0.2.
  - Look: a red diamond at 0.2 carrying one flat orange disc on its road-facing front — the shield is visible on the enemy that carries it (the Hauler's coin language, T0098); when the Guard dies, the disc dies with it.

**The wave rule (core/waves.ts):** wave 20's plan is exactly the Guard and the Titan — the Guard at 0 s, the Titan 1.2 s behind, walking about one cell closer to the exit with the shield in front of the boss. The wave-20 plan declares which of its spawns is the boss (the Titan) the way T0258's death hook and T0256's card read it: if T0256's card picks the boss as "the plan's single spawn", that rule becomes "the plan's declared boss spawn" as part of this task. Waves 10, 30, 40 and every later multiple of 10 keep sending the Colossus (T0253's rule) until a later boss reassigns them. The preview (T0257's chip, if it has landed) shows the two tokens and the "boss" tag straight from the plan with no change to that file.

**Everything else is automatic:** the name tags say "Titan" and "Guard" on their first spawn in a run (T0085); a Guard leak is an ordinary 1-life leak (the warning, the jolt scaled to its size, the combo break, the Toll pay) and leaves the Titan shielded; a Titan leak is an ordinary 1-life leak; kills are ordinary kills (20 / 8 gold, chips, the combo, the Mint, the by-tower count); a boss wave held clean counts clean; the save writes at the start of the wave, before spawns, so a mid-fight Titan is never in a save; the enemies reference (T0252) lists both with no change to that screen.

**What it punishes:** the spread-the-damage habit — while the Guard lives, every point of damage the board deals is worth half against the boss. **What counters it:** concentrated fire on the small shape (a Reach's heavy shots, a Bolt stack, a Chain's leap) and then the full-damage Titan — or the area build that chews the Guard down while a Splash and a Lance line clean the Titan.

## Compared with what exists — the Titan
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk` | the steady basic walker; no mechanic at all |
| Dart | `walk` | speed and fragility only; always full-damage |
| Block | `walk`, slow and heavy, the square | soaks damage on its own; always full-damage |
| Sprinter | `walk` | gets faster when hit; no resistance |
| Splitter | `walk` | its threat is the pieces it leaves; no resistance |
| Hauler | `walk`, big and slow | a bigger bank of gold on the road; no resistance |
| Mute | `walk` | silences the towers around it — a debuff on the run, not its own survival |
| Ward | `walk`, "do not touch it" | ignores control for its whole life — a defense against aim, not against damage |
| Bulwark | `walk`, the tough front | halves shots into its face — its own plate, one direction |
| Splinter | `walk` | a fast fragment; no mechanic of its own |
| Colossus | `walk`, the boss shape | goes out of reach in timed beats — its own survival, on a clock; the Titan is always targetable and fully controllable, and its half-damage is carried by another living enemy until that enemy is killed |

## Compared with what exists — the Guard
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk`, the small shape | walks alone; its death is its own |
| Dart | `walk`, the small shape | speed and fragility only; no mechanic |
| Block | `walk`, the square family | soaks damage; no one else benefits from its life |
| Sprinter | `walk` | ramps when hit; no one else benefits from its life |
| Splitter | `walk` | splits into its own pieces on death — never a shield for anyone |
| Hauler | `walk`, the gold on the road | carries a fortune for the killer; never for another enemy |
| Mute | `walk` | spends its life silencing towers; the Guard spends its life arming the Titan's defense |
| Ward | `walk` | ignores control — a self-defense; the Guard's body is someone else's defense |
| Bulwark | `walk`, the plate language | the plate is its own and works only against shots into the face; the Guard carries a separate shield for another enemy, from every direction |
| Splinter | `walk`, the small fast piece | a fragment with no role; the Guard's whole role is the Titan's |
| Colossus | `walk`, the boss wave's shape | is the boss itself; the Guard is the escort that walks ahead of it and carries its damage resistance |

## Acceptance criteria
- [ ] The wave-20 build-phase preview shows exactly two tokens — the Guard's and the Titan's — and nothing else; the wave sends the Guard at 0 s and the Titan about one cell behind it.
- [ ] The Titan is a red square (size 0.5) walking at 0.9 with wave-20 scaled hp; the Guard is a red diamond at 0.2 with one flat orange disc on its road-facing front.
- [ ] While the Guard is alive, every source of damage to the Titan lands at half (a Bolt shot, a Splash burst, a Lance pierce, a Chain leap, a Beam's rate, an Ember tick); the Titan stays an ordinary target and fully controllable the whole time.
- [ ] The moment the Guard dies (any source), the Titan takes full damage from every source; the disc is gone.
- [ ] A Guard leak costs exactly 1 life (the ordinary leak: warning, size-scaled jolt, combo break, Toll pay) and leaves the Titan shielded; a Titan leak costs exactly 1 life.
- [ ] Kills pay 20 (Titan) and 8 (Guard) with the ordinary kill (chips, combo, Mint, by-tower count); a boss wave held clean counts clean; the boss card (T0256) shows the Titan — no notch on the bar, the fill in the Titan's own red — and the boss death moment (T0258) fires on the Titan.
- [ ] The first Titan and the first Guard spawn in a run each pop their name tag; the enemies reference lists both.
- [ ] Every wave except 20 is byte-identical to today (wave 10 and every later multiple of 10 still sends the Colossus); the Titan and the Guard never appear in a normal mix.
