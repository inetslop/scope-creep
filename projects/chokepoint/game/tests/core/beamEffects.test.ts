import { describe, expect, it } from 'vitest';
import { CELL } from '../../src/config';
import { getAugment } from '../../src/content/augments';
import { PALETTE } from '../../src/content/palette';
import type { AugmentCopy, Tier } from '../../src/content/types';
import { describeSpec, towerSpec } from '../../src/core/augments';
import { BEAM_EFFECT_LINE_MAX, beamEffectLines, beamFx } from '../../src/core/beamEffects';

const copy = (id: string, tier: Tier = 'common'): AugmentCopy => ({ id, tier });
const spec = (...ids: string[]) => towerSpec(ids.map((id) => copy(id)));

describe('beamFx', () => {
  it('a plain beam carries no effects, and a Beam added to another tower is not beam-first', () => {
    expect(beamFx(spec('beam'))).toBeUndefined();
    expect(beamFx(spec('bolt', 'beam'))).toBeUndefined();
  });

  it('a Beam-first tower carries the effects of its added augments, straight from the spec', () => {
    expect(beamFx(spec('beam', 'frost'))).toEqual({ slow: { pct: 0.4, sec: 2 }, markPct: 0, burn: undefined, root: undefined, push: 0 });
    expect(beamFx(spec('beam', 'frost', 'mark'))).toEqual({ slow: { pct: 0.4, sec: 2 }, markPct: 0.25, burn: undefined, root: undefined, push: 0 });
    expect(beamFx(spec('beam', 'ember'))).toEqual({ slow: undefined, markPct: 0, burn: { dps: 3, sec: 3 }, root: undefined, push: 0 });
    expect(beamFx(spec('beam', 'anchor'))).toEqual({ slow: undefined, markPct: 0, burn: undefined, root: { sec: 0.5 }, push: 0 });
    expect(beamFx(spec('beam', 'anchor', 'anchor'))).toEqual({ slow: undefined, markPct: 0, burn: undefined, root: { sec: 0.75 }, push: 0 });
    expect(beamFx(spec('beam', 'push'))).toEqual({ slow: undefined, markPct: 0, burn: undefined, root: undefined, push: 0.4 * CELL });
  });

  it('uses the tier values of the copies in the tower', () => {
    expect(beamFx(towerSpec([copy('beam'), copy('frost', 'rare')]))?.slow).toEqual({ pct: 0.5, sec: 2 });
    expect(beamFx(towerSpec([copy('beam'), copy('ember', 'epic')]))?.burn).toEqual({ dps: 5, sec: 3 });
  });
});

describe('beamEffectLines', () => {
  it('lists the effect augments in tower order, deduped, in their own colors, at most two', () => {
    const lines = beamEffectLines([copy('beam'), copy('mark'), copy('ember'), copy('anchor'), copy('push')]);
    expect(lines).toHaveLength(BEAM_EFFECT_LINE_MAX);
    expect(lines.map((l) => l.id)).toEqual(['mark', 'ember']);
    expect(lines[0]!.color).toBe(PALETTE[getAugment('mark').look.color]);
    expect(lines[1]!.color).toBe(PALETTE.orange);
  });

  it('drops duplicates and shows nothing without an effect augment', () => {
    expect(beamEffectLines([copy('frost'), copy('frost')])).toEqual([{ id: 'frost', color: PALETTE.ice }]);
    expect(beamEffectLines([copy('beam')])).toEqual([]);
    expect(beamEffectLines([copy('bolt'), copy('beam')])).toEqual([]);
  });
});

describe('describeSpec beam lines', () => {
  it('says each effect its beam carries', () => {
    expect(describeSpec(spec('beam', 'frost'))).toMatch(/its beam slows by 40%/);
    expect(describeSpec(spec('beam', 'mark'))).toMatch(/its beam marks for \+25% damage/);
    expect(describeSpec(spec('beam', 'ember'))).toMatch(/its beam sets ablaze/);
    expect(describeSpec(spec('beam', 'anchor'))).toMatch(/its beam roots for 0\.5s every second/);
    expect(describeSpec(spec('beam', 'anchor', 'anchor'))).toMatch(/its beam roots for 0\.75s every second/);
    expect(describeSpec(spec('beam', 'push'))).toMatch(/its beam pushes back 0\.4 cells/);
  });

  it('does not say it for a Beam added to another tower', () => {
    expect(describeSpec(spec('bolt', 'beam'))).not.toContain('its beam');
  });
});
