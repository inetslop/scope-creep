---
id: T0342
title: "The last stand's bed: the wave's music knows the run is at one life"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T05:50:54Z
---

## Goal
The last stand (exactly one life left, kills paying double) is the run's loudest state on screen — the red lives, the banner, the entry sting — but the wave's bed (T0239) never changes under it. Give the bed its own last-stand form so the run's climax is heard the whole time it lasts, not only at its door.

## Details
- While the run's last stand is on — the same state that gates the double kill gold (exactly 1 life; off in Iron, as that rule is) — and the wave bed is playing, the bed wears the last-stand form:
  - the 8-note heartbeat plays the same pattern one octave lower, same 0.4 s step, same 0.04 volume;
  - one quiet held note sits under the heartbeat: the loop's root (E), one octave below the transposed heartbeat, at half the heartbeat's volume (0.02), held for as long as the form lasts;
  - the exit warning's quicken (the bed's existing state, T0239) still applies on top, unchanged — a quickened last stand is the quickened steps in the lower register with the drone.
- Entry: the moment the last stand turns on (the same trigger the sting, T0091, plays on), the bed crossfades from whatever it is playing to the last-stand form over ~1 s — no hard cut, no second sting, no new one-shot sound.
- Exit: the moment the last stand turns off (a life comes back to 2 — the streak's payback, or a later Mend), the bed crossfades back to the normal form over ~1 s during the current wave. If the wave ends while the form is on, the bed's existing 0.5 s wave-end fade applies and the next wave starts in the last-stand form.
- The normal-state bed stays byte-identical to today: same notes, step, volume, fades, quicken. The last-stand form is a new pattern defined next to it (a new file is fine), selected by the run's last-stand state.
- The bed reads the last-stand state on its own clock, the way it already reads the exit warning's state: the change stays inside the audio module and its tests — no new scene wiring, no new input, nothing new on screen, and the build phase is untouched.
- The form follows the rule's state and is unaffected by the 2x fast-forward (audio time, not sim time). Sound off stays silent as everything else.

## Acceptance criteria
- [ ] A leak to 1 life during a wave: from the last-stand banner, the bed is crossfading to the lower form with the held root note, complete ~1 s later; the moment before the trigger the bed is byte-identical to today.
- [ ] While the form is on, the exit warning still quickens on top (today's quicken, lower register plus drone), and lifts again when the warning clears.
- [ ] A life restored to 2 (the streak's payback) crossfades the bed back to the normal form over ~1 s, still within the current wave.
- [ ] An Iron run never hears the last-stand form.
- [ ] At 2x the form's sound and its crossfade timing are unchanged (real audio time).
- [ ] The variant selection is a pure function — (last stand on/off, quicken on/off) to form and step — with unit tests covering all four combinations; `npm run check` and `npm run smoke` pass.

## Design (architect, inet-racing)

### Files
- create `src/core/bedForm.ts` - pure form selection `(lastStand, quicken) → form and step` (no Phaser, no WebAudio), holding the loop's notes and volumes
- edit `src/audio/music.ts` - `MusicBed` plays the selected form: new `lastStand` flag, one held drone oscillator with a 1 s in/out fade, `update()` gains two parameters, `note()` reads the form, `stop()` resets the form and ends the drone
- edit `src/scenes/GameScene.ts` - one line, `update()` line 215: pass real `dt` and `isLastStand(this.run)` (already imported at line 2)
- create `tests/core/bedForm.test.ts` - unit tests for all four combinations

### Interfaces
```ts
// src/core/bedForm.ts
export const BED_NOTES = [164.81, 164.81, 196, 164.81, 130.81, 164.81, 196, 220]; // E3 E3 G3 E3 C3 E3 G3 A3
export interface BedForm {
  readonly notes: readonly number[];  // the 8-note loop in the form's register
  readonly stepSec: number;           // seconds per step, the quicken applied
  readonly vol: number;               // heartbeat pre-master volume
  readonly echoVol: number;           // the quicken's octave-up voice (0 = absent)
  readonly drone: number;             // held root frequency (0 = absent)
  readonly droneVol: number;          // drone pre-master volume (0 = absent)
  readonly realTime: boolean;         // step clock: real audio seconds (last stand) vs sim seconds (normal)
}
export function bedForm(lastStand: boolean, quicken: boolean): BedForm;
// values: normal {notes: BED_NOTES, stepSec: 0.4|0.2, vol: 0.04, echoVol: 0|0.03, drone: 0, droneVol: 0, realTime: false}
// last stand {notes: BED_NOTES.map(f => f / 2), stepSec: 0.4|0.2, vol: 0.04, echoVol: 0|0.03, drone: BED_NOTES[0]! / 4 (=41.2025, E1), droneVol: 0.02, realTime: true}

// src/audio/music.ts — new signature (everything else in the class unchanged):
update(dt: number, simDt: number, playing: boolean, lastStand: boolean, danger: boolean): void;
```
In `music.ts` remove the local `NOTES`, `STEP_SEC`, `VOL`, `DANGER_VOL` constants (moved to `bedForm.ts` as the exact same numbers); keep `DECAY_SEC`, `FADE_SEC`; add `const FORM_FADE_SEC = 1.0;`. New class fields: `private lastStand = false; private droneOsc: OscillatorNode | undefined; private droneGain: GainNode | undefined;`.

`update` body (replaces lines 24–34):
```ts
    if (playing && this.sfx && !this.sfx.muted) {
      if (!this.started) this.start();
      const form = bedForm(lastStand, danger);
      if (this.danger !== danger || this.lastStand !== lastStand) {
        this.danger = danger; this.lastStand = lastStand; this.acc = 0; // new form's first note comes a full step away
      }
      if (lastStand) this.startDrone(form); else this.endDrone(FORM_FADE_SEC); // level-based: a fresh wave re-enters the form
      this.acc += form.realTime ? dt : simDt; // the last-stand form keeps its 0.4 s step at 2× fast-forward
      while (this.acc >= form.stepSec) { this.acc -= form.stepSec; this.note(form); }
      return;
    }
    if (this.started) this.stop();
```
`note(form: BedForm)` replaces line 71–73: `const f = form.notes[this.step % 8]!; this.playNote(f, form.vol); if (form.echoVol > 0) this.playNote(f * 2, form.echoVol); this.step += 1;`

```ts
  /** The held root under the last-stand form: one constant sine, faded in/out over FORM_FADE_SEC, hung under the bed's own gain. */
  private startDrone(form: BedForm): void {
    const { ctx, gain } = this;
    if (!ctx || !gain || this.droneOsc || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = form.drone;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(form.droneVol, t + FORM_FADE_SEC);
    osc.connect(g).connect(gain);
    osc.start(t);
    this.droneOsc = osc; this.droneGain = g;
  }

  /** Fades the drone out over `fade` and clears it at once, so a fast 1↔2 toggle never stacks drones. */
  private endDrone(fade: number): void {
    const { ctx, droneOsc, droneGain } = this;
    this.droneOsc = undefined; this.droneGain = undefined;
    if (!ctx || !droneOsc || !droneGain) return;
    const t = ctx.currentTime;
    droneGain.gain.cancelScheduledValues(t);
    droneGain.gain.setValueAtTime(droneGain.gain.value, t);
    droneGain.gain.linearRampToValueAtTime(0.0001, t + fade);
    droneOsc.stop(t + fade + 0.05);
  }
```
In `stop()`, after `this.danger = false;` add `this.lastStand = false;` (the next wave re-enters the form and the drone fades in again) and call `this.endDrone(FADE_SEC);` BEFORE the `const { ctx, gain } = this; this.ctx = undefined; ...` lines.

GameScene line 215 becomes:
```ts
    this.music.update(dt, simDt, this.run.phase === 'wave', isLastStand(this.run), this.exitWarn.live); // after, so `live` is this frame's
```

### Steps
1. Create `src/core/bedForm.ts` exactly as above (module doc comment: the wave bed's form, pure).
2. Edit `src/audio/music.ts`: swap constants for `import { bedForm } from '../core/bedForm';` (type-only use — import the value), add fields, rewrite `update`, `note`, add `startDrone`/`endDrone`, patch `stop`, update the class doc comment to mention the last-stand form.
3. Edit the one line in `src/scenes/GameScene.ts`.
4. Create `tests/core/bedForm.test.ts` (imports `'../../src/core/bedForm'`).
5. `npm run check`, then `npm run smoke`.

### Pitfalls
- The drone must connect to the bed's gain node (`this.gain`), not `a.master`: that is what makes the 0.5 s wave-end fade and the wave-start fade cover it ("the next wave starts in the last-stand form" = the drone's 1 s ramp riding on the 0.5 s bed fade).
- `stop()` must reset `lastStand` so a new wave re-triggers the drone, but the flag edge in `update` must not otherwise re-fire (it is level-based for the drone, edge-based only for the `acc` reset).
- Do not touch `playNote`, `start`, `broken`, `liveNotes` — the normal form stays byte-identical (same constants, same `acc` reset on `danger` change).
- `endDrone` clears its references synchronously while the old oscillator finishes ramping silently under the fading bed gain; never `disconnect` in a frame callback race — `osc.stop()` handles teardown.
- 41.2 Hz is very low; that is the spec (root one octave below the E2 transposed heartbeat) — do not "fix" it to E2.
- The form's step clock is real `dt` (clamped 0.05 s in GameScene), so the while-loop adds at most one note per frame; no unbounded catch-up.

### Tests
`tests/core/bedForm.test.ts`, one `it` per combination of `(lastStand, quicken)`: (false,false) normal — notes deep-equal `[164.81, 164.81, 196, 164.81, 130.81, 164.81, 196, 220]`, stepSec 0.4, vol 0.04, echoVol 0, drone 0, realTime false; (false,true) — stepSec 0.2, echoVol 0.03, rest as normal; (true,false) — notes each value halved, stepSec 0.4, echoVol 0, drone 41.2025 (expect `BED_NOTES[0]! / 4`), droneVol 0.02, realTime true; (true,true) — stepSec 0.2, echoVol 0.03, drone as above.
