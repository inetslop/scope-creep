import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { parseTask, type Task } from '../loop/tasks.ts';
import { lastFinished, machineView, poolCounts, projectTasks, sortMachines } from './home-data.ts';

const text = (id: string, front: string, body = '## Goal\nA thing.\n'): string => `---\nid: ${id}\ntitle: The ${id} thing\nsize: S\n${front}\n---\n\n${body}`;
const task = (id: string, front: string, body?: string): Task => parseTask(text(id, front, body), path.join('tasks', `${id}-x.md`));
const DONE_BODY = '## Design (architect, desktop)\n\nPlan.\n\n## Result (attempt 1, yoga)\n\nBuilt it.\n- Time: 5 min\n';

describe('machineView', () => {
  const tasks = [
    task('T0001', 'status: in-progress\nassignee: yoga\nclaimed_at: 2026-10-28T10:00:00Z'),
    task('T0002', 'status: designing\ndesigner: desktop\nclaimed_at: 2026-10-28T11:00:00Z'),
    task('T0003', 'status: done\nassignee: yoga\nfinished_at: 2026-10-28T09:00:00Z', DONE_BODY),
    task('T0004', 'status: todo', '## Design (architect, desktop)\n\nPlan.\n'),
  ];

  it('says what each machine is doing, since when, and what it built and designed', () => {
    const yoga = machineView('yoga', { label: 'Yoga', model: 'Q2', roles: ['dev', 'architect'] }, tasks, { at: '2026-10-28T10:05:00Z', subject: 'T0001: claimed by yoga' });
    assert.equal(yoga.state, 'building');
    assert.deepEqual({ id: yoga.task?.id, since: yoga.task?.since }, { id: 'T0001', since: '2026-10-28T10:00:00Z' });
    assert.equal(yoga.built, 1);
    assert.equal(yoga.lastActive, '2026-10-28T10:05:00Z');
    const desktop = machineView('desktop', { label: 'Desktop', model: 'Q4' }, tasks);
    assert.equal(desktop.state, 'designing');
    assert.equal(desktop.task?.id, 'T0002');
    assert.equal(desktop.designed, 2);
    assert.deepEqual(desktop.roles, ['dev']);
    assert.equal(machineView('asus', { label: 'Asus', model: 'Q8' }, tasks).state, 'idle');
  });

  it('with no claim, a last commit that starts a PO cycle means planning; its end commit means idle again', () => {
    const started = { at: '2026-10-28T11:30:00Z', subject: 'po: cycle 40 started (3 finished task(s) to review)' };
    const v = machineView('desktop', { label: 'Desktop', model: 'Q4' }, [], started);
    assert.equal(v.state, 'planning');
    assert.equal(v.planningSince, '2026-10-28T11:30:00Z');
    assert.equal(machineView('desktop', { label: 'Desktop', model: 'Q4' }, [], { at: started.at, subject: 'po: cycle 40: 0 new task(s), 3 archived' }).state, 'idle');
    assert.equal(machineView('desktop', { label: 'Desktop', model: 'Q4', paused: true }, [], started).state, 'paused');
    assert.equal(machineView('yoga', { label: 'Yoga', model: 'Q2' }, tasks, started).state, 'building', 'a claim wins');
  });

  it('a paused machine shows as paused, without the claim it may still hold', () => {
    const v = machineView('yoga', { label: 'Yoga', model: 'Q2', paused: true }, tasks);
    assert.equal(v.state, 'paused');
    assert.equal(v.task, undefined);
  });

  it('sorts busy machines first (building, designing, planning), then idle, then paused, keeping config order within', () => {
    const v = (id: string, state: 'building' | 'designing' | 'planning' | 'idle' | 'paused') => ({ ...machineView(id, { label: id, model: '' }, []), state });
    const order = sortMachines([v('a', 'paused'), v('b', 'idle'), v('c', 'designing'), v('d', 'building'), v('e', 'idle'), v('f', 'planning')]).map((m) => m.id);
    assert.deepEqual(order, ['d', 'c', 'f', 'b', 'e', 'a']);
  });
});

describe('poolCounts and lastFinished', () => {
  it('counts the pool by status and finds the newest finished task', () => {
    const tasks = [
      task('T0001', 'status: in-progress'),
      task('T0002', 'status: todo'),
      task('T0003', 'status: todo'),
      task('T0004', 'status: design'),
      task('T0005', 'status: done\nfinished_at: 2026-10-28T09:00:00Z'),
      task('T0006', 'status: done\nfinished_at: 2026-10-28T12:00:00Z'),
      task('T0007', 'status: failed'),
    ];
    assert.deepEqual(poolCounts(tasks), { building: 1, ready: 2, designing: 0, design: 1, done: 2, failed: 1 });
    assert.equal(lastFinished(tasks), '2026-10-28T12:00:00Z');
    assert.equal(lastFinished([]), undefined);
  });
});

describe('projectTasks', () => {
  it('reads the pool, older machine folders and the archive; skips salvage and files that are not tasks', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'home-'));
    const put = (rel: string, body: string): void => {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), body);
    };
    put('tasks/T0001-a.md', text('T0001', 'status: todo'));
    put('tasks/yoga/T0002-b.md', text('T0002', 'status: in-progress\nassignee: yoga'));
    put('tasks/archive/T0003-c.md', text('T0003', 'status: done'));
    put('tasks/salvage/T0004.md', text('T0004', 'status: todo'));
    put('tasks/notes.md', 'not a task');
    assert.deepEqual(projectTasks(dir).map((t) => t.id).sort(), ['T0001', 'T0002', 'T0003']);
    assert.deepEqual(projectTasks(path.join(dir, 'nothing-here')), []);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
