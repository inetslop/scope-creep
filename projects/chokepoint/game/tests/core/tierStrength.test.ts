import { describe, expect, it } from 'vitest';
import { AUGMENTS } from '../../src/content/augments';
import { bolt } from '../../src/content/augments/bolt';
import { lance } from '../../src/content/augments/lance';
import { push } from '../../src/content/augments/push';
import { spray } from '../../src/content/augments/spray';
import { towerSpec } from '../../src/core/augments';
import { TIER_ORDER, tierAdded, tierAddedLine } from '../../src/core/tiers';

describe('rarity matters when added', () => {
  it('every augment that can roll more than one rarity has a different added form at each', () => {
    for (const def of AUGMENTS) {
      if (def.tier !== undefined) continue; // the epic-only augments never roll another tier
      const forms = TIER_ORDER.map((tier) => JSON.stringify(tierAdded(def, tier)));
      expect(new Set(forms).size).toBe(TIER_ORDER.length);
    }
  });

  it('bolt, spray, push and lance state their real number on the card at every tier', () => {
    const shotWord = (n: number): string => (n === 2 ? 'Two' : n === 3 ? 'Three' : 'One');
    for (const tier of TIER_ORDER) {
      expect(tierAddedLine(bolt, tier)).toContain(shotWord(tierAdded(bolt, tier).extraShots!));
      expect(tierAddedLine(spray, tier)).toContain(`+${tierAdded(spray, tier).spray}`);
      expect(tierAddedLine(push, tier)).toContain(tierAdded(push, tier).push!.toFixed(1));
      expect(tierAddedLine(lance, tier)).toBe(`+${tierAdded(lance, tier).pierce!} pierce.`);
    }
  });

  it('a second copy at Rare and Epic changes the tower spec by its number', () => {
    for (const tier of ['rare', 'epic'] as const) {
      expect(towerSpec([{ id: bolt.id, tier: 'common' }, { id: bolt.id, tier }]).shots).toBe(tier === 'rare' ? 3 : 4);
      expect(towerSpec([{ id: spray.id, tier: 'common' }, { id: spray.id, tier }]).spray).toBe(tier === 'rare' ? 8 : 9);
      expect(towerSpec([{ id: push.id, tier: 'common' }, { id: push.id, tier }]).pushPerHit).toBeCloseTo(tier === 'rare' ? 0.6 : 0.8);
    }
  });
});
