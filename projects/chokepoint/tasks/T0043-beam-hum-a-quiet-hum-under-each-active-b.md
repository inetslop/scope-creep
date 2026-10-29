---
id: T0043
title: "Beam hum: a quiet hum under each active beam"
assignee: cachyos-x8664
size: S
priority: 3
status: in-progress
depends_on: [T0073]
attempts: 2
created: 2026-10-28T11:24:34Z
claimed_at: 2026-10-29T02:08:04Z
epic: E4
---

## Goal
A beam is heard as well as seen: a very quiet continuous hum under each active beam, so how many beams are on is felt without looking.

## Details
- A new Sfx sound in the quiet family of the leak warning (T0014) and the tier chime (T0032), below the UI blips: one sustained 110 Hz sine at volume 0.05, with a 200 ms fade in when it starts and a 200 ms fade out when it stops. Sustained — a held oscillator — not a blip; closest example is the short sines of `Sfx.tierChime` (T0032), held instead of released.
- One hum per beam tower: it starts the instant that tower's beam locks onto a target and stops the instant the beam has no target. Retargeting (the beam jumps to the next target the instant its target dies or leaves range, per T0029) keeps the hum continuous — no fade out and back in.
- At most 3 hums at once: the first three beam towers to lock get a hum; a fourth or later tower stays silent until one of the humming towers releases, and the next lock then takes a free slot.
- No visuals, no per-tick sound, no change to any other sound.

## Acceptance criteria
- [ ] A beam tower locks onto a target: a quiet hum (110 Hz, ~0.05 volume) is audible within ~200 ms and continues for as long as the beam stays on.
- [ ] The beam's target dies and the beam retargets instantly: the hum never stops or fades.
- [ ] The beam's target leaves range with no new target in range: the hum fades out over ~200 ms.
- [ ] A second and a third beam tower locking on each adds its own hum.
- [ ] A fourth beam locking on adds no new hum; when one of the first three releases, the next lock takes its place.
- [ ] Non-beam towers make no hum, and all other sounds are unchanged.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` — one held hum per active beam: a `beamHums` field + `beamHumStart()`, `beamHumStop()`, `beamHumsStopAll()`
- edit `src/systems/BeamSystem.ts` — one hum call per target transition (file lands with T0029, which this depends on)
- edit `src/scenes/GameScene.ts` — one line in the existing `shutdown` handler (GameScene.ts:102): stop all hums when the scene goes away

### Interfaces
```ts
// Sfx.ts — field after `muted = false;`, methods after leakWarn() (its quiet family):
private beamHums: { osc: OscillatorNode; gain: GainNode }[] = [];

beamHumStart(): void {
  const ctx = this.ctx;
  if (!ctx || !this.master || this.muted || ctx.state !== 'running' || this.beamHums.length >= 3) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 110;
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.05, t + 0.2);
  osc.connect(gain).connect(this.master);
  osc.start(t);
  this.beamHums.push({ osc, gain });
}
beamHumStop(): void {
  const ctx = this.ctx;
  const hum = this.beamHums.pop();
  if (!ctx || !hum) return;
  const t = ctx.currentTime;
  hum.gain.gain.cancelScheduledValues(t);
  hum.gain.gain.setValueAtTime(hum.gain.gain.value, t);
  hum.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  hum.osc.stop(t + 0.22);
}
beamHumsStopAll(): void { while (this.beamHums.length > 0) this.beamHumStop(); }
```

### Steps
1. `src/audio/Sfx.ts`: add the field and the three methods, modeled on `tone()` (Sfx.ts:29) but with a *held* oscillator — `tone()` schedules a stop; a hum's oscillator lives until released. The `length >= 3` gate makes a fourth lock silent; a release pops a slot, the next lock takes it.
2. `src/systems/BeamSystem.ts`: if BeamSystem does not already take `sfx: Sfx | undefined` as its last constructor arg (TowerSystem.ts:36 pattern), add it and pass `sfx` at its construction in GameScene.ts. In the per-tower pass where the beam target resolves: none→target ⇒ `this.sfx?.beamHumStart();`, target→none ⇒ `this.sfx?.beamHumStop();`, target→a *different* target ⇒ **no call** (retargeting keeps the hum continuous).
3. `src/scenes/GameScene.ts`: inside the existing `this.events.once('shutdown', () => {...})` (line 102), after `hook.setBuildSpots(() => []);`, add `sfx?.beamHumsStopAll();`. Covers game over and quit-to-menu, so the pool is never clogged for the next run.

### Pitfalls
- start/stop must stay 1:1 per tower; the pool is anonymous (no per-tower state), so a lost pair clogs the 3-cap forever. Towers are never removed mid-run (no demolish) — only transitions + shutdown.
- 0.05 is pre-master gain (master is 0.25), same convention as leakWarn's 0.1 — do not renormalize. Never use `tone()`.
- Hum continues through pause and drafts (the beam is still locked and visible) — gate on lock only, not on phase. `muted` gates new starts only, like every other sound.
- WebAudio is real-time: no `dt`, no frame-rate coupling.

### Tests
none

## Note (PO, 2026-10-28, cycle 41)

No longer waits on the failed T0029: it now waits on **T0073**, the T0029 re-task that re-applies the salvage (`tasks/salvage/T0029.diff`) and lands the beam as `src/systems/BeamSystem.ts` — the file this design already targets. The design stands as written; if T0073's beam system is named or shaped differently, re-check this design against the landed code before building. Everything else (110 Hz sine, volume 0.05, 200 ms fades, one hum per beam tower, continuous through retargets, at most 3 at once) is unchanged.

## Attempt 1 failed (cachyos-x8664)

The agent reported it is blocked: BeamSystem.ts (landed by T0073) does not exist in the current code, so there is no beam target-resolution to attach the hum to.

```
I've verified the state of the codebase, and the dependency is not landed:

- `src/systems/BeamSystem.ts` does not exist (no `BeamSystem` anywhere in the tree).
- There is no beam attack kind in `AttackKind` (`content/types.ts`: only `shot`, `pulse`, `rally`, `mark`, `burn`), no beam augment in `src/content/augments/`, and a case-insensitive search for "beam" across `src/` matches nothing.

The design itself says the hum call-sites live in the beam's target-resolution pass ("the file lands with T0029, which this depends on"), and the PO note confirms this task waits on **T0073** to land the beam as `src/systems/BeamSystem.ts`. That hasn't landed yet — and per the note, its naming/shape may differ, so the call-sites can't be re-checked. Building the `Sfx.beamHums` machinery now would add dead code with no caller (no beam ever locks on, so no hum could start), and every acceptance criterion (audible hum under an active beam, continuity through retargets, the 3-hum cap under beam lock/release) would be unverifiable against a game with no beams at all.

Making no changes, per the rule for a task that makes no sense against the current code.

SUMMARY: The design's target file `src/systems/BeamSystem.ts` does not exist in the current code — there is no beam system, no `beam` attack kind, and no beam augment anywhere in `src/`. The task's own note says it waits on T0073 to land the beam (and to re-check the design against whatever shape T0073 lands); until that lands, the hum would be dead code with no caller and the acceptance criteria are unverifiable. No changes made; ready to build as-written once T0073 is in.

STATUS: BLOCKED: BeamSystem.ts (landed by T0073) does not exist in the current code, so there is no beam target-resolution to attach the hum to.
```
