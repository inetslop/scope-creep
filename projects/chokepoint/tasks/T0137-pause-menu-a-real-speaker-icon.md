---
id: T0137
title: "Pause menu: the Sound toggle gets a real speaker icon"
assignee: cachyos-x8664
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T09:46:49Z
claimed_at: 2026-10-29T10:28:15Z
---

## Goal
The Sound row in the pause menu shows a dark blob (a rounded block with a triangle pointing outward, reading like a play button) instead of a speaker. Players should see at a glance that it is the sound toggle, and whether sound is on or off.

## Details
- Where: `scenes/PauseScene.ts`, `paintGlyph` (the `glyph` Graphics in the sound row). Keep the row, the "Sound" word and the On/Off text as they are.
- The speaker, about 24x20 px, drawn with flat fills in the row's color (ink when on, muted when off), no outlines:
  - the box: a small rounded rectangle, 6 px wide, 8 px tall, on the left, vertically centered;
  - the cone: a trapezoid joined to the box's right side, narrow at the box (8 px tall) and flaring to 18 px tall, 7 px wide, so it opens away from the box (the current triangle points the wrong way);
  - **On:** two sound-wave arcs to the right of the cone (radii about 5 and 9 px, about 90 degrees each, centered on the cone's middle), drawn as thin filled rings with `fillRing()` (`ui/ring.ts`), never a thick Graphics stroke;
  - **Off:** no arcs; a small "x" of two 2 px rounded bars (8 px long) to the right of the cone instead.
- The whole glyph stays inside the button and lifts with it (it is already in `soundRow.content`). It must not collide with the "Sound" word: keep at least 8 px of space between them.

## Acceptance criteria
- [ ] With sound on, the pause menu shows an ink speaker (box, cone opening right, two arcs) left of "Sound".
- [ ] Toggling sound off shows a muted speaker with an "x" and no arcs; toggling back restores the arcs.
- [ ] The icon is crisp at 412x915 and 1280x720 and doesn't touch the "Sound" word.

## Design (architect, cachyos-x8664)

The Sound-row glyph in `src/scenes/PauseScene.ts` is a local `paintGlyph` const that draws a rounded rect + a right-pointing triangle (reads as a play button). Redraw it as a flat speaker: a box, a flaring cone, and (on) two thin filled-ring arcs / (off) a thin 2-px "x". One import added; nothing else in the row changes (the glyph stays at `(-88, 0)` in `soundRow.content`, so it lifts with the button and keeps its ≥8 px gap to the "Sound" word at `-62`).

### Files
- edit `src/scenes/PauseScene.ts` - add `import { fillRing } from '../ui/ring';` (after the `../ui/card` import) and replace the body of `paintGlyph` (lines 67-72). No other line in the file changes.

### Interfaces
No new types/exports. `paintGlyph` keeps its signature `(isOn: boolean): void` (local const in `create()`). Reuses existing `fillRing(g, x, y, radius, thickness, from, to, color)` from `src/ui/ring` (angle radians, 0 = up, clockwise) and `PALETTE.ink`/`PALETTE.muted` (already imported via `cssColor`/`PALETTE`).

### Steps
1. In `src/scenes/PauseScene.ts`, after `import { makeCard } from '../ui/card';` add the line:
   `import { fillRing } from '../ui/ring';`
2. Replace lines 67-72 (`const paintGlyph = ...`) with exactly:
```ts
const paintGlyph = (isOn: boolean): void => {
  glyph.clear();
  const c = isOn ? PALETTE.ink : PALETTE.muted;
  glyph.fillStyle(c, 1);
  // box: 6 wide, 8 tall, on the left, vertically centered
  glyph.fillRoundedRect(-12, -4, 6, 8, 2);
  // cone: trapezoid joined to the box's right, 8 tall at the box flaring to 18, opening right
  glyph.beginPath();
  glyph.moveTo(-6, -4);
  glyph.lineTo(-6, 4);
  glyph.lineTo(1, 9);
  glyph.lineTo(1, -9);
  glyph.closePath();
  glyph.fillPath();
  if (isOn) {
    // two sound-wave arcs to the right of the cone, centered on its middle (-2.5, 0)
    fillRing(glyph, -2.5, 0, 5, 2, Math.PI / 4, 3 * Math.PI / 4, c);
    fillRing(glyph, -2.5, 0, 9, 2, Math.PI / 4, 3 * Math.PI / 4, c);
  } else {
    // off: a small x of two 2px rounded bars (8 long) to the right of the cone
    glyph.lineStyle(2, c, 1);
    glyph.lineCap('round');
    glyph.line(2.2, -2.8, 7.8, 2.8);
    glyph.line(2.2, 2.8, 7.8, -2.8);
  }
};
```

### Pitfalls
- Draw in the glyph's local coords (it sits at `(-88, 0)` in `soundRow.content`); the box's left edge stays at `x=-12`, the right edge is ≤ `7.8`, so the gap to the word at `-62` is ≥ 18 px (≥ 8 required).
- Use `fillRing` for the arcs, never a thick Graphics stroke (WebGL shimmers thick strokes); the off-state "x" is a thin 2-px stroke, which is fine.
- Keep `glyph.clear()` first so the on/off swap doesn't leave leftover fills/strokes; keep the glyph's position and `soundRow.content.add([glyph, wordText, stateText])` unchanged.
- Colors only `PALETTE.ink`/`PALETTE.muted` (already used); vector fills stay crisp at 412x915 and 1280x720 (panel scale is 1 at both).

### Tests
none
