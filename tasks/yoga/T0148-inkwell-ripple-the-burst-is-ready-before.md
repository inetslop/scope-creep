---
id: T0148
title: Inkwell ripple — the burst is ready before you spend it
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T22:11:29Z
---

## Goal
The moment the Inkwell meter (T0090) reaches full, it announces itself — one swell and one soft tick — so the burst is known to be ready before you spend it.

## Details
- The moment the meter's fill rises from below-full to full (one false→true edge per fill):
  - the meter swells once: its drawn width scales about the meter's center 1.0× → 1.2× over 100 ms and back to 1.0× over 100 ms (200 ms total); its position under the streak tally, its fill and the 412×915 / 1280×720 layouts are otherwise unchanged.
  - one short high tick plays: a new `Sfx.inkwellFull()` in `src/audio/Sfx.ts` in the weapon-tick idiom (T0093) — a ~60 ms triangle blip 2600→2000 Hz at about half the gain of a normal hit, mute-gated by the same gate the other Sfx use, throttled to one per 300 ms.
- The edge is detected where the meter is already drawn (the scene sees the fill fraction every frame and remembers the previous frame's full/not-full state) — no new rule in `src/core/run.ts`, no change to the inkwell math.
- One swell and one tick per fill, never per frame; a meter that stays full does nothing further; spending the meter on a burst (the 3× volley) resets the edge, so the next refill announces again.
- No change to the fill rate (10% per volley), the burst itself, the deeper burst shoot sound, the knockback, or anything T0120 (Heavy burst) owns — no new key, HUD element, scene or gameplay number.

## Acceptance criteria
- [ ] Firing until the meter first reaches full: exactly one swell (1.2× over 200 ms total) and exactly one high tick.
- [ ] Letting the meter sit full: no further swell or tick (at most one tick per 300 ms even in a glitch).
- [ ] Firing the burst, then refilling: the swell and tick play again.
- [ ] The tick obeys the same mute gate as the existing pickup pluck (silent whenever the pluck is silent, audible whenever it is audible).
- [ ] The fill rate, the burst's 3× volley, its sound and knockback are unchanged; desktop + mobile smoke runs pass.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` - replace the existing `inkwellFull()` body (T0090: flat 1046.5 Hz sine) with the weapon-tick idiom + 300 ms throttle; add a `lastInkwellFullAt` field
- edit `src/scenes/HudScene.ts` - the full edge in `drawInkwell()` also starts the swell and plays `Sfx.inkwellFull()`; bar drawn scaled about its center
- edit `src/systems/WeaponSystem.ts` - drop the `sfx.inkwellFull()` call (line 113)
- edit `src/systems/ArcSystem.ts` - drop the `sfx.inkwellFull()` call (line 82)

### Interfaces
No new types or signatures. `Sfx.inkwellFull(): void` unchanged; `RunState.addInkwell`/`consumeInkwell` untouched (the `addInkwell` return becomes unused — keep its signature).

### Steps
1. `Sfx.ts`: add `private lastInkwellFullAt = 0;` after `lastOrbitHumAt` (line 23). Replace lines 108–112 with `inkwellFull(): void { if (!this.canPlay()) return; const now = performance.now(); if (now - this.lastInkwellFullAt < 300) return; this.lastInkwellFullAt = now; this.tone('triangle', 2600, 2000, 0.06, 0.09); }` — 60 ms, 0.09 = half of `hit()`'s 0.18 tone gain, same `canPlay()` mute gate as `pickup()`, throttle shaped like `slam()`.
2. `HudScene.ts`: add field `private inkSwellAt = 0;` beside `lastInkwell` (line 75) and reset `this.inkSwellAt = 0;` in `create()` beside line 124. In `drawInkwell()`, before the `drawBar`: `const sw = this.time.now - this.inkSwellAt; let s = this.inkSwellAt > 0 && sw < 200 ? 1 + 0.2 * (sw < 100 ? sw / 100 : (200 - sw) / 100) : 1; if (this.inkSwellAt > 0 && sw >= 200) this.inkSwellAt = 0;` then draw `this.drawBar(this.g, x + (w - w * s) / 2, y, w * s, h, Phaser.Math.Clamp(run.inkwell, 0, 1), PALETTE.red);` — center `x + w/2` and resting width/position unchanged.
3. `HudScene.ts` `drawInkwell()`: change line 336 to `if (this.lastInkwell < 1 && run.inkwell >= 1) { this.inkSwellAt = this.time.now; getSfx(this)?.inkwellFull(); if (!this.inkNoteShown) { this.inkNoteShown = true; this.inkNoteUntil = this.time.now + 2000; } }` — swell + tick on every full edge; note keeps its once-per-run guard; keep `this.lastInkwell = run.inkwell;` after it.
4. `WeaponSystem.ts:113` → `this.run.addInkwell(INKWELL.fillPerVolley);` (bare call; same for `ArcSystem.ts:82`). Nothing else: fill rate, `consumeInkwell()` (resets to 0, re-arming the edge), `inkBurst`, knockback unchanged.

### Pitfalls
- `inkwellFull()` already exists — replace its body, do not add a second method.
- No tween of `this.g` (cleared every frame, holds the whole HUD): the swell must be a per-frame factor from elapsed ms — frame-rate independent, completes even under a pause overlay.
- `inkSwellAt` must reset in `create()` — the scene instance survives stop/launch.
- Don't move the `lastInkwell` update or touch the note logic; with `inkSwellAt = 0` the factor is 1 (meter at rest).
- 412×915: narrow → w=88, max width 105.6 still centered under the streak tally; `inkLabel`/`inkNote` positions unchanged.

### Tests
none (audio + UI juice; no `src/core` rule change).
