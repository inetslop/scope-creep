---
id: T0402
title: "The Blinker: the wave-60 boss that blinks the road"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T03:32:09Z
claimed_at: 2026-11-02T04:26:18Z
designer: desktop
---

## Goal
The sixth every-10 boss: the wave-60 Blinker, a pink almond that walks the road and blinks 2.5 cells forward on a committed 1 s telegraph — the first boss that skips the road, so a build concentrated on the choke does not hold the wave. The T0364 re-file, deliberately smaller: one periodic reposition, no second mechanic.

## Details
- **The enemy:** `blink`, a new way of moving (no enemy has it — the Dasher's dash is a fast walk, this is a step): it walks at the boss norm, then every cycle it stops, spends 1.0 s in the telegraph and repositions 2.5 cells forward along the road in one step. The cycle: 4.0 s of plain walking, then the telegraph, then the step. It never blinks the last 2.5 cells of the road — it walks the rest.
- **The telegraph:** the blink's own language — its small white eye slides forward toward the destination and one thin pink ring blooms once at the destination the moment it is set.
- **Committed:** a root, a slow, a Push gust or a Mute's silence during the telegraph does not cancel it — it lands where the ring showed, and the road between the jump is never walked, so nothing on that stretch sees it.
- **Numbers:** hp 720 (wave-scaled, the boss norm), speed 0.9 cells/s, gold 20, livesCost 1, fromWave 60, spawnOnly (never in a wave's mix — the regular cap, 10 of 10, is untouched). It comes one, as the whole wave-60 budget (the every-10 boss slot). Threat: the wave-60 budget itself — read the number from core/waves.ts the way the Flyer's 250 prices wave 50; every every-10 boss carries its whole wave's budget (50/95/150/200/250 for waves 10–50).
- **The wave:** the wave plan names it as the wave-60 boss (the plan's own boss declaration, the Flyer's line for 50, T0317) — the BossCard, the death banner and the boss horn pick it up with no change. The thin road's 0.9× walk factor (T0369) slows its walk segments, not the step (the step is a fixed 2.5 cells).
- **Look:** a pink almond (a new shape in art/shapes.ts; the closest example is the Flyer boss's triangle, T0317) at the boss scale (size 0.5), one small white eye near the back of the face. Pink is the warm family's last color and the silhouette is new (the Mute lesson). The first spawn wears the name chip (T0085) like every new enemy.
- **Card line (dry):** "The whole wave in one shape: it blinks 2.5 cells forward every 4 s — kill it while it blinks, or cover the road between."
- **What it punishes:** a build concentrated on one choke — the blink skips the choke's coverage between jumps, so a choke tower sees the boss only during its 4 s walk segments; a build that kills by holding one spot.
- **What counters it:** the 1 s telegraph is a committed kill window (longer than the Dasher's 0.5 s stop); spread cover across the road (each walk segment is 4 s of plain 0.9 cells/s); the last 2.5 cells are pure walking — cover the final stretch; a sustained line (the Beam) holds on through a blink, the target never changes.

## Compared with what exists
`blink` is a new behavior — no enemy shares it — so the table holds the enemies this one names as similar: the Dasher.

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dasher | a periodic forward burst on a telegraph | its dash is a fast walk — it is on the road, hittable the whole way, and its whole cycle is the burst; the Blinker walks plainly between blinks, and its blink is a committed reposition: it lands where the ring showed, controls or no controls, and the road between is never walked |

## Acceptance criteria
- [ ] The wave-60 plan sends the Blinker as the whole wave (the boss slot, like the Flyer at 50): the BossCard names it with its live hp while it is alive, and the death banner and the boss horn fire on its death with no change to either.
- [ ] It walks at 0.9 cells/s for 4.0 s, then spends 1.0 s in the telegraph — the eye slides forward, one thin pink ring blooms at the destination — then repositions 2.5 cells forward in one step; it never blinks the last 2.5 cells and walks the rest.
- [ ] A root, a slow, a Push gust or a Mute's silence during the telegraph does not cancel the blink: it lands where the ring showed; the 2.5 cells of road between the jump are never walked.
- [ ] Its look is a pink almond at the boss scale with one small white eye — a silhouette no enemy has — and its first spawn wears the name chip.
- [ ] hp 720 wave-scaled, 20 gold, 1 life; spawnOnly, so the regular-enemy cap is untouched; playable menu to game over on desktop and mobile.
