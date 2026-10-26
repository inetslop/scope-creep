import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { parseTask, type Task } from '../loop/tasks.ts';
import { collectFeatures, collectHandChanges, designMinutes, formatMinutes, itemIds, machineStats, parseGitLog, parseResult, type Commit } from './log-data.ts';

const task = (id: string, front: string, body: string): Task =>
  parseTask(`---\nid: ${id}\ntitle: Add the ${id} thing\nsize: S\n${front}\n---\n\n${body}`, path.join('tasks', 'archive', `${id}-x.md`));

const RESULT = `## Goal
Make a thing.

## Design (architect, desktop)

Use the existing pattern.

## Attempt 1 failed (asus)

Checks failed.

## Result (attempt 2, yoga)

Added the thing as a data file. It also does more.
- Self-review: APPROVE
- Time: 7.3 min
\`\`\`
 game/src/x.ts | 2 +-
\`\`\`
`;

const commit = (sha: string, author: string, date: string, subject: string, body = ''): Commit => ({ sha, author, date, subject, body });

describe('build log data', () => {
  it('reads the shipping attempt: machine, first sentence of the summary, measured time', () => {
    assert.deepEqual(parseResult(RESULT), { machine: 'yoga', summary: 'Added the thing as a data file.', buildMin: 7.3 });
    assert.deepEqual(parseResult('## Goal\nx'), { summary: '' });
  });

  it('times the design from the last claim before it was ready', () => {
    const commits = [
      commit('a', 'agent-desktop', '2026-10-26T10:00:00Z', 'T0001: design claimed by asus'),
      commit('b', 'agent-desktop', '2026-10-26T11:00:00Z', 'T0001: design claimed by desktop'),
      commit('c', 'agent-desktop', '2026-10-26T11:04:00Z', 'T0001: design ready'),
      commit('d', 'agent-desktop', '2026-10-26T11:30:00Z', 'T0010: design ready'),
    ];
    assert.equal(designMinutes('T0001', commits), 4);
    assert.equal(designMinutes('T0002', commits), undefined);
    assert.equal(designMinutes('T0010', commits), undefined);
  });

  it('turns done tasks into features with their code commit, newest first, skipping unfinished ones', () => {
    const tasks = [
      task('T0001', 'status: done\nattempts: 2\ncreated: 2026-10-26T10:00:00Z\nfinished_at: 2026-10-26T11:30:00Z', RESULT),
      task('T0002', 'status: done\nattempts: 1\nfinished_at: 2026-10-26T12:00:00Z', '## Result (attempt 1, desktop)\n\nShort.\n- Time: 3 min'),
      task('T0003', 'status: todo', '## Goal\nlater'),
    ];
    const game = [
      commit('c1', 'agent-yoga', '2026-10-26T11:29:00Z', 'T0001: Add the T0001 thing'),
      commit('h1', 'Mattias S', '2026-10-26T13:00:00Z', 'T0002: looks like a task but is by hand'),
    ];
    const features = collectFeatures(tasks, [], game);
    assert.deepEqual(
      features.map((f) => [f.id, f.builtBy, f.designedBy, f.attempts, f.leadMin, f.commit]),
      [
        ['T0002', 'desktop', undefined, 1, undefined, undefined],
        ['T0001', 'yoga', 'desktop', 2, 90, 'c1'],
      ],
    );
    assert.deepEqual(
      machineStats(features, ['asus', 'desktop', 'yoga']).map((s) => [s.id, s.features, s.totalBuildMin, s.firstTry]),
      [
        ['asus', 0, 0, 0],
        ['desktop', 1, 3, 1],
        ['yoga', 1, 7.3, 0],
      ],
    );
  });

  it('lists game commits made outside the loop with their co-authors', () => {
    const log = parseGitLog(
      'aaa\x1fMattias S\x1f2026-10-26T20:00:00+01:00\x1fFix the shake\x1fBody line\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\x1e\n' +
        'bbb\x1fagent-yoga\x1f2026-10-26T21:00:00+01:00\x1fT0017: Add the Boulder enemy\x1f\x1e\n',
    );
    const hand = collectHandChanges(log);
    assert.deepEqual(hand, [{ sha: 'aaa', author: 'Mattias S', coAuthors: ['Claude Opus 5.5'], date: '2026-10-26T20:00:00+01:00', subject: 'Fix the shake' }]);
    assert.deepEqual(itemIds([], hand), ['hand:aaa']);
  });

  it('formats durations', () => {
    assert.deepEqual(
      [undefined, 0.4, 7.3, 59.6, 119.7, 125, 60 * 50].map(formatMinutes),
      ['—', '<1 min', '7 min', '1 h 00 min', '2 h 00 min', '2 h 05 min', '2 d 2 h'],
    );
  });
});
