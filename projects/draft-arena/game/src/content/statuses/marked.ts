import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The mark: +35% move speed for 15 s, nothing else. The red ring around the marked player. */
export const marked: StatusDef = { id: 'marked', name: 'Marked', color: PALETTE.red, speedMul: 1.35 };
