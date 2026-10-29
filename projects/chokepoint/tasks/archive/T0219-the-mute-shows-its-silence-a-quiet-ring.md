---
id: T0219
title: "The Mute shows its silence: a quiet ring under the Mute"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T16:16:13Z
claimed_at: 2026-10-29T17:32:01Z
finished_at: 2026-10-29T17:47:13Z
---

## Goal
The Mute holds every tower within 2 cells still, and nothing on the board says so — a first-time player sees towers go quiet and can't tell why, or how far the silence reaches. The Mute earns its telegraph: a quiet ring in its own color, in the language the game already uses for quiet work.

## Details
- What exists: the Mute (from wave 11) silences every tower within 2 cells while it lives; a jammed tower shows nothing, and the Mute's reach is drawn nowhere. The game already has the sign of quiet work: the working-aura ring (T0055) — a thin ring in the source's own color grows from the base and fades over 1 s each time the effect works — and the root's light-blue ground ring (T0192).
- The change: while a live Mute is holding at least one tower still, a thin ring in the Mute's own purple grows from the Mute's token out to its full 2-cell silence radius and fades over 1 s, once per second — the silence reads as a quiet steady pulse. Ground level, under the token (the root ring's placement), the working-aura's soft alpha. No ring while the Mute is alive but no tower is within its radius — the ring is the "working" sign, not a permanent marker — and it clears the instant the Mute dies.
- Display only: the Mute's numbers, its silence, its token and every other enemy, tower and HUD element are untouched; the ring reuses the check that already decides which towers are jammed (no new radius, no new metric). It is a draw, not a simulation timer — it reads the same at 1x and 2x.
- Closest examples: the working-aura ring (T0055) for the grow-and-fade once-per-second pulse; the root ground ring (T0192) for the ground-level placement; the enemy-hook pattern (T0099, T0138, the hooks index) for where the draw lives — the Mute's own hook, which owns its reaction, or a display-only sibling registered next to it.
- No sound, no input, no HUD element, no save field.

## Acceptance criteria
- [ ] While a live Mute holds at least one tower within its 2-cell radius still: a thin purple ring grows from the Mute out to 2 cells and fades over 1 s, repeating once a second, at 1x and 2x.
- [ ] A live Mute with no tower in range shows no ring; the moment the Mute dies its ring is gone.
- [ ] The ring sits at ground level in the Mute's own purple at the working-aura's soft alpha; the Mute's silence, numbers and token behave exactly as before, and no other enemy, tower or HUD element changes.
- [ ] No sound, no new input, no HUD element; the smoke test passes on desktop and mobile.

## Design (architect, yoga)

### Files
- edit `src/systems/enemyHooks/muteJam.ts` — the Mute's own hook (already in `ENEMY_HOOKS`) gains its working sign: while it holds a tower still, a thin purple ring pulses from its token out to the 2-cell reach once a second of real time, fades over 1 s, follows the Mute, and is destroyed the frame the Mute dies. Nothing else changes.

### Interfaces
None. Export stays `export const muteJam: MakeEnemyHook`; the `update()` body grows, plus `onKill`/`onLeak`.

### Steps
Replace the whole file with exactly this:

```ts
import type Phaser from 'phaser';
import { CELL, DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import type { Enemy } from '../../entities/Enemy';
import { fillRing } from '../../ui/ring';
import type { MakeEnemyHook } from './hook';

/** Cells of road a Mute silences: the same reach Rally's range ring shows. */
const MUTE_REACH = 2;
/** The pulse's beat and life, in real milliseconds (scene.time, not the simulation dt). */
const BEAT_MS = 1000;

/**
 * The Mute's silence: while a Mute is alive, every tower whose center is inside its two-cell
 * circle holds still. Sets `jammed` on each tower (entities/Tower.ts); TowerSystem skips jammed
 * towers, so no shot, gust, root, burn or tick leaves them, and the Push windup (its ring reads
 * the tower's own cooldown) freezes and resumes with it.
 *
 * The working sign: while a Mute holds at least one tower still, a thin ring in the Mute's own
 * purple pulses from its token out to the full reach once a second and fades over 1 s, at ground
 * level under the token in the working aura's soft alpha (systems/fx/auraRing.ts). It is a draw,
 * not a simulation timer: the beat and the fade run on scene.time, so they read the same at 1x
 * and 2x. The ring is gone the frame the Mute dies.
 */
export const muteJam: MakeEnemyHook = ({ enemies, towers, scene }) => {
  /** Real ms of the last pulse; 0 so the first holding frame pulses straight away. */
  let lastPulse = 0;
  /** One live ring per Mute: its Graphics and its tween, followed every frame, cleared on death. */
  const rings = new Map<Enemy, { g: Phaser.GameObjects.Graphics; tw: Phaser.Tweens.Tween }>();
  const drop = (e: Enemy) => {
    const r = rings.get(e);
    if (!r) return;
    rings.delete(e);
    r.tw.remove();
    r.g.destroy();
  };
  return {
    update() {
      const mutes = enemies.all.filter((e) => e.active && e.def.id === 'mute');
      const r2 = MUTE_REACH * MUTE_REACH * CELL * CELL;
      for (const t of towers()) t.setJammed(mutes.some((m) => (m.x - t.x) ** 2 + (m.y - t.y) ** 2 <= r2));
      // The rings follow their Mutes (the Mute walks; the ring stays on it).
      for (const [m, r] of rings) r.g.setPosition(m.x, m.y);
      // The quiet pulse: once a second of real time, each Mute that holds at least one tower still.
      const now = scene.time.now;
      if (now - lastPulse >= BEAT_MS) {
        lastPulse = now;
        for (const m of mutes) {
          if (!towers().some((t) => (m.x - t.x) ** 2 + (m.y - t.y) ** 2 <= r2)) continue;
          drop(m); // the last pulse is fading out; a no-op once it has faded
          const g = scene.add.graphics().setDepth(DEPTH.preview).setPosition(m.x, m.y);
          fillRing(g, 0, 0, MUTE_REACH * CELL, 3, 0, Math.PI * 2, PALETTE.purple, 0.9);
          g.setScale((0.26 * CELL) / (MUTE_REACH * CELL)); // from the Mute's token (look.size, content/enemies/mute.ts)
          const tw = scene.tweens.add({
            targets: g, scale: 1, alpha: 0, duration: BEAT_MS, ease: 'Quad.easeOut',
            onComplete: () => {
              const r = rings.get(m);
              if (r && r.g === g) {
                rings.delete(m);
                g.destroy();
              }
            },
          });
          rings.set(m, { g, tw });
        }
      }
    },
    onKill({ enemy }) {
      drop(enemy); // gone the frame it dies, even mid-pulse (as the root's tick is)
    },
    onLeak(enemy) {
      drop(enemy);
    },
  };
};
```

### Pitfalls
- The jam loop (`setJammed(...)`) must stay byte-identical — it is the mechanics; the ring is the separate block below it, reusing the same `r2` and the same distance test (no new radius constant).
- The beat is `scene.time.now` (real ms), never an accumulated `dt`: `WaveSpeed` doubles the `dt` the hook receives at 2x, so a dt beat would pulse twice a second there and the fade tween is real-time too — both must stay on wall time for 1x and 2x to read the same.
- Only one of `drop()` and the tween's `onComplete` may destroy a ring: `drop()` calls `tw.remove()` first, and `onComplete` is guarded by `r.g === g`. A double `destroy()` on a Phaser object is not safe.
- `Enemy` objects are pooled: the map is keyed by instance but an entry can only exist while the Mute is alive (created at the beat, cleared the frame it dies via `onKill`/`onLeak`), so a re-spawned pooled Mute never inherits a dead ring — no serial tracking needed.
- The ring is drawn at `DEPTH.preview` (5), under towers (10) and enemies (20); `fillRing`'s radius is board units (`MUTE_REACH * CELL`), never screen pixels; start scale 0.26/2 is the token, so the ring grows from the token out to the full reach.

### Tests
- none (display only; no `core/` rule changes)

## Result (attempt 1, yoga)

The Mute now shows its silence: while a live Mute holds at least one tower within its 2-cell reach, a thin purple ring in the Mute's own color grows from its token out to the full radius and fades over 1 s, pulsing once a second of real time (so 1x and 2x read the same), at ground level under the token in the working-aura's soft alpha. No ring appears when no tower is in range, and it clears the frame the Mute dies or leaks. The jam mechanic itself is byte-identical — the ring reuses the same radius check — and nothing else changed; check and smoke pass.

- Self-review: APPROVE
- Time: 15.2 min

```
.../game/src/systems/enemyHooks/muteJam.ts         | 72 +++++++++++++++++++---
 1 file changed, 64 insertions(+), 8 deletions(-)
```
