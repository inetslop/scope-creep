---
id: T0376
title: "The Flyer's sky note: the sky has its own quiet sound"
assignee: inet-racing
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T19:38:40Z
claimed_at: 2026-11-01T19:59:30Z
finished_at: 2026-11-01T20:15:26Z
epic: E10
---

## Goal
The sky gets its own sound: while any regular Flyer is in the air, one soft sustained tone plays, so the crossing is heard as distinct from the road's thuds.

## Details
- A single soft sustained tone plays for as long as at least one regular (non-boss) Flyer is alive in the sky: it fades in over ~200 ms when the first regular Flyer spawns, and fades out over ~200 ms when the last one dies or leaks.
- The tone is a held sine, quiet — volume 0.03, the beam hum's class (T0112) — and airy: one 660 Hz sine. The closest example is the beam hum's held tone, but here it is one shared tone for all Flyers at once (a refcount over regular Flyers), so it never gets louder as more cross.
- It rides the existing audio system: silent with sound off, in the menu, and whenever no regular Flyer is present.
- The wave-50 boss Flyer is excluded — it keeps its own arrival horn and death notes (T0312/T0302), unchanged.
- No HUD element, no text, no new button; nothing on the pause screen changes (it is ambient, like the beam hum and the beds).

## Acceptance criteria
- [ ] The moment a regular Flyer spawns, a soft sustained tone fades in (~200 ms) and holds until the last regular Flyer dies or leaks, then fades out (~200 ms).
- [ ] With several regular Flyers in the sky at once, the tone stays at its single 0.03 volume (it refcounts, it does not stack).
- [ ] The tone is silent with sound off, in the menu, and while no regular Flyer is present.
- [ ] The wave-50 boss Flyer is untouched (no sky note for it; its arrival horn and death notes are unchanged).
- [ ] No HUD element, text, or gameplay change; the rest of the game is byte-identical.
- [ ] Typecheck, lint, unit tests, and the desktop/mobile smoke pass.

## Design (architect, desktop)

### Files
- create `src/systems/enemyHooks/skyNote.ts` - the hook: while any regular Flyer is in the air, hold one shared 660 Hz tone (per-frame reconcile, zero state)
- edit `src/audio/Sfx.ts` - `skyNote` field next to `beamHums`; stop it in the `muted` setter; `skyNoteStart()`/`skyNoteStop()` after `stopBeamHums()`
- edit `src/systems/enemyHooks/index.ts` - import + one registry line, next to `flySpawn`
- edit `src/systems/RunFlow.ts` - one line in `endRun()`
- edit `src/scenes/GameScene.ts` - one line in the shutdown handler (like the beam hums)

### Interfaces
```ts
// audio/Sfx.ts — held tone, modeled exactly on beamHumStart/beamHumStop (Sfx.ts:158-191)
private skyNote: { osc: OscillatorNode; gain: GainNode } | undefined;
skyNoteStart(): void; // one 660 Hz sine, 0.03 pre-master, 200 ms linear fade-in; no-op when muted/locked/already held
skyNoteStop(): void;  // 200 ms linear fade-out; no-op when not held
```

### Steps
1. `Sfx.ts`: after the `beamHums` field (line 15) add `private skyNote: { osc: OscillatorNode; gain: GainNode } | undefined;`. Change the setter (line 13) to `set muted(on: boolean) { if (on === this.mutedFlag) return; this.mutedFlag = on; if (on) { this.stopBeamHums(); this.stopSkyNote(); } }`. After `stopBeamHums()` (line 191) add, mirroring `beamHumStart`/`beamHumStop` with freq 660 and volume 0.03:
```ts
  /** The sky's quiet note: one shared held 660 Hz sine while any regular Flyer is in the air (pre-master 0.03, the beam hum's quiet class), fading in over 200 ms. A no-op while it is already held. */
  skyNoteStart(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.muted || ctx.state !== 'running' || this.skyNote) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.03, t + 0.2);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    this.skyNote = { osc, gain };
  }

  /** The sky's note fades out over 200 ms; an exact no-op when it is not held. */
  skyNoteStop(): void {
    const note = this.skyNote;
    const ctx = this.ctx;
    if (!note || !ctx) return;
    this.skyNote = undefined;
    const t = ctx.currentTime;
    note.gain.gain.cancelScheduledValues(t);
    note.gain.gain.setValueAtTime(note.gain.gain.value, t);
    note.gain.gain.linearRampToValueAtTime(0.0001, t + 0.2);
    note.osc.stop(t + 0.22);
  }
```
2. Create `src/systems/enemyHooks/skyNote.ts` exactly:
```ts
import { bossId } from '../../core/waves';
import type { MakeEnemyHook } from './hook';

/**
 * The sky's quiet note: while at least one regular Flyer is in the air, one soft held 660 Hz tone
 * (Sfx's skyNoteStart/skyNoteStop, 0.03 pre-master, the beam hum's quiet class) — it fades in over
 * 200 ms when the first regular Flyer spawns and out when the last one dies or leaks. One shared
 * tone for every Flyer at once: it refcounts to "at least one", it never stacks. The boss Flyer
 * (T0317) is excluded: it keeps its own arrival horn and death notes. Reconciled every frame like
 * the beam hum: start and stop are idempotent, so the hook keeps no state.
 */
export const skyNote: MakeEnemyHook = ({ run, enemies, sfx }) => ({
  update() {
    const bossFlyer = bossId(run.wave) === 'flyer';
    let any = false;
    for (const e of enemies.all) {
      if (!bossFlyer && e.active && e.def.id === 'flyer') { any = true; break; }
    }
    if (any) sfx?.skyNoteStart();
    else sfx?.skyNoteStop();
  },
});
```
3. `src/systems/enemyHooks/index.ts`: add `import { skyNote } from './skyNote';` on the line after the `flySpawn` import (line 16), and `skyNote,` on the line after `flySpawn,` in `ENEMY_HOOKS` (line 72).
4. `src/systems/RunFlow.ts` `endRun()` (line 264): as the first statement add `this.s.sfx?.stopSkyNote(); // the sky's note must not ring over the end card (its flyers may still be in the air)`.
5. `src/scenes/GameScene.ts` shutdown handler (line 193): after `sfx?.stopBeamHums();` add `sfx?.stopSkyNote(); // the sky's note must not outlive the run, like the hums`.

### Pitfalls
- The hook calls start/stop **every frame of every wave**: both Sfx methods must keep the early-returns (already-held / not-held) — never a second oscillator, never a per-flyer one.
- The `muted` setter must stop the note (step 1) or it keeps sounding with sound off. Re-calling `skyNoteStart()` every frame is what makes unmute self-heal (it early-returns while muted, so no double tone).
- Stuck-tone path: hook `update` runs only in the `wave` phase. A run that ends mid-wave with a Flyer airborne (lives hit 0, or quit from pause — both converge on `RunFlow.endRun`) would leave the held tone ringing over the game-over card; step 4 closes it, step 5 mirrors the beam hums' teardown.
- Boss exclusion is `bossId(run.wave) === 'flyer'`, NOT `e.def.flies` — T0317 may reuse the flyer def for its boss. Today `bossId` never returns `'flyer'`, so every current Flyer counts and the exclusion is a no-op until T0317 lands; no dependency on it either way.
- 0.03/660 Hz are pre-master values (master gain 0.25), exactly the beam hum's class — do not rescale, and keep `0.0001`/`t + 0.22` as in `beamHumStop`.
- No module-level state in the hook file; the closure holds none. Ignore the `dt` argument (`update()` with no parameter is the existing style, cf. `bossArrival`).

### Tests
- none (audio task; no rule in src/core changes)

## Result (attempt 1, inet-racing)

The sky now has its own quiet sound: a new enemy hook (`src/systems/enemyHooks/skyNote.ts`, registered next to `flySpawn`) reconciles every frame during a wave — the moment at least one regular Flyer is in the air, Sfx holds one shared 660 Hz sine at 0.03 pre-master (the beam hum's quiet class), fading in/out over 200 ms via new `skyNoteStart()`/`skyNoteStop()` in `src/audio/Sfx.ts`; it refcounts to "at least one" so it never stacks, the boss Flyer is excluded via `bossId()`, and the note is stopped when sound is muted, when the run ends (`RunFlow.endRun()`), and on scene shutdown (`GameScene.ts`), mirroring the beam hums. No HUD, text, or gameplay changes.

- Self-review: APPROVE
- Time: 15.9 min

```
projects/chokepoint/game/src/audio/Sfx.ts          | 33 +++++++++++++++++++++-
 projects/chokepoint/game/src/scenes/GameScene.ts   |  1 +
 projects/chokepoint/game/src/systems/RunFlow.ts    |  1 +
 .../game/src/systems/enemyHooks/index.ts           |  2 ++
 .../game/src/systems/enemyHooks/skyNote.ts         | 22 +++++++++++++++
 5 files changed, 58 insertions(+), 1 deletion(-)
```
