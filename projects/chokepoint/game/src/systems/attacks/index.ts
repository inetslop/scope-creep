import type { AttackKind } from '../../content/types';
import type { Attack } from './attack';
import { mark } from './mark';
import { pulse } from './pulse';
import { shot } from './shot';

/** Every kind of tower attack, by TowerSpec.kind. A new kind: its file here and one line below. */
export const ATTACKS: Record<AttackKind, Attack> = {
  shot,
  pulse,
  mark,
};
