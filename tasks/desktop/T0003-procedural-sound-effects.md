---
id: T0003
title: Procedural sound effects
assignee: desktop
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
claimed_at: 2026-10-26T16:44:33Z
---

## Goal
The game is silent. Add short, clean, synthesized sound effects (no audio files) for the core actions. Think minimal and percussive: soft clicks, woodblock-like knocks, plucked tones — matching the flat Bauhaus look, not sci-fi zaps.

## Details
- Create `src/audio/Sfx.ts`: a class that synthesizes sounds with the Web Audio API (oscillators, filtered noise, gain envelopes). Get the `AudioContext` from Phaser: `(scene.sound as Phaser.Sound.WebAudioSoundManager).context`. If the sound manager is not WebAudio (e.g. `NoAudioSoundManager`), every method must be a silent no-op.
- Methods: `shoot()`, `hit()`, `enemyDeath(size: number)`, `pickup()`, `playerHurt()`, `levelUp()`. Keep each sound under 300 ms, and keep `shoot()` quiet; it plays several times per second. `pickup()` can rise in pitch slightly when shards are collected in quick succession.
- Throttle: at most one `hit()` and one `pickup()` sound per 40 ms.
- Master volume 0.35. Add a mute toggle: the `M` key toggles mute; store the setting in `localStorage` under `scope-creep:muted` (wrap storage access in try/catch).
- Wire it up: create one `Sfx` in `GameScene.create()`, pass it to the systems that need it (WeaponSystem, CombatSystem, PickupSystem), and call `levelUp()` when the LevelUp overlay opens.
- Browsers only allow audio after a user gesture; Phaser unlocks the context on the first input. Don't play sounds before that, and don't throw if the context is suspended.

## Acceptance criteria
- [ ] Shooting, hits, deaths, pickups, getting hurt and leveling up each have a distinct sound
- [ ] `M` mutes and unmutes, and the setting survives a reload
- [ ] No audio files were added
- [ ] No errors when audio is unavailable or locked

## Design (architect, desktop)

### Files
- create `src/audio/Sfx.ts` - Sfx class: synthesizes all SFX on Phaser's WebAudio context (oscillators, filtered noise, gain envelopes). No audio files.
- edit `src/systems/WeaponSystem.ts` - add `sfx` param; call `sfx.shoot()` in `fireVolley()`.
- edit `src/systems/CombatSystem.ts` - add `sfx` param; call `hit()`, `playerHurt()`, `enemyDeath()`.
- edit `src/systems/PickupSystem.ts` - add `sfx` param; call `pickup()` when a shard is collected.
- edit `src/scenes/GameScene.ts` - create Sfx, pass to systems, `M` mute key, `levelUp()` when overlay opens, cleanup on shutdown.
- edit `docs/ARCHITECTURE.md` - short "Audio" section after "Input".

### Interfaces
```ts
// src/audio/Sfx.ts (import type Phaser from 'phaser')
export class Sfx {
  constructor(scene: Phaser.Scene);
  toggleMute(): boolean; // flips muted, writes localStorage 'scope-creep:muted' (try/catch), returns new state
  dispose(): void;       // disconnects master gain; call from GameScene shutdown
  shoot(): void; hit(): void; enemyDeath(size: number): void;
  pickup(): void; playerHurt(): void; levelUp(): void;
}
```
WeaponSystem / CombatSystem / PickupSystem: append one final constructor param `sfx: Sfx` (`import type { Sfx } from '../audio/Sfx';`, store as `private readonly sfx: Sfx;`).

### Steps
1. Sfx constructor: `const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager).context ?? null;` — it is `undefined` with NoAudioSoundManager. If ctx exists: create a master GainNode (gain = muted ? 0 : 0.35) connected to `ctx.destination`, and one shared 0.5 s white-noise AudioBuffer (Math.random is fine here: audio texture, not gameplay RNG). `muted` is read from localStorage in the constructor (try/catch, default false).
2. Private helpers, each a no-op when ctx/master is null:
   - `tone(type: OscillatorType, fromHz: number, toHz: number, durSec: number, vol: number, delaySec = 0)`: at `t = ctx.currentTime + delaySec`, create oscillator + gain; `gain.gain.setValueAtTime(vol, t)` then `exponentialRampToValueAtTime(0.001, t + durSec)`; if `toHz !== fromHz` also `osc.frequency.exponentialRampToValueAtTime(Math.max(toHz, 1), t + durSec)`; connect osc→gain→master; `osc.start(t)`, `osc.stop(t + durSec + 0.02)`, `osc.onended = () => { osc.disconnect(); gain.disconnect(); }`.
   - `noise(durSec: number, vol: number, freq: number, type: BiquadFilterType, delaySec = 0)`: BufferSource playing the shared buffer (random start offset 0–0.25 s) → BiquadFilter (freq/type) → same gain envelope → master.
   - `canPlay(): boolean` = ctx && master && !muted && `ctx.state === 'running'`. Every public method starts with `if (!this.canPlay()) return;` — never call `resume()` yourself (Phaser unlocks on first input).
3. Recipes (all < 300 ms; master 0.35):
   - shoot(): no throttle — `noise(0.04, 0.05, 3000, 'highpass')` (quiet: plays several times per second).
   - hit(): 40 ms throttle via `performance.now()` — `noise(0.07, 0.22, 2400, 'bandpass')` + `tone('sine', 220, 160, 0.08, 0.18)`.
   - enemyDeath(size): `tone('sine', hz, hz / 2, 0.18, 0.3)` with `hz = 260 / (1 + size / 24)` + `noise(0.1, 0.18, 900, 'lowpass')`.
   - pickup(): 40 ms throttle; combo: if < 350 ms since the previous pickup() call, `step = Math.min(step + 1, 12)`, else `step = 0` (update on EVERY call, even when the sound is throttled); play `tone('triangle', hz, hz, 0.12, 0.16)` with `hz = 523.25 * 2 ** (step / 12)`.
   - playerHurt(): `tone('sawtooth', 160, 70, 0.22, 0.22)` + `noise(0.15, 0.15, 500, 'lowpass')`.
   - levelUp(): `tone('triangle', f, f, 0.1, 0.2, d)` for f = 523.25 / 659.25 / 783.99 with d = 0 / 0.09 / 0.18.
4. GameScene: field `private sfx!: Sfx;`; in `create()` right after `this.fx = new FxSystem(this);` add `this.sfx = new Sfx(this);`; pass `this.sfx` as the final argument to the PickupSystem, WeaponSystem and CombatSystem constructor calls; in `openLevelUp()` after `this.scene.launch(SCENES.levelUp, ...)` add `this.sfx.levelUp();` (NOT in the maxed-out heal early return); in `endRun()` after the player's `fx.death(...)` add `this.sfx.enemyDeath(40);`.
5. GameScene.bindSceneEvents(): add `const onMute = (): void => { this.sfx.toggleMute(); }; this.input.keyboard?.on('keydown-M', onMute);` (M is unbound today), and in the existing SHUTDOWN once-handler add `this.input.keyboard?.off('keydown-M', onMute); this.sfx.dispose();`.
6. Call sites: `fireVolley()` → `this.sfx.shoot();` next to `fx.muzzle(...)`; `onProjectileHit` → `this.sfx.hit();` next to `fx.hit(...)`; `onPlayerTouched` → `this.sfx.playerHurt();` next to `fx.playerHit();`; `killEnemy` → `this.sfx.enemyDeath(look.radius);` next to `fx.death(...)`; PickupSystem.update → `this.sfx.pickup();` next to `fx.pickup(s.x, s.y)`.
7. docs/ARCHITECTURE.md: after "## Input" add "## Audio": Sfx synthesizes on Phaser's WebAudio context (no audio files); master volume 0.35; M toggles mute, persisted in localStorage (`scope-creep:muted`); sounds only play once the first input unlocks the context.

### Pitfalls
- NoAudioSoundManager has no `context` property — the cast yields `undefined`; the `?? null` + `canPlay()` guards make every method a silent no-op. Never create audio nodes unguarded.
- Suspended context: `canPlay()` is false → skip. Don't `resume()`, don't throw; Phaser's unlock fires on the first pointer/key.
- Scene emitters survive restarts: remove the `keydown-M` listener on shutdown, and `dispose()` the master gain (the smoke test restarts the game repeatedly — otherwise GainNodes accumulate in the game-level context).
- `exponentialRampToValueAtTime` cannot target 0 — use 0.001; every starting gain must be > 0.
- Check throttle gates BEFORE creating nodes; the pickup combo counter advances on every call, not only when a sound plays.
- No Phaser config change (WebAudio manager is already the default), no HUD change, no invariant needed (Sfx holds no gameplay state, like FxSystem).

### Tests
- none (engine-side Web Audio; `npm run smoke` exercises the wiring in a real browser)
