---
id: T0112
title: "Beam hum: a quiet tone under each active beam (the T0043 re-file)"
assignee: asus
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T09:55:07Z
claimed_at: 2026-10-29T11:42:24Z
finished_at: 2026-10-29T12:23:40Z
epic: E4
---

## Goal
A beam is heard as well as seen: a very quiet continuous hum under each active beam, so how many beams are on is felt without looking. This re-files the failed T0043, whose wait (the Beam, T0073) has landed.

## Details
- A new Sfx sound in the quiet family of the leak warning (T0014) and the tier chime (T0032), below the UI blips: one sustained 110 Hz sine at volume 0.05 (pre-master, the T0043 convention — do not renormalize), with a 200 ms fade in when it starts and a 200 ms fade out when it stops. Sustained — a held oscillator, not a blip — the short sines of `Sfx.tierChime` (T0032) held instead of released.
- One hum per beam tower: it starts the instant that tower's beam locks onto a target and stops the instant the beam has no target. Retargeting (the beam jumps to the next target the instant its target dies or leaves range, T0073) keeps the hum continuous — no fade out and back in.
- At most 3 hums at once: the first three beam towers to lock get a hum; a fourth or later tower stays silent until one of the humming towers releases, and the next lock then takes a free slot.
- Silent when sound is off (T0035). All hums stop when the game scene goes away (game over, quit to menu), so the pool is never clogged for the next run.
- No visuals, no per-tick sound, no change to any other sound.
- The complete design already exists in the failed task's archive (`tasks/archive/T0043-beam-hum-a-quiet-hum-under-each-active-b.md`): the Sfx `beamHums` pool with start/stop/stopAll, the call-sites in the beam system's per-tower target pass (none→target: start; target→none: stop; retarget to a different target: no call), and one line in the scene's shutdown handler. T0043's three attempts were blocked only because the Beam had not landed yet — it has now (T0073, 2026-10-29). **Re-check the design's file names against the landed code first**: the design assumed `src/systems/BeamSystem.ts`; the landed beam system may be named differently (the system inventory lists it as "Beam") — the call-sites are the same, the landed file wins.

## Acceptance criteria
- [ ] A beam tower locks onto a target: a quiet hum (110 Hz, ~0.05 volume) is audible within ~200 ms and continues for as long as the beam stays on.
- [ ] The beam's target dies and the beam retargets instantly: the hum never stops or fades.
- [ ] The beam's target leaves range with no new target in range: the hum fades out over ~200 ms.
- [ ] A second and a third beam tower locking on each adds its own hum.
- [ ] A fourth beam locking on adds no new hum; when one of the first three releases, the next lock takes its place.
- [ ] Non-beam towers make no hum; all other sounds are unchanged; with sound off (T0035) no hum is heard; a run after game over starts with no hum.

## Design (architect, narcissus)

Beam hum — one held 110 Hz sine under each live beam line, max 3 at once. Three edits, no new files, no other sound touched. Verified against landed code: call-host is `src/systems/BeamSystem.ts` as the T0043 archive assumed; Sfx is the BootScene singleton (`registry.set('sfx')`, `src/scenes/BootScene.ts:19`) and outlives GameScene, so cleanup belongs in GameScene's existing `shutdown` handler.

### Files
- `src/audio/Sfx.ts` (edit): the hum pool + 3 methods; `muted = false;` becomes a getter/setter.
- `src/systems/BeamSystem.ts` (edit): 4th ctor param `sfx: Sfx | undefined`, per-tower hum state, transition calls in `update()`.
- `src/scenes/GameScene.ts` (edit): pass `sfx` at line 95; one line in the existing shutdown handler.

### Interfaces
Sfx additions:
```ts
private readonly beamHums = new Map<unknown, { osc: OscillatorNode; gain: GainNode }>();
beamHumStart(key: unknown): void   // held 110 Hz sine, vol 0.05 pre-master, 200 ms fade in; no-op without ctx/master, when muted, when key held, or when 3 slots are full
beamHumStop(key: unknown): void    // 200 ms fade out then osc.stop; exact no-op when key not held
stopBeamHums(): void               // beamHumStop for every held key
```
`muted = false;` → `private mutedFlag = false; get muted(): boolean { return this.mutedFlag; } set muted(on: boolean) { if (on === this.mutedFlag) return; this.mutedFlag = on; if (on) this.stopBeamHums(); }`. Existing reads/writes keep working unchanged: `tone()`'s `this.muted` check, the BootScene:19 write (ctx undefined there — safe), PauseScene:76/85 read/toggle (do not edit that file).

BeamSystem: `import type { Sfx } from '../audio/Sfx';`; ctor `(scene: Phaser.Scene, towers: TowerSystem, enemies: EnemySystem, sfx: Sfx | undefined)` stored `private readonly sfx: Sfx | undefined;`; add `private readonly humming = new Set<Tower>();`.

### Steps
1. Sfx: swap the `muted` field for the getter/setter above.
2. Sfx: add the map and the three methods next to `sting()`/`leakWarn()` (the quiet family). start: guard `!ctx || !this.master || this.muted || ctx.state !== 'running'`, then `this.beamHums.has(key) || this.beamHums.size >= 3`. Create osc (`type='sine'`, `frequency.value=110`) + gain: `setValueAtTime(0.0001, t); linearRampToValueAtTime(0.05, t + 0.2)` where `t = ctx.currentTime`; connect to `this.master`, `osc.start(t)`, store. Audio clock only — never `dt`, never `Math.random`. stop: delete from the map first, then `gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0.0001, t + 0.2); osc.stop(t + 0.22);`. stopBeamHums: `for (const k of [...this.beamHums.keys()]) this.beamHumStop(k);`
3. BeamSystem: add the ctor param/field and `humming`; in the `update()` loop, right after the `beamDps`/`beamExtras` `continue`, capture `const wasHumming = this.humming.has(t);`.
4. BeamSystem: turn `if (t.jammed) continue;` into a block that first releases: `if (t.jammed) { if (wasHumming) { this.sfx?.beamHumStop(t); this.humming.delete(t); } continue; }`.
5. BeamSystem: right after `this.held.set(t, now);`, before `if (main === -1) continue;`, add:
```ts
const on = now[0] !== undefined; // live main target this frame — the line's own visibility
if (on && !wasHumming) { this.sfx?.beamHumStart(t); this.humming.add(t); }
if (!on && wasHumming) { this.sfx?.beamHumStop(t); this.humming.delete(t); }
```
A retarget is on→on: no calls, the hum stays continuous.
6. GameScene: line 95 → `this.beams = new BeamSystem(this, this.towers, this.enemies, sfx);`; first line of the existing `shutdown` handler → `sfx?.stopBeamHums(); // held hums must not outlive the run (the Sfx singleton does)`.

### Pitfalls
- The Sfx singleton outlives GameScene: without step 6 every humming tower leaks a running oscillator into the next run. Shutdown fires on retry/menu/rewards (Phaser stops GameScene each time a new game starts).
- `beamHumStop` must stay a no-op for unheld keys: a muted or pool-full start is recorded in `humming` but not in Sfx, and later unconditional stops keep the counts balanced. Pool-full 4th tower: `humming.add(t)` still happens; its slot opens on the next fresh lock (off→on transition), per spec.
- Use `now[0] !== undefined`, not `main !== -1`: a beamTick kill in this frame leaves `main >= 0` one frame longer than the drawn line.
- 0.05 is pre-master (master gain is 0.25) — do not renormalize; change no other sound method, no visual, no per-tick call.
- Mute-on stops held hums; they resume only on the next lock transition after unmute. That is the intended T0035 coverage; don't touch PauseScene.

### Tests
None — audio only; `npm run check` and `npm run smoke` as usual.

## Result (attempt 1, asus)

Each active beam tower now gets a quiet sustained hum — a held 110 Hz sine at volume 0.05 (pre-master, the T0043 convention) with 200 ms fade in/out — added as a 3-slot pool (`beamHums` map + `beamHumStart`/`beamHumStop`/`stopBeamHums`) in `src/audio/Sfx.ts` beside the quiet-family sounds. `src/systems/BeamSystem.ts` (the landed beam system, same name the T0043 archive assumed) drives it per-tower from the main line's visibility: start on lock, stop when the beam has no target, no call on retarget, and a Mute-jammed tower releases its hum. `src/scenes/GameScene.ts` passes `sfx` into the system and stops all hums on scene shutdown so the Sfx singleton never carries oscillators into the next run; `muted` became a getter/setter so muting also silences held hums (T0035). No other sound, visual, or file was touched; `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 41.3 min

```
projects/chokepoint/game/src/audio/Sfx.ts          | 42 +++++++++++++++++++++-
 projects/chokepoint/game/src/scenes/GameScene.ts   |  3 +-
 projects/chokepoint/game/src/systems/BeamSystem.ts | 18 ++++++++--
 3 files changed, 59 insertions(+), 4 deletions(-)
```
