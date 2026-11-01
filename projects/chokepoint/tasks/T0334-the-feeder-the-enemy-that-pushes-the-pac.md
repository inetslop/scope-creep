---
id: T0334
title: "The Feeder: the enemy that pushes the pack"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T02:32:15Z
claimed_at: 2026-11-01T02:32:40Z
designer: desktop-4070
---

## Goal
The first enemy that works on other enemies: a slow shape that hangs at the back of the pack and makes everything near it walk faster, so a wave's pace is no longer what its members look like.

## Details
- New regular enemy `feeder` — the 10th regular (the cap in modules/enemies.md lands at 10 of 10; nothing is removed or merged).
- Look: a new **crescent** shape in the art (a thick rounded arc, open on the leading side — a bow wave pushing things ahead), **orange** (Sprinter's family color — the speed family), size 0.26, chunky rounded with the tokens' own darker side face and soft shadow (no outline, no glow).
- Card line (the Enemies reference and the name tag read it): "The slow one that pushes the pack: everything within two cells walks a quarter faster while it lives."
- Numbers (wave 1, hp wave-scaled as usual): hp 90, speed 0.8 cells/s, gold 8, livesCost 1, threat 3, fromWave 13.
- The wave mix: exactly one Feeder on waves 13, 17, 21, 25, 29, 33, … (every 4th from 13). Its threat comes out of the wave's budget and the rest of the wave is the normal mix (reserved, like the Hauler and the Mute). The series is always 1 mod 4, so it never lands on a quiet wave (0 mod 4) and never on a boss wave (a multiple of 10) — no re-add rule is needed.
- The aura: every enemy with its center within 2 cells of a live Feeder — the Feeder itself included — walks 25% faster while inside. At most one Feeder's aura applies to one enemy at a time (the nearest, if two are in range). It multiplies with the Sprinter's hit ramp and with slows, the way Haste's haste does, and never stacks with itself. While the Feeder lives, a quiet ring in orange at ~40% alpha grows from its token out to 2 cells and fades, once every 1.2 s at ground level — the working-aura language, the Mute's ring pattern — so the aura is readable before it matters.
- A kill is an ordinary kill: gold, Mint, combo, "stopped"; a leak costs its 1 life. The per-frame work rides a new enemy hook on the Mute's pattern.
- What it punishes: a build that herds a big pack through one slow stretch — the pack walks faster than it looks, and the back of it crosses the choke before the build answers. What counters it: it is the slowest in the pack and hangs at the rear, easy to pick off (90 hp, less than a Block); spread the pack instead of herding it, and the ring says where the pace is coming from.
- The name tag (first sight), the wave preview, the next-wave button and the Enemies reference all pick it up from the content — no change to those files.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk` | walks only; the Feeder changes the pace of every enemy around it |
| Block | `walk` | soaks damage; never touches other enemies' pace |
| Colossus | `walk` (spawnOnly boss) | goes out of reach at half health; never touches other enemies' pace |
| Guard | `walk` (spawnOnly) | shields the Titan it escorts; never touches other enemies' pace |
| Titan | `walk` (spawnOnly) | is shielded while its Guard lives; never touches other enemies' pace |
| Orb | `walk` (spawnOnly boss) | splits into two at half health, replacing itself; never touches other enemies' pace |
| Shard | `walk` (spawnOnly) | is a piece the Orb leaves; never touches other enemies' pace |
| Sprinter | `walk`, speed | speeds itself up when hit; the Feeder speeds up everything around it, on top of the Sprinter's own ramp |
| Splitter | `walk` | splits into two on death, replacing itself; never touches other enemies' pace |
| Hauler | `walk` | its leak costs gold; never touches other enemies' pace |
| Mute | `walk`, an aura | its aura silences towers (the other side of the board); the Feeder's aura works on enemies — no existing enemy works on other enemies |
| Ward | `walk` | shrugs off controls; never touches other enemies' pace |
| Bulwark | `walk` | halves shots into its plate; never touches other enemies' pace |
| Splinter | `walk` (spawnOnly) | is a piece a Splitter leaves; never touches other enemies' pace |

## Acceptance criteria
- [ ] Waves 13, 17, 21, … each contain exactly one Feeder (its 3 threat deducted from the wave's budget, the rest the normal mix); no boss wave and no quiet wave ever contains one; the content tests assert the series.
- [ ] The Feeder walks at 0.8 cells/s, has hp 90 wave-scaled, pays 8 gold, costs 1 life on leak, and is a new orange crescent token (a new shape in the art, chunky rounded, soft shadow).
- [ ] An enemy with its center within 2 cells of a live Feeder walks 25% faster while inside (the Feeder itself included); leaving the ring returns it to its own pace; a Sprinter inside keeps its hit ramp on top; at most one Feeder's haste applies at a time.
- [ ] The orange aura ring pulses out to 2 cells once every 1.2 s at ground level while the Feeder lives.
- [ ] First sight pops the "Feeder" name tag; the wave preview and the Enemies reference show it with no change to those files.
- [ ] The regular-enemy count is 10 (the cap); nothing is removed or merged.
