import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { needsRestart } from '../restart.ts';
import path from 'node:path';
import { ARCHIVE_REL, GAME_REL, ORIGINAL_PROJECT, permissionPath, PLANNING_REL, PROJECT, projectDir, REPO, TASKS_REL } from '../paths.ts';
import { claudeSettings, isWritable, OWNER_DIR } from '../sandbox.ts';

// Paths of the project loop.project points at ("game/" for Scope Creep, "projects/<id>/game/" otherwise).
const G = GAME_REL;
const T = TASKS_REL;

describe('projects', () => {
  it('Scope Creep lives at the repo root, every other game in projects/<id>/', () => {
    assert.equal(projectDir(ORIGINAL_PROJECT), REPO);
    assert.equal(projectDir('tower'), path.join(REPO, 'projects', 'tower'));
    assert.ok(GAME_REL.endsWith('game/') && TASKS_REL.endsWith('tasks/') && PLANNING_REL.endsWith('planning/'));
  });

  it('no agent can read or change the project\'s owner/ folder', () => {
    for (const profile of ['dev', 'po', 'architect'] as const) {
      const s = claudeSettings(profile, {}) as { permissions: { deny: string[] } };
      assert.ok(s.permissions.deny.includes(`Read(${permissionPath(OWNER_DIR)}/**)`), profile);
      assert.equal(isWritable(profile, `${path.relative(REPO, OWNER_DIR).split(path.sep).join('/')}/x.ts`), false, profile);
    }
  });

  it('agents cannot see the other games', () => {
    for (const profile of ['dev', 'po', 'architect'] as const) {
      const s = claudeSettings(profile, {}) as { permissions: { deny: string[] } };
      const hidden = PROJECT === ORIGINAL_PROJECT ? `${permissionPath(path.join(REPO, 'projects'))}/**` : `${permissionPath(path.join(REPO, 'game'))}/**`;
      assert.ok(s.permissions.deny.includes(`Read(${hidden})`), profile);
    }
  });
});

describe('isWritable', () => {
  it('dev agents may only change the game, and not its CLAUDE.md or engine/', () => {
    assert.equal(isWritable('dev', `${G}src/main.ts`), true);
    assert.equal(isWritable('dev', `${G}CLAUDE.md`), false);
    assert.equal(isWritable('dev', `${G}engine/sim/match.ts`), false, 'a game\'s engine/ is the owner\'s');
    assert.equal(isWritable('dev', `${G}src/engineering.ts`), true);
    const s = claudeSettings('dev', {}) as { permissions: { deny: string[] } };
    assert.ok(s.permissions.deny.some((r) => r.startsWith('Edit(') && r.endsWith('/game/engine/**)')));
    assert.equal(isWritable('dev', `${T}yoga/T0001-x.md`), false);
    assert.equal(isWritable('dev', 'loop/runner.ts'), false);
    assert.equal(isWritable('dev', 'package.json'), false);
    assert.equal(isWritable('dev', `${G.slice(0, -1)}y/x.ts`), false);
  });

  it('the PO may only change tasks and planning, never the archive or the game', () => {
    assert.equal(isWritable('po', `${T}desktop/T0009-x.md`), true);
    assert.equal(isWritable('po', `${PLANNING_REL}ROADMAP.md`), true);
    assert.equal(isWritable('po', `${ARCHIVE_REL}T0001-x.md`), false);
    assert.equal(isWritable('po', `${PLANNING_REL}VISION.md`), false, 'the vision is the owner\'s');
    assert.equal(isWritable('po', `${G}src/main.ts`), false);
    assert.equal(isWritable('po', 'agents/machines.json'), false);
  });
});

describe('the public build log', () => {
  it('no agent may change it or the workflow that publishes it', () => {
    for (const profile of ['dev', 'po', 'architect'] as const) {
      for (const p of ['site/build-log.ts', 'site/log-data.ts', '.github/workflows/deploy.yml']) assert.equal(isWritable(profile, p), false, `${profile} ${p}`);
    }
    for (const profile of ['dev', 'po'] as const) {
      const s = claudeSettings(profile, {}) as { permissions: { deny: string[] } };
      assert.ok(s.permissions.deny.some((r) => r.startsWith('Edit(') && r.includes('/site/**')), profile);
    }
  });
});

describe('the live server\'s deploy scripts', () => {
  it('no agent may read or change deploy/ (it runs as root on the game server)', () => {
    for (const profile of ['dev', 'po', 'architect'] as const) {
      assert.equal(isWritable(profile, 'deploy/arena/update.sh'), false, profile);
      const s = claudeSettings(profile, {}) as { permissions: { deny: string[] } };
      assert.ok(s.permissions.deny.some((r) => r.startsWith('Read(') && r.includes('/deploy/**')), `${profile} Read`);
      // The architect may edit nothing at all (a bare Edit deny).
      assert.ok(s.permissions.deny.includes('Edit') || s.permissions.deny.some((r) => r.startsWith('Edit(') && r.includes('/deploy/**')), `${profile} Edit`);
    }
  });
});

describe('architect profile', () => {
  it('may change nothing at all', () => {
    for (const p of [`${G}src/main.ts`, `${T}asus/T0001-x.md`, `${PLANNING_REL}IDEAS.md`, 'loop/runner.ts']) {
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

  it('gets no shell, and no agent gets the git status snapshot', () => {
    const s = claudeSettings('architect', {}) as { permissions: { allow: string[] } };
    assert.ok(!s.permissions.allow.some((r) => r.startsWith('Bash')));
    for (const profile of ['dev', 'po', 'architect'] as const) {
      assert.equal((claudeSettings(profile, {}) as { includeGitInstructions?: boolean }).includeGitInstructions, false, profile);
    }
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
