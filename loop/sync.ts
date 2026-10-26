import fs from 'node:fs';
import path from 'node:path';
import type { Git } from './git.ts';
import { info, warn } from './log.ts';
import { REPO } from './paths.ts';
import { readTask, writeTask, type Task } from './tasks.ts';

/**
 * Brings the local checkout up to date with origin/main. Local main should never
 * carry unpushed work between cycles; if it does (crash), we try to push it and
 * otherwise drop it. Returns the repo paths that changed.
 */
export async function syncMain(git: Git): Promise<string[]> {
  await git.abortRebase();
  await git.fetch();
  const before = await git.head();
  const ahead = await git.aheadCount();
  if (ahead > 0) {
    warn(`${ahead} unpushed local commit(s) found; trying to push them`);
    if ((await git.rebase('upstream')) === 'ok' && (await git.push()).code === 0) {
      info('pushed leftover commits');
    } else {
      await git.abortRebase();
      warn('could not push leftover commits; resetting to origin/main');
      await git.resetHard('origin/main');
    }
  } else if ((await git.behindCount()) > 0 && !(await git.fastForward())) {
    warn('fast-forward failed; resetting to origin/main');
    await git.resetHard('origin/main');
  }
  const after = await git.head();
  return before === after ? [] : git.diffNames(before, after);
}

/**
 * Safely updates ONE task file on top of the latest origin/main and pushes it.
 * Resets the checkout to origin/main first, so only call this when there is no
 * local work worth keeping. `mutate` returns false to cancel.
 */
export async function updateTaskAndPush(git: Git, taskRel: string, mutate: (t: Task) => boolean, message: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    await git.abortRebase();
    await git.fetch();
    await git.resetHard('origin/main');
    const abs = path.join(REPO, taskRel);
    if (!fs.existsSync(abs)) {
      warn(`${taskRel} no longer exists upstream`);
      return false;
    }
    const task = readTask(abs);
    if (!mutate(task)) return false;
    writeTask(task);
    if (!(await git.commitPaths([taskRel], message))) return true;
    if ((await git.push()).code === 0) return true;
    warn(`push of ${taskRel} rejected (attempt ${attempt}); retrying on latest main`);
  }
  await git.resetHard('origin/main');
  return false;
}

/** Commits `paths` and pushes, rebasing onto origin/main (upstream wins conflicts). */
export async function commitAndPush(git: Git, paths: readonly string[], message: string): Promise<boolean> {
  if (!(await git.commitPaths(paths, message))) return true;
  for (let attempt = 1; attempt <= 4; attempt++) {
    if ((await git.push()).code === 0) return true;
    await git.fetch();
    if ((await git.rebase('upstream')) !== 'ok') {
      await git.abortRebase();
      break;
    }
  }
  warn(`could not push "${message}"; dropping it`);
  await git.resetHard('origin/main');
  return false;
}
