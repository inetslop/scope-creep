import { describe, expect, it } from 'vitest';
import { UPGRADES, UPGRADE_BY_ID } from '../../src/content/upgrades';
import { Rng } from '../../src/core/rng';
import { RunState } from '../../src/core/run';
import { isUpgradeAvailable, rollUpgradeChoices } from '../../src/core/upgrades';

describe('rollUpgradeChoices', () => {
  it('returns exactly 3 distinct upgrades when 3+ are available', () => {
    const run = new RunState(1);
    for (let seed = 1; seed < 50; seed++) {
      const choices = rollUpgradeChoices(new Rng(seed), UPGRADES, (id) => run.upgradeLevel(id), run.weapons, 3);
      expect(choices).toHaveLength(3);
      expect(new Set(choices.map((c) => c.id)).size).toBe(3);
    }
  });

  it('never offers an upgrade at max level', () => {
    const run = new RunState(1);
    const maxed = ['contrast', 'vector', 'plate'];
    for (const id of maxed) {
      const def = UPGRADE_BY_ID.get(id)!;
      for (let i = 0; i < def.maxLevel; i++) run.applyUpgrade(def);
    }
    for (let seed = 1; seed < 200; seed++) {
      const choices = rollUpgradeChoices(new Rng(seed), UPGRADES, (id) => run.upgradeLevel(id), run.weapons, 3);
      expect(choices).toHaveLength(3);
      for (const id of maxed) expect(choices.map((c) => c.id)).not.toContain(id);
    }
  });

  it('presto offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('presto')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('presto')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('pulse offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('pulse')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
      { stat: 'critChance', op: 'add', value: 0.05 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('pulse')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('sweep offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('sweep')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'moveSpeed', op: 'mul', value: 1.10 },
      { stat: 'pickupRadius', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('sweep')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('trill offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('trill')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'fireRateMul', op: 'mul', value: 1.08 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('trill')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('tessitura offers 5 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('tessitura')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'maxHp', op: 'add', value: 10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('tessitura')).toBe(5);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('glissando offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('glissando')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'xpMul', op: 'mul', value: 1.15 },
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('glissando')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('adagio offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('adagio')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'maxHp', op: 'add', value: 6 },
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('adagio')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('pizzicato offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('pizzicato')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraPierce', op: 'add', value: 1 },
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('pizzicato')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('pedal offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('pedal')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'armor', op: 'add', value: 1 },
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('pedal')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('impasto offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('impasto')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'damageMul', op: 'mul', value: 1.15 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('impasto')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('arpeggio offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('arpeggio')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'critChance', op: 'add', value: 0.05 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('arpeggio')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('vivace offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('vivace')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('vivace')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('legato offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('legato')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'fireRateMul', op: 'mul', value: 1.12 },
      { stat: 'moveSpeed', op: 'mul', value: 1.12 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('legato')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('tenuto offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('tenuto')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'armor', op: 'add', value: 1 },
      { stat: 'damageMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('tenuto')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('sotto voce offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('sotto-voce')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'xpMul', op: 'mul', value: 1.15 },
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('sotto-voce')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('vellum offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('vellum')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'armor', op: 'add', value: 1 },
      { stat: 'xpMul', op: 'mul', value: 1.15 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('vellum')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('stretto offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('stretto')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'armor', op: 'add', value: 1 },
      { stat: 'fireRateMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('stretto')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('marcato offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('marcato')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'critChance', op: 'add', value: 0.05 },
      { stat: 'projectileSpeedMul', op: 'mul', value: 1.10 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('marcato')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('andante offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('andante')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
      { stat: 'moveSpeed', op: 'mul', value: 1.08 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('andante')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('gravure offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('gravure')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraPierce', op: 'add', value: 1 },
      { stat: 'damageMul', op: 'mul', value: 1.15 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('gravure')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('incision offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('incision')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraPierce', op: 'add', value: 1 },
      { stat: 'critChance', op: 'add', value: 0.05 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('incision')).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });

  it('riff offers 2 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('riff')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'extraProjectiles', op: 'add', value: 1 },
      { stat: 'extraPierce', op: 'add', value: 1 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('riff')).toBe(2);
    expect(run.stats.extraProjectiles).toBe(2);
    expect(run.stats.extraPierce).toBe(2);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
    const plain = new RunState(1);
    expect(plain.stats.extraProjectiles).toBe(0);
    expect(plain.stats.extraPierce).toBe(0);
  });

  it('rubato offers 3 levels, then stops', () => {
    const run = new RunState(1);
    const def = UPGRADE_BY_ID.get('rubato')!;
    expect(def).toBeDefined();
    expect(def.mods).toEqual([
      { stat: 'fireRateMul', op: 'mul', value: 1.08 },
      { stat: 'regenPerSec', op: 'add', value: 0.5 },
    ]);
    for (let i = 0; i < def.maxLevel; i++) {
      expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(true);
      run.applyUpgrade(def);
    }
    expect(run.upgradeLevel('rubato')).toBe(3);
    expect(isUpgradeAvailable(def, (id) => run.upgradeLevel(id), run.weapons)).toBe(false);
  });
});
