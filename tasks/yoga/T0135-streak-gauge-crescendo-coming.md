---
id: T0135
title: Streak gauge — Crescendo coming
assignee: yoga
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T18:14:35Z
---

## Goal
The Crescendo bonus (T0065) arrives at 8 kills without being hit, and right now the player has to count. A thin line under the streak tally fills as the streak grows, so the bonus coming is visible at a glance.

## Details
- A flat ink line, 2 u tall, drawn 4 u below the streak tally's number (T0014): width = min(streak, 8) / 8 × the width of the tally's number, left-aligned with it.
- Below 8 the line is ink; at 8 and above it is PALETTE.red — the same red the tally itself turns while Crescendo is active (T0065) — and stays full.
- At streak 0 the line is undrawn (width 0). When a hit resets the streak, the line returns to width 0 the same moment the tally shatters (T0101) — no extra shatter for the line.
- The line scales with the tally's existing layout at 412×915 and 1280×720. No sound, no key, no new element, no number change — the tally, its shatter and the RHYTHM flash are untouched.

## Acceptance criteria
- [ ] At streak 4 the line under the tally is half its full width in ink; at 7 it is just short of full; at 8 it is full and red; at 0 nothing is drawn.
- [ ] When a hit resets the streak the line is gone the same moment the tally shatters (T0101), and it regrows as the streak climbs again.
- [ ] The tally number, the RHYTHM flash and everything else on the HUD are untouched; no new sound, key or scene.

## Design (architect, yoga)

### Files
- edit `src/scenes/HudScene.ts` — append the Crescendo gauge drawing (8 lines) at the end of `updateStreak()` (HudScene.ts:307, after the `this.rhythmText.setVisible(...)` line)
### Interfaces
None. No new types, functions, files or imports. Everything the gauge needs is already in scope in `updateStreak`: `s` (`run.streak`), `width`, `this.streakText`, `this.g`, `STREAK_FIRE_BONUS_STREAK` (= 8, `core/stats.ts`, imported at HudScene.ts:8), `PALETTE`, `PAD`.
### Steps
1. In `src/scenes/HudScene.ts`, at the end of `updateStreak()` — after the line `this.rhythmText.setVisible(s >= 2 && now < this.rhythmUntil);` and before the method's closing brace — add exactly:
```ts
    // Crescendo gauge (T0135): flat 2 u rule 4 u below the tally number, full and red at streak 8.
    if (s > 0) {
      const gaugeW = (Math.min(s, STREAK_FIRE_BONUS_STREAK) / STREAK_FIRE_BONUS_STREAK) * this.streakText.width;
      this.g.fillStyle(s >= STREAK_FIRE_BONUS_STREAK ? PALETTE.red : PALETTE.ink, 1);
      this.g.fillRect(width - PAD - this.streakText.width, this.streakText.y + this.streakText.height / 2 + 4, gaugeW, 2);
    }
```
2. Run `npm run check`, then `npm run smoke`.
### Pitfalls
- Draw onto `this.g` (cleared every frame at the top of `update()`); do not create a new Graphics or Text object, and add no listeners or invariants — nothing to clean up on shutdown.
- Left edge is `width - PAD - this.streakText.width` (the tally is origin (1, 0.5)); Phaser 3.90 Text has no `.left` property — do not write `this.streakText.left`. This matches the existing left-align pattern at HudScene.ts:245 and :306.
- The gauge is stateless: it is a pure function of `run.streak` redrawn every frame, so a hit (`takeDamage` → `streak = 0`) drops it to width 0 the same frame `shatterTally()` fires, with no extra shatter. Do not add state or edge-trigger logic.
- Do not touch the tally text, its show/hide fade, `shatterTally()`, the RHYTHM flash, `flashUntil`, or `drawInkwell()` — the acceptance criteria are explicit.
- Red is `s >= STREAK_FIRE_BONUS_STREAK` only — do not add `now < this.flashUntil` (the 8th-kill flash red is the tally's existing behavior and must not drive the line).
- `if (s > 0)` means the line is undrawn only at streak 0; at s = 1 an 1/8-ink sliver is drawn (on a fresh run the tally text is still `''` so the width is 0 there — leave that, the tally's `setText` only happens at s ≥ 2 and must not change).
- The line's bottom edge (y = PAD+74, since the 16 px text has height 16: 72 + 8 + 4) touches the inkwell rule's top edge within the rightmost tally width; `drawInkwell` draws after this on the same `this.g`, so no visible overlap — do not "fix" the position. At both 412×915 and 1280×720 the line sits in the free band between the tally (y = PAD+60) and the INK rule (y = PAD+74).
### Tests
none
