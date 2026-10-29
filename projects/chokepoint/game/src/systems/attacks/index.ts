import type { AttackKind } from '../../content/types';
import type { Attack } from './attack';
import { beam } from './beam';
import { burn } from './burn';
import { mark } from './mark';
import { pulse } from './pulse';
import { rally } from './rally';
import { shot } from './shot';
import { spray } from './spray';

/** Every kind of tower attack, by TowerSpec.kind. A new kind: its file here and one line below. */
export const ATTACKS: Record<AttackKind, Attack> = {
  shot,
  spray,
  pulse,
  rally,
  mark,
  burn,
  beam,
};
