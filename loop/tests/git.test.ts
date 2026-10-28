import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { Git, isTransientGitError } from '../git.ts';

describe('git network errors', () => {
  it('retries DNS and connection failures, never rejections or conflicts', () => {
    for (const e of [
      "fatal: unable to access 'https://github.com/inetslop/scope-creep.git/': Could not resolve host: github.com",
      "fatal: unable to access 'https://github.com/x/y.git/': Failed to connect to github.com port 443 after 21 ms: Couldn't connect to server",
      "fatal: unable to access 'https://github.com/x/y.git/': Recv failure: Connection reset by peer",
      'error: RPC failed; curl 92 HTTP/2 stream 5 was not closed cleanly: CANCEL (err 8)\nfatal: the remote end hung up unexpectedly',
    ]) {
      assert.equal(isTransientGitError(e), true, e);
    }
    for (const e of [
      ' ! [rejected]        HEAD -> main (fetch first)\nerror: failed to push some refs to \'https://github.com/x/y.git\'',
      "remote: Permission to x/y.git denied to someone.\nfatal: unable to access 'https://github.com/x/y.git/': The requested URL returned error: 403",
      'CONFLICT (content): Merge conflict in game/src/main.ts',
    ]) {
      assert.equal(isTransientGitError(e), false, e);
    }
  });
});

describe('continueRebase', () => {
  it('stops while an edit outside the conflicted files is unstaged, and says why; staging the folder lets it go on', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rebase-'));
    const sh = (...args: string[]): string =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'init.defaultBranch=main', ...args], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const write = (f: string, text: string): void => {
      fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
      fs.writeFileSync(path.join(dir, f), text);
    };
    sh('init', '-q');
    write('game/a.ts', 'a\nb\nc\n');
    write('game/b.ts', 'one\n');
    sh('add', '.');
    sh('commit', '-qm', 'base');
    sh('checkout', '-qb', 'task');
    write('game/a.ts', 'a\nmine\nc\n');
    sh('commit', '-qam', 'mine');
    sh('checkout', '-q', 'main');
    write('game/a.ts', 'a\ntheirs\nc\n');
    sh('commit', '-qam', 'theirs');
    sh('checkout', '-q', 'task');
    assert.throws(() => sh('rebase', 'main'));

    // The conflict agent resolves a.ts and, to make the checks pass, also changes b.ts.
    write('game/a.ts', 'a\ntheirs\nmine\nc\n');
    write('game/b.ts', 'two\n');
    const git = new Git(dir, 't');
    sh('add', '--', 'game/a.ts');
    const stuck = await git.continueRebase();
    assert.equal(stuck.status, 'conflict');
    assert.match(stuck.output, /git add/);
    assert.equal(git.isRebasing(), true);

    sh('add', '-A', '--', 'game');
    assert.equal((await git.continueRebase()).status, 'ok');
    assert.equal(git.isRebasing(), false);
    assert.equal(fs.readFileSync(path.join(dir, 'game/b.ts'), 'utf8'), 'two\n');
    assert.equal(sh('status', '--porcelain'), '');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('commitEmpty', () => {
  it('adds a marker commit that changes no file', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'marker-'));
    const sh = (...args: string[]): string => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'init.defaultBranch=main', ...args], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    sh('init', '-q');
    fs.writeFileSync(path.join(dir, 'a.txt'), 'a');
    sh('add', '.');
    sh('commit', '-qm', 'base');
    await new Git(dir, 'agent-desktop').commitEmpty('po: cycle 40 started (scheduled review)');
    assert.equal(sh('log', '-1', '--format=%an|%s').trim(), 'agent-desktop|po: cycle 40 started (scheduled review)');
    assert.equal(sh('diff', '--stat', 'HEAD~1', 'HEAD').trim(), '');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
