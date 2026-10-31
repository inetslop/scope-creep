import type { EffectDef } from '../../../engine/api.ts';
import { burst } from './burst.ts';
import { pop } from './pop.ts';
import { prestigeRing } from './prestige-ring.ts';
import { crownFall } from './crown-fall.ts';
import { coin } from './coin.ts';
import { ring } from './ring.ts';
import { slowPop } from './slow-pop.ts';
import { wiredPop } from './wired-pop.ts';
import { geyserBubble } from './geyser-bubble.ts';
import { splashRing } from './splash-ring.ts';
import { stingBurst } from './sting-burst.ts';

/** Every one-shot visual. One per line. */
export const EFFECTS: readonly EffectDef[] = [
  pop,
  coin,
  ring,
  prestigeRing,
  crownFall,
  geyserBubble,
  splashRing,
  burst,
  stingBurst,
  slowPop,
  wiredPop,
];
