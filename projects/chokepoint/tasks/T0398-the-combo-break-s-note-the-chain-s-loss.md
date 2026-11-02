---
id: T0398
title: "The combo break's note: the chain's loss is heard"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T01:41:53Z
---

## Goal
A leak already costs a life (the thud, the jolt, the echo) — but it also quietly kills the kill-combo chain (T0207 fades the ×N counter, no sound). That second cost — losing the chain's gold progress and the road to the ×10 milestone — is invisible. A soft, distinct note when a real chain is broken turns a hidden loss into a felt one.

## Details
- A new quiet sound in `src/audio/Sfx.ts` (the file is free): `comboBreak()` — a soft two-note **fall** (E4 → C4, ~70 ms sines each, 40 ms apart, volume 0.08). A fall, not a rise: the chain drops. It sits in the quiet class (the coin blip's 0.08, T0255) and plays on top of the leak thud (which stays at its own volume, untouched).
- A new leak hook in a new file `src/systems/enemyHooks/comboBreakNote.ts` (modeled on the existing leak hook `comboBreak.ts`, T0207, and `leakEcho.ts`, T0250): on every leak, read the current kill-combo chain count from FxSystem (the ×N counter, T0031) **while it is still alive** and, only if the chain had **2 or more kills** (a real chain, not a single kill), play `Sfx.comboBreak()`. A leak with no chain (0) or a lone kill (1) plays nothing.
- Register the new hook in `src/systems/enemyHooks/index.ts` **ahead of** the existing visual combo-break hook (T0207), so it reads the count before that hook resets it to zero.
- It is display-adjacent audio only: no new HUD, mark, key, button or card; the pause screen is untouched. Silent when sound is off.

## Acceptance criteria
- [ ] A leak that breaks a live chain of 2+ kills plays the soft two-note fall (E4 → C4, ~70 ms each, 40 ms apart, volume 0.08) on top of the existing leak thud.
- [ ] A leak with no chain, or that breaks only a single-kill chain, plays no new sound.
- [ ] The visual combo break (the ×N counter fading out, T0207) and the leak thud are unchanged; the note is the only addition.
- [ ] Silent when sound is off; the desktop + mobile smoke run passes.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/comboBreakNote.ts` — the new leak hook: on a leak that breaks a live chain of 2+ kills, play the new soft note.
- edit `src/audio/Sfx.ts` — add the `comboBreak()` method (one method, next to `leak()`, after line 136).
- edit `src/systems/enemyHooks/index.ts` — add the `comboBreakNote` import and one registry line **ahead of** `comboBreak`.

### Interfaces
No new types. Exact additions:

`src/audio/Sfx.ts`, after the `leak()` method:
```ts
/** A leak breaks a real kill-combo chain (2+ kills): a soft two-note fall, E4 to C4, ~70 ms sine each, 40 ms apart, the coin blip's quiet class — the chain drops, so it falls. */
comboBreak(): void {
  this.tone(329.63, 0.07, 'sine', 0.08);
  this.tone(261.63, 0.07, 'sine', 0.08, undefined, 0.04);
}
```

`src/systems/enemyHooks/comboBreakNote.ts` (whole file, model: `comboBreak.ts` + the `({ sfx })` of `tollLeak.ts`):
```ts
import type { MakeEnemyHook } from './hook';

/** A leak that breaks a real kill-combo chain (2+ kills) plays the soft two-note fall (Sfx.comboBreak);
 *  a leak with no chain, or one that breaks only a single kill, plays nothing.
 *  It must run ahead of the comboBreak hook, which resets the chain to zero. */
export const comboBreakNote: MakeEnemyHook = ({ fx, sfx }) => ({
  onLeak: () => {
    if (fx.chain >= 2) sfx?.comboBreak();
  },
});
```

`src/systems/enemyHooks/index.ts`: add `import { comboBreakNote } from './comboBreakNote';` with the other imports, and one line `comboBreakNote,` between the existing `comboGold,` and `comboBreak,` lines.

### Steps
1. Add `Sfx.comboBreak()` in `src/audio/Sfx.ts`, directly after the `leak()` method (the leak thud; it stays untouched).
2. Create `src/systems/enemyHooks/comboBreakNote.ts` with the hook above. It reads `fx.chain` (the `FxSystem.chain` getter, the ×N counter's count), plays only when `>= 2`, and plays nothing else.
3. Register in `src/systems/enemyHooks/index.ts`: import line next to its kin, registry line **ahead of** `comboBreak` (hooks run in array order, `EnemySystem` line 126, so the count is read before `breakCombo()` zeroes it).

### Pitfalls
- Ordering: the note must be ahead of `comboBreak` in `ENEMY_HOOKS`; after it, `fx.chain` is already 0 and it would never play.
- `sfx` is optional (`Sfx | undefined`) — always `sfx?.comboBreak()`; it is `undefined`/muted when sound is off, so the silence criterion falls out for free.
- Do not touch `Sfx.leak()` (the thud), `FxSystem.breakCombo()`, or the `comboBreak` hook file; the note is the only addition.
- No scene objects, no state in the closure (fresh per run via `MakeEnemyHook`), nothing to clean up.

### Tests
none
