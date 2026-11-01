---
id: T0367
title: "The run's end gets its note"
assignee: inet-racing
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T16:45:37Z
claimed_at: 2026-11-01T17:09:43Z
finished_at: 2026-11-01T17:19:31Z
---

## Goal
The end of a run is heard before it is read: the moment the game-over card lands, one quiet two-note fall plays, so the last life's leak lands as an ending, not as another leak with a score card behind it.

## Details
- Today the run's end is silent after the leak: the existing leak feedback plays (the low thud, the camera jolt, the leak echo), then the game-over card lands with no note of its own — the only sound on the card is the coin chime (T0009), and only from wave 10 on (T0325).
- The moment the game-over card lands, play one soft two-note falling sting, once per run end, on whichever path ended the run (the last leak, or the pause's "End the run?" of T0325).
- The note: a new `Sfx.runEnd()` method in `src/audio/Sfx.ts`, placed next to `sting()` (T0091) — two 80 ms sine notes, 123.47 Hz then 98 Hz (B2→G2: the boss's death horn's own two low notes, T0302, falling instead of rising), 90 ms apart, volume 0.1 (the sting's quiet class), sequenced through `tone()`'s existing delay parameter (the T0290/T0302 pattern).
- The call: one line in the game-over scene (`src/scenes/GameOverScene.ts`), at the card's landing, before the count-up starts. Closest examples: T0290 (a new Sfx method plus one call at the moment) and T0315 (a note on a UI beat).
- It plays on top of the existing leak feedback, never replacing it: the thud, the jolt and the echo are unchanged. If a boss leak ends the run, the boss-leak horn (T0269) plays at the leak and the sting lands with the card ~1 s later — a sequence, not a mix.
- The coin chime (T0009) and the card's count-up, pop and lines (score, coins, by-tower rows, the Flawless mark) are untouched.
- It respects the pause's sound on/off toggle like every other note; it never plays in the menu, in the menu demo, or in any phase before the run ends.
- Nothing on screen changes: no HUD element, no button, no text, no mark.

## Acceptance criteria
- [ ] When the game-over card lands, the B2→G2 sting (two 80 ms sine notes, 90 ms apart, volume 0.1) plays once; it plays on the death path and on the pause's quit path, and never again while the card stays up.
- [ ] With sound off (pause) the note is silent; with sound on it is quieter than the leak thud and the boss horn (volume 0.1, the sting's class).
- [ ] The leak's feedback (thud, jolt, echo), the boss-leak horn (T0269) and the coin chime (T0009) are all unchanged; on a boss-leak death the horn plays at the leak and the sting lands with the card.
- [ ] The game-over card's count-up, pop, score, coins, by-tower rows and the Flawless mark are byte-identical; the screen shows nothing new.
- [ ] No other scene or phase plays the note: the menu, the menu demo, the draft, the build and the wave phases are byte-identical in sound.

## Design (architect, inet-racing)

### Files
- edit `src/audio/Sfx.ts` - add one `runEnd()` method directly after `sting()` (ends line 118), before `bossHorn()`
- edit `src/scenes/GameOverScene.ts` - one line in `create()` after the coin-chime block (after line 56, the `}` closing `if (result.coins > 0) {`)

### Interfaces
No new types or exports. One new method on the existing `Sfx` class, following `sting()`'s pattern exactly.

### Steps
1. In `src/audio/Sfx.ts`, insert between `sting()` and `bossHorn()`:

```ts
  /** The run ends as the game-over card lands: the boss horn's two low notes falling (123.47 then 98 Hz), 80 ms each, 90 ms apart, the sting's quiet class. */
  runEnd(): void {
    this.tone(123.47, 0.08, 'sine', 0.1);
    this.tone(98, 0.08, 'sine', 0.1, undefined, 0.09);
  }
```

2. In `src/scenes/GameOverScene.ts`, `create()`, after line 56 (the closing brace of the `if (result.coins > 0)` block) and before the `bestText` line, add:

```ts
    getSfx(this)?.runEnd();
```

`getSfx` is already imported (line 15) and used at line 55. This covers both end paths: the last leak (`RunFlow` starts the scene, line 269) and the pause's "End the run?" (which pops `runEnded` and lands on the same `create()`).

### Pitfalls
- Use `tone()`'s `delaySec` for the second note (exactly like `sting()` and `bossHorn()`), never `window.setTimeout` (the `tierChime` pattern is for per-note loops only). Muting is handled inside `tone()` (line 42), so the pause's sound toggle needs no handling here.
- Do not move, renumber or reformat any other line; do not touch `leak()`, `bossHorn()`, `chime()` or the card's count-up/coin tween. `Sfx.ts` is a shared file — other tasks may append methods, so insert at the exact spot named, one method only.
- `create()` runs exactly once per scene launch, so the sting plays once per run end; no guard needed.

### Tests
- none (audio task; `npm run check` and `npm run smoke` suffice)

## Result (attempt 1, inet-racing)

The run's end now has its own quiet note: a new `Sfx.runEnd()` (src/audio/Sfx.ts) plays the boss horn's two low notes falling — 123.47 Hz then 98 Hz sine, 80 ms each, 90 ms apart, volume 0.1 — from one new line in GameOverScene.create() (src/scenes/GameOverScene.ts) as the game-over card lands, on both the last-leak and the pause's quit path. It layers on top of the unchanged leak thud/jolt/echo and boss-leak horn, respects the sound toggle, and leaves every visual on the card untouched.

- Self-review: APPROVE
- Time: 9.8 min

```
projects/chokepoint/game/src/audio/Sfx.ts            | 6 ++++++
 projects/chokepoint/game/src/scenes/GameOverScene.ts | 1 +
 2 files changed, 7 insertions(+)
```
