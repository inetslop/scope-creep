import type { AugmentDef } from '../types';
import { bolt } from './bolt';
import { frost } from './frost';
import { lance } from './lance';
import { mark } from './mark';
import { rally } from './rally';
import { rapid } from './rapid';
import { reach } from './reach';
import { splash } from './splash';

/** Every augment. The draft after each wave offers three different ones. */
export const AUGMENTS: readonly AugmentDef[] = [
  bolt,
  lance,
  splash,
  frost,
  rally,
  mark,
  rapid,
  reach,
];

const byId = new Map(AUGMENTS.map((a) => [a.id, a]));

export function getAugment(id: string): AugmentDef {
  const def = byId.get(id);
  if (!def) throw new Error(`unknown augment "${id}"`);
  return def;
}
