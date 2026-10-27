---
id: T0149
title: Puddle plop — the slow is felt the instant it starts
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T22:11:29Z
---

## Goal
The moment your center enters a slow puddle, you hear and see it — one soft plop and one edge pulse — so the Wash's puddles (T0111) are felt the instant the slow starts, not discovered mid-slow.

## Details
- The moment the player's circle center crosses from outside to inside any slow puddle on the page (today the Wash puddle — 120 u across, 2.0 s life; when the ink rain (T0137) lands, its puddles reuse the same hook):
  - one soft low plop plays: a new `Sfx.puddlePlop()` in `src/audio/Sfx.ts` in the `orbitHum()` idiom (T0107) — a ~120 ms sine glide 90→45 Hz at about half the gain of a normal hit, mute-gated by the same gate the other Sfx use, throttled to one per 250 ms.
  - the puddle's edge pulses once: a flat 2 u ink ring at the puddle's own radius, fading over 200 ms — a new emitter in the FxSystem `restRing` pattern (T0143; the first-light ring idiom, T0138).
- The edge rides the existing slow check — the same place the Wash puddle decides the player is slowed: one entry event per outside→inside crossing; leaving and re-entering the same puddle plays again; standing inside plays exactly once, never per frame.
- No change to the slow value (20% while inside), the puddle's look, its life or anything else — no damage, key, HUD element, scene or stat change.

## Acceptance criteria
- [ ] Walking into a Wash puddle: exactly one plop and one 200 ms edge pulse at the crossing moment; the 20% slow applies as before.
- [ ] Standing still inside a puddle: no repeated plops or pulses.
- [ ] Leaving the puddle and re-entering it: the plop and pulse play again.
- [ ] Two overlapping puddles: at most one plop per 250 ms.
- [ ] The puddle's look, life and slow are unchanged; desktop + mobile smoke runs pass.

## Design (architect, yoga)

### Files
- edit `src/systems/PuddleSystem.ts` - per-puddle `inside` flag + new `sense()` entry detector riding `playerSpeedMul()`
- edit `src/audio/Sfx.ts` - new `puddlePlop()` after `orbitHum()`, new `lastPuddlePlopAt` field after `lastSlamAt`
- edit `src/art/textures.ts` - new `TEX.puddleRing` key (after `puddle`) + its draw call (after the puddle block)
- edit `src/systems/FxSystem.ts` - new `puddleRings` emitter field, build, depth, `puddleRing()` method
- edit `src/scenes/GameScene.ts` - one `sense()` call right after the `drive()` line (186)

### Interfaces
```ts
// PuddleSystem: add `inside: boolean;` to the private Puddle interface (init `inside: false,` in the pool,
// reset `p.inside = false;` in drop() after `p.slowMul = def.slowMul;` and in despawn() after `p.active = false;`).
/** Player center at (x,y): onEntry once per puddle per outside->inside crossing. Standing inside fires exactly once; re-entry fires again. */
sense(x: number, y: number, onEntry: (x: number, y: number) => void): void {
  for (const p of this.puddles) {
    const dx = x - p.x;
    const dy = y - p.y;
    const inside = p.active && dx * dx + dy * dy <= p.radius * p.radius;
    if (inside) { if (!p.inside) { p.inside = true; onEntry(p.x, p.y); } }
    else { p.inside = false; }
  }
}

// Sfx (after orbitHum):
puddlePlop(): void {
  if (!this.canPlay()) return;
  const now = performance.now();
  if (now - this.lastPuddlePlopAt < 250) return;
  this.lastPuddlePlopAt = now;
  this.tone('sine', 90, 45, 0.12, 0.09);
}

// FxSystem:
/** Puddle plop pulse: the puddle's own edge - flat 2 u ink ring at the puddle's radius, fading over 200 ms. */
puddleRing(x: number, y: number): void { this.puddleRings.explode(1, x, y); }
```
textures.ts: `puddleRing: 'puddleRing',` in TEX, drawn as `g.lineStyle(2, 0xffffff, 1); g.strokeCircle(64, 64, 60);` in a 128x128 texture (the puddle's own edge, outline only). FxSystem emitter: `scene.add.particles(0, 0, TEX.puddleRing, { lifespan: 200, scale: 1, alpha: { start: 1, end: 0 }, tint: PALETTE.ink, emitting: false })` + `this.puddleRings.setDepth(DEPTH.fx);` (one line after the build, like `this.trail.setDepth(...)`).

### Steps
1. `PuddleSystem.ts`: add the flag + `sense()` exactly as above, placed after `playerSpeedMul()`.
2. `textures.ts`: TEX key after `puddle`; draw call after the puddle `graphicsTexture` block.
3. `Sfx.ts`: field `private lastPuddlePlopAt = 0;` after `lastSlamAt`; method after `orbitHum()`.
4. `FxSystem.ts`: field after `restRings`; emitter build after the `restRings` block; `puddleRing()` after `restRing()`.
5. `GameScene.ts` after line 186:
```ts
this.puddles.sense(this.player.x, this.player.y, (x, y) => {
  this.sfx.puddlePlop();
  this.fx.puddleRing(x, y);
});
```
6. `npm run check` then `npm run smoke`.

### Pitfalls
- Ring is baked at radius 60 u (no per-call scale in 3.90): do NOT reuse TEX.ring (5 u line, wrong size); the new texture is the 2 u edge at exactly 60 u.
- The 250 ms cap is inside `puddlePlop()`; `sense()` may fire two entries in one frame (overlapping puddles) - that is fine, the gate drops the second plop.
- Reset `inside` in BOTH `drop()` and `despawn()` - a puddle dropped on a standing player must plop once on its next frame.
- Merge pressure: T0137 (ink rain) also edits `PuddleSystem`/`Sfx`; T0146/T0147/T0140 edit `FxSystem`/`GameScene.update`. Keep every new line adjacent as specified, never appended at file/function end; if the FxSystem depth `for (const e of [...])` line conflicts, resolve by one emitter per entry.
- No listeners added, nothing to remove on shutdown; particles self-reap after 200 ms.
### Tests
none
