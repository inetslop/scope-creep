import type { EffectDef } from '../../../engine/api.ts';
import { burst } from './burst.ts';
import { pop } from './pop.ts';
import { ring } from './ring.ts';
import { slowPop } from './slow-pop.ts';

/** Every one-shot visual. One per line. */
export const EFFECTS: readonly EffectDef[] = [
  pop,
  ring,
  burst,
  slowPop,
];
