import { describe, expect, it } from 'vitest';
import { AUGMENTS } from '../src/content/augments';
import { ENEMIES } from '../src/content/enemies';
import { BRIGHTS } from '../src/content/palette';

const kebab = /^[a-z][a-z0-9-]*$/;

function uniqueIds(items: readonly { id: string }[]): void {
  expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  for (const i of items) expect(i.id).toMatch(kebab);
}

describe('content', () => {
  it('enemies are valid', () => {
    uniqueIds(ENEMIES);
    expect(ENEMIES.some((e) => e.fromWave === 1)).toBe(true);
    for (const e of ENEMIES) {
      expect(e.name && e.description).toBeTruthy();
      expect(e.hp).toBeGreaterThan(0);
      expect(e.speed).toBeGreaterThan(0);
      expect(e.gold).toBeGreaterThanOrEqual(0);
      expect(e.livesCost).toBeGreaterThanOrEqual(1);
      expect(e.threat).toBeGreaterThan(0);
      expect(e.fromWave).toBeGreaterThanOrEqual(1);
      expect(BRIGHTS).toContain(e.look.color);
      expect(e.look.size).toBeGreaterThan(0);
      expect(e.look.size).toBeLessThanOrEqual(0.45);
      if (e.speedRamp) {
        expect(e.speedRamp.perHit).toBeGreaterThan(0);
        expect(e.speedRamp.max).toBeGreaterThan(e.speed);
      }
      if (e.behavior === 'dash') {
        const c = e.dashCycle!;
        expect(c.crawlSec).toBeGreaterThan(0);
        expect(c.pauseSec).toBeGreaterThan(0);
        expect(c.dashCells).toBeGreaterThan(0);
        expect(c.dashSec).toBeGreaterThan(0);
        expect(c.dashCells / c.dashSec).toBeGreaterThan(e.speed); // the surge outpaces the crawl
      }
    }
  });

  it('augments are valid: a first form, an added form, short card lines, tier values', () => {
    uniqueIds(AUGMENTS);
    expect(AUGMENTS.filter((a) => a.first.damage > 0).length).toBeGreaterThanOrEqual(3);
    for (const a of AUGMENTS) {
      expect(a.name).toBeTruthy();
      expect(BRIGHTS).toContain(a.look.color);
      expect(a.first.range).toBeGreaterThan(0);
      expect(a.first.rate).toBeGreaterThan(0);
      expect(a.first.damage > 0 || a.first.slow || a.first.root || a.first.mark || a.first.kind === 'rally' || a.first.goldRadius || a.first.goldPerLeak || a.first.push || a.first.burn || a.first.beam).toBeTruthy();
      if (a.first.kind === 'shot') expect(a.first.projectileSpeed ?? 0).toBeGreaterThan(0);
      expect(Object.keys(a.added).length).toBeGreaterThan(0);
      // The card shows each line next to its glyph: short, and no "First:"-style labels.
      for (const text of [a.asTower, a.asAdded]) {
        expect(text.length).toBeGreaterThan(5);
        expect(text.length).toBeLessThanOrEqual(70);
        expect(text).not.toMatch(/^(first|added|alone)\b/i);
      }
      // The tier values: the added line at that tier, and sane multipliers where present.
      for (const t of [a.tiers.rare, a.tiers.epic]) {
        expect(t.asAdded.length).toBeGreaterThanOrEqual(6);
        expect(t.asAdded.length).toBeLessThanOrEqual(56);
        expect(t.asAdded).not.toMatch(/^(first|added|alone)\b/i);
        if (t.damageMul !== undefined) expect(t.damageMul).toBeGreaterThan(1);
        if (t.rangeMul !== undefined) expect(t.rangeMul).toBeGreaterThan(1);
        if (t.addedRateMul !== undefined) expect(t.addedRateMul).toBeGreaterThan(1);
        if (t.addedRangeMul !== undefined) expect(t.addedRangeMul).toBeGreaterThan(1);
        if (t.cooldownMul !== undefined) {
          expect(t.cooldownMul).toBeGreaterThan(0);
          expect(t.cooldownMul).toBeLessThan(1);
        }
        if (t.slowPct !== undefined) {
          expect(t.slowPct).toBeGreaterThan(0);
          expect(t.slowPct).toBeLessThan(1);
        }
        if (t.splash !== undefined) expect(t.splash).toBeGreaterThan(0);
        if (t.burnDps !== undefined) expect(t.burnDps).toBeGreaterThan(0);
        if (t.beamDps !== undefined) expect(t.beamDps).toBeGreaterThan(0);
        if (t.addedBeamDps !== undefined) expect(t.addedBeamDps).toBeGreaterThan(0);
        if (t.rootSec !== undefined) expect(t.rootSec).toBeGreaterThan(0);
        if (t.addedRootSec !== undefined) expect(t.addedRootSec).toBeGreaterThan(0);
        if (t.asTower !== undefined) {
          expect(t.asTower.length).toBeGreaterThanOrEqual(6);
          expect(t.asTower.length).toBeLessThanOrEqual(56);
          expect(t.asTower).not.toMatch(/^(first|added|alone)\b/i);
        }
      }
    }
  });

  it('no two augments share a shape + color pair, except the pink-square support family', () => {
    const byPair = new Map<string, string[]>();
    for (const a of AUGMENTS) {
      const pair = `${a.look.shape} ${a.look.color}`;
      const ids = byPair.get(pair);
      if (ids) ids.push(a.id);
      else byPair.set(pair, [a.id]);
    }
    for (const [pair, ids] of byPair) {
      if (ids.length === 1) continue;
      // Anchor, Mark and Mint are the support family: they share pink squares on purpose.
      expect(pair).toBe('square pink');
      expect([...ids].sort()).toEqual(['anchor', 'mark', 'mint']);
    }
  });
});
