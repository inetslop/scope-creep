---
id: T0281
title: Beam and burn deal damage in ticks
size: L
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T10:37:56Z
epic: E4
---

## Goal
Beam and burn both deal damage smoothly every frame today. Because of that, nothing can "happen per hit" for them: crits, slows, pushes and damage multipliers all need special-case rules (`core/beamEffects.ts`, `core/beamHold.ts`). Turn both into **ticks**, small discrete hits at a fixed rhythm. Every tick is then an ordinary hit, and every per-hit rule applies to it the same way it applies to a bolt. Burn also gets stronger: its ticks now scale with the burning tower's damage multipliers, so Ember is no longer a fixed, weak number.

## Details
- **One shared tick:** `TICK_SEC = 0.25` (4 ticks per second) in `src/config.ts`, used by both beam and burn.
- **Beam:**
  - A beam line deals its damage as one tick every 0.25 s while it holds its target, each tick worth a quarter of its per-second rate. The total per second is unchanged.
  - The tick clock starts when the line locks on. A line that loses its target mid-tick deals nothing for that partial tick, and the new target starts a fresh clock.
  - Each tick goes through the normal hit path (`EnemySystem`), so it credits kills, gold, Mint, combo and Mark the same as a shot.
  - Bolt rays (T0130) and Lance and Splash beam shapes tick the same way. Rally and Rapid multiply the tick's damage, as they multiply the rate today.
- **Beam effects (replaces the T0132 contact and pulse split):**
  - Each beam tick carries the tower's effects like any hit: Frost's slow, Mark's mark and Ember's burn on every tick.
  - Anchor's root and Push's push land on **every 4th tick**, which is once per second of contact, the same rate as today, so they don't become 4× stronger.
  - Remove the per-frame contact logic and the separate once-a-second pulse clock (`beamHold`), or reduce them to "every Nth tick".
- **Burn:**
  - A burn deals its damage as one tick every 0.25 s for its duration, each tick worth a quarter of its per-second rate. The total over the burn is unchanged at base.
  - Refresh and overtake rules stay as they are: the hotter burn wins and re-ignition refreshes.
- **Burn scales with the burning tower's damage:**
  - Each burn tick is multiplied by that tower's damage multipliers: tier `damageMul`, Rapid's lighter hits (×0.75), the Beam-added boost if that inbox task has landed, and Momentum.
  - Mark already applies to every hit, so it applies to burn ticks for free.
  - Store the multiplier on the burn when it's lit (next to `burnSource`), so a burn keeps its strength after the tower changes.
  - Example: Ember's own 3 per second on a tower with a Common Beam added burns 3.75 per second.
- **Looks:**
  - Each beam tick gives a small hit pulse at the target end of the line: a short brightening of the existing tick mark, not a new effect.
  - Burn ticks keep the current look, with no white flash, as today.
  - No new sounds.
- **Panel:** damage-per-second figures don't change for beams. For burns they include the new multiplier.
- **Tests:**
  - Beam: 4 ticks of rate/4 per second, and kill credit through ticks.
  - Root and push land once per 4 ticks.
  - Burn: total damage over its duration, and the multiplier from Rapid and the Beam boost.
  - Update `beamHold`, `beamEffects`, `beam` and `ember` tests to the tick model.

## Acceptance criteria
- [ ] A Beam deals its damage in ticks every 0.25 s, with the same total per second as before, and each tick credits kills like a shot.
- [ ] Beam ticks apply slow, mark and burn on every tick, and root and push once every 4 ticks.
- [ ] Burns tick every 0.25 s with the same total at base, and are multiplied by the burning tower's damage multipliers (a Rapid-added Ember burns lighter, a Beam-boosted one hotter).
- [ ] A small visible pulse at the beam's target end shows each tick.
- [ ] `npm run check` passes with the reworked tests. Desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, desktop)

### Files
- edit `src/config.ts` - add `TICK_SEC = 0.25` (next to `TAP_SLOP`)
- edit `src/core/beamHold.ts` - rewrite the hold into a per-line tick clock (replaces `nextHit` pulse clock)
- edit `src/core/burn.ts` - `LiveBurn` gains `mul`/`acc`; `burnTick` becomes `burnStep` (ticks of `rate × mul × TICK_SEC`); `ignite` takes the igniter's `mul`; overtake compares effective rate
- edit `src/core/augments.ts` - `TowerSpec.damageMul` (first's tier `damageMul` × added `damageMuls`, 1 when none) + `EMPTY` entry + computation in `towerSpec` + `describeSpec` burn line shows `burn.dps × damageMul`
- edit `src/core/towerDps.ts` - burn term becomes `spec.burn.dps * spec.damageMul`
- edit `src/core/beamEffects.ts` - doc comments only: contact/pulse are now "per tick / every 4th tick"
- edit `src/systems/BeamSystem.ts` - per-line tick clocks (always kept, plus pierce and scorch clocks), damage and effects applied per tick, white fade pulse on the tick mark, `broken()` rewritten
- edit `src/systems/EnemySystem.ts` - `tickBurn` loops `burnStep` ticks through `e.hit(dmg, false)`; `strike`/`beamEffects` ignite with `source.spec.damageMul` and compare effective rate for `overtook`; `brokenBurn` checks `mul`/`acc`; comments
- edit `src/entities/Enemy.ts` - `burn` init/reset gains `mul = 1`, `acc = 0`; `ignite(dps, sec, mul)`
- edit `src/systems/enemyHooks/burnLeap.ts` - `best.ignite(enemy.burn.dps, 3, enemy.burn.mul)`
- edit `tests/core/beamHold.test.ts` - rewrite to the tick model
- edit `tests/core/ember.test.ts` - new `LiveBurn` shape, `burnStep` totals, `mul` and overtake tests
- edit `tests/core/towerDps.test.ts` - burn with a Rapid (2.25/s) case
- edit `tests/core/augments.test.ts` - `damageMul` assertions

### Interfaces
```ts
// src/config.ts
export const TICK_SEC = 0.25; // 4 ticks per second, beams and burns

// src/core/beamHold.ts (BEAM_HIT_SEC deleted)
export interface BeamHold { enemy: object | undefined; /** [0, TICK_SEC) */ acc: number; /** ticks dealt on `enemy` so far */ ticks: number; }
export const EMPTY_BEAM_HOLD: BeamHold;
export const BEAM_PULSE_EVERY = Math.round(1 / TICK_SEC); // 4: root and push land every 4th tick
/** `ticks`: how many ticks this line dealt this frame (usually 0 or 1); `pulse`: one of them was the Nth (root/push). */
export function beamHoldStep(hold: BeamHold, enemy: object | undefined, dt: number): { ticks: number; pulse: boolean; hold: BeamHold };
// a missing or new `enemy` resets: `{ ticks: 0, pulse: false, hold: EMPTY_BEAM_HOLD | { enemy, acc: 0, ticks: 0 } }`

// src/core/burn.ts (burnTick deleted)
export interface LiveBurn { dps: number; mul: number; /** [0, TICK_SEC) */ acc: number; left: number; }
export function burnRate(burn: LiveBurn): number; // dps * mul
export function ignite(burn: LiveBurn, dps: number, sec: number, mul: number): boolean; // refresh always; takes dps+mul when fresh or dps*mul >= burnRate(burn)
export function burnStep(burn: LiveBurn, dt: number): number[]; // one entry per tick this frame, each burnRate * TICK_SEC

// src/core/augments.ts: TowerSpec gains, next to `damage`:
damageMul: number; // 1 in EMPTY; towerSpec: first.tier === 'common' ? 1 : def.tiers[tier]!.damageMul ?? 1, then *= e.damageMul ?? 1 in the added loop

// src/entities/Enemy.ts
ignite(dps: number, sec: number, mul: number): boolean;
```

### Steps
1. `config.ts`: `/** The tick: beam lines and burns deal their damage in hits this often (4 per second). */ export const TICK_SEC = 0.25;`
2. Rewrite `core/beamHold.ts`: on same `enemy`, `acc += dt`, then `while (acc >= TICK_SEC) { acc -= TICK_SEC; ticks++; if ((hold.ticks + ticks) % BEAM_PULSE_EVERY === 0) pulse = true; }`; store `{ enemy, acc, ticks: hold.ticks + ticks }`.
3. Rewrite `core/burn.ts` per the interfaces; `burnStep` adds `Math.min(dt, left)` to `acc` (and subtracts from `left`) before the tick loop; spent burn clears `acc` and returns `[]`.
4. `core/augments.ts`: the four small edits above; burn line: `` `Sets ablaze the furthest enemy: ${spec.burn.dps * spec.damageMul} per second for ${spec.burn.sec} s` ``.
5. `core/towerDps.ts`: `if (spec.burn) dps += spec.burn.dps * spec.damageMul;`
6. `entities/Enemy.ts`: `burn: LiveBurn = { dps: 0, mul: 1, acc: 0, left: 0 }`, same in `spawn()` reset, `ignite` passes `mul` through.
7. `systems/EnemySystem.ts`: `tickBurn`: `for (const damage of burnStep(e.burn, dt)) { if (!e.active) break; if (e.hit(damage, false)) { this.kill(e, e.burnSource); break; } }`; in `strike` and `beamEffects` compute `const mul = source.spec.damageMul;`, `overtook = e.burn.left <= 0 || (payload|fx).burn.dps * mul >= burnRate(e.burn)`, then `ignite(dps, sec, mul)`; `brokenBurn` also flags `mul` not finite/negative and `acc` not in `[0, TICK_SEC)`.
8. `burnLeap.ts`: carry `enemy.burn.mul`.
9. `systems/BeamSystem.ts`: replace the `held` + fx-gated `holds` maps with one `state = new Map<Tower, { lines: BeamHold[]; pierce: BeamHold; scorch: BeamHold }>()` (resize as today's `holdsFor`: keep slot 0 and the old extras at the new end; keep `pierce`/`scorch`). Feed `beamLines` from `st.lines[i].enemy as Enemy | undefined`. Each frame: `steps = targets.map((e, i) => beamHoldStep(st.lines[i]!, e, dt))`; deal `beamTick(target, rate * m * TICK_SEC, t)` once per fired tick (main/rays at `beamDps * m`, extras at `beamExtras[i] * m`; `shotsFired += 1` only on a new lock as today). Pierce and scorch each run one `beamHoldStep` keyed on `mainTarget` while `mainTarget.active`, else set to `EMPTY_BEAM_HOLD` (a tick that kills the main clears them the same frame); on fired ticks they deal to the freshly derived `pierced`/`scorched` sets. Effects: `if (e && e.active && steps[i]!.ticks > 0) this.enemies.beamEffects(e, fx, steps[i]!.pulse, t)`. Store `st.lines[i] = alive ? steps[i]!.hold : EMPTY_BEAM_HOLD` in the existing `now` loop. Draw: keep `hitTick`, and after it call `hitPulse(g, muzzle, e, 1 - st.lines[i]!.acc / TICK_SEC)` (pierce victims use `st.pierce`); `hitPulse` returns under `glow < 0.05` and draws the same 8-px cross as `hitTick` with `g.lineStyle(2, PALETTE.road, glow)`. Rewrite `broken()`: every line's target active/in range, `acc` in `[0, TICK_SEC)`, `ticks` finite ≥ 0, `st.pierce.enemy === st.lines[0]!.enemy === st.scorch.enemy`.
10. `core/beamEffects.ts` comments only. 11. Tests per Files, then `npm run check` and `npm run smoke`.

### Pitfalls
- Phaser clamps dt to ≤ 0.1 s (minFps 10), so at most one tick fires per line per frame; the `while` loop is still correct for a spike — don't clamp `dt` by hand.
- A tick can kill its target: deal damage before applying that tick's effects (effects guard on `e.active`), and the `now` loop already resets the line's hold for dead targets — keep that order.
- Pooled enemies: `mul`/`acc` must be reset in `Enemy.spawn()` or a recycled enemy resums a dead burn's clock.
- `damageMul` is kind-agnostic by design (a beam tower's Rapid contributes 0.75 to burns even though its beam rate uses `beamRapidMul`); do not fold `beamRapidMul` or rally into it. When Momentum (T0064) or the Beam boost (T0280) land through the same `damageMul` fields, burns pick them up for free; if either lands as a separate runtime factor, it belongs in `EnemySystem`'s single `mul` read.
- Burn ticks keep `flash = false` (no white blink); the beam pulse is a Graphics overlay, not a new FxSystem effect or texture.
- `describeSpec` burn line can grow to "…5.95 per second…" — same single line, no layout change at 412x915/1280x720.

### Tests
- `tests/core/beamHold.test.ts` (rewrite): first tick at 0.25 s of hold (4 × 0.1 s steps → ticks 0,0,0,1); 8 ticks over 20 × 0.1 s; pulse exactly on ticks 4 and 8 of 12; switching targets mid-tick deals nothing for the partial and the new target's first tick comes 0.25 s later; a step with `undefined` returns `EMPTY_BEAM_HOLD`; a 0.5 s step fires 2 ticks at once; `acc` stays in `[0, TICK_SEC)` over 600 mixed-dt steps.
- `tests/core/ember.test.ts` (update): totals 9/12/15 per tier via `burnStep` (12 ticks of 0.75); re-ignition rules with `mul`; new: `ignite(live, 3, 3, 0.75)` burns 6.75 over 3 s; overtake compares effective rate (4/s × 1 beats 3/s × 1.25 = 3.75; 5/s × 1 loses to 4/s × 1.5 = 6); `towerSpec([ember, rapid]).damageMul === 0.75` and `describeSpec` says "2.25 per second"; `towerSpec([bolt rare]).damageMul === 1.3`.
- `tests/core/towerDps.test.ts`: `towerDps(spec('ember', 'rapid'))` ≈ 2.25 (existing plain-ember 3 unchanged).
- `tests/core/beam.test.ts` and `tests/core/beamEffects.test.ts` need no functional changes (targeting rules and `beamFx` are untouched) — verify they still pass.
