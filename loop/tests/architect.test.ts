import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { designCandidates, isStaleClaim, parseArchitectResult, sizeFilter } from '../architect.ts';
import type { FleetConfig, MachineConfig } from '../config.ts';
import { parseTask, type Task } from '../tasks.ts';

const mk = (id: string, machine: string, extra: Partial<Task> = {}): Task => ({
  ...parseTask(`---\nid: ${id}\ntitle: ${id}\n---\n`, path.join('tasks', machine, `${id}-x.md`)),
  ...extra,
});
const NOW = Date.parse('2026-10-26T12:00:00Z');
const minutesAgo = (m: number): string => new Date(NOW - m * 60_000).toISOString().slice(0, 19) + 'Z';

describe('design claims', () => {
  it('skips tasks another architect is designing, unless the claim is stale', () => {
    const fresh = mk('T0001', 'yoga', { status: 'designing', claimedAt: minutesAgo(10) });
    const stale = mk('T0002', 'yoga', { status: 'designing', claimedAt: minutesAgo(200) });
    const open = mk('T0003', 'yoga');
    const ids = designCandidates([fresh, stale, open], 'asus', { preferOwn: false, staleMinutes: 150, nowMs: NOW }).map((t) => t.id);
    assert.deepEqual(ids, ['T0002', 'T0003']);
    assert.equal(isStaleClaim(fresh, 150, NOW), false);
    assert.equal(isStaleClaim(stale, 150, NOW), true);
  });

  it('an idle architect designs its own tasks first, then by priority', () => {
    const tasks = [mk('T0001', 'yoga', { priority: 1 }), mk('T0004', 'desktop', { priority: 3 }), mk('T0002', 'asus', { priority: 1 })];
    assert.deepEqual(
      designCandidates(tasks, 'desktop', { preferOwn: true, staleMinutes: 150 }).map((t) => t.id),
      ['T0004', 'T0001', 'T0002'],
    );
    assert.deepEqual(
      designCandidates(tasks, 'desktop', { preferOwn: false, staleMinutes: 150 }).map((t) => t.id),
      ['T0001', 'T0002', 'T0004'],
    );
  });

  it('never offers tasks that are already designed or in progress', () => {
    const tasks = [mk('T0001', 'yoga', { status: 'todo' }), mk('T0002', 'yoga', { status: 'in-progress' })];
    assert.equal(designCandidates(tasks, 'asus', { preferOwn: false, staleMinutes: 150 }).length, 0);
  });
});

const design = `DESIGN:
## Files
- create \`src/content/enemies/hex.ts\` - the enemy definition
- edit \`src/content/enemies/index.ts\` - register it
## Steps
1. Copy wedge.ts.
DEPENDS_ON: T0003, t0004
STATUS: READY`;

describe('parseArchitectResult', () => {
  it('extracts the design and dependencies from a READY answer', () => {
    const r = parseArchitectResult(`I read the code.\n\n${design}`);
    assert.equal(r.kind, 'ready');
    assert.match(r.design, /^## Files/);
    assert.doesNotMatch(r.design, /DEPENDS_ON|STATUS/);
    assert.deepEqual(r.dependsOn, ['T0003', 'T0004']);
  });

  it('accepts "none" as no dependencies', () => {
    const r = parseArchitectResult(design.replace('T0003, t0004', 'none'));
    assert.deepEqual(r.dependsOn, []);
  });

  it('reports rejections with their reason', () => {
    const r = parseArchitectResult('Looked around.\nSTATUS: REJECT: hexagon enemies already exist');
    assert.equal(r.kind, 'reject');
    assert.equal(r.reason, 'hexagon enemies already exist');
  });

  it('flags answers without a READY status or without a real design', () => {
    assert.equal(parseArchitectResult(design.replace('STATUS: READY', '')).kind, 'invalid');
    assert.equal(parseArchitectResult('DESIGN:\nok\nSTATUS: READY').kind, 'invalid');
  });
});

describe('who designs what size', () => {
  const machine = (extra: Partial<MachineConfig>): MachineConfig => ({ label: '', model: '', roles: ['dev', 'architect'], tier: '', maxTaskSize: 'L', targetQueue: 2, notes: '', ...extra });
  const fleet = (machines: Record<string, MachineConfig>): FleetConfig => ({ machines, loop: { designGraceMinutes: 20 } }) as unknown as FleetConfig;
  const small = mk('T0001', 'yoga', { size: 'S', created: minutesAgo(5) });
  const smallOld = mk('T0002', 'desktop-4070', { size: 'S', created: minutesAgo(25) });
  const medium = mk('T0003', 'yoga', { size: 'M', created: minutesAgo(1) });
  const ids = (f: (t: Task) => boolean): string[] => [small, smallOld, medium].filter(f).map((t) => t.id);

  it('a small-task architect designs only up to its size', () => {
    const f = fleet({ desktop: machine({}), yoga: machine({ maxDesignSize: 'S' }) });
    assert.deepEqual(ids(sizeFilter(f, 'yoga', NOW)), ['T0001', 'T0002']);
  });

  it('a bigger architect leaves small tasks to it until they have waited the grace period', () => {
    const f = fleet({ desktop: machine({}), yoga: machine({ maxDesignSize: 'S' }) });
    assert.deepEqual(ids(sizeFilter(f, 'desktop', NOW)), ['T0002', 'T0003']);
  });

  it('designs everything when the small architect is paused or absent', () => {
    assert.deepEqual(ids(sizeFilter(fleet({ desktop: machine({}), yoga: machine({ maxDesignSize: 'S', paused: true }) }), 'desktop', NOW)), ['T0001', 'T0002', 'T0003']);
    assert.deepEqual(ids(sizeFilter(fleet({ desktop: machine({}), yoga: machine({ roles: ['dev'] }) }), 'desktop', NOW)), ['T0001', 'T0002', 'T0003']);
  });

  it('plugs into the candidate list', () => {
    const f = fleet({ desktop: machine({}), yoga: machine({ maxDesignSize: 'S' }) });
    const picked = designCandidates([small, smallOld, medium], 'yoga', { preferOwn: true, staleMinutes: 150, nowMs: NOW, mayDesign: sizeFilter(f, 'yoga', NOW) });
    assert.deepEqual(picked.map((t) => t.id), ['T0001', 'T0002']);
  });
});
