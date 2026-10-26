import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { devMachineIds, hasArchitect, poMachineId, type FleetConfig, type MachineConfig } from '../config.ts';

const machine = (roles: MachineConfig['roles'], extra: Partial<MachineConfig> = {}): MachineConfig => ({
  label: '',
  model: '',
  roles,
  tier: '',
  maxTaskSize: 'M',
  targetQueue: 2,
  notes: '',
  ...extra,
});
const fleet = (machines: Record<string, MachineConfig>): FleetConfig => ({ machines }) as FleetConfig;

describe('paused machines', () => {
  it('get no planned work and count for no role', () => {
    const f = fleet({
      asus: machine(['po', 'architect', 'dev'], { paused: true }),
      desktop: machine(['dev']),
      yoga: machine(['dev']),
    });
    assert.deepEqual(devMachineIds(f), ['desktop', 'yoga']);
    assert.equal(hasArchitect(f), false);
    assert.equal(poMachineId(f), undefined);
  });

  it('unpaused machines keep all their roles', () => {
    const f = fleet({ desktop: machine(['po', 'architect', 'dev'], { paused: false }), yoga: machine(['dev']) });
    assert.deepEqual(devMachineIds(f), ['desktop', 'yoga']);
    assert.equal(hasArchitect(f), true);
    assert.equal(poMachineId(f), 'desktop');
  });
});
