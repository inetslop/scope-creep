---
id: T0397
title: "The menu's bed: a quiet beat under the menu"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T01:41:53Z
---

## Goal
The menu — where the next run is planned (tech spending, the codex, the mode pick, the board pick) — is the only space of the run without a beat: the wave has its heartbeat (T0239), the build its calmer beat (T0365), the draft its sparsest (T0372). A quiet fourth bed under the menu closes the audio design, so the run's loop gets its rest before the first build.

## Details
- A new quiet generative bed in a new file beside `src/audio/buildBed.ts` and `src/audio/draftBed.ts` (the closest examples — the same shape: a small class on Sfx's WebAudio context, sine notes, fades, nothing else): a 3-note sine loop **E2, B2, E3** at **1.6 s steps, volume 0.02** — the calmest of the four beds (the draft bed is 0.025, the build bed 0.03) — with **0.6 s fades** in and out. No forms: the menu has no run state to form from.
- Owned by the menu scene exactly like the draft bed is owned by the draft scene (T0372): created when the menu scene starts, destroyed on its shutdown. Whatever the menu scene does when an overlay card opens over it (Tech, How, the codex, the board pick), the bed follows the scene — no extra wiring, no per-card logic.
- The bed plays only in the menu's own space: it stops the moment a run starts (Play, Ghost or Iron) and never plays during a run, in a pause reference, or on the game-over or rewards screens. The run's beds keep their own phases (the build bed is already silent in the menu).
- Silent when the profile's sound is off (the same remembered preference the pause's Sound toggle writes, T0035) — the other beds' own guard.
- The live menu demo is untouched: whatever it sounds like today, it is unchanged, and the bed is the menu's only new sound.
- No new key, button, HUD element or toggle; the pause screen is untouched. T0398 (the Iron card's third clause) edits the same menu scene; the same-file edits serialize, either order.

## Acceptance criteria
- [ ] Opening the menu (fresh or back from a run) fades the quiet 3-note bed in over 0.6 s; starting a run (Play, Ghost or Iron) fades it out, and no run, draft, wave, pause or end screen ever plays it.
- [ ] While an overlay card (Tech, How, codex or the board pick) is open, the bed does whatever the menu scene does — it is never a second, competing sound in any scene.
- [ ] Sound off in the profile → the menu is silent; sound on → the bed is audible at 0.02, quieter than the draft bed's 0.025.
- [ ] The menu's layout, cards, demo and profile are byte-identical; the desktop + mobile smoke run passes.

## Design (architect, desktop)

### Files
- create `src/audio/menuBed.ts` - the menu's quiet 3-note bed (a copy of `src/audio/draftBed.ts` with the exact changes listed in Steps)
- edit `src/scenes/MenuScene.ts` - create the bed in `create()`, stop it on `shutdown`, update it in `update()` (3 insertion points, nothing else)
- edit `src/debug/runChecks.ts` - one invariant line + one import

### Interfaces
The new class mirrors `DraftBed` exactly (same private fields `ctx`, `gain`, `started`, `acc`, `step`, `liveNotes`, and byte-identical `start()`/`playNote()`/`stop()` bodies from `draftBed.ts`):

```ts
export class MenuBed {
  constructor(private readonly sfx: Sfx | undefined);
  /** dt = real seconds; playing = the menu is open (call it with true). */
  update(dt: number, playing: boolean): void;
  /** Fades the bed out over 0.6 s; a no-op when not started; call it from the scene's shutdown too. */
  stop(): void;
  /** Invariant: a note rings 0.52 s and the step is 1.6 s, so at most one is alive. */
  broken(): string | undefined;
}
```

### Steps
1. Copy `src/audio/draftBed.ts` to `src/audio/menuBed.ts`, then change exactly these lines (everything else stays byte-identical, including `start()`, `playNote()`, `stop()` and the private fields):
   - line 3 → `const DECAY_SEC = 0.5, FADE_SEC = 0.6, STEP_SEC = 1.6, VOL = 0.02;`
   - line 4 → `const NOTES = [82.41, 123.47, 164.81]; // E2 B2 E3` (same constants as `buildBed.ts`, so the beds stay in tune)
   - class name `DraftBed` → `MenuBed`; class doc comment → "The quiet 3-note loop under the menu (the planning before the first build): 1.6 s steps, 0.5 s decays, 0.02 pre-master on Sfx's WebAudio context — the calmest of the four beds (the draft's is 0.025, the build's 0.03), and distinct from all of them, so the beds never blur into one. It fades in over 0.6 s when the menu scene opens and fades out over 0.6 s when a run starts (the scene's stop); an overlay card (Tech, How, the codex, the boards) pauses the scene, so its notes simply stop until the card closes; silent when muted. No forms: the menu has no run state to form from."
   - the `/** dt = real seconds; ... */` comment above `update` → the interface comment above
   - in `broken()`: message text "draft bed" → "menu bed"
2. In `src/scenes/MenuScene.ts`:
   - after line 1 (`import Phaser from 'phaser';`) add `import { MenuBed } from '../audio/menuBed';`
   - line 16 → `import { getSfx, onKey, onResize, SCENES } from './keys';`
   - after the field `private clock = 0;` (line 43) add `bed!: MenuBed; // the menu's quiet bed: its shutdown stops it, runChecks reads it while the menu is open` — no `private`: runChecks reads it (like `DraftScene.bed`)
   - in `create()`, after `this.clock = 0;` (line 53) add:
     ```ts
     this.bed = new MenuBed(getSfx(this));
     this.events.once('shutdown', () => this.bed.stop()); // the fade-out and ringing notes must not outlive the menu (the Sfx context is the singleton's)
     ```
   - in `update()`, after `this.demo.update(dt);` (line 265) add `this.bed.update(dt, true); // overlay cards pause the scene, so no notes sound while they are open`
3. In `src/debug/runChecks.ts`: after the `DraftScene` import (line 13) add `import { MenuScene } from '../scenes/MenuScene';`, and after the `draftBed.valid` line (line 86) add:
   `['menuBed.valid', (g) => (g.scene.isActive(SCENES.menu) ? (g.scene.get(SCENES.menu) as MenuScene).bed.broken() : null)],`

### Pitfalls
- `bed` must be public (no `private` keyword) or the runChecks line fails typecheck.
- Do not add a `scene.isActive(SCENES.pause)` guard like DraftScene's: nothing pauses the menu; its overlays (Tech/How/codex/boards) use `scene.launch + scene.pause()`, which stops `update()` — that silence *is* the desired under-card behavior, no per-card wiring.
- Play/Ghost/Iron all use `this.scene.start(...)`, so the menu's `shutdown` fires and `bed.stop()` fades the bed out — never call `stop()` anywhere else, and never let a run scene touch it.
- Don't touch any other MenuScene line: layout, demo, profile card, buttons and tweens must stay byte-identical.
- `start()` already handles an unlocked-later AudioContext (returns without setting `started`; next frame retries) — keep it, don't add a timer.

### Tests
- none (audio task; `npm run check` and `npm run smoke` are the verification)
