import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { autoResolvable, autoResolveAdditions } from '../merge.ts';

const hunk = (ours: string[], base: string[], theirs: string[]): string[] => [
  '<<<<<<< HEAD',
  ...ours,
  '||||||| parent of abc1234 (T0001: Mine)',
  ...base,
  '=======',
  ...theirs,
  '>>>>>>> abc1234 (T0001: Mine)',
];

describe('autoResolveAdditions', () => {
  it('keeps both sides when both only added lines, main first', () => {
    const text = ['a();', ...hunk(['b();'], [], ['c();']), 'd();'].join('\n');
    assert.deepEqual(autoResolveAdditions(text), { text: 'a();\nb();\nc();\nd();', resolved: 1, remaining: 0 });
  });

  it('leaves hunks that changed existing lines for the agent, and resolves the rest', () => {
    const changed = hunk(['x = 2;'], ['x = 1;'], ['x = 3;']);
    const text = [...changed, 'mid();', ...hunk(['b();'], [], ['c();'])].join('\n');
    const r = autoResolveAdditions(text);
    assert.equal(r.resolved, 1);
    assert.equal(r.remaining, 1);
    assert.equal(r.text, [...changed, 'mid();', 'b();', 'c();'].join('\n'));
  });

  it('writes an identical addition once and drops a repeated import', () => {
    assert.equal(autoResolveAdditions(hunk(['same();'], [], ['same();']).join('\n')).text, 'same();');
    const imports = hunk(["import { a } from './a';", "import { b } from './b';"], [], ["import { a } from './a';", "import { c } from './c';"]);
    assert.equal(autoResolveAdditions(imports.join('\n')).text, ["import { a } from './a';", "import { b } from './b';", "import { c } from './c';"].join('\n'));
  });

  it('needs the base section (plain conflict style) and keeps CRLF files CRLF', () => {
    const plain = ['<<<<<<< HEAD', 'b();', '=======', 'c();', '>>>>>>> abc1234'].join('\n');
    assert.deepEqual(autoResolveAdditions(plain), { text: plain, resolved: 0, remaining: 1 });
    assert.equal(autoResolveAdditions(hunk(['b();'], [], ['c();']).join('\r\n')).text, 'b();\r\nc();');
  });

  it('only touches code and docs', () => {
    assert.equal(autoResolvable('game/src/scenes/GameScene.ts'), true);
    assert.equal(autoResolvable('game/docs/ARCHITECTURE.md'), true);
    assert.equal(autoResolvable('game/package.json'), false);
  });

  it('resolves what a real rebase produces when two tasks append to the same block', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-'));
    const git = (...args: string[]): string =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'init.defaultBranch=main', '-c', 'merge.conflictStyle=zdiff3', ...args], {
        cwd: dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    const file = path.join(dir, 'Scene.ts');
    const scene = (calls: string[]): string => ['class Scene {', '  update(dt: number): void {', '    this.a.update(dt);', ...calls, '  }', '}', ''].join('\n');
    git('init', '-q');
    fs.writeFileSync(file, scene([]));
    git('add', '.');
    git('commit', '-qm', 'base');
    git('checkout', '-qb', 'task');
    fs.writeFileSync(file, scene(['    this.mine.update(dt);']));
    git('commit', '-qam', 'T0002: mine');
    git('checkout', '-q', 'main');
    fs.writeFileSync(file, scene(['    this.landed.update(dt);']));
    git('commit', '-qam', 'T0001: landed');
    git('checkout', '-q', 'task');
    assert.throws(() => git('rebase', 'main'));
    const r = autoResolveAdditions(fs.readFileSync(file, 'utf8'));
    assert.equal(r.remaining, 0);
    assert.equal(r.text, scene(['    this.landed.update(dt);', '    this.mine.update(dt);']));
    git('rebase', '--abort');
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
