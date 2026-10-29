import fs from 'node:fs';
import path from 'node:path';

/** Repository root (the folder that contains loop/, game/, tasks/ ...). */
export const REPO = path.resolve(import.meta.dirname, '..');
export const AGENTS_DIR = path.join(REPO, 'agents');

/**
 * The fleet works on one game at a time: `loop.project` in agents/machines.json. The first game,
 * Scope Creep, lives at the repo root (game/, planning/, tasks/); every other project in
 * projects/<id>/ with the same three folders. SCOPE_CREEP_PROJECT overrides the setting (the
 * deploy builds every project; tests pin the original one).
 */
export const ORIGINAL_PROJECT = 'scope-creep';
export const PROJECTS_DIR = path.join(REPO, 'projects');

/** Folder holding a project's game/, planning/ and tasks/. */
export function projectDir(id: string): string {
  return id === ORIGINAL_PROJECT ? REPO : path.join(PROJECTS_DIR, id);
}

/** Every project in the repo: the original one, then projects/<id>/ folders that have a game. */
export function projectIds(): string[] {
  const others = fs.existsSync(PROJECTS_DIR)
    ? fs
        .readdirSync(PROJECTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && fs.existsSync(path.join(PROJECTS_DIR, d.name, 'game')))
        .map((d) => d.name)
        .sort()
    : [];
  return [ORIGINAL_PROJECT, ...others];
}

/** `loop.project` as committed (re-read each cycle by the runner, which restarts when it changes). */
export function configuredProject(): string {
  try {
    const fleet = JSON.parse(fs.readFileSync(path.join(AGENTS_DIR, 'machines.json'), 'utf8')) as { loop?: { project?: string } };
    return fleet.loop?.project || ORIGINAL_PROJECT;
  } catch {
    return ORIGINAL_PROJECT;
  }
}

/** The project this process works on, fixed for its lifetime. */
export const PROJECT = process.env.SCOPE_CREEP_PROJECT || configuredProject();
export const PROJECT_DIR = projectDir(PROJECT);
export const GAME_DIR = path.join(PROJECT_DIR, 'game');
export const TASKS_DIR = path.join(PROJECT_DIR, 'tasks');
export const ARCHIVE_DIR = path.join(TASKS_DIR, 'archive');
/** Work from attempts that passed the gate but could not be merged, kept for the next attempt (<id>.diff). */
export const SALVAGE_DIR = path.join(TASKS_DIR, 'salvage');
/** Tasks without an id, dropped in by anyone; the PO machine numbers them into the pool (loop/inbox.ts). */
export const INBOX_DIR = path.join(TASKS_DIR, 'inbox');
export const PLANNING_DIR = path.join(PROJECT_DIR, 'planning');
/** Per-machine, git-ignored state. */
export const AGENT_DIR = path.join(REPO, '.agent');
export const LOG_DIR = path.join(AGENT_DIR, 'logs');
export const RUNS_DIR = path.join(AGENT_DIR, 'runs');
export const SMOKE_OUT_DIR = path.join(AGENT_DIR, 'smoke');
/** Isolated Claude Code config dir so agents never see the user's own settings, hooks or MCP servers. */
export const CLAUDE_HOME = path.join(AGENT_DIR, 'claude-home');
/** Create this file to make the runner exit cleanly at the next safe point. */
export const STOP_FILE = path.join(AGENT_DIR, 'STOP');

/** Repo-relative POSIX path, e.g. "game/src/main.ts". */
export function rel(absPath: string): string {
  return path.relative(REPO, absPath).split(path.sep).join('/');
}

/** Repo-relative folders of this project with a trailing slash, as git and the sandbox see them: "game/" or "projects/<id>/game/". */
export const GAME_REL = `${rel(GAME_DIR)}/`;
export const TASKS_REL = `${rel(TASKS_DIR)}/`;
export const ARCHIVE_REL = `${rel(ARCHIVE_DIR)}/`;
export const PLANNING_REL = `${rel(PLANNING_DIR)}/`;

/**
 * Absolute path in the form Claude Code permission rules expect on Windows:
 * C:\Users\me\repo -> //c/Users/me/repo
 */
export function permissionPath(absPath: string): string {
  const posix = absPath.split(path.sep).join('/');
  const drive = /^([A-Za-z]):\//.exec(posix);
  return drive ? `//${drive[1]!.toLowerCase()}/${posix.slice(3)}` : `/${posix}`;
}
