---
id: T0335
title: "The Ward shows its immunity: a ring when a control does not take"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T02:32:15Z
claimed_at: 2026-11-01T03:05:23Z
finished_at: 2026-11-01T03:27:42Z
---

## Goal
A Ward that shrugs off a slow, a root or a gust says so on the board: the control that does not take gets one small ring, so a first-time player learns the Ward's rule from the board instead of from a leak.

## Details
- Display-only, on the board: the moment a control that a Ward ignores — a Frost slow (first apply or a re-apply), an Anchor root, a Push gust or a per-hit push — is applied to a live Ward and takes no effect, one small ring plays at the Ward's base: a thin ring in the Ward's own **red**, muted at ~40% alpha, growing from the token's base out to ~0.5 cells over ~400 ms while fading, at ground level under the token (the Mute ring's / the boss-arrival ring's ground placement).
- One ring at a time per Ward: if a ring is already playing, the new event restarts it from the top; a Ward standing inside a Frost aura refreshes it no more often than once per 0.5 s.
- The hook fires exactly where the Ward's `ignoresControl` makes a push, root or slow be skipped — the shared control path the fatigue module (T0301) rides. New file `src/systems/enemyHooks/wardDeny.ts`, registered in `src/systems/enemyHooks/index.ts` (one import, one `ENEMY_HOOKS` line, the `bossPhase` anchor pattern). Closest example to copy: the Mute's silence ring hook (T0219).
- No sound, no input, no gameplay change: the Ward's numbers (hp 180, speed 0.9, gold 10, 1 life) and its immunity are untouched; the controls still do nothing to it.

## Acceptance criteria
- [ ] A Frost apply, an Anchor pulse, a Push gust or a per-hit push landing on a live Ward plays one small red ring at its base; a re-apply restarts the ring instead of stacking, and inside a Frost aura it refreshes at most once per 0.5 s.
- [ ] The ring is display-only: a Ward's hp, speed, gold, leak cost and control immunity are unchanged; the controls still do nothing to it.
- [ ] No ring on any enemy that is not a Ward; no sound; no new input.
- [ ] The hook is a new file registered in the enemy-hook list; typecheck, lint, unit tests and the smoke test pass.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/wardDeny.ts` - the Ward's shrug-off ring: one small red ring at its base when a control is ignored
- edit `src/entities/Enemy.ts` - add a `deny` flag, set it where `ignoresControl` skips slow/root/push, reset in `spawn()`
- edit `src/systems/enemyHooks/index.ts` - one import + one `ENEMY_HOOKS` line, both next to `muteJam`

### Interfaces
```ts
// entities/Enemy.ts — new public field (display-only; only the Ward ever sets it)
deny = false;

// systems/enemyHooks/wardDeny.ts — new export (same shape as muteJam/bossPhase)
export const wardDeny: MakeEnemyHook;
```
No signature changes: `slow()`, `root()`, `pushBack()` keep their params/returns; only their `ignoresControl` early-return now also sets `this.deny = true`.

### Steps
1. **`entities/Enemy.ts`** — add the field after `pushLeft` (line 58): `/** True on the frame a slow, root or push was applied and ignored (ignoresControl); the Ward's ring (systems/enemyHooks/wardDeny.ts) reads and clears it. */ deny = false;` Add `this.deny = false;` in `spawn()` after `this.pushLeft = 0;` (line 105). Then split the three early-returns so only the `ignoresControl` branch sets it:
   - `slow()`: `if (this.def.ignoresControl) { this.deny = true; return; }` (keep the `pct < this.slowPct` line after it).
   - `root()`: replace `if (this.def.ignoresControl || this.rootLeft > 0) return;` with `if (this.def.ignoresControl) { this.deny = true; return; }` then `if (this.rootLeft > 0) return;`.
   - `pushBack()`: replace `if (!this.active || this.def.ignoresControl || units <= 0) return;` with `if (!this.active || units <= 0) return;` then `if (this.def.ignoresControl) { this.deny = true; return; }`.
2. **Create `src/systems/enemyHooks/wardDeny.ts`** — model on `muteJam` (ring) + `bossPhase` (per-enemy `Map` + `drop` on kill/leak). `export const wardDeny: MakeEnemyHook = ({ fx, enemies }) => { ... }`. Constants: `RING_CELLS = 0.5`, `W = 2`, `A = 0.4`, `LIFE_MS = 400`, `REFRESH_MS = 500`. Closure: `rings = new Map<Enemy, { g: Phaser.GameObjects.Graphics; tw: Phaser.Tweens.Tween; last: number }>()`; `drop(e)` deletes + `tw.remove()` + `g.destroy()` (copy muteJam's); `bloom(e, now)`: if `r && now - r.last < REFRESH_MS` return; else `drop(e)`, then `R = RING_CELLS * CELL`, `g = fx.scene.add.graphics().setDepth(DEPTH.preview).setPosition(e.x, e.y)`, `fillRing(g, 0, 0, R, W, 0, Math.PI * 2, PALETTE[e.def.look.color], A)`, `g.setScale((e.def.look.size * CELL) / R)`, tween `{ targets: g, scale: 1, alpha: 0, duration: LIFE_MS, ease: 'Quad.easeOut', onComplete: drop-if-still-this-g }`, `rings.set(e, { g, tw, last: now })`. Return `{ update() { const now = fx.scene.time.now; for (const e of enemies.all) { if (!e.active) continue; const r = rings.get(e); if (r) r.g.setPosition(e.x, e.y); if (e.def.ignoresControl !== true || !e.deny) continue; e.deny = false; bloom(e, now); } }, onKill({ enemy }) { drop(enemy); }, onLeak(enemy) { drop(enemy); } }`.
3. **`src/systems/enemyHooks/index.ts`** — add `import { wardDeny } from './wardDeny';` after the `muteJam` import; add `wardDeny,` after `muteJam,` in `ENEMY_HOOKS`.

### Pitfalls
- The ring is one per Ward: `bloom` must `drop` before recreating (never stack); the `REFRESH_MS` guard makes a Frost aura's re-apply refresh at most once per 0.5 s while a discrete gust/root/push restarts from the top.
- `deny` is a pooled field: it MUST reset in `spawn()`, or a recycled Ward re-shows a stale ring; only the Ward sets it (only it has `ignoresControl`), so no other enemy rings.
- Ring is display-only: never touch hp/speed/gold/rootLeft/slowPct/pushLeft; the early-returns still skip, controls still do nothing.
- Ground level under the token = `DEPTH.preview` (5, below `enemies` 20), repositioned every frame so it stays on the walking Ward; gone the frame it dies/leaks via `drop`.

### Tests
none

## Result (attempt 1, yoga)

The Ward now shows its immunity: when a Frost slow, Anchor root, Push gust or per-hit push lands on it and is ignored, one small thin red ring plays at its base (its own color, ~40% alpha, growing from the token's base out to 0.5 cells over 400 ms, at ground level under the token) so a first-time player reads the Ward's rule from the board. The hook is a new file, systems/enemyHooks/wardDeny.ts, registered next to muteJam in the enemy-hook list; Enemy.ts gained a display-only `deny` flag, set exactly where the `ignoresControl` early-returns skip a control and reset in `spawn()`. One ring per Ward: a new event restarts it from the top instead of stacking, and a Frost aura's re-apply refreshes at most once per 0.5 s. The Ward's numbers and immunity are untouched — the controls still do nothing to it; no sound, no input, no gameplay change.

- Self-review: APPROVE
- Time: 22.3 min

```
projects/chokepoint/game/src/entities/Enemy.ts     | 11 +++-
 .../game/src/systems/enemyHooks/index.ts           |  2 +
 .../game/src/systems/enemyHooks/wardDeny.ts        | 76 ++++++++++++++++++++++
 3 files changed, 86 insertions(+), 3 deletions(-)
```
