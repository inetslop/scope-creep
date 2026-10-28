---
id: T0049
title: The menu demo plays at your level
size: M
priority: 2
status: todo
depends_on: [T0015]
attempts: 0
created: 2026-10-28T12:01:28Z
epic: E1
---

## Goal
The menu's live demo shows how hard the game has gotten for this player: it plays a wave from around their saved best wave instead of always an early one.

## Details
- The menu's autoplay demo currently plays an early wave. Change it to play a wave of the same difficulty as the player's saved best wave (bestWave from the profile), using the same wave-escalation the game uses (enemy hp, speed and counts for that wave number).
- The demo's wave number is a pure function of bestWave: demo wave = bestWave, clamped to at least 1. So a player whose best is wave 12 sees a wave-12-strength demo.
- If the player has no saved best wave yet (a first-time player), the demo plays the current early wave, exactly as today — no change.
- It stays a demo: no input, no cards, no lives lost, nothing written to the profile, and it loops as it does now — only the wave's difficulty follows the saved best.
- No new UI or HUD element: the demo board looks exactly like the real board, just at the player's level.

## Acceptance criteria
- [ ] A player whose saved best wave is N (N ≥ 2) sees the menu demo playing a wave of roughly wave-N difficulty (escalated enemy hp/speed/counts), not the early wave.
- [ ] A first-time player (no saved best wave) sees the unchanged early-wave demo.
- [ ] The same saved best wave always produces the same demo difficulty (it is a pure function of bestWave).
- [ ] The demo still autoplays with no input, loops, and never writes to the profile.

## Design (architect, baby-mama)

Files:
- edit `src/core/waves.ts`: add pure `demoWave(bestWave)` after `waveHpMul` (before `rampCount`, not file end).
- edit `src/scenes/menu/MenuDemo.ts`: constructor takes `bestWave`; add plan-driven mode (fields + `planNext()`, `spawnWave()`, `spawnDef(def, hp)`); keep today's random path when `bestWave === 0`.
- edit `src/scenes/MenuScene.ts`: `create()` loads the profile once and passes `p.bestWave` to `new MenuDemo(this, p.bestWave)`.
- edit `tests/core/waves.test.ts`: add a `describe('demoWave')` test.
- No new files, no UI/HUD, no new content, no invariant (the demo is not a run system).

Interfaces:
- `export function demoWave(bestWave: number): number` → `Math.max(1, bestWave)`.
- `constructor(scene: Phaser.Scene, bestWave: number): void`.
- Fields: `private readonly wave: number` (0 on first time); `private plan: WavePlan | undefined`; `private next = 0`; `private spawnTimer = 0`.
- `private planNext(): void` — `this.plan = planWave(this.wave, new Rng(this.wave), ENEMIES); this.next = 0; this.spawnTimer = 0;`.
- `private spawnWave(dt: number): void` — consumes plan delays exactly like `WaveSystem.update`.
- `private spawnDef(def: EnemyDef, hp: number): void` — builds the image, `artScale`s it, pushes `{ img, def, distance: 0, hp, slowLeft: 0 }`; `spawn()` keeps only the random def pick and then calls `spawnDef`.

Steps:
1. `waves.ts`: add `demoWave` after `waveHpMul`.
2. `MenuDemo` constructor: `this.wave = bestWave > 0 ? demoWave(bestWave) : 0;`; if `this.wave > 0` call `this.planNext()`.
3. `MenuDemo.update(dt)`: `if (this.wave === 0)` run the unchanged `spawnIn` + `this.spawn()`; else `this.spawnWave(dt)`; then the existing walk/shoot/pulse/flyBolts.
4. `spawnWave`: `this.spawnTimer += dt;`; `while (this.next < plan.spawns.length && this.spawnTimer >= plan.spawns[this.next]!.delaySec) { this.spawnTimer -= plan.spawns[this.next]!.delaySec; const def = getEnemy(plan.spawns[this.next]!.enemy); this.spawnDef(def, Math.max(1, Math.round((def.livesCost > 1 ? 4 : 2) * plan.hpMul))); this.next++; }`; then `if (this.next >= plan.spawns.length && this.enemies.length === 0) this.planNext();`
5. Split `spawn()` into `spawnDef` as above; legacy `spawn()` calls `this.spawnDef(def, def.livesCost > 1 ? 4 : 2)`.
6. `MenuScene.create()`: move `const p = loadProfile(window.localStorage);` before `this.demo`, set `this.demo = new MenuDemo(this, p.bestWave);` (`p` still feeds `buildProfileCard`/`buildRecentLine`).
7. `waves.test.ts`: `expect(demoWave(0)).toBe(1); expect(demoWave(1)).toBe(1); expect(demoWave(12)).toBe(12);`; add `demoWave` to the waves import.

Pitfalls:
- T0015 (in progress) also touches `src/core/waves.ts` + `tests/core/waves.test.ts` — insert after `waveHpMul`, never at file end; DEPENDS_ON.
- The `bestWave === 0` path must stay byte-identical (random spawner, `Math.random`); that is the AC.
- Use a fresh `new Rng(this.wave)` on every (re)plan so the same saved bestWave replans identically (determinism, AC c).
- Plan-mode hp is the DEMO's own base hp × `plan.hpMul`: `Math.max(1, Math.round((def.livesCost > 1 ? 4 : 2) * plan.hpMul))`. Do NOT use the real `def.hp * plan.hpMul` — the 1-damage bolt would never kill, breaking the show.
- Never call `recordRun`, write nothing to the profile; walk-offs stay cosmetic (`remove(e, false)`, no lives lost) (AC d).
- No per-wave speed scale exists; speed is per def (`e.def.speed`), and "harder" comes from rampers (sprinter) that `planWave` mixes in from wave 8. Don't touch the walk formula.

Tests:
- New `demoWave` pure-function test (0→1, 1→1, 12→12); existing `planWave`/`rampCount` tests untouched.

## Note (by hand, 2026-10-28)

No longer waits on T0042: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.
