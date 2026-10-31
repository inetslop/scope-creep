import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/content/index.ts';
import { buildRegistry, kindRadius } from '../registry.ts';
import { Reader, Writer } from '../shared/codec.ts';
import { readInput, readSnapshot, S2C, writeInput } from '../shared/protocol.ts';
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
