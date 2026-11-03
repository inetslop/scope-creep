---
id: T0460
title: "The Leech's drink gets its note"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-03T01:27:12Z
claimed_at: 2026-11-03T01:44:31Z
---

## Goal
The wave-80 Leech's drink is the boss's whole trick and right now it is only the white flash — the moment the Leech starts drinking, a quiet note plays, so the drink is heard the way the Mute's silence is heard (T0419).

## Details
- One note per drink: the Leech's drink is its 0.8 s white flash every 5 s (T0405) that draws 8% of its max hp from its nearest escort. The note plays at the flash's start, once per drink; it is silent whenever the Leech is not drinking.
- The note is a short quiet falling sip in Sfx's softest class (the Mute note's volume class, 0.05–0.08 pre-master, never above a kill blip): two 70 ms sine notes falling, ~40 ms apart, a step below A4 (G4→E4, 392→330 Hz).
- A new enemy-hook file on the per-frame reconcile pattern (src/systems/enemyHooks/skyNote.ts, T0376 — the closest example): it plays when a live Leech's drink flash begins and is silent otherwise, registered in the hooks' index next to skyNote. The new sound method (Sfx.leechDrink()) sits beside the Mute note's and sky note's methods in src/audio/Sfx.ts.
- It respects the pause's Sound toggle the way the other notes do (Sfx.tone's existing mute check).
- No HUD, no chip, no text: sound only, like T0419 and T0376.

## Acceptance criteria
- [ ] In a wave-80 run, each Leech drink flash plays exactly one short falling two-note sip at the flash's start.
- [ ] The note never plays when the Leech is not drinking (dead, or a wave without a Leech).
- [ ] The note is silent with the pause's Sound toggle off, and no other boss or wave moment gains a sound.
- [ ] The note sits at ~0.05–0.08 pre-master volume — quiet, below a kill blip.
- [ ] No HUD element, chip or text is added; everything else is byte-identical.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/leechDrinkNote.ts` - the per-frame reconciled note hook (model: `skyNote.ts`, name pairs with `leechDrink.ts` like `comboBreak`/`comboBreakNote`)
- edit `src/audio/Sfx.ts` - one method after `muteNoteStop()` (before `waveStart()`), beside the Mute note's and sky note's methods
- edit `src/systems/enemyHooks/index.ts` - import line after `import { skyNote } ...` (line 19) and array item after `skyNote,` (line 93); both run after `leechDrink`, which must stay so

### Interfaces
```ts
// leechDrinkNote.ts (whole file):
import { drinkLeg } from '../../core/drink';
import type { MakeEnemyHook } from './hook';

export const leechDrinkNote: MakeEnemyHook = ({ enemies, sfx }) => {
  let leechSerial = -1; // the live Leech's spawn serial (the pool reuses objects)
  let wasFlashing = false;
  return {
    update(): void {
      const L = enemies.all.find((e) => e.active && e.def.drinks !== undefined);
      if (L === undefined) { wasFlashing = false; return; }
      if (L.serial !== leechSerial) { leechSerial = L.serial; wasFlashing = false; } // a recycled slot starts fresh
      const flashing = L.drinkReady && drinkLeg(L.def.drinks!, L.age) === 'flash';
      if (flashing && !wasFlashing) sfx?.leechDrink(); // at the flash's start, once per drink
      wasFlashing = flashing;
    },
  };
};

// Sfx.ts:
leechDrink(): void {
  this.tone(392, 0.07, 'sine', 0.05);
  this.tone(330, 0.07, 'sine', 0.05, undefined, 0.04);
}
```
(JSDoc: "The Leech's drink: one short falling sip at each drink's white flash — two 70 ms sines a step below A4, G4 then E4 (392→330 Hz), ~40 ms apart, 0.05 pre-master, the Mute note's volume class, never above a kill blip.")

### Steps
1. Add `leechDrink()` to `Sfx.ts` after `muteNoteStop()`. No held node: `tone()` already no-ops when `this.muted` or the context is locked, so the pause Sound toggle is covered.
2. Create `leechDrinkNote.ts`; register in `index.ts` next to `skyNote`.
3. `npm run check` must pass.

### Pitfalls
- Hook order: the note reads `L.drinkReady` set by `leechDrink` in the same frame, so its array item must stay after `leechDrink` (next to `skyNote` does).
- Edge-trigger: play on the false→true transition of `flashing` only; the flash leg lasts 0.8 s, so per-frame calls would ring 40+ times per drink.
- Use `L.age` (reset in `spawn()`, advanced every `advance()`) — the exact clock `Enemy.advance` paints the white tint with — never a second private accumulator; then the note's leg can never disagree with the telegraph.
- Silent-otherwise is free: dead/no Leech → `L === undefined`; maw closed or last escort gone → `leechDrink` sets `drinkReady` false.

### Tests
none
