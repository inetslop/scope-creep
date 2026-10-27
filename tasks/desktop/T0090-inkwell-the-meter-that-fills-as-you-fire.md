---
id: T0090
title: Inkwell — the meter that fills as you fire
assignee: desktop
size: M
priority: 2
status: todo
depends_on: [T0064, T0070]
attempts: 0
created: 2026-10-27T08:45:39Z
---

## Goal
Every run gets a payoff rhythm: firing fills a thin "Inkwell" meter in the HUD, and a full meter makes your next volley a heavy ink burst — 3× the projectiles at 2× the knockback. It rewards sustained fire, gives every build a visible meter to watch, and is the first new core-loop system since the crop marks.

## Details
- The meter: a thin rule under the kill-streak tally in the HUD. Desktop (1280×720): 120×6 units, ink outline, filled left to right in red. Mobile (412×915): 88×5 in the same relative position. A small all-caps ink label "INK" sits to its left, same type as the other HUD labels.
- The empty rule is visible from the start of the run so players know it is there. The meter is a passive system (like Balance's regen or the Crescendo streak bonus) — no key, no button, no new input.
- Filling: each fired volley of Point, Line or Arc fills the meter by 10% — a volley is one trigger pull, not one projectile (a Repetition volley of 3 points fills it 10% once). No drain. Per-run: it resets to 0 on every new run.
- Orbit is a contact weapon: it neither fills the meter nor consumes it.
- At 100%: the rule turns solid red and a single short high blip plays (one new Sfx in the existing synthesized style of `Sfx.ts`, once per fill). The first time the meter reaches full in a run, a small all-caps ink note — "A FULL WELL BURSTS" — fades in and out over 2 s under the rule, in the same style as the first-encounter marginalia (T0027).
- The burst: the next fired volley of Point, Line or Arc fires 3× that weapon's normal projectile count (Point: 3× its points; Line: 3× its lines; Arc: 3 bolts, each still chaining as usual) at 2× the normal per-projectile knockback, with the same damage per projectile. It uses a deeper variant of that weapon's shoot sound and a small ink ring at your position (same class as the crit ring, T0019).
- The meter returns to 0 immediately after the burst volley and refills at the same rate. If the player stops firing, or only fires Orbit, the meter simply stays full until the next firing weapon's volley.
- Implement the burst as a multiplier on the normal volley path (no per-weapon special cases), so a future firing weapon — the Counterpoint wall-bounce is queued on desktop-4070 (T0055) — gets the burst for free.
- No new scene, no new input, no new content card.

## Acceptance criteria
- [ ] A thin rule labeled "INK" is visible under the streak tally from the start of a run on both the desktop and mobile layouts, and it is empty (0%) at the start of every new run.
- [ ] With only Point, 10 normal volleys fill the rule to solid red; the fill that completes it plays the single high blip, and the first fill of a run also shows the 2 s "A FULL WELL BURSTS" note under the rule.
- [ ] The next Point volley after a full meter fires 3× the normal number of points at 2× the normal knockback, with the deeper shoot sound and a small ink ring at your position; after that volley the rule is empty and refills at the same rate.
- [ ] The burst works for Line (3× lines) and Arc (3 bolts, each still chaining); a multi-projectile Repetition volley still fills only 10%; Orbit never fills or consumes the meter.
- [ ] The meter never overlaps the streak tally, the boss health bar, or the score readout T0054 adds (re-read the HUD scene when that lands) and does not block input.

## Design (architect, desktop)

### Files
- edit `src/core/run.ts` — add `INKWELL` tuning constant + `inkwell` field and `addInkwell()`/`consumeInkwell()` on `RunState` (per-run, resets for free with the new instance)
- edit `src/entities/Projectile.ts` — add `knockback` to `ShotParams`; `fire()` reads `p.knockback` instead of `p.weapon.knockback`
- edit `src/audio/Sfx.ts` — add `inkwellFull()` (high blip) and `inkBurst()` (deeper shoot variant)
- edit `src/systems/WeaponSystem.ts` — burst multiplier in `fireVolley()`
- edit `src/systems/ArcSystem.ts` — split `fire()` into `fire()` + `bolt()`; burst = 3 bolts
- edit `src/debug/testHook.ts` — `HookStats.inkwell: number` (init 0)
- edit `src/scenes/GameScene.ts` — `inkwell` invariant + `s.inkwell` in `updateHookStats()`
- edit `src/scenes/HudScene.ts` — INK label, meter rule, first-fill note
- edit `tests/core/core.test.ts` — inkwell unit tests

### Interfaces
```ts
// core/run.ts
export const INKWELL = { fillPerVolley: 0.1, burstCount: 3, burstKnockback: 2 } as const;
// RunState members:
inkwell = 0; // 0..1
addInkwell(amount: number): boolean { const was = this.inkwell; this.inkwell = Math.min(1, this.inkwell + amount); return was < 1 && this.inkwell >= 1; }
consumeInkwell(): boolean { if (this.inkwell < 1) return false; this.inkwell = 0; return true; }
// entities/Projectile.ts ShotParams: add `knockback: number;` — fire() sets `this.knockback = p.knockback;`
// Sfx: inkwellFull(): void  — this.tone('sine', 1046.5, 1046.5, 0.12, 0.16);
//     inkBurst(): void      — this.noise(0.08, 0.12, 700, 'lowpass'); this.tone('sine', 130, 65, 0.14, 0.2);
```
Both Sfx methods start with `if (!this.canPlay()) return;` like their neighbors.

### Steps
1. `core/run.ts`: add the export + the three members (place `inkwell` near `streak`, methods near `registerKill()`).
2. `Projectile.ts`: `ShotParams.knockback` + `fire()` line (only caller is WeaponSystem, verified).
3. `Sfx.ts`: add the two methods after `shoot()`.
4. `WeaponSystem.ts` — replace `fireVolley()` with: `const burst = this.run.consumeInkwell();` `const count = (def.count + stats.extraProjectiles) * (burst ? INKWELL.burstCount : 1);` keep the existing loop but pass `knockback: def.knockback * (burst ? INKWELL.burstKnockback : 1)` in `p.fire({...})`; after the loop: `this.fx.muzzle(...)` as today, then if `burst` → `this.fx.critRing(this.player.x, this.player.y); this.sfx.inkBurst();` else → `this.sfx.shoot(); if (this.run.addInkwell(INKWELL.fillPerVolley)) this.sfx.inkwellFull();`
5. `ArcSystem.ts`: `fire(def)` becomes: `const burst = this.run.consumeInkwell(); for (let b = 0, bolts = burst ? INKWELL.burstCount : 1; b < bolts; b++) this.bolt(def, burst);` then the same burst/else sfx+fx block as step 4. Move the old `fire()` body into `private bolt(def: WeaponDef, burst: boolean): void` unchanged except the chain loop's `e.hit(dmg, from, def.knockback * (burst ? INKWELL.burstKnockback : 1))` and keep `hook.stats.shotsFired += 1;` + `this.draw(points, spec.fadeMs);` at its end. Each bolt picks its own targets (3 independent chains).
6. `testHook.ts` + `GameScene.ts`: `inkwell` stat, `s.inkwell = this.run.inkwell;`, invariant `hook.addInvariant('inkwell', () => (this.run.inkwell >= -1e-9 && this.run.inkwell <= 1 + 1e-9 ? null : \`inkwell ${this.run.inkwell}\`));`, add `'inkwell'` to `INVARIANTS`.
7. `HudScene.ts`: fields `inkLabel!` / `inkNote!` (Text), `inkNoteShown = false`, `lastInkwell = 0`, `inkNoteUntil = 0`. In `create()`: `this.inkLabel = this.add.text(0, 0, 'INK', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(1, 0.5);` `this.inkNote = this.add.text(0, 0, 'A FULL WELL BURSTS', textStyle(13, PALETTE.ink)).setOrigin(1, 0).setVisible(false);` reset the three scalars (scene instance survives stop/launch). In `update()` after `this.updateStreak(run, width);` call `this.drawInkwell(run, width, narrow);` (reuse the existing `narrow` flag). Method:
```ts
private drawInkwell(run: RunState, width: number, narrow: boolean): void {
  const w = narrow ? 88 : 120; const h = narrow ? 5 : 6; const y = PAD + 74; const x = width - PAD - w;
  this.drawBar(this.g, x, y, w, h, Phaser.Math.Clamp(run.inkwell, 0, 1), PALETTE.red);
  this.inkLabel.setPosition(x - 8, y + h / 2);
  if (this.lastInkwell < 1 && run.inkwell >= 1 && !this.inkNoteShown) { this.inkNoteShown = true; this.inkNoteUntil = this.time.now + 2000; }
  this.lastInkwell = run.inkwell;
  const left = this.inkNoteUntil - this.time.now;
  if (left > 0) this.inkNote.setPosition(width - PAD, y + h + 6).setAlpha((2000 - left) < 200 ? (2000 - left) / 200 : left < 500 ? left / 500 : 1).setVisible(true);
  else if (this.inkNote.visible) this.inkNote.setVisible(false);
}
```
8. `tests/core/core.test.ts` in `describe('RunState')`: 9× `addInkwell(INKWELL.fillPerVolley)` → `false` and `inkwell` closeTo 0.9; 10th → `true`, `inkwell` 1; another add → `false` (clamped, no re-cross); `consumeInkwell()` → `true`, 0; again → `false`. Import `INKWELL`.
9. `npm run check` and `npm run smoke` must pass.

### Pitfalls
- The burst branch must NOT call `addInkwell` — spec: meter is 0 immediately after the burst volley (holding fire = burst every 10th volley).
- Orbit: do not touch `OrbitSystem.ts`; it neither fills nor consumes by construction.
- Keep `if (def.orbit || def.arc) continue;` in WeaponSystem — arc volleys live in ArcSystem, 3 bolts must fit the existing `MAX_LINES = 4` pool (don't raise it).
- Never make the meter label/note interactive (no input handlers) — passive HUD, must not block touch sticks.
- Blip plays only on the crossing (`addInkwell` return), never while held full; note only on the first fill (Hud-scene flag, not RunState).
- `y = PAD + 74` verified clear of: streak row (center PAD+60), boss bar (desktop y 56–68; mobile 96–108), mobile timer. If T0054 (score, desktop-4070) lands first, re-read HudScene.ts and push this y down if it added a row.
- If T0093 (per-weapon shoot timbres) lands first, `inkBurst()` should be re-based on the per-weapon shoot sound.

### Tests
- `tests/core/core.test.ts`: the inkwell fill/crossing/consume case above. HUD/Sfx/system behavior covered by `npm run smoke`.
