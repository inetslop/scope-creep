---
id: T0356
title: "The Colossus's return gets its flash"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T11:49:16Z
---

## Goal
The wave-10 Colossus's out-of-reach beat ends with a moment on the token, the way its other beats do: the player sees exactly when the towers can hit it again, instead of noticing the alpha pop.

## Details
- **The moment:** the instant the Colossus's out-of-reach beat (the 2.5 s at 50% alpha) ends and it is in reach again — the same out-of-reach state the windup ring (T0286) reads from the boss's reachClock. Fire on the edge of the transition, once per return, never per frame.
- **The look:** the token's own white tint wash — the same white the Dasher's telegraph and the Colossus's 0.5 s out-of-reach telegraph use — for ~0.3 s, then its normal purple at full alpha. If the tint state needs its own clock, add one field on the enemy the way T0347's splitClock sits there.
- **Display only:** no sound, no text, no chip, no ring, no haptics — the windup ring already counts the next beat and the quiet tone (T0284) already marks the departure; this marks only the return.
- **Scope:** any enemy with the Colossus's out-of-reach beat (today only the Colossus); a later boss with the same beat inherits it. Every other enemy, including the Titan and the Orb, byte-identical.
- **Files:** one new enemy-hook file `src/systems/enemyHooks/bossBack.ts`, registered in `src/systems/enemyHooks/index.ts` next to `bossPhase`. Model: `bossPhase.ts` (T0286 — the same state, the same per-frame pass) and `orbSplit.ts` (T0347 — the white tint). No change to waves, art, audio or the run's numbers.

## Acceptance criteria
- [ ] Wave 10: the moment the Colossus becomes hittable again after each out-of-reach beat, its token flashes white for ~0.3 s (the telegraph's own white) before settling — one flash per return, on every return in the wave, the first included.
- [ ] No flash on the 0.5 s white telegraph that starts a beat, on the boss's death, or on any other enemy — Titan, Orb and every regular byte-identical.
- [ ] No new sound, text, chip or ring; the windup ring, the out-of-reach tone, the arrival ring and the death beat are unchanged.
- [ ] A resumed run mid-beat fires the flash at the next return, once.

## Design (architect, desktop)

### Files
- create `src/systems/enemyHooks/bossBack.ts` — the return flash: when a boss's out-of-reach phase ends, its token flashes white for 0.3 s
- edit `src/systems/enemyHooks/index.ts` — one import line next to `bossPhase` and one registry line next to `bossPhase`

### Interfaces
No new types. `src/systems/enemyHooks/bossBack.ts` exports exactly:
```ts
export const bossBack: MakeEnemyHook;
```
No field on `Enemy` — the flash is derived from the boss's existing `reachClock` (seconds since its beat started), so there is nothing to reset in `spawn()` and a resumed run is correct for free.

### Steps
1. Create `src/systems/enemyHooks/bossBack.ts` with this exact content (model: `bossOut.ts` for the `enemies.all` pass over `outOfReachLeg`; `orbSplit.ts` for the white tint):
```ts
import { outOfReachLeg } from '../../core/outOfReach';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/**
 * The boss's return from its out-of-reach beat (the Colossus, core/outOfReach.ts): the frame its
 * 2.5 s untargetable phase ends and the towers can hit it again, its token flashes white — the
 * telegraph's own white (Enemy's `setTintFill(0xffffff)`) — for 0.3 s, once per return, the first
 * included. Display only: the wind-up ring (bossPhase) already counts the next beat and the quiet
 * tone (bossOut) already marks the departure; this marks the return. No sound, text, chip or ring.
 * The flash rides the boss's own beat clock (`reachClock`, the simulation dt), so at 2× speed it
 * lasts half the real time and a resumed run flashes at its next return, once. An enemy with no
 * outOfReach spec is byte-identical.
 */
const BACK = 0.3;

export const bossBack: MakeEnemyHook = ({ enemies }) => {
  /** The enemies this hook tinted last frame: its clear only undoes its own tint. */
  const lit = new WeakMap<Enemy, boolean>();
  return {
    update() {
      for (const e of enemies.all) {
        const spec = e.def.outOfReach;
        if (!e.active || spec === undefined || e.reachClock < 0) continue;
        // Seconds since the out-of-reach phase ended; -1 while the telegraph or the phase runs
        // (that white, if any, is the beat's own, owned by Enemy's advance).
        const back = outOfReachLeg(spec, e.reachClock) === 'idle'
          ? e.reachClock % spec.periodSec - spec.telegraphSec - spec.phaseSec
          : -1;
        const want = back >= 0 && back < BACK;
        if (want) e.setTintFill(0xffffff); // re-asserted every frame; setTintFill is idempotent
        else if (lit.get(e)) e.clearTint();
        lit.set(e, want);
      }
    },
  };
};
```
2. Edit `src/systems/enemyHooks/index.ts`: after `import { bossPhase } from './bossPhase';` add `import { bossBack } from './bossBack';`; in `ENEMY_HOOKS`, after `bossPhase,` add `bossBack,`.
3. Run `npm run check`.

### Pitfalls
- Only ever `clearTint()` when `lit.get(e)` is true: `Enemy.hit()` also sets white for 0.06 s and `Enemy.advance()` clears it on expiry — a hit inside the 0.3 s window must neither cut the flash short (re-assert every frame while `want`) nor be clobbered afterwards (guarded clear).
- Never tint during the `flash` or `out` legs — Enemy owns the 0.5 s telegraph white and the 50% alpha; the hook acts only on the edge into `idle`.
- No `onKill`/`onLeak` needed: `Enemy.despawn()` already `clearTint()`s, and a stale `lit` entry on a pooled slot is harmless (the clear is guarded and `spawn()` clears the tint).
- Do not add per-frame counting (frames ≠ 0.3 s); `back` is derived from the simulation clock, so frame-rate and 2× speed are safe. Do not add an `Enemy` field, sound, text, ring or invariant — the hooks `bossOut`/`bossPhase` set no invariants and the task is display only.

### Tests
none (display-only juice; no core rule added).
