---
id: T0419
title: "The Mute's silence gets its note"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T10:55:36Z
claimed_at: 2026-11-02T13:14:38Z
---

## Goal
The Mute is the only enemy that holds the player's towers still, and its silence currently shows only as a quiet ring under the token (T0219) — a player looking at the hand or the panel misses it entirely. One soft held tone plays while any Mute holds a tower, the sky note's own pattern (T0376), so the silence is heard where the eye is not.

## Details
- One held tone, shared by the state: the moment any live Mute first holds a tower within its 2-cell reach, the note fades in over ~250 ms; the moment the last holding Mute stops — it dies, or walks out of every tower's reach — it fades out over ~250 ms. Not one tone per Mute: one tone for "a Mute is holding towers", the sky note's "any Flyer in the air" rule.
- The tone: one held sine at C3 (130.81 Hz), volume 0.05 — the beam hum's own quiet class (T0112), a step above the beam hum's A2 and out of the wave bed's E–G–A loop, so it reads as its own calm held note and never nears the leak thud's class. A new method in Sfx, the sky note's own start/stop-with-fade pattern.
- The trigger is a new enemy hook that reconciles every frame during a wave (the sky note's own hook shape), reading the silence the same way the Mute's own ring does (T0219's per-frame read); the hook drives only the tone.
- The Mute's own data, its ring, the towers' behavior and the wave bed are untouched — this adds a listener, not a change. Silent with sound off (Sfx's own guard); no Mute in reach, no note.
- No new key, button, HUD element or board mark; the pause screen is untouched.

## Acceptance criteria
- [ ] The moment a Mute first holds a tower within its 2-cell reach, a soft held tone (C3, volume 0.05) fades in over ~250 ms, and it stays continuous for as long as any Mute holds any tower (no gap while a Mute walks from one tower's reach into another's)
- [ ] The moment the last holding Mute stops, the tone fades out over ~250 ms; it is gone by the wave's end, and a Mute that never reaches a tower never starts it
- [ ] With sound off, nothing plays; the Mute's ring, the beam hum, the wave bed and the Mute's data are byte-identical to before
- [ ] No new key, button, HUD element or board mark; `npm run check` and the desktop + mobile smoke pass

## Design (architect, desktop)

### Files
- create `src/systems/enemyHooks/muteNote.ts` — one held note while any Mute holds a tower; reads the silence the same way `muteJam.ts` does, drives only the Sfx.
- edit `src/audio/Sfx.ts` — one field, two methods (`muteNoteStart`/`muteNoteStop`, the `skyNoteStart`/`skyNoteStop` pattern), and one call in the `muted` setter.
- edit `src/systems/enemyHooks/index.ts` — one import line + one line in `ENEMY_HOOKS`.
- edit `src/scenes/GameScene.ts` — one line in the `shutdown` handler (after the `skyNoteStop` line, line 194).
- edit `src/systems/RunFlow.ts` — one line in `endRun()` (after the `skyNoteStop` line, line 273).

### Interfaces
In `Sfx` (private field next to `private skyNote: ...` at line 17, methods next to `skyNoteStop` at line 239):

```ts
/** The Mute's silence: one shared held note while any Mute holds a tower still, and only once. */
private muteNote: { osc: OscillatorNode; gain: GainNode } | undefined;

/** The Mute's held note: one shared sine at C3 (130.81 Hz) while any Mute silences a tower (pre-master 0.05, the beam hum's quiet class, a step above its A2): fades in over 250 ms. A no-op while it is already held. */
muteNoteStart(): void {
  const ctx = this.ctx;
  if (!ctx || !this.master || this.muted || ctx.state !== 'running' || this.muteNote) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 130.81;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.05, t + 0.25);
  osc.connect(gain).connect(this.master);
  osc.start(t);
  this.muteNote = { osc, gain };
}

/** The Mute's note fades out over 250 ms; an exact no-op when it is not held. */
muteNoteStop(): void {
  const note = this.muteNote;
  const ctx = this.ctx;
  if (!note || !ctx) return;
  this.muteNote = undefined;
  const t = ctx.currentTime;
  note.gain.gain.cancelScheduledValues(t);
  note.gain.gain.setValueAtTime(note.gain.gain.value, t);
  note.gain.gain.linearRampToValueAtTime(0.0001, t + 0.25);
  note.osc.stop(t + 0.27);
}
```

`muted` setter (line 13): append `this.muteNoteStop();` after `this.skyNoteStop();` inside `if (on) { ... }`.

### Steps
1. Create `src/systems/enemyHooks/muteNote.ts`. Model it on `skyNote.ts` (stateless, idempotent start/stop) but read reach the way `muteJam.ts` does (its `MUTE_REACH = 2` and squared-distance test):
```ts
import { CELL } from '../../config';
import type { MakeEnemyHook } from './hook';

/** Cells of road a Mute silences: the same reach its ring shows (muteJam.ts). */
const MUTE_REACH = 2;

/**
 * The Mute's held note: while any live Mute holds a tower still within its two-cell circle, one soft
 * held C3 tone (Sfx's muteNoteStart/muteNoteStop, 0.05 pre-master, the beam hum's quiet class) — one
 * shared tone for every Mute at once: it refcounts to "at least one", it never stacks. Reconciled
 * every frame like the sky note: start and stop are idempotent, so the hook keeps no state.
 */
export const muteNote: MakeEnemyHook = ({ enemies, towers, sfx }) => ({
  update() {
    const r2 = MUTE_REACH * MUTE_REACH * CELL * CELL;
    let holding = false;
    for (const e of enemies.all) {
      if (!e.active || e.def.id !== 'mute') continue;
      if (towers().some((t) => (e.x - t.x) ** 2 + (e.y - t.y) ** 2 <= r2)) { holding = true; break; }
    }
    if (holding) sfx?.muteNoteStart();
    else sfx?.muteNoteStop();
  },
});
```
2. In `Sfx.ts`: add the field after the `skyNote` field (line 17), the two methods after `skyNoteStop()` (line 239), and the setter line.
3. In `src/systems/enemyHooks/index.ts`: add `import { muteNote } from './muteNote';` after the `skyNote` import (line 18), and one line `muteNote,` in `ENEMY_HOOKS` after `skyNote,` (line 84).
4. In `GameScene.ts`'s `shutdown` handler, after line 194 add: `sfx?.muteNoteStop(); // the Mute's note must not outlive the run, like the sky's`.
5. In `RunFlow.ts`'s `endRun()`, after line 273 add: `this.s.sfx?.muteNoteStop(); // the Mute's note must not ring over the end card (its Mutes may still be holding)`.

### Pitfalls
- Do not touch `muteJam.ts`, `Tower.ts`, `Sfx`'s existing hums/note, or any content file — this is a listener; `muteJam` keeps setting `jammed`, the hook only reads the same geometry.
- No hook state: `start`/`stop` are idempotent, so a Mute walking from one tower's reach into another's never gaps (every frame while any holds, `muteNoteStart` is a no-op) and the note never stacks per Mute.
- The hook `update` runs in `EnemySystem.update` *after* enemies move and leak (`onLeak` then `update`, EnemySystem.ts:126-130), so the last holding frame always stops the tone — "gone by the wave's end" falls out; no `onLeak` needed.
- The Sfx singleton outlives the run: without steps 4-5 the tone would ring over the end card; without the setter line it would ring while muted.
- Keep the guard order exactly like `skyNoteStart` (`!ctx || !this.master || this.muted || ctx.state !== 'running' || this.muteNote`) so muted/locked audio is byte-silent.

### Tests
- none (audio + enemy hook; no `src/core` rule added or changed)
