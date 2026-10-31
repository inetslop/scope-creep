import type { StatusDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The mark: +35% move speed for 15 s, nothing else. The red target ring around the marked player. maxStacks counts how often the mark was applied (read by the price director, directors/price.ts); it is one instance, never stacked. */
export const marked: StatusDef = { id: 'marked', name: 'Marked', color: PALETTE.red, speedMul: 1.35, maxStacks: 32 };
