import type { Point } from './path';

/**
 * The board camera as pure math: how far it is zoomed in and which board point sits at the center
 * of the play area. `zoom` is a multiple of the zoom that fits the whole board (1 = fit).
 * Board points map to screen points as: screen = area center + (board - focus) * fit * zoom.
 */
export interface View {
  /** Pixels per board unit when the whole board fits the area. */
  fit: number;
  /** Multiple of `fit`, between ZOOM.min and ZOOM.max (config.ts). */
  zoom: number;
  /** Board point at the center of the play area. */
  focus: Point;
}

/** The part of the screen the board is shown in (between the HUD bars), in screen pixels. */
export interface ViewArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardSize {
  width: number;
  height: number;
}

const center = (a: ViewArea): Point => ({ x: a.x + a.width / 2, y: a.y + a.height / 2 });

/** Pixels per board unit right now. */
export function scaleOf(view: View): number {
  return view.fit * view.zoom;
}

/** The view that shows the whole board, centered. */
export function fitView(area: ViewArea, board: BoardSize): View {
  const fit = Math.max(0.01, Math.min(area.width / board.width, area.height / board.height));
  return { fit, zoom: 1, focus: { x: board.width / 2, y: board.height / 2 } };
}

export function toScreen(view: View, area: ViewArea, p: Point): Point {
  const c = center(area);
  const s = scaleOf(view);
  return { x: c.x + (p.x - view.focus.x) * s, y: c.y + (p.y - view.focus.y) * s };
}

export function toBoard(view: View, area: ViewArea, p: Point): Point {
  const c = center(area);
  const s = scaleOf(view);
  return { x: view.focus.x + (p.x - c.x) / s, y: view.focus.y + (p.y - c.y) / s };
}

/**
 * Keeps the board on screen. At the fit zoom it is centered. Zoomed in, along each axis a board
 * still smaller than the area stays inside it (not forced to the middle, so zooming in on a point
 * near an edge keeps that point under the finger), and a bigger one can't be moved further than
 * `pad` board units past its edge.
 */
export function clampView(view: View, area: ViewArea, board: BoardSize, minZoom: number, maxZoom: number, pad: number): View {
  const zoom = Math.min(maxZoom, Math.max(minZoom, view.zoom));
  const s = view.fit * zoom;
  const atFit = zoom <= minZoom + 1e-6;
  const axis = (focus: number, size: number, areaSize: number): number => {
    const half = areaSize / 2 / s;
    if (atFit) return size / 2;
    if (size <= half * 2 + 1e-6) return Math.min(half, Math.max(size - half, focus));
    return Math.min(size - half + pad, Math.max(half - pad, focus));
  };
  return { fit: view.fit, zoom, focus: { x: axis(view.focus.x, board.width, area.width), y: axis(view.focus.y, board.height, area.height) } };
}

/** Zooms to `zoom`, keeping the board point under the screen point `at` where it is. */
export function zoomAt(view: View, area: ViewArea, at: Point, zoom: number): View {
  const anchor = toBoard(view, area, at);
  const c = center(area);
  const s = view.fit * zoom;
  return { fit: view.fit, zoom, focus: { x: anchor.x - (at.x - c.x) / s, y: anchor.y - (at.y - c.y) / s } };
}

/** Moves the board with the finger or mouse: `dx`, `dy` in screen pixels. */
export function panBy(view: View, dx: number, dy: number): View {
  const s = scaleOf(view);
  return { ...view, focus: { x: view.focus.x - dx / s, y: view.focus.y - dy / s } };
}
