---
id: T0145
title: Pick arpeggio — the score marks the pick
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T21:17:36Z
---

## Goal
A level-up is the run's biggest decision, and today it is marked by the card flip and the tempo nudge — but the score itself stays silent. The moment a card is picked, the score plays a short rising two-note motif, so the pick is felt in the music as well as on the cards (the audio sibling of the level-up pulse, T0102).

## Details
- The moment a level-up card is picked — the same moment the level-up pulse (T0102) and the Index line (T0104) are recorded — the score plays a short rising two-note motif on the existing pulse voice's timbre (no new tone, no new SFX, no new instrument):
  - note 1: the pulse's root, at the pick;
  - note 2: a perfect fifth above the root (root frequency × 2^(7/12)), exactly one beat later at the tempo in effect at that moment;
  - each note at about half the pulse's gain, so the motif sits under the score, not over it.
- The tempo is whatever the score is playing at the pick: the run tempo curve (T0111) including the Tempo nudge (T0115) if this pick just landed one — a pick that raises the tempo plays its motif at the new, faster tempo — and the 64 BPM boss hold (T0108) if a boss is alive at the pick.
- One motif per pick; two consecutive picks (a double level-up) play two motifs.
- The motif is part of the score: it follows the music mute (the existing M key) and is unaffected by the SFX mute. The card-flip SFX (T0059) and everything else in the score are unchanged.
- No new key, HUD element, scene or gameplay number change.

## Acceptance criteria
- [ ] Picking any level-up card plays a two-note motif — the pulse root, then a perfect fifth, one beat apart at the current tempo — on the existing pulse voice at about half the pulse's gain; the card-flip SFX (T0059) still plays exactly as before.
- [ ] A pick that lands the Tempo nudge (T0115) plays its motif at the new (faster) tempo; a pick while the boss hold (T0108) is active plays at 64 BPM.
- [ ] Two consecutive picks (a double level-up) play two motifs.
- [ ] The motif is silent when the music is muted (M key) and plays regardless of the SFX mute state.
- [ ] No new key, HUD element, scene or gameplay number change; the score's existing behavior (tempo curve, boss hold, second voice) is untouched outside the added motif.

## Design (architect, desktop)

### Files
- edit `src/audio/Music.ts` - add one module const (the fifth) and turn `notePick()` into the motif: same pulse-voice tone, half gain, one beat apart at `bossTempo.bpmFor(timeSec, picks)`
- edit `src/scenes/LevelUpScene.ts` - pass the run time into `notePick` (one line, line 118)
- edit `docs/ARCHITECTURE.md` - one clause in the Audio paragraph naming the pick motif

### Interfaces
```ts
// src/audio/Music.ts — only public signature change (sole caller: LevelUpScene.choose)
notePick(timeSec: number): void; // was: notePick(): void

// new module-level const in Music.ts, directly under PULSE_SEMITONE_HZ (line 12), not exported:
const PULSE_FIFTH_HZ = PULSE_HZ * 2 ** (7 / 12); // the pulse root's perfect fifth, ≈ 164.81 Hz
```

### Steps
1. In `src/audio/Music.ts`, after line 12 add the `PULSE_FIFTH_HZ` const above with a one-line comment ("the pulse root's perfect fifth: note 2 of the level-up pick motif").
2. In the same file, replace the existing `notePick()` (lines 113-117) with exactly:
```ts
  /** One upgrade card was picked: the tempo gains +2 BPM from the next scheduled beat, and
   * the score marks the pick with a rising two-note motif on the pulse voice — the pulse's
   * root at the pick, then its perfect fifth exactly one beat later at the tempo in effect
   * (this pick's nudge included; the 64 BPM boss hold if one is active). Each note is the
   * pulse's own tone at half the pulse's gain, so the motif sits under the score. The state
   * bump is applied before the beat length is read, so a pick that lands the nudge plays at
   * the new tempo. Like bossSwell, the mute gate is here — update() only gates the scheduler. */
  notePick(timeSec: number): void {
    this.picks += 1;
    if (this.ctx === null || this.master === null || this.sfx.isMuted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const beat = 60 / this.bossTempo.bpmFor(timeSec, this.picks);
    this.tone('sine', PULSE_HZ, PULSE_HZ / 2, 0.3, 0.25, t);
    this.tone('sine', PULSE_FIFTH_HZ, PULSE_FIFTH_HZ / 2, 0.3, 0.25, t + beat);
  }
```
   Do not add any throttling (unlike `Sfx.cardFlip`) — a double level-up must yield two motifs.
3. In `src/scenes/LevelUpScene.ts`, change line 118 to:
   `getMusic(this).notePick(getRun(this).timeSec); // the score's tempo gains +2 BPM and the pick motif plays, same moment the pulse fires and the Index updates`
4. In `docs/ARCHITECTURE.md` Audio paragraph, after "(core/music.ts `BossTempo`)" add: ", and an upgrade pick plays a two-note rising motif (pulse root, then a perfect fifth one beat later) on the pulse voice at half its gain".
5. Run `npm run check` and `npm run smoke`; both must pass.

### Pitfalls
- Order inside `notePick`: `this.picks += 1` must run before `bpmFor` is read, or the nudge pick plays at the old tempo. Do not special-case the boss hold — `BossTempo.bpmFor` already returns 64 while holding and suspends the nudge by design.
- Schedule against `ctx.currentTime` (as `bossSwell` does), never against `nextBeat`/the beat grid: the game is paused under the overlay, the scheduler is stopped, and the two oscillators must fire at the pick moment. Do not touch `nextBeat`, `beatIndex`, `scheduleBeat`, or `Music.update` — the resume catch-up in `update()` already handles the paused stretch.
- The mute check must stay in `notePick` (tone() doesn't know about mute); dropping it makes the motif play through the M mute. Routing through Music's master (not `Sfx`) is what keeps it score-side and unaffected by the SFX mute.
- `Music.ts` is also on T0140's (Settings, same machine) file list for separate music/SFX mutes. The edits land in different regions (const at line 12, method at 113-117 vs constructor/toggle area); if T0140 lands first, point the gate at the music-mute flag it introduces instead of `sfx.isMuted`.
- No new listeners, pooled objects, scenes, keys or HUD → nothing to remove on shutdown; oscillators self-disconnect in `tone()`'s `onended`. Frequencies are finite constants, `bpmFor` never returns 0 or NaN, so `beat` is safe.
- Do not change `Sfx.levelUp()` (the overlay-open arp), `Sfx.cardFlip()`, or the warm-start `applyUpgrade` in `GameScene.create()` — only level-up card picks get the motif.

### Tests
none (audio task; the tempo rules the motif reads — `effectiveTempo` nudge and `BossTempo` 64 BPM hold — are already covered in `tests/core/music.test.ts`, and `src/core/music.ts` is untouched)
