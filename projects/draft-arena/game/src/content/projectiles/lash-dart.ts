import { drawCritter, type Look, type ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

const look: Look = { shape: 'hexagon', color: PALETTE.purple };
look.draw = (g, e) => drawCritter(g, look, e, { ink: PALETTE.white });

/** A Lash shard: half a horn dart with a thin white edge, straight, gone on hit or after 0.4 s. It never splits. */
export const lashDart: ProjectileDef = {
  id: 'lash-dart',
  radius: 3,
  life: 0.4,
  look,
};
