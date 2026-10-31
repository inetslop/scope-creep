import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/content/index.ts';
import { buildRegistry, kindRadius } from '../registry.ts';
import { Reader, Writer } from '../shared/codec.ts';
import { C2S, readInput, readJoin, readRoster, readScores, readSnapshot, S2C, writeInput, writeJoin, writeRoster, writeScores } from '../shared/protocol.ts';
import { Match } from '../sim/match.ts';
import { writeSnapshot } from '../sim/snapshot.ts';

const registry = buildRegistry(CONTENT);

describe('protocol', () => {
  it('a snapshot reads back as written', () => {
    const m = new Match(registry, 5);
    const me = m.addPlayer('me', true, '');
    for (let i = 0; i < 5; i++) m.addPlayer(`b${i}`, true, '');
    for (let t = 0; t < 200; t++) m.step();
    const w = new Writer(16);
    writeSnapshot(w, m, me);
    const r = new Reader(w.finish());
    expect(r.u8()).toBe(S2C.snapshot);
    const s = readSnapshot(r, (kind) => kindRadius(registry, kind));
    expect(r.remaining).toBe(0);
    expect(s.tick).toBe(m.tick);
    expect(s.self.level).toBe(me.level);
    expect(s.self.prestige).toBe(me.prestige);
    expect(s.self.coins).toBe(me.coins);
    expect(s.self.x).toBeCloseTo(me.x, 0);
    const mine = s.entities.find((e) => e.id === me.id);
    if (me.alive) {
      expect(mine).toBeDefined();
      expect(Math.abs(mine!.x - me.x)).toBeLessThanOrEqual(0.125);
    }
    for (const e of s.entities) {
      const k = registry.kinds[e.kind];
      expect(k, `kind ${e.kind}`).toBeDefined();
      expect(e.radius).toBeGreaterThan(0);
    }
  });

  it('join, roster and scores carry color, what is worn and prestige', () => {
    const wear = { head: 3, face: 0, back: 1, pattern: 2 };
    let w = new Writer();
    writeJoin(w, { protocol: 9, name: 'Ada', token: 'abc', color: 4, wear });
    let r = new Reader(w.finish());
    expect(r.u8()).toBe(C2S.join);
    expect(readJoin(r)).toEqual({ protocol: 9, name: 'Ada', token: 'abc', color: 4, wear });
    w = new Writer();
    writeJoin(w, { protocol: 9, name: 'Bo', token: '', color: undefined, wear: { head: 0, face: 0, back: 0, pattern: 0 } });
    r = new Reader(w.finish());
    r.u8();
    expect(readJoin(r).color, 'no color: the server picks').toBeUndefined();
    w = new Writer();
    writeRoster(w, [{ id: 7, name: 'Ada', color: 4, bot: false, wear }]);
    r = new Reader(w.finish());
    expect(r.u8()).toBe(S2C.roster);
    expect(readRoster(r)).toEqual([{ id: 7, name: 'Ada', color: 4, bot: false, wear }]);
    w = new Writer();
    writeScores(w, [{ id: 7, score: 12, level: 3, kills: 2, prestige: 2 }]);
    r = new Reader(w.finish());
    r.u8();
    expect(readScores(r)).toEqual([{ id: 7, score: 12, level: 3, kills: 2, prestige: 2 }]);
  });

  it('inputs read back quantized', () => {
    const w = new Writer();
    writeInput(w, { seq: 65535, moveX: 0.5, moveY: -1, aim: 2, buttons: 1 });
    const r = new Reader(w.finish());
    r.u8();
    const m = readInput(r);
    expect(m.seq).toBe(65535);
    expect(m.moveX).toBeCloseTo(0.5, 1);
    expect(m.moveY).toBe(-1);
    expect(m.aim).toBeCloseTo(2, 3);
    expect(m.buttons).toBe(1);
  });
});
