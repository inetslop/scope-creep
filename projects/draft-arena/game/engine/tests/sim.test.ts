import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/content/index.ts';
import type { TalentTreeDef } from '../api.ts';
import { buildRegistry } from '../registry.ts';
import { Match } from '../sim/match.ts';
import { PROTOCOL_VERSION } from '../config.ts';
import { Reader, Writer } from '../shared/codec.ts';
import { readWelcome, S2C, writeSpectate } from '../shared/protocol.ts';
import { Room } from '../sim/room.ts';

const registry = buildRegistry(CONTENT);

describe('match rules', () => {
  it('points bank, and a talent can only be taken once what it needs is there', () => {
    // A tree of its own, so the rule is tested whatever the game's trees look like.
    const [first, second] = CONTENT.upgrades.filter((u) => !u.fire && u.maxLevel >= 2);
    expect(first && second, 'needs two stat upgrades with maxLevel 2+ in the content').toBeTruthy();
    const tree: TalentTreeDef = {
      id: 'test-tree',
      name: 'Test',
      description: 'For the test.',
      look: { shape: 'circle', color: '#ffffff' },
      talents: [
        { id: 'test-a', upgrade: first!.id, max: 2 },
        { id: 'test-b', upgrade: second!.id, max: 1, needs: [['test-a', 2]] },
      ],
    };
    const reg = buildRegistry({ ...CONTENT, upgrades: CONTENT.upgrades, trees: [...CONTENT.trees.map((t) => ({ ...t, talents: t.talents.filter((x) => x.upgrade !== first!.id && x.upgrade !== second!.id) })), tree] });
    const m = new Match(reg, 1);
    const p = m.addPlayer('p', false, 't');
    const a = reg.talents.get('test-a')!;
    const b = reg.talents.get('test-b')!;
    const levelUp = (): void => m.giveXp(p, p.xpNext - p.xp);

    m.pick(p, reg.talentIndex.get(a)!);
    expect(p.talents.get(a) ?? 0, 'a talent was taken without a point to spend').toBe(0);
    levelUp();
    levelUp();
    expect(p.pendingPicks, 'points bank').toBe(2);
    m.pick(p, reg.talentIndex.get(b)!);
    expect(p.talents.get(b) ?? 0, 'test-b was taken before test-a 2').toBe(0);
    m.pick(p, reg.talentIndex.get(a)!);
    m.pick(p, reg.talentIndex.get(a)!);
    expect(p.talents.get(a)).toBe(2);
    expect(p.pendingPicks).toBe(0);
    levelUp();
    m.pick(p, reg.talentIndex.get(b)!);
    expect(p.talents.get(b)).toBe(1);
    expect(p.upgrades.get(second!)?.level).toBe(1);
  });

  it('everyone starts with the free start ranks', () => {
    const m = new Match(registry, 1);
    const p = m.addPlayer('p', false, 't');
    for (const t of registry.talentList) expect(p.talents.get(t) ?? 0, t.id).toBe(t.start ?? 0);
  });

  it('a player knocked out respawns at level 1 after respawnSeconds', () => {
    const m = new Match(registry, 2);
    const p = m.addPlayer('p', false, 't');
    m.giveXp(p, 100);
    // Below zero: regen would lift an exact 0 back up before deaths are counted.
    p.hp = -1;
    m.step();
    expect(p.alive).toBe(false);
    for (let t = 0; t < CONTENT.rules.respawnSeconds * 20 + 2; t++) m.step();
    expect(p.alive).toBe(true);
    expect(p.level).toBe(1);
    for (const t of registry.talentList) expect(p.talents.get(t) ?? 0, t.id).toBe(t.start ?? 0);
    expect(p.hp).toBe(p.maxHp);
  });

  it('players take reduced damage from players', () => {
    const m = new Match(registry, 3);
    const a = m.addPlayer('a', false, 'a');
    const b = m.addPlayer('b', false, 'b');
    const hp = b.hp;
    m.damage(b, 10, a);
    expect(hp - b.hp).toBeCloseTo(10 * CONTENT.rules.pvp.damageMul);
  });
});

describe('room', () => {
  it('a spectator watches without taking a slot', () => {
    const room = new Room(registry, 5);
    const got: Uint8Array[] = [];
    const conn = room.connect({ send: (d) => got.push(d), close: () => {}, backlog: 0 });
    const w = new Writer();
    writeSpectate(w, PROTOCOL_VERSION);
    conn.receive(w.finish());
    for (let t = 0; t < 10; t++) room.step();
    const types = got.map((d) => d[0]);
    expect(types[0]).toBe(S2C.welcome);
    const welcome = readWelcome(new Reader(got[0]!.subarray(1)));
    expect(welcome.playerId, 'a spectator has no player').toBe(0);
    expect(types.filter((t) => t === S2C.snapshot).length, 'a spectator gets snapshots').toBeGreaterThanOrEqual(9);
    expect(room.status().humans, 'a spectator is not a player').toBe(0);
    expect(room.status().bots).toBe(CONTENT.rules.bots.fillTo);
  });

  it('fills with bots and keeps running', () => {
    const room = new Room(registry, 4);
    for (let t = 0; t < 200; t++) room.step();
    const s = room.status();
    expect(s.bots).toBe(CONTENT.rules.bots.fillTo);
    expect(s.errors).toEqual([]);
  });
});
