import { describe, expect, it } from 'vitest';
import { placeConfirmButtons } from '../../src/core/placeConfirm';

const view = { width: 412, height: 915 }; // phone portrait
const size = 56;
const GAP = 12; // the module's gap (between the buttons, and between the cell and the row)
const cell = (x: number, y: number, w = 32, h = 32) => ({ x, y, width: w, height: h });

describe('placeConfirmButtons', () => {
  it('sits the row above the cell, centered on it, with the cancel left of the confirm', () => {
    const rect = cell(190, 384); // a 32 px cell centered at (206, 400)
    const b = placeConfirmButtons(rect, view, size);
    expect(b.cancel.y).toBe(b.confirm.y);
    expect(b.confirm.x).toBeGreaterThan(b.cancel.x);
    expect((b.cancel.x + b.confirm.x) / 2).toBe(206); // centered on the cell's x
    expect(b.cancel.y).toBe(384 - GAP - size / 2); // a gap above the cell's top
    expect(b.confirm.x - b.cancel.x).toBe(size + GAP);
  });

  it('sits below the cell when it is within size + GAP of the top, above at the exact boundary', () => {
    // The row fits above exactly when rect.y >= size + GAP (56 + 12 = 68).
    const atBoundary = placeConfirmButtons(cell(190, 68), view, size);
    expect(atBoundary.cancel.y).toBe(28); // 68 - GAP - size / 2: above
    const below = placeConfirmButtons(cell(190, 67), view, size);
    expect(below.cancel.y).toBe(67 + 32 + GAP + size / 2); // below the cell, a gap under its bottom
  });

  it('keeps both buttons fully on screen for off-screen cells', () => {
    const rects = [
      cell(-500, -500), // far top-left
      cell(800, 300), // right of the screen
      cell(100, 1200), // below the screen
      cell(-16, 900), // bottom-left corner of the 412x915 screen
    ];
    for (const rect of rects) {
      const b = placeConfirmButtons(rect, view, size);
      for (const p of [b.cancel, b.confirm]) {
        expect(p.x).toBeGreaterThanOrEqual(size / 2);
        expect(p.x).toBeLessThanOrEqual(view.width - size / 2);
        expect(p.y).toBeGreaterThanOrEqual(size / 2);
        expect(p.y).toBeLessThanOrEqual(view.height - size / 2);
      }
    }
  });
});
