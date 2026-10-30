---
id: T0286
title: "The boss's phase wind-up: the ring that counts the eight seconds"
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T12:31:05Z
claimed_at: 2026-10-30T13:22:36Z
epic: E5
---

## Goal
The Colossus goes out of reach for a beat, then again every 8 s — but between beats the player counts dead air. A thin ring at its feet makes the next beat readable before it lands, so a single-target build plans its burst windows around a clock it can see.

## Details
- While the run's Colossus (any boss with the out-of-reach mechanic, T0253) is alive and at half health or below, one thin ring in the boss's own color (purple) sits on the road under its token, at ground level, and sweeps 0°→360° clockwise from 12 o'clock over the boss's full 8 s between phases — the Push wind-up's sweep (T0258) in the Mute ring's ground placement (T0219).
- The sweep starts the moment the boss returns to targetable and completes exactly as the white telegraph flashes (0.5 s). For the 2.5 s out-of-reach beat the ring rests — a dim, un-swept full circle — and resumes a fresh sweep at the next return. The moment the boss first reaches half health the first phase starts at once, so the ring appears already complete and its first full sweep counts the next 8 s.
- The ring only exists at half health or below: above it, nothing (the first phase is still read by the boss card's notch, T0256). It follows the boss along the road and clears the moment the boss dies or leaks.
- It is driven by the boss's own phase clock, so at 2× speed (T0019) it sweeps in half the real time and stays true to the beat.
- A new enemy-mark hook file on the markTick/crackTick pattern (one Graphics mark around the boss, per frame, reading the boss's out-of-reach state), registered in the enemy-hooks index. No sound, no HUD, no card change; the boss card (T0256) and the phase note (T0284) stay as they are. This is a wind-up, not a status chip: it shows the clock to the next beat, which nothing else shows (the removed chips, T0179, marked states the enemy's own look already shows).

## Acceptance criteria
- [ ] Above half health the Colossus wears no ring; from the moment it reaches half health, a thin purple ring at ground level under its token sweeps 0°→360° clockwise over 8 s.
- [ ] The sweep completes as the telegraph's white flash begins; through the 2.5 s out-of-reach beat the ring rests as a dim un-swept circle; it resumes a full sweep when the boss returns.
- [ ] The ring tracks the boss along the road and clears the moment the boss dies or leaks.
- [ ] No sound, no HUD element, no change to the boss card or the phase note; at 2× speed the ring sweeps in 4 real seconds.
- [ ] Bosses without the out-of-reach mechanic (the Titan and its Guard, the Orb) wear no ring.

## Design (architect, cachyos-x8664)

### Files
- create `src/systems/enemyHooks/bossPhase.ts` - the Colossus phase wind-up: one per-frame Graphics ring on the road under the boss token, driven by the boss's own `reachClock` (sim time), cleared on kill/leak/despawn
- edit `src/systems/enemyHooks/index.ts` - add `import { bossPhase } from './bossPhase';` after the `bossOut` import, and one line `bossPhase,` after `bossOut,` in the `ENEMY_HOOKS` list (its kin: `bossArrival`, `bossOut`)

### Interfaces
No new shared types. The hook is `export const bossPhase: MakeEnemyHook` taking `({ fx, enemies })` and returning `{ update(), onKill(kill: KillEvent), onLeak(enemy: Enemy) }`. It reads only existing things: `e.def.outOfReach` (the inline `{ hpFrac, telegraphSec, phaseSec, periodSec }` on `EnemyDef`), `e.reachClock`, `e.active`, `enemies.all`, `outOfReachLeg(spec, clock)` from `core/outOfReach.ts`, `fillRing(g, x, y, r, w, from, to, color, alpha)` from `ui/ring.ts` (0 = up, clockwise), `PALETTE[e.def.look.color]` (= purple for the Colossus), `DEPTH.preview` (ground layer, under the token), `fx.scene`.

State of the ring, all derived per frame from `t = e.reachClock % spec.periodSec` and `leg = outOfReachLeg(spec, e.reachClock)` — at half health `reachClock = 0` → leg is `flash` → the ring appears already complete:
- `leg === 'flash'`: full circle, alpha 1 (the sweep, complete exactly as the white telegraph begins)
- `leg === 'out'`: full circle, alpha `DIM = 0.25` (resting: dim, un-swept)
- `leg === 'idle'`: fresh sweep, `progress = (t - spec.telegraphSec - spec.phaseSec) / (spec.periodSec - spec.telegraphSec - spec.phaseSec)`, arc `0..progress * Math.PI * 2`

### Steps
1. Create `src/systems/enemyHooks/bossPhase.ts`, modeled on `crackTick.ts` (its `Map<Enemy, Phaser.GameObjects.Graphics>` + `drop()` structure) for lifecycle and `muteJam.ts` for the ground placement (`setDepth(DEPTH.preview).setPosition(e.x, e.y)`), with the exact body:

```ts
const W = 2; // thin, as PushWindup's
const DIM = 0.25;

export const bossPhase: MakeEnemyHook = ({ fx, enemies }) => {
  const rings = new Map<Enemy, Phaser.GameObjects.Graphics>();
  const drop = (e: Enemy) => {
    const g = rings.get(e);
    if (!g) return;
    rings.delete(e);
    g.destroy();
  };
  return {
    update() {
      for (const e of enemies.all) {
        const spec = e.def.outOfReach;
        if (!e.active || spec === undefined || e.reachClock < 0) { drop(e); continue; }
        let g = rings.get(e);
        if (!g) { g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(e.x, e.y); rings.set(e, g); }
        g.setPosition(e.x, e.y);
        const t = e.reachClock % spec.periodSec;
        const leg = outOfReachLeg(spec, e.reachClock);
        const r = e.def.look.size * CELL; // the Colossus's token radius
        g.clear();
        if (leg === 'out') fillRing(g, 0, 0, r * 1.5, W, 0, Math.PI * 2, PALETTE[e.def.look.color], DIM);
        else if (leg === 'flash') fillRing(g, 0, 0, r * 1.5, W, 0, Math.PI * 2, PALETTE[e.def.look.color], 1);
        else {
          const p = (t - spec.telegraphSec - spec.phaseSec) / (spec.periodSec - spec.telegraphSec - spec.phaseSec);
          if (p > 0) fillRing(g, 0, 0, r * 1.5, W, 0, p * Math.PI * 2, PALETTE[e.def.look.color], 1);
        }
      }
    },
    onKill({ enemy }) { drop(enemy); },
    onLeak(enemy) { drop(enemy); },
  };
};
```

2. Edit `index.ts`: the one import line and one list line, next to `bossOut` (never at the end of the list).
3. No other files: no `BossCard`/phase-note change, no sound, no invariants in `debug/runChecks.ts` (enemy hooks aren't reachable from GameScene; the tick hooks `crackTick`/`rootTick`/`muteJam` set that precedent, and `EnemySystem` already bounds `reachClock`).

### Pitfalls
- `Graphics` accumulates: `g.clear()` before `fillRing` every frame, or the arcs paint over each other.
- Pooled `Enemy`: the boss dies (onKill), leaks (onLeak) or is despawned without a kill at wave end — all three paths `drop()`; the `!e.active` guard in `update` catches the pool reuse.
- Guard `reachClock < 0` before the `%`/leg math: above half health the ring must not exist (and no negative mod).
- `p = 0` at idle start: `fillRing` no-ops at span 0 — the ring is briefly empty before the fresh sweep grows; that is the spec, don't clamp it to a visible sliver.
- Drive from `reachClock` (sim dt, which `WaveSpeed.scale` speeds at 2×), never `scene.time` — the mute-jam beat is cosmetic and uses scene.time; this one must run in half the real time at 2×.
- `depth DEPTH.preview` (5), under the enemy (20): the ring is a ground prop, so the boss's 2 px pop bob on `e.y` is fine (the Mute ring sits the same way); never `scene.scale`/pixels — radius and width are board units.
- Color from `e.def.look.color` (any future out-of-reach enemy wears its own color); the Titan/Guard/Orb need no code: they simply have no `outOfReach` def.

### Tests
none — juice/mark task; the rule it reads (`outOfReachLeg`, `reachClock`) is already tested via `core/outOfReach.ts`.
