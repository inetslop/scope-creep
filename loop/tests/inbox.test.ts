import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { numberInbox, parseInboxFile } from '../inbox.ts';
import { TASKS_DIR } from '../paths.ts';
import { parseTask, type Task } from '../tasks.ts';

const existing = (id: string, status = 'done'): Task => parseTask(`---\nid: ${id}\ntitle: ${id}\nstatus: ${status}\n---\nbody\n`, path.join(TASKS_DIR, 'archive', `${id}-x.md`));
const NOW = '2026-10-29T18:00:00Z';

describe('parseInboxFile', () => {
  it('takes the frontmatter it is given, and ignores the fields the runner owns', () => {
    const t = parseInboxFile('---\ntitle: Remove the chip\nsize: s\npriority: 1\nepic: E2\nid: T0001\nstatus: done\nassignee: yoga\n---\n\n## Goal\nGone.\n', 'x.md');
    assert.equal(t.title, 'Remove the chip');
    assert.equal(t.size, 'S');
    assert.equal(t.priority, 1);
    assert.equal(t.extra.epic, 'E2');
    assert.equal(t.status, 'design');
    assert.equal(t.assignee, '');
    assert.match(t.body, /^## Goal\nGone\./);
  });

  it('without a title, uses the first "# " heading (out of the body), else the file name; no frontmatter is fine', () => {
    const t = parseInboxFile('# The exit shows what is left\n\n## Goal\nA chip.\n', 'whatever.md');
    assert.equal(t.title, 'The exit shows what is left');
    assert.doesNotMatch(t.body, /^# The exit/m);
    assert.equal(t.size, 'M');
    assert.equal(t.priority, 2);
    assert.equal(parseInboxFile('## Goal\nNo heading.\n', 'clean-chip_words.md').title, 'clean chip words');
  });

  it('a malformed file throws', () => {
    assert.throws(() => parseInboxFile('---\ntitle: x\nsize: XL\n---\nbody\n', 'x.md'), /size must be S, M or L/);
  });
});

describe('numberInbox', () => {
  it('numbers after the highest id anywhere, in file name order, as design tasks in the pool', () => {
    const all = [existing('T0153'), existing('T0192', 'todo')];
    const r = numberInbox(
      [
        { name: 'b-second.md', text: '# Second\n\nbody\n' },
        { name: 'a-first.md', text: '---\ntitle: First\ndepends_on: [T0153, T0999]\n---\nbody\n' },
      ],
      all,
      NOW,
    );
    assert.deepEqual(r.tasks.map((t) => `${t.id} ${t.title}`), ['T0193 First', 'T0194 Second']);
    for (const t of r.tasks) {
      assert.equal(t.status, 'design');
      assert.equal(t.created, NOW);
      assert.equal(path.dirname(t.file), TASKS_DIR);
    }
    assert.equal(path.basename(r.tasks[0]!.file), 'T0193-first.md');
    assert.deepEqual(r.tasks[0]!.dependsOn, ['T0153']);
    assert.deepEqual(r.dropped, [{ id: 'T0193', deps: ['T0999'] }]);
  });

  it('skips a file it cannot read and keeps numbering the rest', () => {
    const r = numberInbox([{ name: 'a.md', text: '---\ntitle: x\nsize: XL\n---\n' }, { name: 'b.md', text: '# Fine\n' }], [existing('T0010')], NOW);
    assert.deepEqual(r.tasks.map((t) => t.id), ['T0011']);
    assert.equal(r.skipped.length, 1);
    assert.equal(r.skipped[0]!.name, 'a.md');
  });

  it('an empty inbox numbers nothing', () => {
    assert.deepEqual(numberInbox([], [existing('T0001')], NOW).tasks, []);
  });
});
