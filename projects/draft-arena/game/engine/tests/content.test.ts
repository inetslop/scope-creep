/**
 * Every piece of content, checked automatically: valid data, pure paths, draw functions that don't
 * throw, and every upgrade and monster run in a real match without errors. A new content file is
 * covered the moment it is in its registry: there is nothing to add here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/content/index.ts';
import { ACCESSORY_SLOTS, MOODS, MOUTHS, SHAPES, type DrawView, type Launch, type Look, type Stats, type WearView } from '../api.ts';
import { buildRegistry } from '../registry.ts';
import { Match } from '../sim/match.ts';
import { missingFor } from '../talents.ts';
import { stubContext } from './stub.ts';

const registry = buildRegistry(CONTENT);
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/i;
const STATS: readonly (keyof Stats)[] = ['maxHp', 'speed', 'regen', 'damage', 'cooldown', 'area', 'projectileSpeed', 'pickup', 'armor', 'pierce', 'shots'];
const positive = (v: number): boolean => Number.isFinite(v) && v > 0;

function checkLook(look: Look, where: string): void {
  expect(SHAPES, `${where}: look.shape`).toContain(look.shape);
  expect(look.color, `${where}: look.color must be '#rrggbb'`).toMatch(HEX);
  if (look.scale !== undefined) expect(positive(look.scale), `${where}: look.scale`).toBe(true);
  if (look.face) {
    if (look.face.mood !== undefined) expect(MOODS, `${where}: look.face.mood`).toContain(look.face.mood);
    if (look.face.mouth !== undefined) expect(MOUTHS, `${where}: look.face.mouth`).toContain(look.face.mouth);
    if (look.face.eyes !== undefined) expect([1, 2, 3], `${where}: look.face.eyes`).toContain(look.face.eyes);
  }
  if (look.draw) {
    for (const slot of [0, 1]) {
      const view: DrawView = { x: 0, y: 0, angle: 1, radius: 12, hp: 0.5, slots: [slot, 2, 3, 4], flash: slot === 1, speed: 150, time: 3.2, seed: 7, color: look.color };
      expect(() => look.draw!(stubContext, view), `${where}: look.draw threw`).not.toThrow();
    }
  }
}

function allIds(): { category: string; id: string }[] {
  const lists = { monsters: CONTENT.monsters, projectiles: CONTENT.projectiles, areas: CONTENT.areas, upgrades: CONTENT.upgrades, statuses: CONTENT.statuses, pickups: CONTENT.pickups, effects: CONTENT.effects, directors: CONTENT.directors, trees: CONTENT.trees, talents: CONTENT.trees.flatMap((t) => t.talents), accessories: CONTENT.accessories, patterns: CONTENT.patterns };
  return Object.entries(lists).flatMap(([category, list]) => list.map((d) => ({ category, id: d.id })));
}

describe('content files', () => {
  // One item per file, named after its id, and every file in its registry: the layout that lets
  // several developers add content at once without touching each other's files.
  const lists: Record<string, readonly { id: string }[]> = {
    monsters: CONTENT.monsters,
    projectiles: CONTENT.projectiles,
    areas: CONTENT.areas,
    upgrades: CONTENT.upgrades,
    statuses: CONTENT.statuses,
    pickups: CONTENT.pickups,
    effects: CONTENT.effects,
    directors: CONTENT.directors,
    talents: CONTENT.trees,
    accessories: CONTENT.accessories,
    patterns: CONTENT.patterns,
  };
  const contentDir = fileURLToPath(new URL('../../src/content/', import.meta.url));
  for (const [folder, items] of Object.entries(lists)) {
    it(`${folder}/: one file per item, named after its id, each in the registry`, () => {
      const files = fs.readdirSync(path.join(contentDir, folder)).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
      const ids = new Set(items.map((i) => i.id));
      for (const f of files) {
        const id = f.replace(/\.ts$/, '');
        expect(ids.has(id), `src/content/${folder}/${f}: no item with id '${id}' in ${folder}/index.ts. Name the file after the item's id, and add the item to the list in index.ts`).toBe(true);
      }
      expect(files.length, `src/content/${folder}/index.ts lists ${items.length} items but the folder has ${files.length} files: one item per file`).toBe(items.length);
    });
  }
});

describe('content data', () => {
  it('ids are kebab-case and unique per kind of content', () => {
    for (const { category, id } of allIds()) expect(id, `${category}: "${id}"`).toMatch(KEBAB);
    expect(() => buildRegistry(CONTENT)).not.toThrow();
  });

  it('monsters', () => {
    for (const m of CONTENT.monsters) {
      const where = `monster ${m.id}`;
      for (const k of ['hp', 'speed', 'radius'] as const) expect(positive(m[k]), `${where}: ${k} must be > 0`).toBe(true);
      for (const k of ['damage', 'xp', 'weight'] as const) expect(Number.isFinite(m[k]) && m[k] >= 0, `${where}: ${k} must be >= 0`).toBe(true);
      expect(Number.isInteger(m.fromLevel) && m.fromLevel >= 1, `${where}: fromLevel must be a whole number >= 1`).toBe(true);
      expect(m.radius, `${where}: radius above 120 breaks hit detection`).toBeLessThanOrEqual(120);
      expect(m.name.length && m.description.length, `${where}: name and description`).toBeTruthy();
      checkLook(m.look, where);
    }
    expect(CONTENT.monsters.some((m) => m.weight > 0 && m.fromLevel === 1), 'some monster must spawn at level 1').toBe(true);
  });

  it('projectiles: valid numbers, and every path() is pure', () => {
    for (const p of CONTENT.projectiles) {
      const where = `projectile ${p.id}`;
      expect(positive(p.radius) && positive(p.life), `${where}: radius and life must be > 0`).toBe(true);
      expect(!(p.path && p.step), `${where}: give it a path() or a step(), not both`).toBe(true);
      if (p.pierce !== undefined) expect(Number.isInteger(p.pierce) && p.pierce >= 1, `${where}: pierce`).toBe(true);
      checkLook(p.look, where);
      if (!p.path) continue;
      const launch: Launch = { x: 500, y: 600, angle: 0.7, speed: 400, seed: 1234, p1: 250, p2: 60 };
      const owner = { x: 520, y: 580 };
      for (const t of [0, p.life / 3, p.life / 2, p.life]) {
        const a = p.path(launch, t, owner);
        const b = p.path({ ...launch }, t, { ...owner });
        expect(Number.isFinite(a.x) && Number.isFinite(a.y), `${where}: path(t=${t}) is not a number`).toBe(true);
        expect(b, `${where}: path() gave two answers for the same input: it must be pure (no state, no randomness)`).toEqual(a);
      }
    }
  });

  it('areas, statuses, pickups, effects', () => {
    for (const a of CONTENT.areas) {
      expect(positive(a.radius) && positive(a.life) && positive(a.interval), `area ${a.id}: radius, life and interval must be > 0`).toBe(true);
      checkLook(a.look, `area ${a.id}`);
    }
    for (const s of CONTENT.statuses) {
      expect(s.color, `status ${s.id}: color`).toMatch(HEX);
      if (s.speedMul !== undefined) expect(s.speedMul >= 0 && s.speedMul <= 3, `status ${s.id}: speedMul`).toBe(true);
    }
    for (const k of CONTENT.pickups) {
      expect(positive(k.radius) && positive(k.life), `pickup ${k.id}: radius and life`).toBe(true);
      checkLook(k.look, `pickup ${k.id}`);
    }
    for (const e of CONTENT.effects) {
      expect(positive(e.duration), `effect ${e.id}: duration`).toBe(true);
      for (const t of [0, 0.5, 1]) {
        expect(() => e.draw(stubContext, { ax: 10, ay: 20, bx: 30, by: 40, value: 12, t, age: t * e.duration, seed: 99 }), `effect ${e.id}: draw threw`).not.toThrow();
      }
    }
  });

  it('upgrades', () => {
    for (const u of CONTENT.upgrades) {
      const where = `upgrade ${u.id}`;
      expect(u.name.length && u.description.length, `${where}: name and description`).toBeTruthy();
      expect(Number.isInteger(u.maxLevel) && u.maxLevel >= 1, `${where}: maxLevel`).toBe(true);
      expect(!!u.fire === !!u.cooldown, `${where}: a weapon needs both fire() and cooldown`).toBe(true);
      if (u.cooldown !== undefined) expect(u.cooldown, `${where}: cooldown`).toBeGreaterThanOrEqual(0.1);
      for (const key of Object.keys(u.stats ?? {})) expect(STATS, `${where}: unknown stat "${key}"`).toContain(key);
      expect(u.fire || u.stats || u.onHit || u.onKill, `${where}: does nothing`).toBeTruthy();
      checkLook(u.look, where);
    }
  });

  it('talent trees: needs stay in their tree, every talent can be reached, every upgrade is in a tree', () => {
    for (const tree of CONTENT.trees) {
      expect(tree.name.length && tree.description.length, `tree ${tree.id}: name and description`).toBeTruthy();
      checkLook(tree.look, `tree ${tree.id}`);
      for (const t of tree.talents) {
        const up = registry.upgrades.get(t.upgrade)!;
        expect(Number.isInteger(t.max) && t.max >= 1 && t.max <= up.maxLevel, `talent ${t.id}: max must be 1-${up.maxLevel} (the maxLevel of ${up.id})`).toBe(true);
        expect((t.start ?? 0) <= t.max, `talent ${t.id}: start is above max`).toBe(true);
        if (t.prestige !== undefined) expect(Number.isInteger(t.prestige) && t.prestige >= 1, `talent ${t.id}: prestige must be a whole number, 1 or more`).toBe(true);
        for (const [id, rank] of t.needs ?? []) {
          const other = tree.talents.find((x) => x.id === id);
          expect(other, `talent ${t.id} needs "${id}", which is not in tree ${tree.id}`).toBeDefined();
          expect(rank >= 1 && rank <= (other?.max ?? 0), `talent ${t.id} needs ${id} at rank ${rank}, more than ${id} can have`).toBe(true);
        }
      }
      // Take everything that can be taken, again and again, until nothing changes: every talent must get there.
      const ranks = new Map(tree.talents.map((t) => [t, t.start ?? 0]));
      for (let changed = true; changed; ) {
        changed = false;
        for (const t of tree.talents) {
          // Prestige talents count as reachable: a player who prestiges enough gets there.
          if (ranks.get(t)! >= t.max || missingFor(registry, t, (x) => ranks.get(x) ?? 0, 99).length) continue;
          ranks.set(t, t.max);
          changed = true;
        }
      }
      for (const t of tree.talents) expect(ranks.get(t), `talent ${t.id} (${tree.id}) can never be taken: what it needs can't all be had`).toBe(t.max);
    }
    const talents = CONTENT.trees.flatMap((tree) => tree.talents);
    for (const u of CONTENT.upgrades) {
      const ranks = talents.filter((t) => t.upgrade === u.id).reduce((n, t) => n + t.max, 0);
      expect(ranks, `upgrade ${u.id} is in no talent tree, so nobody can get it`).toBeGreaterThan(0);
      expect(ranks, `upgrade ${u.id}: its talents add up to ${ranks} ranks, but its maxLevel is ${u.maxLevel}`).toBeLessThanOrEqual(u.maxLevel);
    }
  });

  it('accessories and patterns: shop data, and draw() runs', () => {
    const wearables = [...CONTENT.accessories.map((a) => ({ def: a, where: `accessory ${a.id}` })), ...CONTENT.patterns.map((p) => ({ def: p, where: `pattern ${p.id}` }))];
    for (const { def, where } of wearables) {
      expect(def.name.length >= 1 && def.name.length <= 18, `${where}: name must be 1-18 characters (it shows on a shop card at 412x915)`).toBe(true);
      expect(def.description.length >= 1 && def.description.length <= 70, `${where}: description must be 1-70 characters`).toBe(true);
      expect(Number.isInteger(def.price) && def.price >= 0, `${where}: price must be a whole number of coins, 0 or more`).toBe(true);
      if (def.prestige !== undefined) expect(Number.isInteger(def.prestige) && def.prestige >= 1, `${where}: prestige must be a whole number, 1 or more`).toBe(true);
      for (const time of [0, 2.7]) {
        const w: WearView = { radius: 18, color: '#4dabf7', ink: '#3b3355', time, seed: 3, angle: 1, speed: time ? 200 : 0 };
        expect(() => def.draw(stubContext, w), `${where}: draw threw`).not.toThrow();
      }
    }
    for (const a of CONTENT.accessories) expect(ACCESSORY_SLOTS, `accessory ${a.id}: slot`).toContain(a.slot);
  });

  it('rules name content that exists', () => {
    const r = CONTENT.rules;
    expect(registry.pickups.has(r.gem), `rules.gem "${r.gem}"`).toBe(true);
    for (const id of Object.values(r.effects)) expect(registry.effects.has(id), `rules.effects "${id}"`).toBe(true);
    for (const c of r.playerColors) expect(c).toMatch(HEX);
    expect(r.ground).toMatch(HEX);
    expect(r.ink).toMatch(HEX);
    expect(r.world.width).toBeLessThanOrEqual(16000);
    expect(r.world.height).toBeLessThanOrEqual(16000);
    expect(Number.isInteger(r.prestige.level) && r.prestige.level >= 2, 'rules.prestige.level must be a whole number, 2 or more').toBe(true);
  });
});

/** A short match: the player under test, three bots to fight, monsters spawning as usual. */
function runMatch(seconds: number, setup: (m: Match) => void): Match {
  const m = new Match(registry, 4242);
  setup(m);
  for (let i = 0; i < 3; i++) m.addPlayer(`bot ${i}`, true, '');
  for (let t = 0; t < seconds * 20; t++) m.step();
  return m;
}

function expectHealthy(m: Match, what: string): void {
  expect(m.errors, `${what}: content errors in the match`).toEqual([]);
  for (const e of [...m.players.values(), ...m.monsters, ...m.projectiles, ...m.areas, ...m.pickups]) {
    expect(Number.isFinite(e.x) && Number.isFinite(e.y), `${what}: an entity's position is not a number`).toBe(true);
  }
  for (const p of m.players.values()) expect(Number.isFinite(p.hp), `${what}: a player's hp is not a number`).toBe(true);
}

describe('every upgrade in a match', () => {
  for (const def of CONTENT.upgrades) {
    it(`${def.id} at max level`, () => {
      const m = runMatch(20, (match) => {
        const p = match.addPlayer('test', true, '');
        match.grant(p, def, def.maxLevel);
      });
      expectHealthy(m, `upgrade ${def.id}`);
    });
  }
});

describe('directors in a long match', () => {
  it('run three minutes without errors', () => {
    expectHealthy(runMatch(180, (match) => match.addPlayer('test', true, '')), 'directors');
  });
});

describe('prestige in a match', () => {
  it('every onPrestige runs without errors, and the match goes on', () => {
    const m = runMatch(5, (match) => {
      const p = match.addPlayer('test', true, '');
      for (let i = 0; i < 3; i++) for (let guard = 0; guard < 200 && p.prestige <= i; guard++) match.giveXp(p, p.xpNext - p.xp);
    });
    for (let t = 0; t < 100; t++) m.step();
    expectHealthy(m, 'prestige');
  });
});

describe('every monster in a match', () => {
  for (const def of CONTENT.monsters) {
    it(def.id, () => {
      const m = runMatch(12, (match) => {
        const p = match.addPlayer('test', true, '');
        for (let i = 0; i < 12; i++) match.addMonster(def, p.x + Math.cos(i) * 300, p.y + Math.sin(i) * 300, 5);
      });
      expectHealthy(m, `monster ${def.id}`);
    });
  }
});
