import { drawCritter, drawFace, shade, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const ANGRY: Face = { mood: 'angry', eyes: 1, mouth: 'o' };

/** The bean's color lightened the way Flee's coral lightens the Dot's red. */
const look: Look = { shape: 'circle', color: shade(PALETTE.berry, 0.4), face: ANGRY };
/** A little bean: the same tall oval and notch, no shudder (it can never give birth). */
look.draw = (g, e) => {
  const r = e.radius;
  g.save();
  g.scale(0.84, 1.1);
  drawCritter(g, look, e, { ink: PALETTE.ink }); // no face: the face keeps its shape
  g.restore();
  g.beginPath();
  g.arc(0, -1.14 * r, 0.34 * r, 0.59, 2.55); // the notch
  g.strokeStyle = PALETTE.ink;
  g.lineWidth = Math.max(1.5, Math.min(3, r * 0.2));
  g.stroke();
  drawFace(g, ANGRY, r, e.angle, PALETTE.ink);
};

/** Born from a wounded Twin; chases the nearest player and never gives birth. */
export const twinling: MonsterDef = {
  id: 'twinling',
  name: 'Twinling',
  description: 'A small, fast bean born from a wounded Twin.',
  hp: 8,
  speed: 110,
  radius: 10,
  damage: 8,
  xp: 1,
  weight: 0,
  fromLevel: 1,
  look,
};
