---
id: T0272
title: "The early-send teach: the button's banked gold, taught once"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-30T09:22:16Z
claimed_at: 2026-10-30T10:00:37Z
finished_at: 2026-10-30T10:14:06Z
---

## Goal
A first-time player sees the big button's "+N" pill but may not know it is gold they can bank: the run's first build phase says, once, that starting the wave early turns the countdown into gold.

## Details
- On the run's first build phase only, one muted line appears under the wave-preview card — the same style, position and one-time pattern as the tag teach line (T0092, in `src/ui/hud/NextWavePreview.ts`) — reading: `start early — the button banks the seconds left as gold`.
- It is derived from the run's state, shown while `run.wavesCleared` is 0 (the build phase before wave 1), and never shown again in that run. A resumed run at wave 1 or later has `wavesCleared ≥ 1`, so it has already "seen" the line and does not show it.
- Wave 1 is never tagged (quiet is every 4th wave, tight from wave 6), so this line never competes with a tag teach line during the first build phase.
- The line fades with the preview card when the build phase ends. No sound, no input, no new card.

## Acceptance criteria
- [ ] The run's first build phase (before wave 1) shows one muted line under the wave-preview card: `start early — the button banks the seconds left as gold`.
- [ ] The line never shows on any later build phase of the same run.
- [ ] A resumed run at wave 1 or later does not show the line.
- [ ] The line fits its card at 412x915 and 1280x720; no sound, no input, and the preview card and button are otherwise unchanged.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/NextWavePreview.ts` - add the one-time early-send teach line (first build phase) and pin the card to its scaled size so a wide card fits its corner.

### Interfaces
None. No new types or signatures; `teachLine` and `place` keep theirs.

### Steps
1. After the `TEACH` array (line 25), add a module constant, exact text (em dash, no quotes beyond the string):
   ```ts
   /** The one-time teach for the run's first build phase: the big button's "+N" pill banks the seconds left as gold. Shown while `wavesCleared` is 0, re-derived from the run, never stored. */
   const EARLY_SEND = 'start early — the button banks the seconds left as gold';
   ```
2. In `teachLine`, add one line at the top of the method body, before the tag loop, and extend its doc comment to mention the early-send teach:
   ```ts
   if (run.wavesCleared === 0) return EARLY_SEND;
   ```
3. In `place()`, pin the card to its *scaled* size (a no-op for every card that already fits, fitScale = 1). Compute it once and use it for `x`, the y offset and `setScale`:
   ```ts
   const s = this.fitScale();
   const x = Math.min(width - EDGE - NEXT_SIZE / 2 - 4, width - EDGE - (this.cardW / 2) * s);
   const above = isNarrow(width) ? bottom - NEXT_SIZE / 2 - 22 - 30 : bottom - (NEXT_SIZE / 2 + 7) - 10;
   box.setScale(s).setPosition(x, above - (this.cardH / 2) * s);
   ```
   (This replaces the current `x = Math.min(..., width - EDGE - this.cardW / 2)`, `box.setScale(this.fitScale()).setPosition(x, above - this.cardH / 2)`; `s` is a new `const` right after `const bottom = ...`.)

### Pitfalls
- The wording is ~55 chars; at the tag line's 14px rounded font the card is ~420–460px wide, wider than the 412px phone corner. Without the `place()` fix its left edge leaves the screen by up to ~20px. The fix is a no-op for every card that already fits (all tag teach lines, short counts rows → fitScale 1) and only repositions a card that is scaled down.
- Keep the font 14 and `PALETTE.muted` exactly as the tag teach line; do not shorten the text or resize it — the task fixes the wording and style.
- The line is part of the preview card's container, so it hides/destroys with the card when the build phase ends — no separate cleanup, tween or sound.
- `T0260` (level rule) is editing `core/run.ts` (not this file). Re-verify after it lands that `run.wavesCleared` is still `0` only before wave 1 and ≥1 thereafter; if it were made per-board, the `wavesCleared === 0` guard would re-fire at boards 2 and 3.

### Tests
none (UI task).

## Result (attempt 1, yoga)

The wave-preview card now teaches the early-send gold in a run's first build phase: a one-time muted line under the counts, `start early — the button banks the seconds left as gold`, shown only while `wavesCleared` is 0 (re-derived from the run, so resumed runs at wave 1+ skip it) and fading with the card when the build phase ends. `place()` now pins the card to its scaled size so the wide teach card fits the phone corner; all other cards are unaffected. No sound, input or new card; desktop and mobile smoke pass.

- Self-review: APPROVE
- Time: 13.5 min

```
projects/chokepoint/game/src/ui/hud/NextWavePreview.ts | 11 ++++++++---
 1 file changed, 8 insertions(+), 3 deletions(-)
```
