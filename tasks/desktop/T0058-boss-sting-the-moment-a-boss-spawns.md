---
id: T0058
title: Boss sting — the moment a boss spawns
assignee: desktop
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T02:15:10Z
---

## Goal
Every boss spawn — The Frame at 5:00, The Grid from 10:00, and every respawn — is announced by one deep bass hit plus a swell in the generative music, so the player hears the danger the instant it arrives instead of just noticing a health bar.

## Details
- New SFX, e.g. `Sfx.bossSting()`: a deep sub-bass thump — sine at about 55 Hz with a fast ~30 ms attack and an exponential decay to silence over ~450 ms, plus a second low tone at about 82 Hz at a quarter of the gain for a dark, slightly dissonant color. Build it from the existing Sfx oscillator/gain-envelope primitives (same style as the other SFX), with its own throttle (`lastBossStingAt`, minimum gap 1000 ms) so it can never overlap itself.
- Music swell: a new method on the Music class (e.g. `swell()`) that raises the music's master gain to 1.6× its normal level over 0.4 s, holds ~0.3 s, then eases back to 1.0× over 2 s. If a second swell is requested mid-swell, it extends the hold rather than stacking gains.
- Trigger: exactly once per boss spawn — when the boss entity actually appears on the page (both The Frame and The Grid, including later respawns at higher HP), not when it is scheduled. The sting and the swell start on the same frame.
- Elite enemies and regular enemies never trigger the sting or the swell. No HUD text, no new art — this is an audio-only moment.

## Acceptance criteria
- [ ] The Frame's spawn at 5:00 plays one deep (~55 Hz) sting and the background music audibly swells, settling back to normal within ~3 s.
- [ ] The Grid's spawn and every later boss respawn (Frame or Grid) get the identical sting + swell.
- [ ] Elite or regular enemy spawns never play the sting or swell the music.
- [ ] Two boss spawns within 1 s produce one sting, not two overlapping ones.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- edit `src/audio/Sfx.ts` — new `bossSting()` + private `stingTone()` helper + `lastBossStingAt` field
- edit `src/audio/Music.ts` — new public `bossSwell()`, `masterGain` getter, `export` the `MUSIC_VOLUME` const
- edit `src/systems/BossSystem.ts` — accept a `Music` dependency, fire sting + swell in `startEntering()`
- edit `src/scenes/GameScene.ts` — pass `this.music` into BossSystem, add a `music-swell` invariant

### Interfaces
```ts
// Sfx (src/audio/Sfx.ts) — public, silent no-op when muted/locked (same as other methods)
bossSting(): void
// Music (src/audio/Music.ts) — public
bossSwell(): void
get masterGain(): number // current master gain; 0 without a WebAudio context
// Music.ts line 5: `const MUSIC_VOLUME` gains the `export` keyword (value unchanged: MASTER_VOLUME * 0.25)
// BossSystem constructor (src/systems/BossSystem.ts): insert `music: Music` between the existing
// `sfx: Sfx` and `damageNumbers: DamageNumbers` parameters; import type { Music } from '../audio/Music';
```
**Do not name the Music method `swell()`** — a private `swell(t: number)` noise helper already exists there (Music.ts:112). `bossSwell()` avoids the collision.

### Steps
1. `src/audio/Sfx.ts` — after `private lastPickupCallAt = 0;` add `private lastBossStingAt = 0;`. After the `bossWarn()` method add:
```ts
  /** Deep sub-bass thump when a boss appears: 55 Hz with a 30 ms attack decaying over 450 ms,
   *  plus a darker 82 Hz tone at a quarter of the gain. One per second, never overlaps itself. */
  bossSting(): void {
    if (!this.canPlay()) return;
    const now = performance.now();
    if (now - this.lastBossStingAt < 1000) return;
    this.lastBossStingAt = now;
    this.stingTone(55, 0.6);
    this.stingTone(82, 0.15);
  }

  /** Sine tone with a 30 ms linear attack and an exponential decay to silence over 450 ms. */
  private stingTone(hz: number, vol: number): void {
    if (!this.ctx || !this.master || vol <= 0) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, t);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.47);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
```
2. `src/audio/Music.ts` — make line 5 `export const MUSIC_VOLUME = MASTER_VOLUME * 0.25;`. After the `nextBeatTime` getter add `get masterGain(): number { return this.master ? this.master.gain.value : 0; }`. After `update()` add:
```ts
  /** Boss arrival: raise the master gain to 1.6x over 0.4 s, hold 0.3 s, ease back over 2 s.
   * A call mid-swell re-anchors the envelope at the current value, so it extends the
   * hold instead of stacking — the gain never exceeds 1.6x. */
  bossSwell(): void {
    if (this.ctx === null || this.master === null || this.sfx.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const gain = this.master.gain;
    gain.cancelScheduledValues(t);
    gain.setValueAtTime(gain.value, t);
    gain.linearRampToValueAtTime(MUSIC_VOLUME * 1.6, t + 0.4);
    gain.setValueAtTime(MUSIC_VOLUME * 1.6, t + 0.7);
    gain.linearRampToValueAtTime(MUSIC_VOLUME, t + 2.7);
  }
```
3. `src/systems/BossSystem.ts` — add `import type { Music } from '../audio/Music';` (before the Sfx import), field `private readonly music: Music;` after `sfx`, constructor param + `this.music = music;`, and in `startEntering()` after `this.run.bossMaxHp = hp;` add:
```ts
    this.sfx.bossSting(); // the boss is on the page: one deep thump and a music swell, same frame
    this.music.bossSwell();
```
4. `src/scenes/GameScene.ts` — line 2 becomes `import { MUSIC_VOLUME, Music } from '../audio/Music';`; in the `new BossSystem(...)` call insert `this.music,` after `this.sfx,`; after the `music-scheduler` invariant add:
```ts
    hook.addInvariant('music-swell', () => {
      const g = this.music.masterGain;
      return g >= MUSIC_VOLUME - 1e-6 && g <= MUSIC_VOLUME * 1.6 + 1e-6 ? null : `music swell gain ${g}`;
    });
```
and add `'music-swell'` to the `INVARIANTS` array after `'music-scheduler'`.
5. Run `npm run check && npm run smoke`.

### Pitfalls
- **`swell` name collision**: Music already has `private swell(t)`; TypeScript errors on a second `swell`. Use `bossSwell()`.
- **Trigger point**: only `startEntering()` (where `boss.spawn()` makes the entity visible) fires audio — not `startWarning()` (that's the 1 s-early name warning; `bossWarn()` stays untouched) and never SpawnSystem (elite/regular spawns and the Frame's ring darts go through SpawnSystem, so they can't trigger it).
- **BossSystem.ts and GameScene.ts are also touched by in-progress T0040/T0054 (desktop-4070)**: no logical dependency, but keep edits in the small regions above and rebase cleanly if they land first.
- The invariant name must go in the `INVARIANTS` array or it is never removed on shutdown (the existing loop handles removal).
- Both audio methods are no-ops until the WebAudio context is unlocked — no guard changes needed; don't call `resume()`.
- No pooling involved: `Boss` is a unique entity, not a pool.

### Tests
- none — all new logic is engine-side (WebAudio/Phaser), which vitest (Node) can't touch; the `music-swell` invariant and the error checks run under `npm run smoke`.
