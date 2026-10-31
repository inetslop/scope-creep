import type { EffectDef } from '../../../engine/api.ts';
import { burst } from './burst.ts';
import { novaBurst } from './nova.ts';
import { pop } from './pop.ts';
import { ring } from './ring.ts';
import { zap } from './zap.ts';

/** Every one-shot visual. One per line. */
export const EFFECTS: readonly EffectDef[] = [
  pop,
  ring,
  zap,
  burst,
  novaBurst,
];
