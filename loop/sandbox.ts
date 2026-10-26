import path from 'node:path';
import type { Role } from './config.ts';
import type { ChangedPath, Git } from './git.ts';
import { AGENT_DIR, AGENTS_DIR, GAME_DIR, PLANNING_DIR, permissionPath, REPO, TASKS_DIR } from './paths.ts';

/**
 * Who may change what. This is the core of the separation between the game and
 * the loop, enforced twice:
 *   1. Claude Code permission rules (claudeSettings) stop the agent's tools.
 *   2. enforceWritable() runs after every agent session and reverts ANY change
 *      outside the profile's writable paths (catches anything the rules missed,
 *      e.g. a test script that writes files). The runner also only ever stages
 *      the writable paths when it commits.
 */
export type Profile = Role;

export const WRITABLE: Record<Profile, readonly string[]> = {
  dev: ['game/'],
  po: ['tasks/', 'planning/'],
  // The architect only reads; the runner writes its design into the task file.
  architect: [],
};

/** Inside writable areas, but still human-owned. */
export const PROTECTED: Record<Profile, readonly string[]> = {
  dev: ['game/CLAUDE.md'],
  po: ['tasks/archive/'],
  architect: [],
};

export function isWritable(profile: Profile, repoPath: string): boolean {
  const p = repoPath.replace(/\\/g, '/');
  if (PROTECTED[profile].some((prefix) => p === prefix || p.startsWith(prefix))) return false;
  return WRITABLE[profile].some((prefix) => p.startsWith(prefix));
}

/** Reverts every change the profile was not allowed to make. Returns the reverted paths. */
export async function enforceWritable(git: Git, profile: Profile): Promise<string[]> {
  const changed = await git.changedPaths();
  const violations: ChangedPath[] = changed.filter((c) => !isWritable(profile, c.path));
  for (const v of violations) await git.revertPath(v);
  return violations.map((v) => v.path);
}

const rule = (tool: string, absPath: string, glob = '/**'): string => `${tool}(${permissionPath(absPath)}${glob})`;

/** Root-level loop folders/files no agent may touch. */
const LOOP_AREAS = [path.join(REPO, 'loop'), path.join(REPO, 'setup'), AGENTS_DIR, AGENT_DIR, path.join(REPO, '.github'), path.join(REPO, 'node_modules')];
const ROOT_FILES = ['package.json', 'package-lock.json', 'tsconfig.json', '.gitignore', 'README.md'].map((f) => path.join(REPO, f));

const READ_ONLY_TOOLS = ['Read', 'Glob', 'Grep', 'LS', 'TodoWrite'];

/** Shell commands a dev agent may run (inside game/). Everything else is denied. */
const DEV_BASH = [
  ...['check', 'typecheck', 'lint', 'test', 'build', 'smoke', 'verify'].flatMap((s) => [`Bash(npm run ${s})`, `Bash(npm run ${s} *)`]),
  'Bash(npx vitest *)',
  'Bash(npx tsc *)',
  'Bash(npx eslint *)',
  'Bash(git status)',
  'Bash(git status *)',
  'Bash(git diff)',
  'Bash(git diff *)',
  'Bash(git log *)',
  'Bash(git show *)',
];

/** Read-only git for the architect. (The PO gets no shell: its git log is in the prompt.) */
const GIT_READ_BASH = ['Bash(git status)', 'Bash(git status *)', 'Bash(git log *)', 'Bash(git show *)', 'Bash(git diff *)'];

const ALWAYS_DENY = [
  'WebFetch',
  'WebSearch',
  // Subagents would double the load on a local model; a bare deny also drops the tool from the prompt.
  'Agent',
  'Task',
  'NotebookEdit',
  'Bash(git commit *)',
  'Bash(git push *)',
  'Bash(git reset *)',
  'Bash(git checkout *)',
  'Bash(git switch *)',
  'Bash(git rebase *)',
  'Bash(git stash *)',
  'Bash(git clean *)',
  'Bash(npm install *)',
  'Bash(npm i *)',
  'Bash(npm ci *)',
  'Bash(npm uninstall *)',
  'Bash(curl *)',
  'Bash(rm *)',
];

/** Claude Code settings for a profile, passed with --settings (rules use absolute paths). */
export function claudeSettings(profile: Profile, env: Record<string, string>): object {
  const loopReads = LOOP_AREAS.map((d) => rule('Read', d));
  const loopEdits = [...LOOP_AREAS.map((d) => rule('Edit', d)), ...ROOT_FILES.map((f) => `Edit(${permissionPath(f)})`)];

  // Agents never commit and can't use memory: keep those instructions out of their (small) context.
  const common = { autoMemoryEnabled: false, includeCoAuthoredBy: false, attribution: { commit: '', pr: '' } };
  // Same view of the repo as a dev (the game, not the queue or the loop).
  const devReadDenies = [rule('Read', TASKS_DIR), rule('Read', PLANNING_DIR), ...loopReads];

  if (profile === 'architect') {
    return {
      ...common,
      permissions: {
        allow: [...READ_ONLY_TOOLS, ...GIT_READ_BASH],
        deny: [...ALWAYS_DENY, ...devReadDenies, 'Edit', 'Write'],
      },
      env,
    };
  }
  if (profile === 'dev') {
    return {
      ...common,
      permissions: {
        allow: [...READ_ONLY_TOOLS, rule('Edit', GAME_DIR), ...DEV_BASH],
        deny: [
          ...ALWAYS_DENY,
          // Devs never see or touch the task queue, planning docs or the loop.
          ...devReadDenies,
          rule('Edit', TASKS_DIR),
          rule('Edit', PLANNING_DIR),
          ...loopEdits,
          `Edit(${permissionPath(path.join(GAME_DIR, 'CLAUDE.md'))})`,
        ],
      },
      env,
    };
  }
  return {
    ...common,
    permissions: {
      // The PO plans from planning/ and tasks/ only. It never reads the game's code (that is the
      // architect's job); it gets a generated inventory and planning/CHANGELOG.md instead.
      allow: [...READ_ONLY_TOOLS, rule('Edit', TASKS_DIR), rule('Edit', PLANNING_DIR)],
      deny: [...ALWAYS_DENY, 'Bash', rule('Read', GAME_DIR), ...loopReads, ...loopEdits, rule('Edit', GAME_DIR), rule('Edit', path.join(TASKS_DIR, 'archive'))],
    },
    env,
  };
}
