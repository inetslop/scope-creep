import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deletionProblem, deletionRequests, extractSummary, formatUpstreamLog, previousWorkSection, salvageText } from '../dev.ts';

describe('salvaged work', () => {
  it('keeps upstream commit messages but drops trailers and blank runs', () => {
    const log = '- efb989a Mattias S: Purge padded content\n  Removed Hex and Mote.\n\n\n  Co-Authored-By: Claude <x@y>\n  Claude-Session: https://x\n\n- 1a2b3c4 agent-yoga: T0089: Add the Leggero upgrade\n';
    assert.equal(formatUpstreamLog(log), '- efb989a Mattias S: Purge padded content\n  Removed Hex and Mote.\n\n- 1a2b3c4 agent-yoga: T0089: Add the Leggero upgrade');
    assert.equal(formatUpstreamLog('  \n'), '(none)');
    assert.match(formatUpstreamLog('x'.repeat(7000)), /… \(truncated\)$/);
  });

  it('writes the header and upstream commits as # comments before the diff', () => {
    const diff = 'diff --git a/game/src/a.ts b/game/src/a.ts\n--- a/game/src/a.ts\n+++ b/game/src/a.ts\n@@ -1 +1 @@\n-a\n+b';
    const text = salvageText('T0040 attempt 1 failed', '- efb989a Purge\n\n  Removed Hex.', diff);
    assert.equal(text, `# T0040 attempt 1 failed\n# Commits on main since then that touch the same files:\n# - efb989a Purge\n#\n#   Removed Hex.\n\n${diff}\n`);
  });

  it('hands the saved work to the next attempt in a fence that survives ``` inside it', () => {
    const section = previousWorkSection('# header\n\ndiff --git a/x b/x\n+```ts\n');
    assert.match(section, /^# Earlier work to re-apply\n/);
    assert.match(section, /\n````diff\n# header\n\ndiff --git a\/x b\/x\n\+```ts\n````$/);
  });
});

describe('runner-side deletion', () => {
  it('reads one DELETE line per file from the final message, once each, and keeps them out of the summary', () => {
    const result = 'Removed the chip.\nDELETE: src/systems/ExitCount.ts\nDELETE: `./src/ui/Old.ts`\nDELETE: src/systems/ExitCount.ts\nSUMMARY: Removed the exit count.\nSTATUS: DONE';
    assert.deepEqual(deletionRequests(result), ['src/systems/ExitCount.ts', 'src/ui/Old.ts']);
    assert.equal(extractSummary(result), 'Removed the exit count.');
    assert.deepEqual(deletionRequests('SUMMARY: nothing removed\nSTATUS: DONE'), []);
  });

  it('only deletes files inside the game code folders', () => {
    const game = fs.mkdtempSync(path.join(os.tmpdir(), 'game-'));
    fs.mkdirSync(path.join(game, 'src', 'systems'), { recursive: true });
    fs.writeFileSync(path.join(game, 'src', 'systems', 'Old.ts'), 'x');
    fs.writeFileSync(path.join(game, 'package.json'), '{}');
    assert.equal(deletionProblem(game, 'src/systems/Old.ts'), null);
    assert.equal(deletionProblem(game, 'src/systems/Missing.ts'), 'no such file');
    assert.equal(deletionProblem(game, 'src/systems'), 'not a file');
    assert.match(deletionProblem(game, 'package.json') ?? '', /only files in src\//);
    assert.equal(deletionProblem(game, '../outside.ts'), 'outside the game folder');
    assert.equal(deletionProblem(game, 'src/../../outside.ts'), 'outside the game folder');
    fs.rmSync(game, { recursive: true, force: true });
  });
});
