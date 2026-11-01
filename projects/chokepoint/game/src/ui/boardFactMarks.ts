import type Phaser from 'phaser';
import { PALETTE } from '../content/palette';
import type { BoardFactMark } from '../core/boardFacts';

/**
 * The board's own language, flat on the white card: a short fragment of what each modifier is,
 * in muted ink (no outline, no glow, no texture) on a 24 px box centered on (0,0). The road is
 * an axis-aligned 3 px rounded bar; a later modifier adds one case here, never a new scene.
 */
export function paintBoardFactMark(g: Phaser.GameObjects.Graphics, mark: BoardFactMark): void {
  g.fillStyle(PALETTE.muted, 1);
  switch (mark) {
    case 'choke': // two road strokes within one cell of each other
      road(g, -4, -9, -4, 9);
      road(g, 4, -9, 4, 9);
      break;
    case 'bend': // an S, two corners: the road winds one bend more
      road(g, -9, 8, -9, -2);
      road(g, -9, -2, 2, -2);
      road(g, 2, -2, 2, 8);
      break;
    case 'longway': // one corner, a longer road
      road(g, -10, 7, -10, -7);
      road(g, -10, -7, 10, -7);
      break;
    case 'twochokes': // two close pairs of strokes
      road(g, -9, -8, -9, 8);
      road(g, -3, -8, -3, 8);
      road(g, 3, -8, 3, 8);
      road(g, 9, -8, 9, 8);
      break;
    case 'switchback': // two parallel roads with a build cell between
      road(g, -10, -5, 10, -5);
      road(g, -10, 5, 10, 5);
      g.fillRoundedRect(-2.5, -2.5, 5, 5, 1.5);
      break;
    case 'fargate': // a road with a second gate arrow partway along
      road(g, -10, 0, 10, 0);
      road(g, -10, -4, -10, 4);
      g.fillTriangle(2, -4, 2, 4, 7, 0);
      break;
    case 'fork': // the road splits into two lanes
      road(g, -10, 0, -4, 0);
      road(g, -4, -5, -4, 5);
      road(g, -4, -5, 10, -5);
      road(g, -4, 5, 10, 5);
      break;
    case 'markedcell': // a build cell with a small dot on it
      g.fillRoundedRect(-5, -5, 10, 10, 3);
      g.fillStyle(PALETTE.card, 1);
      g.fillCircle(0, 0, 2);
      break;
  }
}

/** An axis-aligned 3 px rounded bar from (x1,y1) to (x2,y2); x1==x2 (vertical) or y1==y2 (horizontal). */
function road(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number): void {
  if (x1 === x2) {
    const y = Math.min(y1, y2);
    g.fillRoundedRect(x1 - 1.5, y, 3, Math.abs(y2 - y1), 1.5);
  } else {
    const x = Math.min(x1, x2);
    g.fillRoundedRect(x, y1 - 1.5, Math.abs(x2 - x1), 3, 1.5);
  }
}
