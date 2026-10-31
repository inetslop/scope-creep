import { type Look, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const look: Look = { shape: 'triangle', color: PALETTE.ice };
look.draw = (g, e) => {
  const a = e.angle, u = e.radius / 6; // sized for radius 6
  const px = (x: number, y: number) => ({ x: x * u * Math.cos(a) - y * u * Math.sin(a), y: x * u * Math.sin(a) + y * u * Math.cos(a) });
  g.fillStyle = 'rgba(40, 30, 70, 0.13)'; // soft shadow, as drawCritter draws it
  g.beginPath();
  g.ellipse(0, 4.9 * u, 5.4 * u, 1.8 * u, 0, 0, Math.PI * 2);
  g.fill();
  // slim teardrop, ~14 long: point ahead at (7, 0), rounded back to (-6.5, 0), half-width 3.5
  const tip = px(7, 0);
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(tip.x, tip.y);
  const c1 = px(1.5, -3.4), t1 = px(0, -3.5);
  g.quadraticCurveTo(c1.x, c1.y, t1.x, t1.y);
  const c2 = px(-6.5, -3.5), b = px(-6.5, 0);
  g.quadraticCurveTo(c2.x, c2.y, b.x, b.y);
  const c3 = px(-6.5, 3.5), t2 = px(0, 3.5);
  g.quadraticCurveTo(c3.x, c3.y, t2.x, t2.y);
  const c4 = px(1.5, 3.4);
  g.quadraticCurveTo(c4.x, c4.y, tip.x, tip.y);
  g.closePath();
  g.fillStyle = e.flash ? '#ffffff' : PALETTE.ice;
  g.fill();
  g.lineWidth = Math.max(1.5, Math.min(3, e.radius * 0.2));
  g.strokeStyle = PALETTE.ink;
  g.stroke();
  const gl = px(-3, -1.2); // small white glint near the back
  g.fillStyle = 'rgba(255, 255, 255, 0.75)';
  g.beginPath();
  g.ellipse(gl.x, gl.y, 1.4 * u, 0.8 * u, a - 0.6, 0, Math.PI * 2);
  g.fill();
};

/** Reach's needle: a slim ice drop that flies straight at the farthest enemy; gone on hit or after 0.8 s. */
export const needle: ProjectileDef = {
  id: 'needle',
  radius: 6,
  life: 0.8,
  look,
};
