import type { MakeHudPart } from '../../engine/api.ts';
import { arm, hudNow } from '../audio/sfx.ts';

/** No card: starts the sound on the first gesture and keeps it on while the match is shown. */
export const audio: MakeHudPart = () => {
  arm();
  return { update() { hudNow(); } };
};
