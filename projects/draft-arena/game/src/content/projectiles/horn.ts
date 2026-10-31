import type { ProjectileDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A fat teal dart, point-first: fast and straight, gone on hit or after 0.6 s. */
export const horn: ProjectileDef = {
  id: 'horn',
  radius: 7,
  life: 0.6,
  look: { shape: 'triangle', color: PALETTE.teal },
};
