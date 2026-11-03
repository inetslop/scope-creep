---
id: T0479
title: "The Hauler's leak pays its note: the coin blip when its 5 gold is taken"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-03T07:13:15Z
claimed_at: 2026-11-03T07:38:02Z
---

## Goal
A Hauler's leak costs 1 life and 5 gold (T0057); the first-leak chip teaches the cost (T0307), but the gold taken is still silent — the thud says "life", nothing says "gold". One quiet coin blip at the exit the moment a Hauler leak actually takes its gold.

## Details
- When a Hauler leaks and its 5-gold cost takes at least 1 gold from the run, one soft falling two-note coin blip plays at the exit gate: G4→E4, 60 ms, volume 0.08 — the run's quietest class (the Ward note's class, T0474), below the hit blip.
- One blip per Hauler leak. A Hauler leak that takes no gold (the run is at 0) plays nothing; no other leaker (a Dot, a Block, a boss, a split piece) ever plays it.
- Silent with the sound toggle off; no visual, no HUD, no new mark — the leak's thud, jolt and echo are untouched.
- Shape and files: the Ward note's pattern (T0474) — a new display-free hook file beside `src/systems/enemyHooks/wardDenyNote.ts`, riding the leak path the way the leak's Toll blip (T0255) rides it, so it reads the leaker's type and whether gold was taken; one `haulerLeak()` method in `src/audio/Sfx.ts` beside `wardDeny()`; one registration line in `src/systems/enemyHooks/index.ts`.

## Acceptance criteria
- [ ] A Hauler leak whose 5-gold cost takes gold plays one soft falling two-note blip (G4→E4, 60 ms, 0.08) at the exit, once per leak.
- [ ] A Hauler leak at 0 gold plays nothing; a leak of any other enemy type never plays it.
- [ ] With sound off it is silent; the leak's thud, jolt, echo and held chip are unchanged; no visual or HUD change.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/haulerLeakNote.ts` — display-free note hook: rides `onLeak`, and the moment a Hauler's 5-gold cost takes gold, plays one soft falling two-note coin blip (`Sfx.haulerLeak`); no visual, no HUD.
- edit `src/audio/Sfx.ts` — add one `haulerLeak()` method, placed directly below `wardDeny()` (line ~287), before `towerMilestone()`.
- edit `src/systems/enemyHooks/index.ts` — one import line next to the `haulerLeak` import; one array line directly **above** `haulerLeak,`.

### Interfaces
```ts
// Sfx.ts, directly after wardDeny() { this.tone(523.25, 0.06, 'sine', 0.08, 440); } :
haulerLeak(): void {
  this.tone(392, 0.06, 'sine', 0.08);            // G4
  this.tone(330, 0.06, 'sine', 0.08, undefined, 0.04); // E4, ~40 ms later
}

// haulerLeakNote.ts, whole file (display-free: only reads state + plays the sound):
import type { MakeEnemyHook } from './hook';
export const haulerLeakNote: MakeEnemyHook = ({ run, sfx }) => ({
  onLeak(enemy) {
    if (enemy.def.id !== 'hauler' || run.gold <= 0) return;
    sfx?.haulerLeak();
  },
});
```

### Steps
1. Create `src/systems/enemyHooks/haulerLeakNote.ts` with the export above. Guard: not a Hauler → return; run at 0 gold → return. Then `sfx?.haulerLeak()`. No `fx`, no scene objects, no `delayedCall` (no visual — it plays at the moment of the leak, immediately).
2. Add the `haulerLeak()` method to `src/audio/Sfx.ts` exactly as above, directly below `wardDeny()`.
3. In `src/systems/enemyHooks/index.ts`: add `import { haulerLeakNote } from './haulerLeakNote';` right above the `haulerLeak` import; add `haulerLeakNote,` right above `haulerLeak,` in `ENEMY_HOOKS`.

### Pitfalls
- **Ordering is the whole design**: `haulerLeakNote` must run **before** `haulerLeak` (array line directly above it). `haulerLeak` does `run.gold = Math.max(0, run.gold - 5)`; the note reads `run.gold` **before** that, so `run.gold > 0` = "the cost takes at least 1 gold". If placed after, `run.gold > 0` misfires (pre 5 → post 0 → wrongly silent). Do **not** read post-mutation gold.
- `sfx` is `Sfx | undefined` → call `sfx?.haulerLeak()`. "Silent with the sound toggle off" is automatic: `Sfx.tone` returns early when `muted`.
- Display-free: never create a scene object here (the exit chip stays `haulerLeak`'s; the thud/jolt/echo/teach-chip are untouched).
- `enemy.def.id` is valid in `onLeak` (the enemy is despawned only after all hooks run); a split piece / Dot / Block / boss has a different `def.id`, so the guard excludes them.
- Two-note gap is 0.04 (the falling two-note convention, cf. `comboBreak`/`leechDrink`); 0.08 pre-master, the Ward-note class.

### Tests
none
