import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import type { FleetConfig } from '../config.ts';
import { TASKS_DIR } from '../paths.ts';
import { designedFiles, isPoolTask, parseTask, pickTaskFor, serializeTask, slugify, TaskFormatError, unblockedTaskIds, type Task } from '../tasks.ts';

const file = path.join('tasks', 'yoga', 'T0007-thing.md');

const sample = `---
id: T0007
title: "Add: the thing"
assignee: yoga
size: s
priority: 1
status: todo
depends_on: [T0001, t0002]
custom: keep me
---

## Goal
Do it.
`;

describe('parseTask', () => {
  it('parses frontmatter and body', () => {
    const t = parseTask(sample, file);
    assert.equal(t.id, 'T0007');
    assert.equal(t.title, 'Add: the thing');
    assert.equal(t.size, 'S');
    assert.equal(t.priority, 1);
    assert.deepEqual(t.dependsOn, ['T0001', 'T0002']);
    assert.equal(t.attempts, 0);
    assert.equal(t.extra.custom, 'keep me');
    assert.match(t.body, /^## Goal/);
  });

  it('round-trips through serializeTask', () => {
    const t = parseTask(sample, file);
    const again = parseTask(serializeTask(t), file);
    assert.deepEqual({ ...again, file: '' }, { ...t, file: '' });
  });

  it('falls back to the file name for the id and the folder for the assignee', () => {
    const t = parseTask('---\ntitle: x\n---\nbody', file);
    assert.equal(t.id, 'T0007');
    assert.equal(t.assignee, 'yoga');
    assert.equal(t.status, 'design', 'new tasks start in design');
  });

  it('handles CRLF and BOM', () => {
    const t = parseTask('﻿' + sample.replace(/\n/g, '\r\n'), file);
    assert.equal(t.title, 'Add: the thing');
  });

  it('rejects bad files', () => {
    assert.throws(() => parseTask('no frontmatter', file), TaskFormatError);
    assert.throws(() => parseTask('---\nid: T0001\n---\n', file), /title/);
    assert.throws(() => parseTask('---\nid: T0001\ntitle: x\nsize: XL\n---\n', file), /size/);
    assert.throws(() => parseTask('---\nid: T0001\ntitle: x\nstatus: maybe\n---\n', file), /status/);
  });
});

/** A small fleet: a big slow machine, a medium one, a weak one that takes only S, one paused. */
const fleet = {
  machines: {
    big: { roles: ['dev'], maxTaskSize: 'L', targetQueue: 2 },
    mid: { roles: ['dev'], maxTaskSize: 'M', targetQueue: 2 },
    weak: { roles: ['dev'], maxTaskSize: 'S', targetQueue: 2 },
    off: { roles: ['dev'], maxTaskSize: 'S', targetQueue: 2, paused: true },
  },
  loop: { claimGraceMinutes: 20 },
} as unknown as FleetConfig;

const pool = (id: string, extra: Partial<Task> = {}): Task => ({
  ...parseTask(`---\nid: ${id}\ntitle: ${id}\n---\n`, path.join(TASKS_DIR, `${id}.md`)),
  status: 'todo',
  size: 'M',
  ...extra,
});

describe('the shared pool', () => {
  it('pool tasks belong to nobody until claimed, and are written without an assignee', () => {
    const t = pool('T0001');
    assert.ok(isPoolTask(t));
    assert.equal(t.assignee, '');
    assert.doesNotMatch(serializeTask(t), /assignee/);
  });

  it('an older task in a machine folder still belongs to that machine', () => {
    const t = parseTask('---\ntitle: x\n---\nbody', path.join(TASKS_DIR, 'yoga', 'T0007-x.md'));
    assert.equal(t.assignee, 'yoga');
    assert.ok(!isPoolTask(t));
  });
});

describe('pickTaskFor', () => {
  const now = Date.parse('2026-10-28T12:00:00Z');
  const fresh = '2026-10-28T11:55:00Z';
  const old = '2026-10-28T11:00:00Z';

  it('never picks tasks still waiting for the architect, claimed ones, or ones too big', () => {
    const tasks = [pool('T0001', { status: 'design' }), pool('T0002', { assignee: 'big' }), pool('T0003', { size: 'L' })];
    assert.equal(pickTaskFor('mid', fleet, tasks, now), undefined);
  });

  it('waits for dependencies, then takes the best priority, the biggest it can, the lowest id', () => {
    const tasks = [
      pool('T0001', { status: 'done' }),
      pool('T0002', { priority: 1, dependsOn: ['T0009'] }),
      pool('T0004', { priority: 2, size: 'L' }),
      pool('T0003', { priority: 2, size: 'L' }),
      pool('T0005', { priority: 2, size: 'M' }),
    ];
    assert.equal(pickTaskFor('big', fleet, tasks, now)?.id, 'T0003');
    assert.equal(pickTaskFor('mid', fleet, tasks, now)?.id, 'T0005');
  });

  it('a task waiting on another task is free once that one is done, whoever built it', () => {
    const tasks = [pool('T0001', { status: 'done', assignee: 'big' }), pool('T0002', { dependsOn: ['T0001'], size: 'S', created: old })];
    assert.equal(pickTaskFor('weak', fleet, tasks, now)?.id, 'T0002');
  });

  it('bigger machines leave small tasks to the smaller ones for a while', () => {
    const small = pool('T0001', { size: 'S', created: fresh });
    assert.equal(pickTaskFor('big', fleet, [small], now), undefined);
    assert.equal(pickTaskFor('weak', fleet, [small], now)?.id, 'T0001');
    assert.equal(pickTaskFor('big', fleet, [{ ...small, created: old }], now)?.id, 'T0001');
  });

  it('a machine builds its own older folder tasks first, and never another machine\'s', () => {
    const own = { ...pool('T0009', { priority: 3 }), file: path.join(TASKS_DIR, 'mid', 'T0009.md'), assignee: 'mid' };
    const others = { ...pool('T0008'), file: path.join(TASKS_DIR, 'big', 'T0008.md'), assignee: 'big' };
    const open = pool('T0001', { priority: 1 });
    assert.equal(pickTaskFor('mid', fleet, [open, own, others], now)?.id, 'T0009');
    assert.equal(pickTaskFor('weak', fleet, [others], now), undefined);
  });
});

describe('unblockedTaskIds', () => {
  const on = (machine: string) => (id: string, extra: Partial<Task> = {}): Task => ({
    ...parseTask(`---\nid: ${id}\ntitle: ${id}\n---\n`, path.join('tasks', machine, `${id}.md`)),
    status: 'todo',
    ...extra,
  });
  const yoga = on('yoga');
  const desktop = on('desktop');
  const archived = on('archive');
  const ids = (tasks: Task[]): string[] => [...unblockedTaskIds(tasks)].sort();

  it('counts tasks whose dependencies are done, also in the archive', () => {
    assert.deepEqual(ids([archived('T0001', { status: 'done' }), yoga('T0002', { dependsOn: ['T0001'] }), yoga('T0003', { status: 'design' })]), ['T0002', 'T0003']);
  });

  it('counts a chain the machine builds by itself', () => {
    const tasks = [yoga('T0001', { status: 'in-progress' }), yoga('T0002', { dependsOn: ['T0001'] }), yoga('T0003', { status: 'design', dependsOn: ['T0002'] })];
    assert.deepEqual(ids(tasks), ['T0001', 'T0002', 'T0003']);
  });

  it("blocks tasks waiting on another machine's open work, and their chain", () => {
    const tasks = [yoga('T0001'), desktop('T0002', { dependsOn: ['T0001'] }), desktop('T0003', { dependsOn: ['T0002'] })];
    assert.deepEqual(ids(tasks), ['T0001']);
  });

  it('blocks tasks waiting on failed, missing or circular dependencies', () => {
    const tasks = [
      archived('T0001', { status: 'failed' }),
      yoga('T0002', { dependsOn: ['T0001'] }),
      yoga('T0003', { dependsOn: ['T0099'] }),
      yoga('T0004', { dependsOn: ['T0005'] }),
      yoga('T0005', { dependsOn: ['T0004'] }),
    ];
    assert.deepEqual(ids(tasks), []);
  });
});

describe('designedFiles', () => {
  it("lists the game files named in the design, once each, ignoring the task's own text", () => {
    const body = [
      'Mention `src/old.ts` before the design.',
      '## Design',
      '## Files',
      '- edit `src/scenes/GameScene.ts` - shake on death',
      '- create `src/systems/Shake.ts`',
      '- edit `src/scenes/GameScene.ts` again, and `tests/core/shake.test.ts`',
    ].join('\n');
    const t = { ...parseTask(`---\nid: T0001\ntitle: x\n---\n${body}\n`, file) };
    assert.deepEqual(designedFiles(t), ['src/scenes/GameScene.ts', 'src/systems/Shake.ts', 'tests/core/shake.test.ts']);
    assert.deepEqual(designedFiles({ ...t, body: 'no design yet' }), []);
  });
});

describe('slugify', () => {
  it('makes short file-safe slugs', () => {
    assert.equal(slugify('Add the Rust Hound enemy!'), 'add-the-rust-hound-enemy');
    assert.equal(slugify('***'), 'task');
  });
});
