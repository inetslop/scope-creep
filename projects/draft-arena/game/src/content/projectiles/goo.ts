import { drawCritter, moveForward, turnToward, type Look, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const look: Look = { shape: 'circle', color: PALETTE.blue };
look.draw = (g, e) => {
  const r = e.radius, back = e.angle + Math.PI; // tail behind the drop -> reads as chasing
  const tail = () => {
    g.beginPath();
    g.moveTo(Math.cos(back + 0.5) * r * 0.9, Math.sin(back + 0.5) * r * 0.9);
    g.lineTo(Math.cos(back) * r * 1.7, Math.sin(back) * r * 1.7);
    g.lineTo(Math.cos(back - 0.5) * r * 0.9, Math.sin(back - 0.5) * r * 0.9);
    g.closePath();
  };
  tail();
  g.lineJoin = 'round';
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2)) * 2; // the part's outline, doubled
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  drawCritter(g, look, e, { ink: PALETTE.ink });
  tail();
  g.fillStyle = e.flash ? '#ffffff' : look.color; // no stroke: covers the inner half
  g.fill();
};

/** The Goober's weapon: a big blue drop that turns in flight toward the nearest enemy within 260. */
export const goo: ProjectileDef = {
  id: 'goo', radius: 14, life: 2.5, look,
  step(ctx, p, dt) {
    const t = ctx.nearestEnemy(p, 260);
    if (t) turnToward(p, { x: t.x, y: t.y }, 5 * dt); // 5 rad/s; none in range -> straight
    moveForward(p, dt);
  },
  onHit(ctx, _p, target) { target.mem.gooAt = ctx.time; },
};
