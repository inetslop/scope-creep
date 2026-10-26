/**
 * The agent loop for one machine. Started (and restarted) by loop/start-agent.ps1.
 *
 *   node loop/runner.ts          run forever
 *   node loop/runner.ts --once   one iteration (sync, maybe plan, maybe one task), then exit
 *
 * Exit codes understood by start-agent.ps1:
 *   0   clean stop (.agent/STOP file or --once)
 *   75  loop code changed upstream: reinstall deps if needed and restart me
 *   76  model server unavailable: wait and restart
 */
import fs from 'node:fs';
import path from 'node:path';
import { releaseOwnDesignClaims, runArchitectPass } from './architect.ts';
import { loadFleet, loadLocalConfig } from './config.ts';
import { runDevTask, type RunContext } from './dev.ts';
import { sleep } from './exec.ts';
import { Git } from './git.ts';
import { ensureLlama } from './llama.ts';
import { error, info, warn } from './log.ts';
import { REPO, STOP_FILE, TASKS_DIR, rel } from './paths.ts';
import { poDue, runPoCycle } from './po.ts';
import { EXIT_NO_MODEL, EXIT_RESTART, needsRestart } from './restart.ts';
import { syncMain, updateTaskAndPush } from './sync.ts';
import { appendSection, listTasks, pickNextTask } from './tasks.ts';

/** After a crash: put our own in-progress tasks back in the queue and clean the checkout. */
async function recover(git: Git, machineId: string): Promise<void> {
  await git.abortRebase();
  if (!(await git.isClean())) {
    warn('working tree is dirty from an interrupted run; stashing it (git stash list to inspect)');
    await git.raw(['stash', 'push', '--include-untracked', '-m', `runner-recovery ${new Date().toISOString()}`]);
  }
  await syncMain(git);
  const mine = listTasks([machineId]).tasks.filter((t) => t.status === 'in-progress');
  for (const t of mine) {
    warn(`${t.id} was in progress when the runner stopped; putting it back in the queue`);
    await updateTaskAndPush(
      git,
      rel(t.file),
      (task) => {
        if (task.status !== 'in-progress') return false;
        task.status = 'todo';
        appendSection(task, `Attempt ${task.attempts} interrupted (${machineId})`, 'The runner stopped mid-task (crash, restart or reboot). Requeued.');
        return true;
      },
      `${t.id}: requeued after interruption`,
    );
  }
}

async function main(): Promise<number> {
  const once = process.argv.includes('--once');
  const local = loadLocalConfig();
  const git = new Git(REPO, `agent-${local.machineId}`);
  info(`runner starting on "${local.machineId}" (pid ${process.pid}, node ${process.version})`);
  // Compare against the commit this process started on: loop updates can arrive through any
  // sync (recovery, task pushes that reset to origin/main), not just the one at the top of the loop.
  const startHead = await git.head();
  await recover(git, local.machineId);
  await releaseOwnDesignClaims({ git, local }, Object.keys(loadFleet().machines));

  for (;;) {
    if (fs.existsSync(STOP_FILE)) {
      fs.rmSync(STOP_FILE);
      info('STOP file found; exiting');
      return 0;
    }
    const fleet = loadFleet();
    const machine = fleet.machines[local.machineId];
    if (!machine) throw new Error(`machine "${local.machineId}" is not in agents/machines.json`);

    await syncMain(git);
    if (needsRestart(await git.diffNames(startHead, 'HEAD'))) {
      info('loop code changed upstream; restarting to pick it up');
      return EXIT_RESTART;
    }
    if (!(await ensureLlama(local))) return EXIT_NO_MODEL;

    const ctx: RunContext = { local, fleet, git };
    let worked = false;
    const allIds = Object.keys(fleet.machines);

    if (machine.roles.includes('po')) {
      const reason = poDue(fleet, listTasks(allIds));
      if (reason) {
        await runPoCycle(ctx, reason);
        worked = true;
      }
    }

    // New tasks are designed before any dev may pick them up. "always" architects design every
    // iteration; "idle" architects only when they have nothing to build (see below).
    const architect = machine.roles.includes('architect');
    const dev = machine.roles.includes('dev');
    // "idle" devs plan and design full time and only build when neither had anything to do.
    const idleDev = dev && machine.devMode === 'idle';
    const idleArchitect = architect && dev && !idleDev && machine.architectMode === 'idle';
    if (architect && !idleArchitect && (await runArchitectPass(ctx, { max: fleet.loop.architectMaxPerPass, preferOwn: false })) > 0) worked = true;

    // An idle dev that just planned or designed loops straight back (no sleep) to look for more.
    if (dev && !(idleDev && worked)) {
      const listing = listTasks(allIds, true);
      const mineDir = path.join(TASKS_DIR, local.machineId);
      const task = pickNextTask(
        listing.tasks.filter((t) => path.dirname(t.file) === mineDir),
        listing.tasks,
      );
      if (task) {
        await runDevTask(ctx, task);
        worked = true;
      } else if (idleArchitect && (await runArchitectPass(ctx, { max: 1, preferOwn: true })) > 0) {
        // Nothing to build: design one task (own first), then look for dev work again.
        worked = true;
      }
    }

    if (once) return 0;
    if (!worked) await sleep(fleet.loop.pollSeconds * 1000);
  }
}

main().then(
  (code) => process.exit(code),
  (err: Error) => {
    error(`runner crashed: ${err.stack ?? err.message}`);
    process.exit(1);
  },
);
