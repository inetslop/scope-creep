import type { Content } from '../../engine/api.ts';
import { ACCESSORIES } from './accessories/index.ts';
import { AREAS } from './areas/index.ts';
import { DIRECTORS } from './directors/index.ts';
import { EFFECTS } from './effects/index.ts';
import { MONSTERS } from './monsters/index.ts';
import { PATTERNS } from './patterns/index.ts';
import { PICKUPS } from './pickups/index.ts';
import { PROJECTILES } from './projectiles/index.ts';
import { RULES } from './rules.ts';
import { STATUSES } from './statuses/index.ts';
import { TREES } from './talents/index.ts';
import { UPGRADES } from './upgrades/index.ts';

/** All of the game's content, as the engine loads it on the server and on every client. */
export const CONTENT: Content = {
  monsters: MONSTERS,
  projectiles: PROJECTILES,
  areas: AREAS,
  upgrades: UPGRADES,
  statuses: STATUSES,
  pickups: PICKUPS,
  effects: EFFECTS,
  directors: DIRECTORS,
  trees: TREES,
  accessories: ACCESSORIES,
  patterns: PATTERNS,
  rules: RULES,
};
