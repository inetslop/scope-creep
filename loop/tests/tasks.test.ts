import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import type { FleetConfig } from '../config.ts';
import { PROJECT, TASKS_DIR } from '../paths.ts';
import { designedFiles, doneIds, duplicateIds, isPoolTask, lockedBy, parseTask, pausedClaims, pickTaskFor, serializeTask, slugify, TaskFormatError, tasksById, unblockedTaskIds, type Task } from '../tasks.ts';

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

describe('the file lock', () => {
  const now = Date.parse('2026-10-28T12:00:00Z');
  const old = '2026-10-28T11:00:00Z';
  const designed = (files: string[]): string => `## Goal\nA thing.\n\n## Design (architect, big)\n\n### Files\n${files.map((f) => `- edit \`${f}\``).join('\n')}\n`;
  const building = pool('T0001', { status: 'in-progress', assignee: 'big', body: designed(['src/systems/EnemySystem.ts', 'src/debug/runChecks.ts']) });

  it('no task is claimed while another machine builds a task that edits one of its files', () => {
    const overlapping = pool('T0002', { body: designed(['src/systems/EnemySystem.ts', 'src/ui/x.ts']), created: old });
    const apart = pool('T0003', { body: designed(['src/ui/y.ts']), created: old });
    assert.equal(lockedBy(overlapping, [building, overlapping], 'mid')?.id, 'T0001');
    assert.equal(lockedBy(apart, [building, apart], 'mid'), undefined);
    assert.equal(pickTaskFor('mid', fleet, [building, overlapping, apart], now)?.id, 'T0003');
    assert.equal(pickTaskFor('mid', fleet, [building, overlapping], now), undefined);
  });

  it('one-line registry lists are lock-free, and a machine is never locked out by its own task', () => {
    const registryOnly = pool('T0004', { body: designed(['src/debug/runChecks.ts', 'src/ui/z.ts']), created: old });
    assert.equal(lockedBy(registryOnly, [building, registryOnly], 'mid', ['src/debug/runChecks.ts']), undefined);
    assert.equal(lockedBy(registryOnly, [building, registryOnly], 'mid')?.id, 'T0001');
    assert.equal(lockedBy(pool('T0005', { body: designed(['src/systems/EnemySystem.ts']) }), [building], 'big'), undefined);
    const lockFree = { ...fleet, loop: { ...fleet.loop, lockFree: { [PROJECT]: ['src/debug/runChecks.ts'] } } } as FleetConfig;
    assert.equal(pickTaskFor('mid', lockFree, [building, registryOnly], now)?.id, 'T0004');
  });

  it('lock-free globs: * stays within a folder, ** crosses folders', () => {
    const t = pool('T0006', { body: designed(['src/content/augments/index.ts']) });
    const b = pool('T0007', { status: 'in-progress', assignee: 'big', body: designed(['src/content/augments/index.ts']) });
    assert.equal(lockedBy(t, [b, t], 'mid', ['src/content/*/index.ts']), undefined);
    assert.equal(lockedBy(t, [b, t], 'mid', ['src/*/index.ts'])?.id, 'T0007');
    assert.equal(lockedBy(t, [b, t], 'mid', ['src/**/index.ts']), undefined);
  });
});

describe('blockers first', () => {
  const now = Date.parse('2026-10-28T12:00:00Z');
  const fresh = '2026-10-28T11:55:00Z';
  const old = '2026-10-28T11:00:00Z';
  const built = (id: string, machine: string, minutes: number): Task =>
    pool(id, { status: 'done', body: `## Result (attempt 1, ${machine})\n\nBuilt it.\n- Time: ${minutes} min\n` });
  const history = [built('T0101', 'big', 10), built('T0102', 'mid', 100)];

  it('within a priority, the task the most others wait on comes first', () => {
    const tasks = [pool('T0001', { created: old }), pool('T0002', { created: old }), pool('T0003', { status: 'design', dependsOn: ['T0002'] }), pool('T0004', { status: 'design', dependsOn: ['T0002'] })];
    assert.equal(pickTaskFor('mid', fleet, tasks, now)?.id, 'T0002');
  });

  it('a slow machine leaves a blocker to a free machine twice as fast for the grace, then takes it', () => {
    const blocker = pool('T0010', { created: fresh });
    const waiting = pool('T0011', { status: 'design', dependsOn: ['T0010'] });
    assert.equal(pickTaskFor('mid', fleet, [...history, blocker, waiting], now), undefined, 'big is free and 10x faster');
    assert.equal(pickTaskFor('big', fleet, [...history, blocker, waiting], now)?.id, 'T0010');
    assert.equal(pickTaskFor('mid', fleet, [...history, { ...blocker, created: old }, waiting], now)?.id, 'T0010', 'after the grace');
    const bigBusy = pool('T0012', { status: 'in-progress', assignee: 'big' });
    assert.equal(pickTaskFor('mid', fleet, [...history, blocker, waiting, bigBusy], now)?.id, 'T0010', 'the fast one is busy');
  });

  it('pace compares machines across sizes: a machine slow on big tasks leaves a small blocker to a fast small one', () => {
    const paced = [built('T0101', 'big', 10), built('T0102', 'mid', 100), { ...built('T0103', 'big', 400), size: 'L' as const }, { ...built('T0104', 'mid', 40), size: 'L' as const }, { ...built('T0105', 'weak', 5), size: 'S' as const }, { ...built('T0106', 'mid', 50), size: 'S' as const }];
    const blocker = pool('T0030', { size: 'S', created: fresh });
    const waiting = pool('T0031', { status: 'design', dependsOn: ['T0030'] });
    assert.equal(pickTaskFor('mid', fleet, [...paced, blocker, waiting], now), undefined, 'weak is free and much faster');
    assert.equal(pickTaskFor('weak', fleet, [...paced, blocker, waiting], now)?.id, 'T0030');
  });

  it('a task nobody waits on, or a machine with no build history, is never held back', () => {
    const lone = pool('T0020', { created: fresh });
    assert.equal(pickTaskFor('mid', fleet, [...history, lone], now)?.id, 'T0020');
    const blocker = pool('T0021', { created: fresh });
    const waiting = pool('T0022', { status: 'design', dependsOn: ['T0021'] });
    assert.equal(pickTaskFor('mid', fleet, [built('T0101', 'big', 10), blocker, waiting], now)?.id, 'T0021');
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
      'No rule in `src/core` changes (a folder, not a file).',
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

describe('shared ids', () => {
  const t = (id: string, status: Task['status'], title = id): Task => ({ ...parseTask(`---\nid: ${id}\ntitle: ${title}\n---\n`, `/x/${id}-${title}.md`), status });
  // T0103 was both the archived Rally task (done) and the tech tree (in progress); T0110 waits on the tech tree.
  const all = [t('T0103', 'done', 'rally'), t('T0103', 'in-progress', 'tech'), t('T0099', 'done')];
  it('an id is done only when every task with it is done', () => {
    assert.deepEqual([...doneIds(all)], ['T0099']);
    assert.ok(doneIds([...all.slice(0, 1), { ...all[1]!, status: 'done' }]).has('T0103'));
  });
  it('a lookup by a shared id finds the task that is not done', () => {
    assert.equal(tasksById(all).get('T0103')!.status, 'in-progress');
  });
  it('lists the ids used twice', () => {
    assert.deepEqual([...duplicateIds(all).keys()], ['T0103']);
  });
});

describe('pausedClaims', () => {
  const now = Date.parse('2026-10-29T18:00:00Z');
  const withPause = (pausedAt?: string): FleetConfig =>
    ({ ...fleet, machines: { ...fleet.machines, off: { ...fleet.machines.off, ...(pausedAt ? { pausedAt } : {}) } } }) as FleetConfig;
  const building = (assignee: string): Task => pool(`T00${assignee.length}0`, { status: 'in-progress', assignee });

  it('releases what a machine paused for an hour still builds, not before, and never an active machine\'s', () => {
    const all = [building('off'), building('mid'), pool('T0099', { status: 'todo' })];
    assert.deepEqual(pausedClaims(all, withPause('2026-10-29T16:59:00Z'), now).map((t) => t.assignee), ['off']);
    assert.deepEqual(pausedClaims(all, withPause('2026-10-29T17:30:00Z'), now), [], 'paused half an hour: it may still be finishing');
  });

  it('without pausedAt, counts from the last change to machines.json, and keeps the claim when that is unknown too', () => {
    const all = [building('off')];
    assert.equal(pausedClaims(all, withPause(), now, '2026-10-29T16:00:00Z').length, 1);
    assert.equal(pausedClaims(all, withPause(), now, '2026-10-29T17:45:00Z').length, 0);
    assert.equal(pausedClaims(all, withPause(), now).length, 0);
  });
});
