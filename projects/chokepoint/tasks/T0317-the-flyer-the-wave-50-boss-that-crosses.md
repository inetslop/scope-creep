---
id: T0317
title: "The Flyer: the wave-50 boss that crosses the sky"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T00:35:25Z
claimed_at: 2026-10-31T00:44:16Z
epic: E10
designer: desktop
---

## Goal
The run's next peak: wave 50 sends the first thing in the game that never walks the road — a boss that crosses the island in a straight line, over towers and rocks, and at half health banks to a new line, so a build that only covers the road stops being enough.

## Details
- **The every-10 rule's fifth boss:** wave 50 sends exactly one Flyer and nothing else — the plan's whole budget in one shape (the Orb's and Hive's pattern) — declared as the wave's boss, so the arrival horn (T0268), the boss card (T0256) and the death burst and name card (T0273) fire for it with no new HUD. The Flyer has no out-of-reach phase, so the escape note (T0269) does not apply to it.
- **Numbers:** behavior `fly` (new — the crossing below); hp 720 base (the boss base, wave-scaled like the Orb's); speed 0.7 cells/s; gold 20; livesCost 1 (a boss leak costs one life, as always); threat exactly the wave-50 budget (the whole-budget pattern); fromWave 50; spawnOnly — never in a wave's mix, not counted in the 10-regular cap.
- **The crossing (the new behavior):** the Flyer never touches the road. Its route is one straight line from a spawn point off the island's edge, on the entrance side, to the exit gate; it flies the line at 0.7 cells/s, its triangle rotated to point along it. The spawn point is chosen from the board's seed (deterministic, different per board), on the island's edge, so the line crosses the island's interior and lands on the exit gate — never through the entrance gate.
- **The bank (the boss's beat):** at exactly 50% hp, once, the Flyer banks: its remaining route becomes two straight segments — from its current position to a bank point on the island's edge, then to the exit gate. The bank point is chosen from the seed so the new route is visibly different from the first line (it crosses another part of the island). 0.8 s before the turn, the two new segments show as the flight line's own thin red preview; the turn lands with one quiet falling tone (the Colossus out-of-reach note's shape, T0284). A rooted or slowed Flyer still banks on its hp clock — control buys time, not the beat.
- **The flight line's telegraph:** at the wave's start, a thin red line (the Flyer's own color) at ~50% alpha shows the first line from spawn to exit for 3 s; the Flyer then pops in at the spawn point with the ordinary spawn pop, and the line fades over 0.3 s. The line is a telegraph in the enemy's own language (the Dasher's, T0046) — it is gone before the crossing starts, leaves no mark on the board, and the Flyer's heading keeps the route readable after.
- **Progress is the remaining route:** the Flyer's "distance along the road" is its remaining distance to the exit gate along its current route (the first line; after the bank, the two segments). Every system that reads an enemy's progress — the beam's and the Mark's furthest-along pick, the exit warning's 3-second check (T0014), the next-wave button's enemies-left count, the wave-end check — reads that number, so the Flyer behaves like any enemy there with nothing new on screen.
- **Control:** Frost's slow and Anchor's root apply in range, exactly as to any enemy (a rooted Flyer hangs in the air, mid-crossing). Push's gust does not touch it — a gust pushes along the road, and the Flyer is not on the road. The Mark marks it; the beam holds it; everything that hits an enemy hits it.
- **What it punishes and what answers it:** it punishes a road-only build — towers that only reach the road may not reach the flight line at all, and the bank crosses a different part of the island, so a build that covered only the first line loses contact at half health. The answers are range (Beam's 3.5, Reach's 4.6, a Lance corridor along the line), a Splash or Spray close to the line, and control on the line (Frost's slow and Anchor's root stretch the crossing; a Push gust cannot).
- **The reference:** the wave preview shows the Flyer's token ×1; the name tag says "Flyer" on its first spawn (T0085); the bosses reference grows its row from the def (T0277), teach language: "crosses the island in a straight line — cover the line, not the road."

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | the basic walker on the road | the Flyer never touches the road — it cannot be pushed along it, held by it or paced by it; its whole crossing is its own line |
| Dasher | a movement that is not steady walking | the Dasher's burst stays on the road and repeats every cycle; the Flyer leaves the road entirely, and its line is the crossing itself |
| Colossus | the every-10 boss with a beat at half health | the Colossus's beat stops the fight (out of reach); the Flyer's beat keeps it coming, on a new line through uncovered ground |
| Orb | a boss that changes at half health | the Orb becomes two other enemies once; the Flyer stays one shape and re-aims itself |
| Hive | the whole wave in one boss shape | the Hive walks the road and grows the group; the Flyer never touches the road and adds nothing but its own crossing |

## Acceptance criteria
- [ ] Wave 50's plan is exactly one Flyer (the whole budget, the "boss" tag); every other wave plan is unchanged, and the seeded plans for waves 10, 20, 30 and 40 stay identical.
- [ ] The Flyer flies its straight line from the off-board spawn point to the exit gate at 0.7 cells/s, rotated to point along it; the 3 s red line shows the line before the spawn and no mark remains after it fades; the spawn point differs per board seed.
- [ ] At exactly 50% hp, once, the Flyer banks to two new straight segments (its position → an edge bank point → the exit gate) with the 0.8 s preview and the falling tone; the bank point is seeded and the new route visibly different from the first line; a rooted Flyer still banks on its hp clock.
- [ ] Progress is the remaining route distance: the beam and the Mark can hold the Flyer as the furthest, the exit warning fires within 3 s of the gate, and the enemies-left count is 1 while it flies and 0 when it is killed or leaks.
- [ ] Frost's slow and Anchor's root apply in range (a rooted Flyer stops in flight); a Push gust does not move it (unit test).
- [ ] The arrival horn, the boss card and the death burst and name card fire from the existing boss hooks; the name tag, the preview token and the bosses reference row show "Flyer"; the escape note does not fire.
- [ ] The look is a red triangle at 0.5 — a shape no enemy has; unit tests pin the wave-50 plan, the route math (one line → the bank → two segments, remaining distance) and the seeded choices; npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
