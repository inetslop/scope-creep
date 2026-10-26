import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { needsRestart } from '../restart.ts';
import { permissionPath } from '../paths.ts';
import { claudeSettings, isWritable } from '../sandbox.ts';

describe('isWritable', () => {
  it('dev agents may only change the game, and not its CLAUDE.md', () => {
    assert.equal(isWritable('dev', 'game/src/main.ts'), true);
    assert.equal(isWritable('dev', 'game/CLAUDE.md'), false);
    assert.equal(isWritable('dev', 'tasks/yoga/T0001-x.md'), false);
    assert.equal(isWritable('dev', 'loop/runner.ts'), false);
    assert.equal(isWritable('dev', 'package.json'), false);
    assert.equal(isWritable('dev', 'gamey/x.ts'), false);
  });

  it('the PO may only change tasks and planning, never the archive or the game', () => {
    assert.equal(isWritable('po', 'tasks/desktop/T0009-x.md'), true);
    assert.equal(isWritable('po', 'planning/ROADMAP.md'), true);
    assert.equal(isWritable('po', 'tasks/archive/T0001-x.md'), false);
    assert.equal(isWritable('po', 'game/src/main.ts'), false);
    assert.equal(isWritable('po', 'agents/machines.json'), false);
  });
});

describe('architect profile', () => {
  it('may change nothing at all', () => {
    for (const p of ['game/src/main.ts', 'tasks/asus/T0001-x.md', 'planning/IDEAS.md', 'loop/runner.ts']) {
      assert.equal(isWritable('architect', p), false, p);
    }
  });

  it('settings deny every edit and hide the queue and the loop', () => {
    const s = claudeSettings('architect', {}) as { permissions: { allow: string[]; deny: string[] } };
    assert.ok(s.permissions.deny.includes('Edit') && s.permissions.deny.includes('Write'));
    assert.ok(!s.permissions.allow.some((r) => r.startsWith('Edit')));
    assert.ok(s.permissions.deny.some((r) => r.startsWith('Read(') && r.includes('/tasks/**')));
    assert.ok(s.permissions.deny.some((r) => r.startsWith('Read(') && r.includes('/loop/**')));
  });
});

describe('permissionPath', () => {
  it('converts Windows paths to the //c/... form', () => {
    if (process.platform !== 'win32') return;
    assert.equal(permissionPath('C:\\Users\\me\\repo\\tasks'), '//c/Users/me/repo/tasks');
  });
});

describe('claudeSettings', () => {
  it('dev settings deny reading tasks and editing the loop', () => {
    const s = claudeSettings('dev', {}) as { permissions: { allow: string[]; deny: string[] } };
    assert.ok(s.permissions.deny.some((r) => r.startsWith('Read(') && r.includes('/tasks/**')));
    assert.ok(s.permissions.deny.some((r) => r.startsWith('Edit(') && r.includes('/loop/**')));
    assert.ok(s.permissions.allow.some((r) => r.startsWith('Edit(') && r.includes('/game/**')));
    assert.ok(!s.permissions.allow.some((r) => r.includes('/tasks/')));
  });

  it('po settings allow editing tasks and planning only', () => {
    const s = claudeSettings('po', {}) as { permissions: { allow: string[]; deny: string[] } };
    const edits = s.permissions.allow.filter((r) => r.startsWith('Edit('));
    assert.equal(edits.length, 2);
    assert.ok(s.permissions.deny.some((r) => r.startsWith('Edit(') && r.includes('/game/**')));
  });

  it('the po cannot read the game code or use a shell', () => {
    const s = claudeSettings('po', {}) as { permissions: { allow: string[]; deny: string[] } };
    assert.ok(s.permissions.deny.some((r) => r.startsWith('Read(') && r.includes('/game/**')));
    assert.ok(s.permissions.deny.includes('Bash'));
    assert.ok(!s.permissions.allow.some((r) => r.startsWith('Bash')));
  });
});

describe('needsRestart', () => {
  it('restarts only for loop code and root dependencies', () => {
    assert.equal(needsRestart(['game/src/main.ts', 'tasks/yoga/T0001.md']), false);
    assert.equal(needsRestart(['loop/dev.ts']), true);
    assert.equal(needsRestart(['package-lock.json']), true);
    assert.equal(needsRestart(['game/package-lock.json']), false);
  });
});
