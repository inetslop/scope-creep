---
id: T0093
title: Weapon SFX timbres — Point, Line and Arc sound like themselves
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T08:45:39Z
claimed_at: 2026-10-27T09:30:23Z
---

## Goal
Each firing weapon should sound like itself — Point a short high tick, Line a low thud, Arc a sharp snap — so the player can hear which weapon the run is built around without looking.

## Details
- In `src/audio/Sfx.ts` (T0003 — all SFX are synthesized from oscillators and gain envelopes, no audio files), give the three firing weapons distinct shoot timbres in the existing synthesis style:
  - Point: a short high tick — a brief, high-pitched blip, clearly higher than today's shared shoot sound.
  - Line: a low thud — a low, dull, brief knock.
  - Arc: a sharp snap — a very short, bright, percussive snap, distinct from the Point tick (crisper, or with a quick pitch drop).
- Firing the three weapons in sequence should give three clearly distinguishable sounds. Keep the existing gain/envelope discipline so rapid fire does not clip (the current shoot sound already throttles — preserve that behavior).
- Route the timbre by weapon at the shoot call site (the weapon system knows which weapon fired), so all three weapons get their own sound everywhere. If a new firing weapon (the Counterpoint wall-bounce, T0055, queued on desktop-4070) has landed before this task, include it with a mid-range woody knock; otherwise leave it to a follow-up.
- The Orbit weapon's contact-hit sound and every other SFX (hit, enemy death, pickup, player hurt, level up, boss sting) are unchanged.
- No new file, no content, no scene change.

## Acceptance criteria
- [ ] Firing the Point plays a short high tick, the Line a low thud and the Arc a sharp snap — three distinct sounds when fired in sequence, on desktop and mobile.
- [ ] The Orbit contact-hit sound and all other SFX are unchanged.
- [ ] Rapid fire stays within today's audio discipline (no new clipping or overlap beyond current behavior).

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` - replace `shoot()` with `shoot(id: string)`: switch on weapon id for the three timbres (closest example: the parameterized SFX method `enemyDeath(size)` just below it)
- edit `src/systems/WeaponSystem.ts` - fire the per-weapon sound at the firing call site in `fireVolley()` (it owns the `def`)
- edit `src/systems/ArcSystem.ts` - same in `fire()` (its `def` is always the arc weapon)

### Interfaces
```ts
// src/audio/Sfx.ts — replaces `shoot(): void`
shoot(id: string): void;
// call sites: `this.sfx.shoot();` → `this.sfx.shoot(def.id);`  (ids: 'point' | 'line' | 'arc')
```
No new types, files, or content.

### Steps
1. In `src/audio/Sfx.ts`, replace the `shoot()` method (lines 71–75) with:
```ts
  /**
   * Per-weapon fire timbre, routed by weapon id at the firing call site:
   * Point a short high tick, Line a low thud, Arc a sharp snap. The fallback
   * is today's shared tick, so a fire weapon without its own case still sounds.
   */
  shoot(id: string): void {
    if (!this.canPlay()) return;
    switch (id) {
      case 'point':
        this.tone('triangle', 3400, 2600, 0.05, 0.12); // short high tick
        break;
      case 'line':
        this.tone('sine', 150, 80, 0.1, 0.18); // low thud
        this.noise(0.08, 0.14, 600, 'lowpass'); // dull knock
        break;
      case 'arc':
        this.noise(0.03, 0.25, 4500, 'highpass'); // bright snap
        this.tone('triangle', 1800, 400, 0.05, 0.12); // quick pitch drop: distinct from Point
        break;
      default:
        this.noise(0.04, 0.05, 3000, 'highpass'); // shared fallback
    }
  }
```
2. `src/systems/WeaponSystem.ts` line 77: `this.sfx.shoot();` → `this.sfx.shoot(def.id);`
3. `src/systems/ArcSystem.ts` line 107: `this.sfx.shoot();` → `this.sfx.shoot(def.id);`
4. Run `npm run check`.

### Pitfalls
- Do NOT add a throttle/`lastAt` timestamp: each fire plays one short (≤0.1 s) quiet voice; Point fires 4/s so envelopes never overlap — no new clipping. Preserve per-fire behavior.
- Orbit's contact sound is `hit()`/`critHit()` (OrbitSystem lines 76/79) — untouched, per acceptance criterion.
- Counterpoint (T0055) has NOT landed (no `content/weapons/counterpoint.ts`); do not add its case — the `default` keeps it non-silent if it lands before its follow-up. (T0055 also edits WeaponSystem.ts — different lines, no functional dependency.)
- The `shoot()`→`shoot(id)` signature change makes any missed call site a compile error, so `npm run check` catches it. Use exact ids `'point'`, `'line'`, `'arc'`.
- No pooling/cleanup change: `tone`/`noise` already self-disconnect on `onended`; no dt or RNG involved.

### Tests
none (Sfx is Phaser/WebAudio, not pure core logic; acceptance is the three distinct sounds on desktop + mobile — same WebAudio path both.)
