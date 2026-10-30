---
id: T0253
title: "The Colossus: wave 10 sends one big shape that goes out of reach at half health"
size: L
priority: 1
status: todo
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

## Design (architect, desktop)

### Files
- create `src/content/enemies/colossus.ts` — the Colossus `EnemyDef` (model on `block.ts`)
- create `src/core/outOfReach.ts` — pure phase state machine (trigger clock → leg)
- edit `src/content/types.ts` — new `EnemyDef.outOfReach` field; fix the `spawnOnly` doc comment
- edit `src/content/enemies/index.ts` — add `colossus` to `ENEMIES`, on the line after `block,`
- edit `src/core/waves.ts` — `isBossWave()` + boss early-return in `planWave()` (body moves to `planNormalWave()`)
- edit `src/core/targeting.ts` — `TargetCandidate.untargetable`; `pickTarget`/`pickTargets` skip it
- edit `src/entities/Enemy.ts` — `reachClock` field, phase trigger/leg in `advance()`, `untargetable` getter, spawn resets
- edit `src/systems/attacks/mark.ts` — `furthestUnmarked` skips untargetable
- edit `src/systems/EnemySystem.ts` — `brokenReach()` invariant
- edit `src/debug/runChecks.ts` — `['enemies.reach', (g) => g.enemies.brokenReach()]` after the `enemies.push` line
- create `tests/core/outOfReach.test.ts`
- edit `tests/core/waves.test.ts` — boss tests; exclude boss waves from the Mute/Bulwark/Ward/quiet tests
- edit `tests/core/tightWaves.test.ts` — drop wave 30 from the tight-plan test list
- edit `tests/content.test.ts` — validate `outOfReach` next to the `dashCycle` block

### Interfaces
```ts
// core/outOfReach.ts
export interface OutOfReachSpec { hpFrac: number; telegraphSec: number; phaseSec: number; periodSec: number; }
export type OutOfReachLeg = 'idle' | 'flash' | 'out';
export function outOfReachLeg(spec: OutOfReachSpec, clock: number): OutOfReachLeg; // clock: seconds since first trigger, -1 before

// content/types.ts, on EnemyDef (inline type, like dashCycle):
outOfReach?: { hpFrac: number; telegraphSec: number; phaseSec: number; periodSec: number };

// core/targeting.ts: TargetCandidate gains  untargetable?: boolean;
// entities/Enemy.ts:  reachClock = -1;  and  get untargetable(): boolean  (leg === 'out')
```

### Steps
1. `colossus.ts`: `id 'colossus'`, name/description exactly as given, `behavior 'walk'`, `hp 720, speed 0.9, gold 20, livesCost 1, threat 50, fromWave 10, spawnOnly: true`, `outOfReach: { hpFrac: 0.5, telegraphSec: 0.5, phaseSec: 2.5, periodSec: 8 }`, `look: { shape: 'square', color: 'purple', size: 0.45 }`. Texture, hp bar, name tag, kill/leak/clean/save are all data-driven — no other system changes.
2. `core/outOfReach.ts`: `outOfReachLeg` — `clock < 0` → `'idle'`; else `t = clock % periodSec`, `t < telegraphSec` → `'flash'`, `t < telegraphSec + phaseSec` → `'out'`, else `'idle'`.
3. `Enemy.ts`: `import { outOfReachLeg } from '../core/outOfReach'`. Field `reachClock = -1` (reset in `spawn()`, which also gains `this.setAlpha(1)` after `clearTint()`). In `advance()`: after the `wasWhite` line, add `const reach = this.def.outOfReach;` (also used in `wasWhite` via its leg), then `if (this.reachClock < 0 && reach && this.hp <= this.maxHp * reach.hpFrac) this.reachClock = 0; if (this.reachClock >= 0) this.reachClock += dt;`. At the bottom, `const leg = reach ? outOfReachLeg(reach, this.reachClock) : 'idle';`, `white` becomes `tele || leg === 'flash' || this.flash > 0`, and after the tint toggle add `this.setAlpha(leg === 'out' ? 0.5 : 1);`. Getter `untargetable` returns `leg === 'out'`.
4. `targeting.ts`: add `if (e.untargetable) continue;`-equivalent to `pickTarget`; `pickTargets` becomes `inRange(...).filter((i) => !enemies[i]!.untargetable).sort(...).slice(...)`. **Do not touch `inRange` or `pickNearest`** (splash bursts, scorch, leaps, control still reach it). No change in `core/beam.ts`: the sticky hold uses `inBeamRange` (must survive the phase); retakes go through `pickTarget` (excluded automatically).
5. `waves.ts`: export `isBossWave(wave) { return wave > 0 && wave % 10 === 0; }`. Move the current `planWave` body to a private `planNormalWave(wave, rng, enemies)`; new `planWave`: `if (isBossWave(wave)) { planNormalWave(wave, rng, enemies); // still draws its share so waves 11+ keep today's seeded plans; return { number: wave, spawns: [{ enemy: 'colossus', delaySec: 0 }], hpMul: waveHpMul(wave), tags: [] }; } return planNormalWave(wave, rng, enemies);`
6. `mark.ts`: `if (!e.active || e.markPct > 0 || e.untargetable) continue;`.
7. `EnemySystem.brokenReach()`: active enemy with `def.outOfReach` and `!Number.isFinite(e.reachClock) || e.reachClock < -1 - 1e-9`. Register it in `runChecks.ts`.
8. Tests: `outOfReach.test.ts` (boundaries: 0/0.49 flash, 0.5/2.99 out, 3/7.99 idle, 8 flash, 10.5 out, 16 flash); `waves.test.ts` — boss test (waves 10/20/30/40: `spawns` exactly `[{ enemy: 'colossus', delaySec: 0 }]`, `tags []`, `hpMul waveHpMul`), and "non-boss waves never send a colossus" (1–40, skip %10); change the Mute/Bulwark/Ward `expected` formulas to add `&& wave % 10 !== 0` (Ward's `wave !== 20` becomes this), and drop 20 from the quiet list `[4,8,12,16,20,24]`; `tightWaves.test.ts` list `[6,14,22,30]` → `[6,14,22]`; `content.test.ts` validates `hpFrac` in (0,1], the three seconds > 0, and `periodSec > telegraphSec + phaseSec`.

### Pitfalls
- **hp number:** the task's "1440 at wave 10" is a miscalculation — `waveHpMul(10)` is 3.124, so 720 → **2249**. Keep `hp 720` (6× Block) and the standard scaling ("wave-scaled like everything else"); the parenthetical is wrong arithmetic. Do not invent a boss hpMul.
- **Rng stream:** `run.rng` is one stream across map/drafts/plans. If the boss branch skips planning draws, every wave after 10 drifts from today's seeded plans. That is why `planWave` calls `planNormalWave` for its draws before returning the boss plan.
- **Don't exclude untargetable in `inRange`/`pickNearest`/`inBeamRange`** — that would break splash, Lance pierce lines, beam sticky hold, scorch, Frost/Anchor/Push. Only the *picks* (`pickTarget`, `pickTargets`, mark's local copy) skip it.
- **Tint toggle:** the flash must flow through the existing `wasWhite`/`white` edge-trigger (that is why the trigger lives in `advance()`, not `hit()` — a `hit()` trigger would set `wasWhite` on the same frame and the tint would never apply). Alpha is separate from tint: 50% alpha only on the `'out'` leg, full alpha on the flash.
- **Pooling:** reset `reachClock` and `setAlpha(1)` in `spawn()`; a recycled dot must not half-ghost.
- **Wave 20 is no longer a quiet/mute/bulwark wave** — update those four tests or the suite fails; wave 10 was neither quiet nor tight, so 1–9 and 11–19 are untouched.
- Preview (`NextWavePreview`), name tag, EnemySystem leak/kill, `RunSave` (saves on the phase change, before spawns) and the enemies reference (built from `ENEMIES` by T0252) all pick the new enemy up with **no changes** — don't touch them.

### Tests
- `tests/core/outOfReach.test.ts` (new): leg boundaries and 8 s repetition.
- `tests/core/waves.test.ts`: boss-wave shape and never-in-a-normal-mix; boss-wave exclusions in Mute/Bulwark/Ward/quiet tests.
- `tests/core/tightWaves.test.ts`: drop wave 30.
- `tests/content.test.ts`: `outOfReach` validation block.
