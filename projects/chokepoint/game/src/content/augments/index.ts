import type { AugmentDef } from '../types';
import { anchor } from './anchor';
import { beam } from './beam';
import { bolt } from './bolt';
import { ember } from './ember';
import { frost } from './frost';
import { lance } from './lance';
import { mark } from './mark';
import { mint } from './mint';
import { push } from './push';
import { rally } from './rally';
import { rapid } from './rapid';
import { reach } from './reach';
import { splash } from './splash';
import { spray } from './spray';

/** Every augment. The draft after each wave offers three different ones (four on every fifth). */
export const AUGMENTS: readonly AugmentDef[] = [
  bolt,
  lance,
  splash,
  spray,
  frost,
  push,
  anchor,
  mint,
  rally,
  mark,
  ember,
  beam,
  rapid,
  reach,
];

const byId = new Map(AUGMENTS.map((a) => [a.id, a]));

export function getAugment(id: string): AugmentDef {
  const def = byId.get(id);
  if (!def) throw new Error(`unknown augment "${id}"`);
  return def;
}
