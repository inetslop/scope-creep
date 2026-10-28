import { describe, expect, it } from 'vitest';
import { clampView, fitView, panBy, toBoard, toScreen, zoomAt, type ViewArea } from '../../src/core/view';

const area: ViewArea = { x: 0, y: 72, width: 412, height: 700 };
const board = { width: 512, height: 896 };

describe('view', () => {
  it('fits the whole board, centered', () => {
    const v = fitView(area, board);
    expect(v.zoom).toBe(1);
    const topLeft = toScreen(v, area, { x: 0, y: 0 });
    const bottomRight = toScreen(v, area, { x: board.width, y: board.height });
    expect(topLeft.x).toBeGreaterThanOrEqual(0);
    expect(bottomRight.x).toBeLessThanOrEqual(area.width + 1e-9);
    expect(topLeft.y).toBeGreaterThanOrEqual(area.y - 1e-9);
    expect(bottomRight.y).toBeLessThanOrEqual(area.y + area.height + 1e-9);
  });

  it('screen and board points round-trip', () => {
    const v = { ...fitView(area, board), zoom: 2, focus: { x: 100, y: 300 } };
    const p = { x: 123, y: 456 };
    const back = toBoard(v, area, toScreen(v, area, p));
    expect(back.x).toBeCloseTo(p.x);
    expect(back.y).toBeCloseTo(p.y);
  });

  it('zooming keeps the point under the finger in place', () => {
    const v = fitView(area, board);
    const at = { x: 300, y: 500 };
    const before = toBoard(v, area, at);
    const z = zoomAt(v, area, at, 2.5);
    const after = toBoard(z, area, at);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('clamping keeps the board on screen and the zoom in range', () => {
    const v = fitView(area, board);
    const far = panBy({ ...v, zoom: 2 }, -5000, -5000);
    const c = clampView(far, area, board, 1, 2.5, 16);
    expect(c.focus.x).toBeLessThanOrEqual(board.width + 16);
    expect(c.focus.y).toBeLessThanOrEqual(board.height + 16);
    const corner = toScreen(c, area, { x: board.width, y: board.height });
    expect(corner.x).toBeGreaterThanOrEqual(area.width - 16 * 2 * v.fit * 2);
    expect(clampView({ ...v, zoom: 9 }, area, board, 1, 2.5, 16).zoom).toBe(2.5);
    expect(clampView({ ...v, zoom: 0.2 }, area, board, 1, 2.5, 16).zoom).toBe(1);
  });

  it('at the fit zoom the board stays centered however it is dragged', () => {
    const v = fitView(area, board);
    const c = clampView(panBy(v, 200, -300), area, board, 1, 2.5, 16);
    expect(c.focus.x).toBeCloseTo(board.width / 2);
    expect(c.focus.y).toBeCloseTo(board.height / 2);
  });

  it('zooming in step by step near an edge keeps that spot on screen, close to the cursor', () => {
    // A wide screen: the board is narrower than the area until zoomed in a while.
    const wide: ViewArea = { x: 10, y: 82, width: 1260, height: 512 };
    const b = { width: 896, height: 512 };
    let v = fitView(wide, b);
    const at = { x: 264, y: 200 };
    const anchor = toBoard(v, wide, at);
    // 1.5 cells of overscroll (as the Board uses): enough to zoom in on a spot one cell from the edge.
    for (let i = 0; i < 5; i++) v = clampView(zoomAt(v, wide, at, v.zoom * 1.2), wide, b, 1, 2.4, 96);
    const spot = toScreen(v, wide, anchor);
    expect(Math.abs(spot.x - at.x)).toBeLessThan(10);
    expect(Math.abs(spot.y - at.y)).toBeLessThan(10);
  });
});
