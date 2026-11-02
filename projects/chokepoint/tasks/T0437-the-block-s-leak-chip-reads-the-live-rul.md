---
id: T0437
title: "The Block's leak chip reads the live rule"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T18:33:27Z
---

## Goal
Since the exit branch's One life a Block (T0429), a leaking Block costs 1 life — but the run's one-time teach chip (T0349) still pops "the Block takes 2 lives" at the first Block leak of every later run, stating a rule the run no longer has. The chip reads the live rule, so nothing on screen lies.

## Details
- First verify the chip does not already read the live cost — if it does, the task is void; say so.
- **Plain runs (the node not owned):** unchanged. The run's first Block leak pops the muted chip "the Block takes 2 lives" at the exit gate (T0349's chip, the first-leak chip's own look, T0107), once per run, then it is gone.
- **Runs with One life a Block owned:** the chip does not show at all on a Block leak — the Block's leak is no longer special (it costs the same 1 life as any other leak, and the run's first-leak chip already taught that a leak costs a life; restating it for the Block would be a second statement of the same rule).
- The run's one-time flag still sets on the run's first Block leak in both cases (a chip never shows later in the run), and it rides the run's save as it does today — a resumed run never re-shows it.
- Read the node's effect through the pure function T0429 added in core/tech.ts (import only — do not edit core/tech.ts). The chip's look, position and timing are untouched in the plain case.
- No new key, button, HUD element, sound or board mark.

## Acceptance criteria
- [ ] In a run without One life a Block, the first Block leak pops "the Block takes 2 lives" at the exit exactly as today; later Block leaks and the next run never do.
- [ ] In a run with One life a Block owned, no chip pops on any Block leak, and the run's one-time flag still sets (it never shows later in the run or after a resume).
- [ ] The chip's look, position and timing in the plain case are byte-identical to today; no new key, button, sound or mark; `npm run check` and the desktop + mobile smoke pass.

## Design (architect, yoga)

### Files
- edit `src/systems/enemyHooks/blockTeach.ts` - in `blockTeach.onLeak`, after the flag is set, return early (no chip) when the Block leak costs 1 life (exit node owned). No other file changes.

### Interfaces
None — no new types or signatures; the change is local to `blockTeach.onLeak`.

### Steps
1. In `blockTeach.onLeak`, move the existing `const cost = blockLeakCost(run.techOwned);` line (currently after the `x`/`y` anchor) up to immediately after `run.blockTold = true;`.
2. Add one line right after it: `if (cost === 1) return;` with a comment that, with the exit node, a Block leak costs 1 life like any other, so the first-leak chip already taught it and this one would only restate.
3. Leave the `x`/`y` anchor, `delay`, and `blockTold` call exactly as they are. The resulting `onLeak`:
```ts
  onLeak(enemy) {
    if (enemy.def.id !== 'block' || run.blockTold) return;
    run.blockTold = true; // set before any chip: the leak paid, a resumed run never re-teaches
    const cost = blockLeakCost(run.techOwned); // the exit node softens what this chip teaches (core/tech)
    if (cost === 1) return; // with the exit node a Block leak costs 1 life, same as any other: the first-leak chip already taught that, so this one would only restate it
    const pts = board.path.points; // same exit anchor as LeakCost and ExitWarning
    const x = (pts[pts.length - 1]!.x + pts[pts.length - 2]!.x) / 2;
    const y = (pts[pts.length - 1]!.y + pts[pts.length - 2]!.y) / 2;
    // onLeak runs before run.leak(): at or above the start, no leak has happened yet, so the
    // first-leak chip (systems/LeakCost) fires on this same leak. `>=`: a clean streak pays +1.
    const delay = run.lives >= START.lives ? FIRST_LEAK_CHIP_MS + AFTER_FIRST_MS : 0;
    if (delay > 0) fx.scene.time.delayedCall(delay, () => blockTold(fx, x, y, cost));
    else blockTold(fx, x, y, cost);
  },
```

### Pitfalls
- `run.blockTold` must still be set on the first Block leak in **both** cases; it is assigned before the early return, so a resumed run (flag restored from save) never re-shows the chip. Do not move or drop that assignment.
- Do not touch `blockTold.ts`: its `cost === 1` branch becomes unreachable but is harmless, and the plain-case chip (look, position, timing) must stay byte-identical.
- `blockLeakCost` is already imported from `core/tech` — do not edit `core/tech.ts`.
- No new key, button, HUD part, sound, or board mark; nothing else changes.

### Tests
none
