import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import type { FleetConfig } from '../config.ts';
import { TASKS_DIR } from '../paths.ts';
import { poolNeeds } from '../po.ts';
import { parseTask, type Task, type TaskListing } from '../tasks.ts';

const fleet = {
  machines: {
    big: { roles: ['dev'], maxTaskSize: 'L', targetQueue: 2 },
    weak: { roles: ['dev'], maxTaskSize: 'S', targetQueue: 2 },
    off: { roles: ['dev'], maxTaskSize: 'M', targetQueue: 2, paused: true },
  },
  loop: {},
} as unknown as FleetConfig;

const pool = (id: string, extra: Partial<Task> = {}): Task => ({
  ...parseTask(`---\nid: ${id}\ntitle: ${id}\n---\n`, path.join(TASKS_DIR, `${id}.md`)),
  status: 'todo',
  size: 'M',
  ...extra,
});
const listing = (tasks: Task[]): TaskListing => ({ tasks, invalid: new Map() });

describe('poolNeeds', () => {
  it('wants the running machines\' targets added up, and counts waiting tasks that will get built', () => {
    const needs = poolNeeds(fleet, listing([pool('T0001'), pool('T0002', { status: 'design' }), pool('T0003', { status: 'in-progress', assignee: 'big' }), pool('T0004', { dependsOn: ['T0099'] })]));
    assert.equal(needs.want, 4);
    assert.equal(needs.have, 2, 'in-progress and blocked tasks are not waiting work');
  });

  it('tracks small tasks for the machines that take nothing bigger', () => {
    const needs = poolNeeds(fleet, listing([pool('T0001', { size: 'L' }), pool('T0002', { size: 'S' })]));
    assert.deepEqual(needs.small, [{ size: 'S', machines: ['weak'], want: 2, have: 1 }]);
  });

  it('a task waiting on another counts only once that one is done: it keeps no machine busy', () => {
    assert.equal(poolNeeds(fleet, listing([pool('T0001'), pool('T0002', { dependsOn: ['T0001'] })])).have, 1);
    assert.equal(poolNeeds(fleet, listing([pool('T0001', { status: 'done' }), pool('T0002', { dependsOn: ['T0001'] })])).have, 1);
    assert.equal(poolNeeds(fleet, listing([pool('T0001', { status: 'in-progress', assignee: 'big' }), pool('T0002', { status: 'design', dependsOn: ['T0001'] })])).have, 0);
  });
});
