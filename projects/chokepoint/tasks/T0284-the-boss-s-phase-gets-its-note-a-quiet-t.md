---
id: T0284
title: "The boss's phase gets its note: a quiet tone when it goes out of reach"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-30T12:12:05Z
claimed_at: 2026-10-30T12:45:17Z
finished_at: 2026-10-30T12:57:58Z
epic: E5
---

## Goal
The Colossus's out-of-reach beat (T0253) is seen — a white flash, the dimmed boss bar (T0256) — but the 2.5 s of wasted damage is silent. Give that dead beat a quiet note so the phase the player has to plan around is heard where it is already seen, the way the boss's arrival (T0268) and escape (T0269) already are.

## Details
- The moment the run's out-of-reach boss (today the Colossus, T0253) flashes white and goes out of reach — the start of its untargetable beat, which repeats every 8 s while it is at or below half health — one short muted note plays. It matters now: that phase is already live on wave 10.
- The note: a single 120 ms sine falling 220→180 Hz, volume 0.08 — the quiet single-note class (T0091's last-stand sting reduced to one note, one notch lower and a touch softer). One note per beat; the 2.5 s untargetable window does not repeat it.
- The return to targetable stays silent — no note when the boss comes back in reach.
- At 2× fast-forward (T0019) it plays once per beat, exactly like the arrival horn and the escape note.
- A new small enemy-hook file in `src/systems/enemyHooks/` on the bossArrival hook's pattern (T0268 — the hook that plays the boss's horn when it spawns), plus one new one-note method next to `Sfx.bossHorn()` in `src/audio/Sfx.ts` (the single-note shape is T0091's `Sfx.sting()`). Silent where the sound toggle (T0035) is off.
- No HUD element, no board mark, no text: the flash and the dimmed boss card already show the phase; this only adds the sound. The boss card (T0256) is untouched.

## Acceptance criteria
- [ ] When the Colossus flashes white and goes out of reach, one short muted note (120 ms sine 220→180 Hz, vol 0.08) plays; it plays again on the next beat; the return to targetable plays nothing.
- [ ] With the sound toggle off, no note plays, and the white flash and the dimmed boss bar are unchanged.
- [ ] No HUD element, board mark or text was added; the boss card and its dimmed bar are untouched.
- [ ] `npm run check` passes, and the desktop (1280x720) and mobile (412x915) smoke tests pass.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/bossOut.ts` - the hook: when the out-of-reach boss's white telegraph flash ends and it goes out of reach (leg `flash` → `out` in `core/outOfReach.ts`), plays one quiet note via `sfx?.bossOut()`; silent on the return to targetable (`out` → `idle`)
- edit `src/systems/enemyHooks/index.ts` - one import line + one list line for `bossOut`, next to `bossArrival` (not at the list's end)
- edit `src/audio/Sfx.ts` - one new method `bossOut()` directly after the `bossEscape()` method (the boss block: `bossHorn`/`leak`/`bossEscape`)

### Interfaces
Sfx (one method, next to `bossHorn()`'s kin):
```ts
/** The boss goes out of reach: a quiet falling note, A3 to G3, 120 ms, the sting's softest class. */
bossOut(): void {
  this.tone(220, 0.12, 'sine', 0.08, 180);
}
```
bossOut.ts, whole file (model: `bossEscape.ts` for the shape, `nameTag.ts` for the pooled-Enemy `WeakMap`):
```ts
import { outOfReachLeg } from '../../core/outOfReach';
import type { OutOfReachLeg } from '../../core/outOfReach';
import type { Enemy } from '../../entities/Enemy';
import type { MakeEnemyHook } from './hook';

/**
 * The boss's out-of-reach: the frame its white telegraph flash ends and it goes out of reach,
 * one quiet note plays - the start of its 2.5 s untargetable beat (core/outOfReach.ts). One
 * note per 8 s beat; the return to targetable is silent; an enemy with no outOfReach spec is
 * byte-identical.
 */
export const bossOut: MakeEnemyHook = ({ enemies, sfx }) => {
  const prevLeg = new WeakMap<Enemy, OutOfReachLeg>();
  return {
    update() {
      for (const e of enemies.all) {
        if (!e.active || e.def.outOfReach === undefined || e.reachClock < 0) continue;
        const now = outOfReachLeg(e.def.outOfReach, e.reachClock);
        const prev = prevLeg.get(e);
        if (prev === 'flash' && now === 'out') sfx?.bossOut();
        if (now !== prev) prevLeg.set(e, now);
      }
    },
  };
};
```
index.ts: add `import { bossOut } from './bossOut';` with the other hook imports, and `bossOut,` in the `ENEMY_HOOKS` list on the line after `bossArrival,`.

### Steps
1. Add `bossOut()` to `Sfx.ts` after the `bossEscape()` method (exact code above). `tone` already checks `this.muted`, so the sound toggle (T0035) silences it for free.
2. Create `src/systems/enemyHooks/bossOut.ts` with exactly the code above.
3. Add the two lines to `src/systems/enemyHooks/index.ts` (import with the other hook imports; list item after `bossArrival,`).

### Pitfalls
- The note fires on `flash` → `out` only — not at the flash start (`idle` → `flash`) and not on the return to targetable (`out` → `idle`); the acceptance criteria test the return is silent.
- State lives in the hook's closure (`WeakMap`), never module-level: a new run makes a new hook. Keying by pooled `Enemy` is the `nameTag.ts`/`burnLeap.ts` mark; a recycled enemy's stale leg can't misfire because a new life is skipped while `reachClock < 0` and always passes through `flash` before `out`.
- `sfx` is `Sfx | undefined` in the hook context — always `sfx?.bossOut()`. No sound scheduling, no held nodes: one `tone` call per beat, so 2× fast-forward (T0019) plays exactly once per beat, like the arrival horn and escape note.
- No fx, no mark, no text, no `BossCard`/flash change — the existing white flash and dimmed bar stay as they are; `Enemy.ts`, `core/outOfReach.ts` and `BossCard.ts` are untouched.

### Tests
none (juice/audio task; `npm run check` and the desktop + mobile smoke gates are the verification).

## Result (attempt 1, yoga)

The Colossus's out-of-reach beat now has its quiet note: a new `bossOut()` method in `Sfx.ts` (one 120 ms sine, 220→180 Hz, vol 0.08, the sting's softest class) and a new enemy hook `src/systems/enemyHooks/bossOut.ts` that plays it the frame the boss's white telegraph flash ends and it goes untargetable — one note per 8 s beat, silent on the return to targetable and when the sound toggle is off. Registered with one import line and one list line in `enemyHooks/index.ts` next to `bossArrival`. No HUD, mark, text or boss-card changes; check and desktop + mobile smoke all pass.

- Self-review: APPROVE
- Time: 12.7 min

```
projects/chokepoint/game/src/audio/Sfx.ts          |  5 +++++
 .../game/src/systems/enemyHooks/bossOut.ts         | 25 ++++++++++++++++++++++
 .../game/src/systems/enemyHooks/index.ts           |  2 ++
 3 files changed, 32 insertions(+)
```
