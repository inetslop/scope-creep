import path from 'node:path';

/** Repository root (the folder that contains loop/, game/, tasks/ ...). */
export const REPO = path.resolve(import.meta.dirname, '..');
export const GAME_DIR = path.join(REPO, 'game');
export const TASKS_DIR = path.join(REPO, 'tasks');
export const ARCHIVE_DIR = path.join(TASKS_DIR, 'archive');
/** Work from attempts that passed the gate but could not be merged, kept for the next attempt (<id>.diff). */
export const SALVAGE_DIR = path.join(TASKS_DIR, 'salvage');
export const PLANNING_DIR = path.join(REPO, 'planning');
export const AGENTS_DIR = path.join(REPO, 'agents');
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

/**
 * Absolute path in the form Claude Code permission rules expect on Windows:
 * C:\Users\me\repo -> //c/Users/me/repo
 */
export function permissionPath(absPath: string): string {
  const posix = absPath.split(path.sep).join('/');
  const drive = /^([A-Za-z]):\//.exec(posix);
  return drive ? `//${drive[1]!.toLowerCase()}/${posix.slice(3)}` : `/${posix}`;
}
