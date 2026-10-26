import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { parseTask, pickNextTask, serializeTask, slugify, TaskFormatError, type Task } from '../tasks.ts';

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

describe('pickNextTask', () => {
  const mk = (id: string, extra: Partial<Task> = {}): Task => ({ ...parseTask(`---\nid: ${id}\ntitle: ${id}\n---\n`, file), status: 'todo', ...extra });

  it('never picks tasks still waiting for the architect', () => {
    const designing = mk('T0001', { status: 'design' });
    assert.equal(pickNextTask([designing], [designing]), undefined);
  });

  it('picks the best priority, then the lowest id, skipping blocked tasks', () => {
    const done = mk('T0001', { status: 'done' });
    const blocked = mk('T0002', { priority: 1, dependsOn: ['T0009'] });
    const a = mk('T0004', { priority: 2 });
    const b = mk('T0003', { priority: 2 });
    const urgent = mk('T0005', { priority: 1, dependsOn: ['T0001'] });
    const mine = [blocked, a, b, urgent];
    assert.equal(pickNextTask(mine, [done, ...mine])?.id, 'T0005');
    assert.equal(pickNextTask([blocked, a, b], [done, blocked, a, b])?.id, 'T0003');
    assert.equal(pickNextTask([blocked], [blocked]), undefined);
  });
});

describe('slugify', () => {
  it('makes short file-safe slugs', () => {
    assert.equal(slugify('Add the Rust Hound enemy!'), 'add-the-rust-hound-enemy');
    assert.equal(slugify('***'), 'task');
  });
});
