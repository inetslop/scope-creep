---
id: T0253
title: "The Colossus: wave 10 sends one big shape that goes out of reach at half health"
size: L
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-30T04:09:41Z
epic: E5
---

## Goal
The deep run gets a peak: every 10th wave the road sends the Colossus instead of a crowd — one big slow shape with a timed untargetable phase, so a one-trick single-target build needs a second line of damage by wave 10.

## Details
**The enemy** (a new content file, like the others in src/content/enemies/):
- Name Colossus, description "The whole wave in one shape: at half health it is out of reach for a beat, again every 8 s."
- Behavior walk, steady on the road.
- Numbers: hp 720 (6× Block's 120; wave-scaled like everything — 1440 at wave 10), speed 0.9 (Block's), gold 20 (Block's doubled), livesCost 1, threat 50 (≈ the wave-10 budget), fromWave 10, size 0.45.
- Look: a purple square at 0.45 — a wall of Block. No new marks; the phase itself is the telegraph.
- Not a regular enemy: a flag in the manner of Splinter's spawnOnly, but it appears only as the boss wave's shape — never in a normal mix; the regular 10-cap is untouched.

**The wave rule** (core/waves.ts):
- Every multiple of 10 the plan is exactly one Colossus and nothing else; no quiet or tight treatment, no tag in this slice.
- The build-phase preview shows the big token ×1 from the plan with no change to the preview file.
- Waves 1–9 and 11–19 are byte-identical to today.

**The phase — timed untargetable, not immune:**
- While its hp is above 50%: an ordinary target, full alpha, no flash.
- The moment its hp first drops to 50% or below: a 0.5 s white flash (the Dasher's telegraph tint), then the phase: the token at 50% alpha and untargetable for 2.5 s. It repeats every 8 s from that start for as long as the Colossus lives — even if it is at 90% by then. All of it on the simulation clock (2× fast-forward scales it like everything else).
- Untargetable, not immune: no tower may pick it as its primary/furthest target (the targeting picks exclude it), but damage that does not need to pick it still lands — Splash's burst around another target, Lance's pierce line, a Chain's leap, a Beam line already holding it (the sticky hold continues), an applied Ember burn ticking, an applied Mark — and Frost slow, Anchor root and Push gusts all apply to it.

**Everything else is automatic:** the name tag says "Colossus" on its first spawn in a run (T0085); a leak is an ordinary leak (1 life — not Block's 2 — with the warning, the jolt scaled to its size, the combo break, the Toll pay); a kill is an ordinary kill (20 gold, chips, combo, Mint, by-tower count); a boss wave held clean counts clean; the save writes at the start of the wave, before spawns, so a mid-fight Colossus is never in a save; the enemies reference lists it with no change to that screen.

**What it punishes:** the one-big-single-target habit of waves 8–9 — 2.5 s out of every 8 is lost. **What counters it:** the second line — the area (Splash), the line (Lance), the leap (Chain), the sustained (Beam, Ember).

## Compared with what exists
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk` | the steady basic walker; no mechanic at all |
| Dart | `walk` | speed and fragility only; never out of reach |
| Block | `walk`, slow and heavy, the purple square | soaks damage; always targetable |
| Sprinter | `walk` | gets faster when hit; always targetable |
| Splitter | `walk` | its threat is the pieces it leaves; never its own survival |
| Hauler | `walk`, big and slow | a bigger bank of gold on the road; always targetable |
| Mute | `walk` | silences the towers around it — a debuff on the run, not its own survival |
| Ward | `walk`, "do not touch it" | ignores control for its whole life — but is always targetable; the Colossus is fully controllable, and only the aim slips, in timed beats |
| Bulwark | `walk`, the tough front | halves shots into its face — a direction, not a time |
| Splinter | `walk` | a fast fragment; no mechanic of its own |

## Acceptance criteria
- [ ] The wave-10 build-phase preview shows one big token and nothing else; the wave sends exactly one Colossus.
- [ ] The Colossus is a purple square (size 0.45) walking at 0.9 with its own scaled hp bar; at wave 10 its hp is 1440.
- [ ] The first Colossus spawn in a run pops the "Colossus" name tag; later spawns in the run do not.
- [ ] While its hp is above 50%: every tower kind targets it normally; no flash, full alpha.
- [ ] The moment its hp is 50% or below: a 0.5 s white flash, then 2.5 s at 50% alpha; during the phase no tower picks it as a new primary target, while a Splash burst, a Lance pierce, a Chain leap and a Beam already holding it still damage it, and slow, root and push all still apply.
- [ ] The phase repeats every 8 s from the first phase start for as long as the Colossus lives.
- [ ] A leak costs exactly 1 life and plays the ordinary leak (warning, jolt scaled to its size, combo break, Toll pay when a Toll stands).
- [ ] A kill pays 20 gold with the ordinary kill (chips, combo, by-tower count); a boss wave held clean counts clean.
- [ ] Wave 20 and every later multiple of 10 also sends the Colossus (until the second boss reassigns them).
- [ ] Waves 1–9 and 11–19 are byte-identical to today; the Colossus never appears in a normal mix; the enemies reference lists it with no change to that screen.
