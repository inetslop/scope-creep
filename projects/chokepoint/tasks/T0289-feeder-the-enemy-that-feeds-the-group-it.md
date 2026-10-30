---
id: T0289
title: "Feeder: the enemy that feeds the group it walks with"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-30T16:07:56Z
claimed_at: 2026-10-30T17:50:11Z
finished_at: 2026-10-30T18:36:28Z
design_attempts: 2
---

## Goal
The next enemy in the queue: a slow walker whose quiet ring makes every enemy near it 25% faster, so the tempo of a wave is something you manage, not just survive.

## Details
- New enemy `feeder` on the content/enemies pattern: behavior `walk`; hp 90; speed 0.9 cells/s; gold 8; livesCost 1; threat 2; fromWave 13.
- Wave mix: one Feeder reserved on every wave numbered 13 + 4k (13, 17, 21, …), like the Mute's reservation in core/waves.ts. It never lands on a boss wave (10, 20, 30, …) and its waves are never quiet (every 4th wave is 4, 8, 12, …), so no re-add rule is needed.
- The aura (the new mechanic): while a Feeder is alive, every enemy whose center is within 2 cells of it — the Feeder itself included — walks at 125% of the speed it would otherwise walk at. It multiplies with everything else: a 40% Frost-slowed enemy inside the ring walks at 75% of base speed; a Sprinter's per-hit ramp is under the ring's 25%. At most one Feeder's 25% ever applies, however many Feeders are on the board. The aura is a state of being alive: it keeps working while the Feeder itself is rooted or slowed; only killing it stops the haste.
- Look: a new shape no enemy wears — a circle with two small arc ticks at its left and right side (a speed mark), orange, size 0.28. While alive it pulses a quiet expanding ring in its own orange out to the full 2-cell radius about every 2 s, at the Mute silence ring's ground placement and look (T0219) — the haste is seen before it bites.
- What counters it: kill it early — 90 hp, no plate, fully controlable (Frost slow, Anchor root and Push all work on it), so a focused corner drops it in a couple of shots; its ring reaches only 2 cells, so coverage past the ring is unhasted.
- What it punishes: long slow waves (a Block/Bulwark/Hauler group crosses in about 17% less time), Frost (a 40% slow inside the ring is a 25% net slow), and coverage tuned to Block's 0.9 — from wave 13 the wave's tempo depends on whether the Feeder is still alive.
- The existing systems read it for free: the wave preview's token and count, the name tag on its first spawn, the enemies reference row and the leak jolt all pick it up from the content and the plan.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | `walk` | Dot does nothing to other enemies; the Feeder hastes every enemy within 2 cells while it lives |
| Block | `walk`, slow | Block only soaks damage; the Feeder drags the whole group faster |
| Colossus | `walk` | The Colossus's beat hides itself from towers; the Feeder's aura acts on its neighbours, not on itself |
| Guard | `walk` | The Guard halves the hits on the Titan; the Feeder changes how its neighbours move |
| Titan | `walk` | The Titan is shielded by its Guard; the Feeder carries no shield and gives the group +25% speed |
| Orb | `walk` | The Orb spends its second half as two Shards; the Feeder works for its whole life and never splits |
| Shard | `walk` | The Shard is fast by its own speed; the Feeder is slow and makes the others fast |
| Sprinter | `walk` | The Sprinter ramps its own speed per hit; the Feeder's +25% is an aura that stacks on top of the ramp |
| Splitter | `walk` | The Splitter pays out on death (two Splinters); the Feeder's effect is on while it lives, not on death |
| Hauler | `walk`, big and slow | The Hauler's threat is what its leak costs; the Feeder's threat is the haste it leaves on the wave |
| Mute | `walk`, a 2-cell aura while alive | The Mute's ring stops your towers; the Feeder's ring speeds up other enemies — it works for the road, not the defense |
| Ward | `walk` | The Ward ignores control for itself; the Feeder is fully controlable, and rooting it does not stop the aura |
| Bulwark | `walk` | The Bulwark halves shots into its face; the Feeder has no plate — a focused corner drops it in a couple of shots |
| Splinter | `walk` | The Splinter is born from a kill; the Feeder walks in from the spawn |

## Acceptance criteria
- [ ] From wave 13, waves 13, 17, 21, … reserve exactly one Feeder: the wave's plan carries it and the build-phase preview shows its token with a count of 1; every other wave's plan is unchanged.
- [ ] While a Feeder is alive, an enemy within 2 cells of it walks at 125% of the speed it would otherwise walk at (slow and ramp multiplied in); a 40% Frost-slowed enemy inside the ring walks at 75% of base; the Feeder itself walks at 1.125.
- [ ] Rooting or slowing the Feeder does not stop the aura; the instant the Feeder dies the haste ends and the affected enemies return to their own speed.
- [ ] The Feeder wears its speed-tick circle (orange, 0.28) and pulses its 2-cell ring about every 2 s while alive, visible at the default zoom.
- [ ] The first Feeder spawn shows the name tag; the enemies reference lists the Feeder in fromWave order; a leaked Feeder costs 1 life with the normal leak feedback.
- [ ] Unit tests cover the mix rule (13 + 4k, none on boss waves) and the aura's speed math (slow and ramp multiplication, the one-aura cap); the gate passes.

## Architect could not design it (cachyos-x8664)

no "STATUS: READY" line after 2 attempt(s). Last output:

```
Prompt is too long
```
