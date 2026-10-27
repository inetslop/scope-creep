---
id: T0138
title: First light — the first shard of a run teaches the economy
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T19:37:42Z
claimed_at: 2026-10-27T20:22:23Z
---

## Goal
The shard economy (shoot → shard → level) is the core loop, but nothing marks it the first time. The moment the first shard of a run is picked up it announces itself — a small ink ring and a higher pluck — so a first-time player notices the loop, in the spirit of the enemy marginalia (T0027).

## Details
- Once per run, the first shard to be picked up (any shard, gilt or not) triggers two extras on top of the normal pickup:
  - a small flat ink ring pops at the pickup point — the existing ring FX idiom (the crit ring, T0119): a flat 2 u ink circle growing from ~8 u to ~24 u and fading over 300 ms, no outline or shadow.
  - the pickup pluck (T0003, as pitch-modified by the gilt glint, T0117) plays one octave higher (frequency ×2, same gain).
- If the first shard happens to be gilt (T0112), the gilt glint's +1 semitone (T0117) is replaced by the first-light octave (the bigger lift wins); the yellow "+N" pop (T0117) still prints.
- Once per run: the flag is per-run, like the marginalia first-sighting (T0027) — it resets on every new run and is not persisted between runs.
- Every other pickup is unchanged: normal shards the plain pluck, gilt shards +1 semitone plus the yellow pop. No new HUD element, key, scene, sound or gameplay number.

## Acceptance criteria
- [ ] In a fresh run, the first shard picked up pops a small flat ink ring at the pickup point (growing ~8→24 u, fading over ~300 ms) and plays the pickup pluck one octave higher.
- [ ] The second and later pickups in the same run behave exactly as before (normal: plain pluck; gilt: +1 semitone + yellow "+N" pop).
- [ ] If the first shard is gilt, the pluck is one octave higher (not +1 semitone) and the yellow "+N" pop still prints.
- [ ] A new run repeats the effect (the flag is per-run, not persisted).
- [ ] No new HUD element, key, scene, or gameplay number change.

## Design (architect, yoga)

### Files
- edit `src/core/run.ts` — `firstShardPickup()` one-shot per-run flag, placed beside `firstSighting`/`firstBossSighting` (lines 135–151)
- edit `src/audio/Sfx.ts` — `pickup()` gains `firstLight` param: lift 12 semitones, replacing gilt's +1
- edit `src/systems/FxSystem.ts` — `firstLightRings` emitter + `firstLightRing(x, y)` method, the `critRings` idiom (lines 29, 70–76, 94, 103–106)
- edit `src/systems/PickupSystem.ts` — both pickup sites fire the ring and pass `first` to the pluck
- edit `tests/core/core.test.ts` — once-per-run test after the firstBossSighting test (line 124)

### Interfaces
```ts
// src/core/run.ts (method, after firstBossSighting)
firstShardPickup(): boolean;              // true exactly once per run
// src/audio/Sfx.ts (was: pickup(gilt?: boolean): void)
pickup(gilt?: boolean, firstLight?: boolean): void;
// src/systems/FxSystem.ts (method, after critRing)
firstLightRing(x: number, y: number): void;
```

### Steps
1. `run.ts`: add `private firstShardPickedUp = false;` plus `firstShardPickup()` returning true on first call then false (copy the `firstSighting` shape minus the Set). Per-run by construction; never localStorage.
2. `Sfx.pickup`: replace the hz line with `const lift = firstLight ? 12 : gilt ? 1 : 0;` then `const hz = 523.25 * 2 ** ((this.comboStep + lift) / 12);`. Keep `this.tone('triangle', hz, hz, 0.12, 0.16)` — same gain/wave, combo/throttle untouched.
3. `FxSystem`: emitter like `critRings` but `scale: { start: 0.29, end: 0.86 }` (TEX.ring radius 28 u → grows 8→24 u), `lifespan: 300`, `alpha: { start: 1, end: 0 }`, `tint: PALETTE.ink`; add `this.firstLightRings` to the `setDepth(DEPTH.fx)` list; method = `this.firstLightRings.explode(1, x, y);`.
4. `PickupSystem.update()`: `const first = this.run.firstShardPickup();` before `this.collect`; `if (first) this.fx.firstLightRing(s.x, s.y);` after `this.fx.pickup(s.x, s.y)`; call becomes `this.sfx.pickup(s.gilt, first);`. Repeat in `drop()`'s pool-full branch at `(x, y)`. Do not touch the `if (s.gilt) this.giltPop.show(...)` lines (the yellow "+N" pop still prints).
5. `core.test.ts`: `it('reports the first shard pickup exactly once per run', () => { const run = new RunState(1); expect(run.firstShardPickup()).toBe(true); expect(run.firstShardPickup()).toBe(false); expect(new RunState(2).firstShardPickup()).toBe(true); });`

### Pitfalls
- Gilt first shard must be +12, not +13: the octave *replaces* the semitone (the bigger lift wins).
- Don't reuse the `critRings` emitter (its scale 0.5→0.75 gives 14→21 u); a new emitter is required. The ring self-expires like `critRings` — no tween, no cleanup, no invariant, no GameScene change.
- `Sfx` is constructed fresh per run (GameScene line 125), so the run's first pickup is always comboStep 0 → exactly 1046.5 Hz, gilt or not.
- The pool-full `drop()` branch is a pickup (it already plays the pluck and gilt pop); first light must fire there too, or the effect could be consumed by the "wrong" shard.
- No HUD/key/scene/stat change; purely FX + audio; no layout work at 412x915 or 1280x720.

### Tests
- `tests/core/core.test.ts`: the once-per-run test from step 5.
