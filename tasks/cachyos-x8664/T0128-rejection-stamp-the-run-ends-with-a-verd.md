---
id: T0128
title: Rejection stamp — the run ends with a verdict
assignee: cachyos-x8664
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T16:34:21Z
---

## Goal
The game-over screen stamps the run's verdict in one word — "ERASED", "FRAMED" or "PUBLISHED" — so the end of a run reads like a printed proof instead of a bare score card.

## Details
- The stamp: a big red ink stamp — a double red frame (3 u outer line, 1 u inner line, with 8 u gaps at the four corners so it reads as a hand-pressed stamp, not a box) around a small-caps verdict word set in red — tilted −8° from horizontal, centered above the score line.
- The verdict is the run's survival time: under 8:00 → "ERASED"; 8:00 or more and under 15:00 → "FRAMED"; 15:00 or more → "PUBLISHED". The 8:00 line is the same one Warm Start uses (T0114).
- Entry: the stamp pops in 0.4 s after the game-over card has settled — scaling from 1.4× to 1.0× over 150 ms with no easing (a hard pop), then it holds. No new sound.
- It takes the place of the existing death word on the game-over screen so the player sees exactly one verdict (the architect maps it — no duplicated "ERASED" text on screen).
- Layout: ~250 units wide at 412x915 and ~460 units wide at 1280x720, same red and −8° tilt in both; it sits in the upper-center area above the score/best lines and never overlaps them or the time line.
- No new input, key, HUD element or scene; the score, the persisted best, the time and the restart flow are unchanged.

## Acceptance criteria
- [ ] A run ending under 8:00 shows the "ERASED" stamp; 8:00–14:59 shows "FRAMED"; 15:00+ shows "PUBLISHED" — one verdict on screen, no duplicated death word.
- [ ] The stamp pops in (1.4× → 1.0× over 150 ms) 0.4 s after the card settles, tilted −8°, with the double red frame (3 u outer, 1 u inner, 8 u corner gaps) and a red small-caps word.
- [ ] At 412x915 and 1280x720 the stamp is centered above the score line (~250 / ~460 units wide) and does not overlap the score, best or time lines.
- [ ] Score, best, time and restart are unchanged; `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, desktop)

### Files
- create `src/core/verdict.ts` - pure rule: survival time → verdict word; reuses `WARM_START_TIME_SEC` for the 8:00 line
- create `src/ui/stamp.ts` - `makeStamp()` UI helper (pattern of `ui/button.ts`): double red frame + word, tilt, pop-ready container
- create `tests/core/verdict.test.ts` - boundary tests for the time thresholds
- edit `src/scenes/GameOverScene.ts` - delete the death word, place the stamp above the stats block, pop it at +400 ms

### Interfaces
```ts
// src/core/verdict.ts (no Phaser imports)
export const VERDICTS = { erased: 'ERASED', framed: 'FRAMED', published: 'PUBLISHED' } as const;
export type Verdict = (typeof VERDICTS)[keyof typeof VERDICTS];
export const PUBLISHED_TIME_SEC = 900; // 15:00
export function verdictForTime(timeSec: number): Verdict; // >=900 PUBLISHED, >=480 FRAMED, else ERASED

// src/ui/stamp.ts
export const STAMP_TILT = (-8 * Math.PI) / 180;
export function stampHeight(width: number): number; // Math.round(width * 0.24)
export function stampHalfExtent(width: number): number; // rotated half-height: (stampHeight(w)*cos + w*|sin|)/2
export function makeStamp(scene: Phaser.Scene, x: number, y: number, word: string, width: number): Phaser.GameObjects.Container;
// container: invisible, scale 1.4, rotation STAMP_TILT; graphics child + text child
```

### Steps
1. Create `src/core/verdict.ts`:
```ts
import { WARM_START_TIME_SEC } from './warmStart';

export const VERDICTS = { erased: 'ERASED', framed: 'FRAMED', published: 'PUBLISHED' } as const;
export type Verdict = (typeof VERDICTS)[keyof typeof VERDICTS];

/** 15:00 — a run that survives this long is published. */
export const PUBLISHED_TIME_SEC = 900;

/** The stamp word for a run's survival time: under 8:00 (the Warm Start line) ERASED, 8:00–14:59 FRAMED, 15:00+ PUBLISHED. */
export function verdictForTime(timeSec: number): Verdict {
  if (timeSec >= PUBLISHED_TIME_SEC) return VERDICTS.published;
  if (timeSec >= WARM_START_TIME_SEC) return VERDICTS.framed;
  return VERDICTS.erased;
}
```
2. Create `src/ui/stamp.ts`:
```ts
import type Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import { textStyle } from './text';

/** Stamp tilt: −8° from horizontal, same on every layout. */
export const STAMP_TILT = (-8 * Math.PI) / 180;

export function stampHeight(width: number): number {
  return Math.round(width * 0.24);
}

/** Half the stamp's vertical extent once rotated, for layout above the stats block. */
export function stampHalfExtent(width: number): number {
  const h = stampHeight(width);
  return (h * Math.cos(STAMP_TILT) + width * Math.abs(Math.sin(STAMP_TILT))) / 2;
}

/**
 * The hand-pressed verdict stamp: double red frame (3 u outer broken 8 u at the
 * four corners, 1 u inner solid, 8 u inset) around a small-caps red word (bold
 * uppercase + letter spacing), tilted −8°. Created invisible at 1.4× — the caller
 * makes it visible and tweens scale to 1 (the pop).
 */
export function makeStamp(scene: Phaser.Scene, x: number, y: number, word: string, width: number): Phaser.GameObjects.Container {
  const height = stampHeight(width);
  const gap = 8;
  const hw = width / 2;
  const hh = height / 2;
  const g = scene.add.graphics();
  g.lineStyle(3, PALETTE.red, 1);
  g.line(-hw + gap, -hh, hw - gap, -hh);
  g.line(hw, -hh + gap, hw, hh - gap);
  g.line(-hw + gap, hh, hw - gap, hh);
  g.line(-hw, -hh + gap, -hw, hh - gap);
  g.lineStyle(1, PALETTE.red, 1);
  g.strokeRect(-hw + gap, -hh + gap, width - gap * 2, height - gap * 2);
  let size = Math.round(width * 0.12);
  let text = scene.add.text(0, 0, word, textStyle(size, PALETTE.red, { fontStyle: 'bold', letterSpacing: 2 })).setOrigin(0.5);
  while (text.width > width - 32 && size > 8) { size -= 1; text.setStyle({ fontSize: `${size}px` }); }
  return scene.add.container(x, y, [g, text]).setRotation(STAMP_TILT).setScale(1.4).setVisible(false);
}
```
3. Create `tests/core/verdict.test.ts` (mirror `tests/core/warmStart.test.ts`):
```ts
import { describe, expect, it } from 'vitest';
import { PUBLISHED_TIME_SEC, VERDICTS, verdictForTime } from '../../src/core/verdict';
import { WARM_START_TIME_SEC } from '../../src/core/warmStart';

describe('verdictForTime', () => {
  it('uses the warm-start 8:00 line and a 15:00 publish line', () => {
    expect(WARM_START_TIME_SEC).toBe(480);
    expect(PUBLISHED_TIME_SEC).toBe(900);
    expect(VERDICTS).toEqual({ erased: 'ERASED', framed: 'FRAMED', published: 'PUBLISHED' });
  });
  it('ERASED under 8:00, FRAMED 8:00–14:59, PUBLISHED 15:00+', () => {
    expect(verdictForTime(0)).toBe('ERASED');
    expect(verdictForTime(479.999)).toBe('ERASED');
    expect(verdictForTime(480)).toBe('FRAMED');
    expect(verdictForTime(899.999)).toBe('FRAMED');
    expect(verdictForTime(900)).toBe('PUBLISHED');
    expect(verdictForTime(7200)).toBe('PUBLISHED');
  });
});
```
4. Edit `src/scenes/GameOverScene.ts`: imports — drop `titleStyle` (now unused; lint fails otherwise) and add `import { verdictForTime } from '../core/verdict';` (right after the `core/progression` import) and `import { makeStamp, stampHalfExtent } from '../ui/stamp';` (after the `ui/button` import). In `create()`, delete line 27 (the `'ERASED'` text) and move the stats text creation before it, replacing both with:
```ts
    const lines = [`Survived  ${formatTime(summary.timeSec)}`, `Level  ${summary.level}`, `${summary.kills} shapes erased`, `Best streak  ×${summary.bestStreak}`, `SCORE ${summary.score}`, `BEST ${summary.best}`];
    const stats = this.add.text(width / 2, height * 0.42, lines.join('\n'), textStyle(Math.min(26, short * 0.055), PALETTE.ink, { align: 'center', lineSpacing: 10 })).setOrigin(0.5);
    const stampWidth = Math.min(460, Math.round(short * 0.64));
    const stampY = stats.y - stats.height / 2 - stampHalfExtent(stampWidth) - 12;
    const stamp = makeStamp(this, width / 2, stampY, verdictForTime(summary.timeSec), stampWidth);
    this.time.delayedCall(400, () => {
      stamp.setVisible(true);
      this.tweens.add({ targets: stamp, scale: 1, duration: 150, ease: 'Linear' });
    });
```
Everything else in the file (buttons, ENTER listener, `armed`, smoke restart, `onResize`) stays byte-identical.

### Pitfalls
- `ease: 'Linear'`, not `easing:` — the codebase idiom (`ArcSystem.ts:139`); `easing` is ignored by Phaser and you get a soft Sine pop.
- `stats.height` is valid synchronously after `add.text()` (Phaser measures in the constructor) — verified; do not defer layout to a `setTimeout` or first frame.
- Tilt is radians (`STAMP_TILT`); passing −8 directly rotates ~458° the wrong way.
- The shrink loop must use `text.setStyle({ fontSize })` (re-measures synchronously here); never `setText` in the loop.
- Do not add an Sfx import or any sound; do not move the buttons or change any stats line.
- Scene restart (resize / smoke) re-runs `create()` and rebuilds the stamp — keep all stamp state local to `create()`, no fields; the `delayedCall` follows the scene's existing un-cleaned pattern (same as the 600/800 ms calls).
- Don't append to shared files: no changes to GameScene, keys.ts, textures.ts, or content — other machines own those.

### Tests
- `tests/core/verdict.test.ts` as above — the 8:00/15:00 thresholds are a new core rule a later balance change could silently break.
