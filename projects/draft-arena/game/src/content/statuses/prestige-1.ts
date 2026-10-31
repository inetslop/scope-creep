import { traceShape, type StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Draws `n` small gold stars fanned up-right of the head, clear of the crown, under the name (prestige-2 and -3 use it too). */
export const prestigeStarsDraw = (n: number): NonNullable<StatusDef['draw']> => (g, v) => {
  const r = v.radius;
  for (let i = 0; i < n; i++) {
    g.save();
    g.translate(r + 6 + i * 9, -(r + 5) - i * 6);
    g.beginPath();
    traceShape(g, 'star', 5, 0);
    g.fillStyle = PALETTE.yellow;
    g.fill();
    g.lineWidth = 2;
    g.lineJoin = 'round';
    g.strokeStyle = v.ink;
    g.stroke();
    g.restore();
  }
};

/** 1 prestige this life: a gold star off the top-right of the head (directors/prestige-stars.ts). */
export const prestige1: StatusDef = { id: 'prestige-1', name: 'Prestige 1', color: PALETTE.yellow, draw: prestigeStarsDraw(1) };
