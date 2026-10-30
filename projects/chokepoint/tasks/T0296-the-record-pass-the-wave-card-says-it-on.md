---
id: T0296
title: "The record pass: the wave card says it once"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-30T17:56:06Z
claimed_at: 2026-10-30T18:18:07Z
finished_at: 2026-10-30T19:00:09Z
---

## Goal
Passing your own record is the run's biggest personal moment, and today it is celebrated nowhere in-run (only the pause line's star, the end card and the menu). The moment the run's wave number reaches the saved best wave, the wave card says so once — a star and a quiet note — so the player feels the record fall where they are looking, not at the end.

## Details
- **The moment:** the instant the wave card's own number first becomes the saved best wave this session, one small yellow star (the record star's look and texture, T0016/T0069, ~14 px) pops in to the right of the number: ~150 ms scale-in, holds ~0.7 s, ~150 ms fade. No residue — the wave card never keeps the star; the pause line (T0069) keeps the state, this marks the moment.
- **The note:** one quiet two-note rise, G5 then B5, 80 ms sines 90 ms apart, volume 0.1 — the wave sweep's shape (T0240) in the sting's quiet class (T0091); silent with the sound off.
- **Once per run, per session:** a resumed run that starts at or above its best does not replay the moment (it belongs to the session that earned it). No saved best (a first device) — no moment.
- **Iron:** an Iron run reads the saved iron best wave (T0249) and wears the muted star (its texture, T0249) for the same moment; a normal run reads the normal best.
- **Layout:** the star sits in the wave card's existing padding, to the right of the number; the card's size and the number's position are unchanged at 412×915 and 1280×720 (the star is transient — no reflow).
- **No new input, no new readout, no board mark**, and the pause's controls line is unchanged.
- Closest pattern: the near miss's one-shot chip (T0271) — a transient mark that pops, holds and fades. The wave card is src/ui/hud/WaveCard.ts; the note is one new method in src/audio/Sfx.ts beside waveSweep() (T0240).

## Acceptance criteria
- [ ] A run with saved best 12 shows the star and hears the note exactly when the wave card's number becomes 12 — once, never again that run; a run with no saved best never shows it.
- [ ] Closing and resuming a run already at or above its best does not replay the moment; the pause line's star (T0069) is untouched either way.
- [ ] An Iron run with saved iron best 8 shows the muted star at wave 8; the normal best is not read.
- [ ] After ~1 s the star is gone and the wave card is otherwise byte-identical to today; both viewports pass the layout check (T0226).
- [ ] npm run check and the desktop/mobile smoke pass.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/WaveCard.ts` - the record moment: one-shot star to the right of the number + the note call
- edit `src/audio/Sfx.ts` - new `recordNote()` method, inserted directly after `waveSweep()` (line 192)

### Interfaces
No new types. One new public method on `Sfx`:
```ts
/** The run's wave number becomes its saved best: the wave sweep's rise, G5 then B5, 80 ms sines 90 ms apart, the sting's quiet volume. */
recordNote(): void {
  this.tone(784, 0.08, 'sine', 0.1);
  this.tone(988, 0.08, 'sine', 0.1, undefined, 0.09);
}
```

### Steps
1. `WaveCard.ts` imports — insert alphabetically among the existing six:
   - `import { artScale, STAR_MUTED_TEXTURE, STAR_TEXTURE } from '../../art/textures';` (before the `content/palette` line)
   - `import { loadProfile } from '../../core/profile';` (after it)
   - `import { getSfx } from '../../scenes/keys';` (after the `GameScene` type import)
2. Add field after `private shownTeach = false;`:
   ```ts
   /** The wave that makes the record's moment fire; -1 when this run has none (no saved best, or it starts at or above it).
    *  undefined until the first update: the first that can see the run's mode and starting wave. */
   private recordAt: number | undefined;
   ```
3. In `update(game)`, after the `wear` line, add `this.record(game);`.
4. Add these two private methods after `update()`, before `private place()`:
   ```ts
   /** The record's moment: the first time the number becomes this session's saved best wave, a star pops
    *  to its right and the note plays; a run that starts at or above its best has no moment. */
   private record(game: GameScene): void {
     if (this.recordAt === undefined) {
       const profile = loadProfile(window.localStorage);
       const best = game.run.mode === 'iron' ? profile.ironBestWave : profile.bestWave;
       this.recordAt = best > game.run.wave ? best : -1;
     }
     if (this.recordAt > 0 && this.recordAt === game.run.wave) {
       this.recordAt = -1;
       this.recordStar(game);
       getSfx(game)?.recordNote();
     }
   }

   /** The star's one pass: ~150 ms scale-in to the right of the number, ~0.7 s hold, ~150 ms fade, then gone. */
   private recordStar(game: GameScene): void {
     const star = artScale(this.scene.add.image(this.wave.width / 2 + 13, this.wave.y, game.run.mode === 'iron' ? STAR_MUTED_TEXTURE : STAR_TEXTURE), 14 / 16); // ~14 px
     star.setScale(0);
     this.box.add(star);
     this.scene.tweens.add({ targets: star, scale: 1, duration: 150, ease: 'Quad.easeOut' });
     this.scene.tweens.add({ targets: star, alpha: 0, duration: 150, delay: 850, ease: 'Quad.easeIn', onComplete: () => { star.destroy(); } });
   }
   ```
5. Add `recordNote()` to `Sfx.ts` directly after `waveSweep()`.

### Pitfalls
- Decide `recordAt` in the first `update()` before the equality check: a new run is at wave 0 there, a resumed run at its restored wave — that is what suppresses a run that starts at or above its best. Never read the profile before wave 0 is seen, and never replay (flag, not `wave === best` alone).
- No saved best (`bestWave`/`ironBestWave` 0) → `recordAt = -1`: first devices see nothing.
- Iron and normal must agree in both places: `ironBestWave` + `STAR_MUTED_TEXTURE` iff `game.run.mode === 'iron'`, else `bestWave` + `STAR_TEXTURE`.
- Star x/y are computed from the number at fire time (same `width / 2 + 13` convention as `ProfileCard`'s star); the card keeps W=120, `H_NUM` and the number's y — the star is a box child that never survives past ~1 s (destroyed in the fade's `onComplete`; tweens die with it and on scene shutdown).
- Star is ~14 px: `artScale(img, 14 / 16)` (the texture's natural display is 16 px; `artScale(size)` is a multiple of that, never a pixel count).
- Touch nothing in `PauseScene` — the pause line's star (T0069) is separate and unchanged.

### Tests
- none (UI + audio; no core rule changes)

## Result (attempt 1, yoga)

The wave card now celebrates the moment the run's wave number first becomes this session's saved best wave: a small yellow record star (~14 px, the record star's texture, muted texture in Iron runs) pops in to the right of the number — a 150 ms scale-in, a 0.7 s hold, a 150 ms fade, then it's destroyed, and the card never changes — and Sfx's new `recordNote()` plays a quiet two-note G5→B5 rise in the wave sweep's shape. `WaveCard` decides `recordAt` on the first update from `loadProfile` (`ironBestWave` for Iron runs, otherwise `bestWave`), so a run with no saved best or one that resumes at or above the best never plays the moment, and the pause line's star is untouched. The design's star tween aimed for `scale: 1`, but since the ART texture is drawn at 3x that would leave a 48 px star, so it tweens to `artScale`'s own scale instead (the star displays at the intended ~14 px). Changes are confined to `src/ui/hud/WaveCard.ts` (record moment + star) and `src/audio/Sfx.ts` (one new `recordNote()` method after `waveSweep()`); no tests were added per the design.

- Self-review: APPROVE
- Time: 42.1 min

```
projects/chokepoint/game/src/audio/Sfx.ts       |  6 +++++
 projects/chokepoint/game/src/ui/hud/WaveCard.ts | 32 +++++++++++++++++++++++++
 2 files changed, 38 insertions(+)
```
