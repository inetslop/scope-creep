/** The two round buttons of a touch placement (ui/hud/PlaceConfirm.ts): screen centers in CSS pixels. */
export interface PlaceButtons {
  cancel: { x: number; y: number };
  confirm: { x: number; y: number };
}

/** Between the two buttons, and between the cell and the row. */
const GAP = 12;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * Where the ✓/✗ buttons sit around a cell that waits a touch placement: a row centered on the
 * cell's x (✗ left, ✓ right), above the cell — or below it when the cell is too near the top of
 * the screen — clamped so both buttons stay fully on screen. `rect` and `view` in CSS pixels,
 * `size` the button side (at least 44).
 */
export function placeConfirmButtons(
  rect: { x: number; y: number; width: number; height: number },
  view: { width: number; height: number },
  size: number,
): PlaceButtons {
  const rowW = 2 * size + GAP;
  const cx = clamp(rect.x + rect.width / 2, rowW / 2, view.width - rowW / 2);
  const y = rect.y - GAP - size >= 0 ? rect.y - GAP - size / 2 : rect.y + rect.height + GAP + size / 2;
  const cy = clamp(y, size / 2, view.height - size / 2);
  return {
    cancel: { x: cx - (size + GAP) / 2, y: cy },
    confirm: { x: cx + (size + GAP) / 2, y: cy },
  };
}
