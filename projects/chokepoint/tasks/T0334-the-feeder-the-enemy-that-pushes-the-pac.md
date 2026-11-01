---
id: T0334
title: "The Feeder: the enemy that pushes the pack"
assignee: desktop-4070
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T02:32:15Z
claimed_at: 2026-11-01T04:00:26Z
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

## Design (architect, desktop-4070)

### Files
- CREATE `src/content/enemies/feeder.ts` — the EnemyDef (exact object below).
- EDIT `src/content/enemies/index.ts` — `import { feeder } from './feeder';` after the dot import; array entry `feeder,` after `mute,`.
- EDIT `src/content/types.ts:4` — append `| 'crescent'` to the Shape union.
- EDIT `src/art/shapes.ts:15` — add `crescent: 0` to the `sides` Record (compile-forced).
- EDIT `src/art/paint.ts` — crescent early-return in `shapePath`, before the generic tail (~line 62).
- CREATE `src/systems/enemyHooks/feederPack.ts` — the per-frame push + ring hook.
- EDIT `src/systems/enemyHooks/index.ts` — import near line 14, entry near `muteJam,`.
- EDIT `src/entities/Enemy.ts` — `packPct` field, spawn reset, advance() factor at lines 166 AND 192.
- EDIT `src/core/waves.ts` — walkers exclusion (137), pre-deduction (after 148), reserved push (after Ward, ~177).
- EDIT `src/debug/runChecks.ts` — one invariant after `enemies.speedCap`.
- EDIT `tests/core/waves.test.ts` — new Feeder series test + line-83 exclusion.

### Interfaces
`feeder` = `{ id:'feeder', name:'Feeder', description:'The slow one that pushes the pack: everything within two cells walks a quarter faster while it lives.', behavior:'walk', hp:90, speed:0.8, gold:8, livesCost:1, threat:3, fromWave:13, look:{ shape:'crescent', color:'orange', size:0.26 } }`.
Enemy field: `packPct = 0` beside `hastePct`; advance(): append `* (1 + this.packPct)` to the walk product at line 166 AND the dash surge at line 192; reset `this.packPct = 0` in spawn() after `this.hastePct = 0`.
`feederPack.ts`: `MakeEnemyHook = ({ enemies, scene }) => ...`; constants `REACH = 2`, `BEAT_MS = 1200`.

### Steps
1. Content: create feeder.ts (import `type { EnemyDef } from '../types'`); register in index.ts.
2. Art: types union + shapes.ts Record + shapePath crescent early-return: outer semicircle r at center (x, y−0.25r) angle 0→π (13 pts), then inner arc radius `radius*1.25` centered (x, y−radius) from `Math.acos(0.8)` to `Math.PI - Math.acos(0.8)` traced reversed (13 pts), close via `roundedPolygon(ctx, pts, radius*0.28); return;`. (paintToken side face/shadow are automatic.)
3. Enemy.ts: add field/reset/factor (three edits).
4. Hook feederPack.ts (model on muteJam): per-frame set every active enemy's `packPct = feeders.some(f => distSq <= REACH²·CELL²) ? 0.25 : 0` (dist from feeder, itself included); move each ring to its Feeder; on `scene.time.now - lastPulse >= BEAT_MS && feeders.length>0` per-Feeder `drop`, add Graphics at DEPTH.preview `fillRing(g,0,0,REACH*CELL,3,0,Math.PI*2,PALETTE.orange,0.4)`, start scale `(0.26*CELL)/(REACH*CELL)`, tween `{scale:1,alpha:0,duration:BEAT_MS,ease:'Quad.easeOut'}` with muteJam's onComplete cleanup; `onKill`/`onLeak` → drop(enemy). Register one line in index.ts.
5. waves.ts: (a) line 137 walkers filter add `&& e.id !== 'feeder'`; (b) after the dasher loop (line 148), before `const spawns` (149): `if (wave >= 13 && (wave - 13) % 4 === 0) budget -= unlocked.find((e) => e.id === 'feeder')!.threat;`; (c) after the Ward push (~line 177), before `let finalSpawns`: `if (wave >= 13 && (wave - 13) % 4 === 0) reserved.push('feeder');`.
6. runChecks.ts: after `enemies.speedCap` add `['enemies.pack', (g) => (g.enemies.all.some((e) => e.active && e.packPct !== 0 && e.packPct !== 0.25) ? 'an enemy packs at the wrong fraction' : null)],`.

### Pitfalls
- Pre-deduction MUST sit after ramp/dash reservation and BEFORE `const spawns` (line 149) so walker budget stays correct; the push MUST stay after the splitter count (line 167) — that is why the line-83 test needs the exclusion below. Do NOT add a Hauler-style re-add: the series ≡1 mod 4 is never quiet nor boss.
- `packPct` is its OWN field (HasteSystem resets hastePct each frame; a shared field would be clobbered). Values are only 0/0.25, so multiple Feeders OR to exactly one push — never stacks; no nearest-enemy tie-break code needed.
- Ring timing uses `scene.time.now`, not dt (muteJam precedent); cosmetic only, `run.rng` not involved. Do not rotate a token with a side face — the crescent mouth points up like chevron/triangle.
- Crescent must use exactly r / 1.25r / a0=acos(0.8) or the tips won't meet and it won't close.

### Tests
- waves.test.ts line 83: extend the `others` exclusion with `&& s.enemy !== 'feeder'`.
- New test, modeled on the Mute one (lines 99–106): loop wave 1..30, `expected = wave >= 13 && (wave - 13) % 4 === 0 ? 1 : 0`, expect exactly that many `feeder` spawns, and when 1 assert the wave also sends a non-feeder.
- `npm run check` must pass (content.test.ts auto-validates feeder; typecheck forces the crescent additions).
