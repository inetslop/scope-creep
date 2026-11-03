import { describe, expect, it } from 'vitest';
import { BARREL_MARKS } from '../src/art/barrelMarks';
import { BOSS_MARKS } from '../src/art/bossMarks';
import { REGULAR_MARKS } from '../src/art/entities';
import { ENEMIES } from '../src/content/enemies';
import { bossId, isBossWave } from '../src/core/waves';

describe('boss marks', () => {
  // The boss ladder, the way the wave plans declare it (core/waves.ts): the spawn-only def the
  // plan names as the boss of its own boss wave. Escorts (a Guard, a Ward, a Hauler) and split
  // pieces (a Splinter, a Shard) appear on boss waves too, but they are not the boss — an escort
  // boss's threat is the wave budget minus its escorts, so the budget can't tell them apart.
  const inLadder = (id: string): boolean => {
    const e = ENEMIES.find((d) => d.id === id);
    return e !== undefined && e.spawnOnly !== undefined && isBossWave(e.fromWave) && bossId(e.fromWave) === id;
  };
  const bosses = ENEMIES.filter((e) => e.spawnOnly !== undefined && isBossWave(e.fromWave) && bossId(e.fromWave) === e.id);

  it('every boss in the ladder wears exactly one mark, and no non-boss has one', () => {
    for (const b of bosses) expect(BOSS_MARKS[b.id]).toBeDefined();
    for (const id of Object.keys(BOSS_MARKS)) expect(inLadder(id)).toBe(true);
  });
  it('the regular mark names cover every regular type, one each', () => {
    expect(Object.keys(REGULAR_MARKS).sort()).toEqual(ENEMIES.filter((e) => e.spawnOnly === undefined).map((e) => e.id).sort());
  });
  it('all boss marks are distinct, and none is a regular-enemy mark or a barrel mark', () => {
    const shapes = Object.values(BOSS_MARKS);
    expect(new Set(shapes).size).toBe(shapes.length);
    const taken = new Set<string>([...Object.values(REGULAR_MARKS), ...Object.values(BARREL_MARKS)]);
    for (const s of new Set(shapes)) expect(taken.has(s)).toBe(false);
  });
});
