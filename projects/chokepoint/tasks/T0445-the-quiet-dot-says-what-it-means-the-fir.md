---
id: T0445
title: "The quiet dot says what it means: the first idle tower's one-time chip"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T20:49:14Z
---

## Goal
The quiet dot (T0233) marks an idle tower, but nothing in the game ever explains it: the first time it appears, a one-time chip above the tower says what it means, so a first-time player connects "dot" with "this tower is not fighting" and goes to check its reach.

## Details
- Trigger: the moment the quiet dot first appears on an attack-first tower in this scene — the dot's own rule, untouched (T0233: no attack event for 4 s while enemies are alive, wave phase only).
- The chip: the first-leak chip's own look — `src/systems/fx/leakCost.ts` is the closest example (small white rounded card chip, ~12 px bold muted ink, holds ~1.5 s, then fades). It reads **quiet: nothing in reach** and pops just above the idle tower's token (the name tag's anchor above the token, T0085). No sound.
- New file `src/systems/fx/quietTell.ts` holds the tell and its own once-per-scene flag (a plain field on the tell itself). The hook is one line in the towerIdle system (the system that owns the quiet dot) where the dot's state first turns on. No run-state field and no run-save change: a resumed run may teach once more, the last-stand banner's re-show pattern.
- Only the first idle tower teaches: later idle towers, and later idles of the same tower, show nothing. Never in the build phase, never on the menu demo. Support towers and still-attacking towers never trigger it.
- The dot's rule, look and timing stay exactly as T0233 left them.

## Acceptance criteria
- [ ] The first time in a run that an attack-first tower goes quiet (its quiet dot appears under T0233's rule), a white rounded chip reading "quiet: nothing in reach" pops above that tower and fades after ~1.5 s, with no sound.
- [ ] No second chip: the run's later idle towers and later idles of the first show nothing; the chip never appears during the build phase or in the menu demo.
- [ ] The quiet dot itself is unchanged (same 4 s rule, same look, same clearing), and the run state and the run save are untouched.

## Design (architect, yoga)

- `quietDot` (in `src/systems/towerIdle.ts`) is the only thing that turns the dot on — called solely from `TowerSystem.ts:122`, gated by `firstAttacks` (attack-first towers only; supports skipped). It fires `t.setIdleDot(true)` once `idleSec >= 4` while `road = aliveCount > 0` (wave only; off in build phase). `Tower.idleOn` + the `setIdleDot` guard make it a transition.
- `leakCost.ts` is the closest chip (white card, 12px bold muted ink, deep side face, no sound); `nameLabel.ts` pops at the `y - 30` "above the token" anchor (T0085); `leechTell.ts` uses `delay: 1200` for the ~1.5s hold.
- `farGateTell` uses a **run-state** field (`run.farGateTold`); this task explicitly wants the opposite — a module-level flag, no run-state/save.
- Menu demo (`MenuDemo.ts`) has no `TowerSystem`/`quietDot`, so the tell can't fire there.

DESIGN:
### Files
- create `src/systems/fx/quietTell.ts` — the one-time "quiet: nothing in reach" chip above an idle tower's token, with its own module-level once flag.
- edit `src/systems/towerIdle.ts` — add an `fx: FxSystem` param to `quietDot`, import `FxSystem` + `quietTell`, add the one-line hook where the dot first turns on.
- edit `src/systems/TowerSystem.ts` — line 122: thread `this.fx` into the `quietDot` call.

### Interfaces
```ts
export function quietDot(t: Tower, road: boolean, attacked: boolean, dt: number, fx: FxSystem): void;
export function quietTell(fx: FxSystem, x: number, y: number): void;  // module-level `let quietTold = false`
```

### Steps
1. `quietTell.ts` — copy `leakCost.ts` exactly; three deltas: label text `'quiet: nothing in reach'`; container at `y - 30` (name tag's anchor above the token, T0085) instead of bare `y`; and first two lines `if (fx.full || quietTold) return;` then `quietTold = true;`. Keep `fx.track(chip, 300, { alpha: 0, delay: 1200, ease: 'Quad.easeIn' })` for the ~1.5 s hold (leechTell's timing), no sound.
2. `towerIdle.ts` — add `import type { FxSystem } from './FxSystem';` and `import { quietTell } from './fx/quietTell';` next to the Tower import; add the `fx: FxSystem` param; brace the `if (t.idleSec >= IDLE_DOT_SEC)` block and add `quietTell(fx, t.x, t.y);` right after `t.setIdleDot(true);`.
3. `TowerSystem.ts:122` — `if (firstAttacks) quietDot(t, road, attacked || t.beamHolding, dt, this.fx);`

### Pitfalls
- The dot stays on for many frames after 4 s (`setIdleDot(true)` runs every idle frame); the module-level `quietTold` is the *only* once-guard — do NOT add a per-frame transition check. Same-frame twin idles: the first tower processed consumes the flag, so exactly one chip.
- The existing `road` gate (`aliveCount > 0`) already keeps the dot (and thus the tell) off in the build phase, and TowerSystem isn't run in the menu demo — add no `run.phase` or scene check.
- `quietTold` is module-level per the task ("a plain field on the tell itself", no run-state/save). Do NOT put it on `run`/`saveRun` or wire a reset into GameScene; a fresh page re-evaluates the module and re-teaches (last-stand banner's re-show pattern).
- Thread `fx` via the new param; don't read it off `Tower` (no fx ref) or a global. Anchor is `y - 30`, not leakCost's bare `y`. `t.x, t.y` are stable board units.

### Tests
- none
