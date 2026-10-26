/** Changes agents/machines.json on top of the latest origin/main and pushes it. */
import fs from 'node:fs';
import path from 'node:path';
import { Git } from '../../loop/git.ts';
import { formatFleetJson, type FleetFile } from './fleet.ts';

const FILE = 'agents/machines.json';

export function readFleet(repo: string): FleetFile {
  return JSON.parse(fs.readFileSync(path.join(repo, FILE), 'utf8')) as FleetFile;
}

/**
 * Applies `mutate` to the newest machines.json and pushes, retrying when someone else pushed first.
 * The checkout is reset to origin/main for this, so it must be an agent checkout with nothing local
 * to keep (on main, clean, nothing unpushed); otherwise it refuses.
 */
export async function updateFleetAndPush(repo: string, author: string, mutate: (fleet: FleetFile) => FleetFile, message: string): Promise<void> {
  const git = new Git(repo, author);
  const branch = (await git.ok(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  const dirty = (await git.changedPaths()).map((c) => c.path).filter((p) => !p.startsWith('.agent/'));
  await git.fetch();
  if (branch !== 'main' || dirty.length > 0 || (await git.aheadCount()) > 0) {
    throw new Error(`${repo} must be on main with no local changes or unpushed commits to update ${FILE} (branch ${branch}, changed: ${dirty.join(', ') || 'none'})`);
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    await git.fetch();
    await git.resetHard('origin/main');
    fs.writeFileSync(path.join(repo, FILE), formatFleetJson(mutate(readFleet(repo))));
    if (!(await git.commitPaths([FILE], message))) return; // already as wanted
    if ((await git.push()).code === 0) return;
  }
  await git.resetHard('origin/main');
  throw new Error(`could not push ${FILE} (rejected 4 times)`);
}
