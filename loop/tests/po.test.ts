import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import type { FleetConfig } from '../config.ts';
import { TASKS_DIR } from '../paths.ts';
import { idleMachines, idleReason, planningReason, poolNeeds } from '../po.ts';
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

describe('idle machines', () => {
  const designed = (file: string): string => `## Goal\nA thing.\n\n## Design (architect, big)\n\n- edit \`${file}\`\n`;
  const building = pool('T0001', { status: 'in-progress', assignee: 'big', body: designed('src/a.ts') });

  it('a running machine with no claim and nothing it can take is idle, file lock included', () => {
    const locked = pool('T0002', { size: 'S', created: '2026-01-01T00:00:00Z', body: designed('src/a.ts') });
    assert.deepEqual(idleMachines(fleet, listing([building, locked])), ['weak'], 'big holds a claim; off is paused');
    assert.match(idleReason(fleet, listing([building, locked])) ?? '', /weak has nothing to take/);
    const free = pool('T0003', { size: 'S', created: '2026-01-01T00:00:00Z', body: designed('src/b.ts') });
    assert.deepEqual(idleMachines(fleet, listing([building, locked, free])), []);
  });

  it('plans for idle machines only while the pool is under three queued tasks per wanted one', () => {
    const locked = Array.from({ length: 12 }, (_, i) => pool(`T01${String(i).padStart(2, '0')}`, { size: 'S', created: '2026-01-01T00:00:00Z', body: designed('src/a.ts') }));
    assert.equal(idleReason(fleet, listing([building, ...locked.slice(0, 11)])) !== null, true);
    assert.equal(idleReason(fleet, listing([building, ...locked])), null, 'want 4 x 3 = 12 queued: enough');
  });
});

describe('planningReason', () => {
  const ready = (n: number, size: 'S' | 'M' = 'M'): Task[] => Array.from({ length: n }, (_, i) => pool(`T0${size === 'S' ? 8 : 9}${String(i).padStart(2, '0')}`, { size, created: '2026-01-01T00:00:00Z' }));
  const full = [...ready(2, 'S'), ...ready(2)]; // want 4: two each for big and weak

  it('a built task is no reason to plan; a failed one is', () => {
    assert.equal(planningReason(fleet, listing([...full, pool('T0100', { status: 'done' })])), null);
    assert.match(planningReason(fleet, listing([...full, pool('T0101', { status: 'failed' })])) ?? '', /1 failed task\(s\) to decide on/);
  });

  it('a low pool or a broken task file still is', () => {
    assert.match(planningReason(fleet, listing(full.slice(0, 3))) ?? '', /the pool is low/);
    assert.equal(planningReason(fleet, { tasks: full, invalid: new Map([['tasks/x.md', 'bad']]) }), 'invalid task files');
  });
});
