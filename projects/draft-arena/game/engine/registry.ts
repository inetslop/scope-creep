/**
 * Turns the content lists into the numbered tables both sides share: an entity's `kind` on the
 * wire is its index in `kinds`, upgrades, statuses and effects travel as their index too. Server
 * and client build this from the same content code, so the numbers match; the hash of every id in
 * order (and the build id) catches a client built from other content.
 */
import type { AccessoryDef, AreaDef, Content, DirectorDef, EffectDef, Look, MonsterDef, PatternDef, PickupDef, ProjectileDef, StatusDef, TalentDef, TalentTreeDef, UpgradeDef } from './api.ts';
import { hashString } from './shared/rng.ts';

export type KindEntry =
  | { type: 'player'; look: Look }
  | { type: 'monster'; def: MonsterDef; look: Look }
  | { type: 'projectile'; def: ProjectileDef; look: Look }
  | { type: 'area'; def: AreaDef; look: Look }
  | { type: 'pickup'; def: PickupDef; look: Look };

export interface Registry {
  content: Content;
  kinds: KindEntry[];
  kindOf: Map<object, number>;
  monsters: Map<string, MonsterDef>;
  projectiles: Map<string, ProjectileDef>;
  areas: Map<string, AreaDef>;
  pickups: Map<string, PickupDef>;
  statuses: Map<string, StatusDef>;
  effects: Map<string, EffectDef>;
  upgrades: Map<string, UpgradeDef>;
  directors: Map<string, DirectorDef>;
  trees: Map<string, TalentTreeDef>;
  talents: Map<string, TalentDef>;
  /** Every talent of every tree, in order: a talent's index here is how it travels. */
  talentList: TalentDef[];
  talentIndex: Map<TalentDef, number>;
  treeOf: Map<TalentDef, TalentTreeDef>;
  upgradeIndex: Map<UpgradeDef, number>;
  statusIndex: Map<StatusDef, number>;
  effectIndex: Map<EffectDef, number>;
  /** What players wear travels as its index + 1 in content.accessories / content.patterns (0: nothing). */
  accessories: Map<string, AccessoryDef>;
  patterns: Map<string, PatternDef>;
  hash: number;
}

export const PLAYER_KIND = 0;

/** The radius an entity of this kind has unless the server says otherwise. */
export function kindRadius(reg: Registry, kind: number): number {
  const k = reg.kinds[kind];
  if (!k) return 10;
  return k.type === 'player' ? reg.content.rules.player.radius : k.def.radius;
}

function byId<T extends { id: string }>(category: string, items: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`content: two ${category} have the id "${item.id}"`);
    map.set(item.id, item);
  }
  return map;
}

/**
 * `build` (the deploy's commit, BUILD_ID / VITE_BUILD_ID) goes into the hash too: a page from
 * another deploy reloads even when only numbers or code changed. Empty in dev and tests.
 */
export function buildRegistry(content: Content, build = ''): Registry {
  const kinds: KindEntry[] = [{ type: 'player', look: { shape: 'circle', color: '#ffffff' } }];
  const kindOf = new Map<object, number>();
  const add = (entry: KindEntry): void => {
    if (entry.type !== 'player') kindOf.set(entry.def, kinds.length);
    kinds.push(entry);
  };
  for (const def of content.monsters) add({ type: 'monster', def, look: def.look });
  for (const def of content.projectiles) add({ type: 'projectile', def, look: def.look });
  for (const def of content.areas) add({ type: 'area', def, look: def.look });
  for (const def of content.pickups) add({ type: 'pickup', def, look: def.look });
  // A kind travels as one byte.
  if (kinds.length > 255) throw new Error('content: more than 255 monsters, projectiles, areas and pickups together');
  if (content.statuses.length > 255) throw new Error('content: more than 255 statuses');
  if (content.accessories.length > 254) throw new Error('content: more than 254 accessories');
  if (content.patterns.length > 254) throw new Error('content: more than 254 patterns');
  const upgrades = byId('upgrades', content.upgrades);
  const talentList = content.trees.flatMap((tree) => tree.talents);
  const treeOf = new Map<TalentDef, TalentTreeDef>();
  for (const tree of content.trees) {
    for (const t of tree.talents) {
      treeOf.set(t, tree);
      if (!upgrades.has(t.upgrade)) throw new Error(`content: talent "${t.id}" gives upgrade "${t.upgrade}", which does not exist`);
    }
  }
  const talents = byId('talents', talentList);
  const ids = [content.monsters, content.projectiles, content.areas, content.pickups, content.upgrades, content.statuses, content.effects, content.trees, talentList, content.accessories, content.patterns].map((list) => list.map((d) => d.id).join(','));
  return {
    content,
    kinds,
    kindOf,
    monsters: byId('monsters', content.monsters),
    projectiles: byId('projectiles', content.projectiles),
    areas: byId('areas', content.areas),
    pickups: byId('pickups', content.pickups),
    statuses: byId('statuses', content.statuses),
    effects: byId('effects', content.effects),
    upgrades,
    directors: byId('directors', content.directors),
    trees: byId('trees', content.trees),
    talents,
    talentList,
    talentIndex: new Map(talentList.map((t, i) => [t, i])),
    treeOf,
    upgradeIndex: new Map(content.upgrades.map((d, i) => [d, i])),
    statusIndex: new Map(content.statuses.map((d, i) => [d, i])),
    effectIndex: new Map(content.effects.map((d, i) => [d, i])),
    accessories: byId('accessories', content.accessories),
    patterns: byId('patterns', content.patterns),
    hash: hashString(build ? `${ids.join('|')}#${build}` : ids.join('|')),
  };
}
