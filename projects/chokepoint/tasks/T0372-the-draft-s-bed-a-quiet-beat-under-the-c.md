---
id: T0372
title: "The draft's bed: a quiet beat under the card pick"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T18:12:12Z
claimed_at: 2026-11-01T18:53:15Z
finished_at: 2026-11-01T19:02:24Z
---

## Goal
The pick is the run's biggest decision, but it is the only beat of the run's loop with no bed: the build has its quiet pulse (T0365), the wave has its heartbeat (T0239), and the draft is silent under its tier chime. A quiet, sparser beat under the card pick completes the three-beat loop T0365 framed (calm build, the wave's heartbeat, the draft's pick), so the run's phases stay distinct to hear.

## Details
- A new generative bed in its own file, modeled on the build bed (`src/audio/buildBed.ts`, T0365 — the closest example): a 3-note sine loop (G2, E3, G3) at 1.2 s steps, volume 0.025 — slower, sparser and a touch quieter than the build bed's 4-note (E2, B2, E3, G3) 0.8 s / 0.03 loop, and clearly distinct from the wave bed's 8-note E–G–A 0.4 s / 0.04 loop, so the three beds never blur into one.
- The draft scene owns its bed: it fades in over 0.6 s the moment the draft opens (the cards' flip starts on top of it) and fades out over 0.6 s the moment the pick commits and the draft closes — one start point, one stop point, in the draft scene's own open/close. A reroll (T0276) keeps the draft open — the bed keeps playing, no re-fade.
- No forms of it: no last-stand form, no Iron form, no quicken — the pick's calm is the same at any stakes. The build bed's last-stand form (T0342) and the wave bed's quicken are untouched, and the build bed (T0365) and wave bed (T0239) stay byte-identical.
- Silent in the menu, during the build phase, during waves and while paused; obeys the pause screen's sound toggle (T0035) like the other beds.
- The draft's tier chime (T0032), the card flip (T0024) and the Epic frame shimmer (T0041) are unchanged. No HUD, no new button or key, no text.

## Acceptance criteria
- [ ] Opening the draft — the pre-wave-1 pick and every pick after a cleared wave — fades the bed in over 0.6 s, and committing a card fades it out over 0.6 s; the bed is silent in the menu, during the build phase, during waves, while paused, and when the sound is off.
- [ ] The loop is exactly 3 sine notes (G2, E3, G3) at 1.2 s steps and 0.025 volume — slower, sparser and quieter than the build bed, distinct from the wave bed; the build bed, the wave bed and the last-stand bed form are byte-identical to before.
- [ ] A reroll keeps the bed playing with no re-fade; the tier chime, the flip and the Epic shimmer are unchanged; a run plays end to end from the first pick to game over.

## Design (architect, desktop)

### Files
- create `src/audio/draftBed.ts` - the draft's quiet 3-note bed class (`DraftBed`), a trimmed copy of `src/audio/buildBed.ts`
- edit `src/scenes/DraftScene.ts` - own the bed: construct in `create()`, drive in a new `update()`, stop in a new `shutdown()`
- edit `src/debug/runChecks.ts` - one invariant line + its import

### Interfaces
`src/audio/draftBed.ts` (copy `buildBed.ts` verbatim, then apply exactly these changes; nothing else):
```ts
const DECAY_SEC = 0.5, FADE_SEC = 0.6, STEP_SEC = 1.2, VOL = 0.025;
const NOTES = [98, 164.81, 196]; // G2 E3 G3
```
- rename the class `BuildBed` → `DraftBed`; rewrite its doc comment (3-note loop under the draft's card pick: 1.2 s steps, 0.5 s decays, 0.025 pre-master — slower, sparser, quieter than the build bed; fades in 0.6 s when the draft scene opens, fades out 0.6 s when a pick commits (the scene's stop); a reroll keeps it playing; silent under the pause screen and when muted).
- delete the `LOW_NOTES` line and the `private lastStand = false;` field (no forms).
- `update(dt: number, playing: boolean): void` — drop the `lastStand` parameter and its two lines (`if (this.lastStand !== lastStand) {...}` and `const notes = ...`); the loop body becomes `while (this.acc >= STEP_SEC) { this.acc -= STEP_SEC; this.playNote(NOTES[this.step % 3]!); this.step += 1; }`
- `stop()`: delete the `this.lastStand = false;` line only.
- `broken()`: message → `` `${this.liveNotes} notes still ringing in the draft bed` `` (same `> 2` threshold; a note rings 0.52 s, the step is 1.2 s, so at most one is alive).

`src/scenes/DraftScene.ts`:
```ts
import { DraftBed } from '../audio/draftBed';   // after the phaser import

export class DraftScene extends Phaser.Scene {
  private picked = false;
  bed: DraftBed; // the draft's quiet bed: its shutdown stops it, runChecks reads it while the draft is open
```
- in `create()`, right after `hook.overlay = SCENES.draft;`: `this.bed = new DraftBed(getSfx(this));`
- new methods between the constructor and `create()`:
```ts
  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.bed.update(dt, !this.scene.isActive(SCENES.pause)); // silent under the pause screen, like the other beds
  }

  shutdown(): void {
    this.bed.stop(); // the pick's fade-out and ringing notes must not outlive the draft (the Sfx context is the singleton's)
  }
```

`src/debug/runChecks.ts`:
- import: `import { DraftScene } from '../scenes/DraftScene';` next to the existing `import type { GameScene } from '../scenes/GameScene';`
- one line directly after `['buildBed.valid', (g) => g.buildBed.broken()],`:
```ts
  ['draftBed.valid', (g) => (g.scene.isActive(SCENES.draft) ? (g.scene.get(SCENES.draft) as DraftScene).bed.broken() : null)],
```

### Steps
1. Create `src/audio/draftBed.ts` by copying `src/audio/buildBed.ts` and applying the exact changes above.
2. Edit `src/scenes/DraftScene.ts`: import, public `bed` field, construction in `create()`, `update()`, `shutdown()`.
3. Edit `src/debug/runChecks.ts`: import + the one invariant line.
4. Run `npm run check` — must pass.

### Pitfalls
- Do not touch `src/audio/buildBed.ts`, `src/audio/music.ts`, `src/audio/Sfx.ts`, `core/bedForm.ts` or `systems/RunFlow.ts` — the build bed, wave bed and last-stand form must stay byte-identical, and no new Sfx method is needed.
- The draft scene keeps running while the pause card overlays it (only GameScene pauses), so the `!this.scene.isActive(SCENES.pause)` gate in `update()` is what makes it "silent while paused"; a pause over the draft re-opens the bed with a fresh 0.6 s fade on resume, same as the other beds restarting after a pause.
- Reroll: change nothing in `reroll()` — the scene stays open, so the bed keeps playing with no re-fade. Do not add a `stop()` call there.
- One start point, one stop point: the bed starts lazily on the first `update()` after `create()` and stops only in `shutdown()` (fired by `pick()`'s `scene.stop()`, possibly 150 ms later for the first-run hint). No re-fade anywhere else.
- The fade-out and the ring-out keep going after the scene is shut down because they live on the Sfx singleton's WebAudio context, not on scene objects — do not schedule anything on the scene after stop.
- Keep the step accumulator (`acc`) and `dt` clamp exactly as in `buildBed.ts`; never assume 60 fps.

### Tests
- none (audio task; no `src/core` rule changes)

## Result (attempt 1, desktop)

Added the draft's quiet generative bed — a new `src/audio/draftBed.ts` (`DraftBed`, a 3-note G2/E3/G3 sine loop at 1.2 s steps and 0.025 volume, 0.6 s fades, no forms), owned by `DraftScene` (constructed in `create()`, driven by a new `update()` gated on the pause screen, stopped on scene shutdown) and guarded by a new `draftBed.valid` invariant in `runChecks.ts`. Two minimal deviations from the design, both forced by the real code: the `bed` field needs the `!` definite-assignment marker (strict property initialization; matches `GameScene.buildBed!`), and the stop is wired as `this.events.once('shutdown', …)` in `create()` instead of a `shutdown()` method override, because Phaser 3.90 dispatches `shutdown` only as an event and would never call a user scene's `shutdown()` method (verified in the Phaser dist; every other scene here uses the same `events.once` convention). `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 9.2 min

```
projects/chokepoint/game/src/audio/draftBed.ts    | 80 +++++++++++++++++++++++
 projects/chokepoint/game/src/debug/runChecks.ts   |  2 +
 projects/chokepoint/game/src/scenes/DraftScene.ts |  9 +++
 3 files changed, 91 insertions(+)
```
