---
id: T0101
title: Streak break — the tally shatters when it goes
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T10:32:47Z
claimed_at: 2026-10-27T12:14:11Z
---

## Goal
The moment your kill streak resets (you get hit), the HUD streak tally shatters — a small ink burst plus a short low blip — so you can see and hear the Crescendo fire-rate bonus (T0065) go, and why.

## Details
- When the kill streak (T0014) drops from 1 or higher to 0 because the player takes a hit, the streak tally shatters: 4–6 tiny ink specks (2–3 u flat dots, PALETTE.ink, no outline) fly outward from the tally 20–40 u in scattered directions and fade linearly over 400 ms.
- At the same moment one short low blip plays: a single ~150 Hz sine tick, ~80 ms, at a gain lower than the crit sting. Nearest example: `Sfx.critHit()` from T0019, with the same one-shot throttle pattern (`lastCritHitAt`-style) so blips can never stack.
- If the streak was already 0 when the hit lands, nothing plays and nothing scatters — there is nothing to break.
- Pure juice: the streak logic, the Crescendo rule (T0065) and the tally's normal rendering are all unchanged; this only adds a transient burst + sound on the existing reset event. Nearest visual examples: the FxSystem transient effects — the crit ring (T0019) and the floating damage numbers pool (T0004).
- No new HUD element, no input, no scene, no content file. Identical on desktop and mobile.

## Acceptance criteria
- [ ] Taking a hit while the kill streak is 1 or higher scatters 4–6 tiny ink specks from the streak tally (flying 20–40 u, fading over ~400 ms) and plays one short low blip.
- [ ] Taking a hit while the streak is already 0 plays nothing and scatters nothing.
- [ ] Blips never stack — at most one per streak reset.
- [ ] The streak number, the Crescendo fire-rate rule and the tally's normal rendering are unchanged.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` - new `streakBreak()` blip + `lastStreakBreakAt` field, same one-shot throttle pattern as `critHit()` (T0019)
- edit `src/scenes/HudScene.ts` - screen-space ink-speck emitter + shatter trigger inside the existing `GAME_EVENTS.playerHit` listener

### Interfaces
```ts
// Sfx.ts: field after `lastCritHitAt`, method after `critHit()`
private lastStreakBreakAt = 0;
streakBreak(): void {
  if (!this.canPlay()) return;
  const now = performance.now();
  if (now - this.lastStreakBreakAt < THROTTLE_MS) return;
  this.lastStreakBreakAt = now;
  this.tone('sine', 150, 150, 0.08, 0.12); // flat ~150 Hz, 80 ms, gain < crit's 0.18, no noise
}
// HudScene.ts
private streakSpecks!: Phaser.GameObjects.Particles.ParticleEmitter;
private shatterTally(): void {
  const { width } = this.scale;
  this.streakSpecks.explode(4 + Math.floor(Math.random() * 3), width - PAD - this.streakText.width / 2, PAD + 60);
  getSfx(this)?.streakBreak();
}
```
### Steps
1. `Sfx.ts`: add the field and method exactly as above (`THROTTLE_MS` is already 40).
2. `HudScene.ts` imports: `import { TEX } from '../art/textures';` and add `getSfx` to the existing `./keys` import.
3. In `create()`, after `cropText` is created (specks must render above the tally text):
```ts
this.streakSpecks = this.add.particles(0, 0, TEX.dot, { lifespan: 400, speed: { min: 50, max: 100 }, scale: { start: 0.75, end: 0.75 }, alpha: { start: 1, end: 0 }, tint: PALETTE.ink, emitting: false });
```
4. In the existing `onPlayerHit` handler, after `this.sinceHit = 0;` add: `if (this.lastStreak >= 1) this.shatterTally();`
5. Add `shatterTally()` beside `updateStreak()`. Count is 4–6; 50–100 px/s over 400 ms = 20–40 u; scale 0.75 of the 8 px `TEX.dot` = 2–3 u dot; fade linear (same `alpha: { start: 1, end: 0 }` as FxSystem fragments).

### Pitfalls
- The event fires in GameScene's physics pre-update, before this frame's `updateStreak` writes `lastStreak`, so at event time `lastStreak` is the pre-hit streak — exactly the "dropped from ≥1 to 0" check. Crop drain (`run.drain`) never emits the event, so it cannot shatter; streak already 0 → `lastStreak` is 0 → nothing plays or scatters.
- Emitter must be created after `streakText` (draw order = creation order in a scene). It is a scene child, destroyed on shutdown — no new listeners, the existing `onPlayerHit` removal on SHUTDOWN already covers it.
- HUD is screen space at 1 px = 1 u; `Math.random` is right (juice, like DamageNumbers jitter), not `run.rng`. Not a system: no invariant, no smoke hook, no core rule touched, `updateStreak` rendering unchanged.
### Tests
none
