/**
 * The 60-player budget: a full match of bots, simulated for a minute, measuring the time per tick
 * and the snapshot bytes every player would receive. It fails when content makes a match too heavy
 * for one home server, and says what to look at.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/content/index.ts';
import type { Content } from '../api.ts';
import { BUDGET, MAX_PLAYERS, TICK_RATE } from '../config.ts';
import { buildRegistry } from '../registry.ts';
import { Writer } from '../shared/codec.ts';
import { Match } from '../sim/match.ts';
import { writeSnapshot } from '../sim/snapshot.ts';

function measure(content: Content): { tickMs: number; bytesPerPlayer: number; monsters: number; heaviest: string } {
  const m = new Match(buildRegistry(content), 99);
  for (let i = 0; i < MAX_PLAYERS; i++) m.addPlayer(`p${i}`, true, '');
  for (let t = 0; t < 40 * TICK_RATE; t++) m.step();
  const w = new Writer(64 * 1024);
  let simMs = 0;
  let bytes = 0;
  const ticks = 20 * TICK_RATE;
  const perKind = new Map<string, number>();
  for (let t = 0; t < ticks; t++) {
    const t0 = performance.now();
    m.step();
    simMs += performance.now() - t0;
    for (const p of m.players.values()) {
      writeSnapshot(w.reset(), m, p);
      bytes += w.pos;
    }
    for (const p of m.projectiles) if (!p.scripted) perKind.set(p.def.id, (perKind.get(p.def.id) ?? 0) + 1);
  }
  const heaviest = [...perKind].sort((a, b) => b[1] - a[1])[0];
  return {
    tickMs: simMs / ticks,
    bytesPerPlayer: bytes / MAX_PLAYERS / (ticks / TICK_RATE),
    monsters: m.monsters.length,
    heaviest: heaviest ? `${heaviest[0]} (a step() projectile, sent every tick: ${Math.round(heaviest[1] / ticks)} alive on average)` : 'none',
  };
}

function check(name: string, r: ReturnType<typeof measure>): void {
  console.log(`${name}: ${r.tickMs.toFixed(2)} ms per tick, ${(r.bytesPerPlayer / 1024).toFixed(1)} KiB/s per player, ${r.monsters} monsters`);
  expect(
    r.bytesPerPlayer,
    `${name}: each player would receive ${Math.round(r.bytesPerPlayer)} bytes/s (budget ${BUDGET.bytesPerPlayerPerSecond}). Something puts too much on the wire. Most often a projectile with step() fired in numbers: give it a path() instead. Most step() projectiles alive: ${r.heaviest}`,
  ).toBeLessThan(BUDGET.bytesPerPlayerPerSecond);
  expect(r.tickMs, `${name}: a tick takes ${r.tickMs.toFixed(1)} ms (budget ${BUDGET.meanTickMs}). Look for a hook that loops over many units every tick.`).toBeLessThan(BUDGET.meanTickMs);
}

describe(`${MAX_PLAYERS} players in one match`, () => {
  it('fit the budget with players close together', () => {
    check('crowded', measure(CONTENT));
  });

  it('fit the budget with players spread out (every player its own crowd of monsters)', () => {
    check('spread', measure({ ...CONTENT, rules: { ...CONTENT.rules, world: { width: 12000, height: 12000 } } }));
  });
});
