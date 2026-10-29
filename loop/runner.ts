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
import { releaseOwnDesignClaims, runArchitectPass } from './architect.ts';
import { FLEET_FILE, loadFleet, loadLocalConfig, type FleetConfig } from './config.ts';
import { runDevTask, type RunContext } from './dev.ts';
import { sleep } from './exec.ts';
import { Git } from './git.ts';
import { ensureLlama } from './llama.ts';
import { error, info, warn } from './log.ts';
import { configuredProject, PROJECT, REPO, STOP_FILE, rel } from './paths.ts';
import { importInbox } from './inbox.ts';
import { poDue, runPoCycle } from './po.ts';
import { EXIT_NO_MODEL, EXIT_RESTART, needsRestart } from './restart.ts';
import { syncMain, updateTaskAndPush } from './sync.ts';
import { appendSection, isPoolTask, listTasks, PAUSED_CLAIM_MINUTES, pausedClaims, pickTaskFor } from './tasks.ts';

/** After a crash: put our own in-progress tasks back in the queue and clean the checkout. */
async function recover(git: Git, machineId: string): Promise<void> {
  await git.abortRebase();
  if (!(await git.isClean())) {
    warn('working tree is dirty from an interrupted run; stashing it (git stash list to inspect)');
    await git.raw(['stash', 'push', '--include-untracked', '-m', `runner-recovery ${new Date().toISOString()}`]);
  }
  await syncMain(git);
  const mine = listTasks().tasks.filter((t) => t.status === 'in-progress' && t.assignee === machineId);
  for (const t of mine) {
    warn(`${t.id} was in progress when the runner stopped; putting it back in the queue`);
    await updateTaskAndPush(
      git,
      rel(t.file),
      (task) => {
        if (task.status !== 'in-progress') return false;
        task.status = 'todo';
        // Back into the pool, for any machine to take.
        if (isPoolTask(task)) task.assignee = '';
        appendSection(task, `Attempt ${task.attempts} interrupted (${machineId})`, 'The runner stopped mid-task (crash, restart or reboot). Requeued.');
        return true;
      },
      `${t.id}: requeued after interruption`,
    );
  }
}

/**
 * On the PO machine: tasks a paused machine has held in progress for an hour go back to the pool
 * (tasks.ts pausedClaims), so its files unlock for the others. If it comes back and finishes one
 * anyway, its runner sees the claim is gone and saves the work instead of pushing it (dev.ts).
 */
async function releasePausedClaims(git: Git, fleet: FleetConfig): Promise<boolean> {
  const changedAt = (await git.ok(['log', '-1', '--format=%cI', '--', rel(FLEET_FILE)])).trim() || undefined;
  let released = false;
  for (const t of pausedClaims(listTasks().tasks, fleet, Date.now(), changedAt)) {
    const holder = t.assignee;
    warn(`${t.id}: ${holder} has been paused for over ${PAUSED_CLAIM_MINUTES} minutes holding it; putting it back in the pool`);
    const ok = await updateTaskAndPush(
      git,
      rel(t.file),
      (task) => {
        if (task.status !== 'in-progress' || task.assignee !== holder) return false;
        task.status = 'todo';
        if (isPoolTask(task)) task.assignee = '';
        task.claimedAt = undefined;
        appendSection(task, `Attempt ${task.attempts} released (${holder})`, `The machine was paused for over ${PAUSED_CLAIM_MINUTES} minutes holding this task, which kept its files locked for the others. Requeued.`);
        return true;
      },
      `${t.id}: back in the pool (${holder} paused over an hour)`,
    );
    released ||= ok;
  }
  return released;
}

async function main(): Promise<number> {
  const once = process.argv.includes('--once');
  const local = loadLocalConfig();
  const git = new Git(REPO, `agent-${local.machineId}`);
  info(`runner starting on "${local.machineId}" (project ${PROJECT}, pid ${process.pid}, node ${process.version})`);
  // Compare against the commit this process started on: loop updates can arrive through any
  // sync (recovery, task pushes that reset to origin/main), not just the one at the top of the loop.
  const startHead = await git.head();
  await recover(git, local.machineId);
  await releaseOwnDesignClaims({ git, local });
  let pausedLogged = false;

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
    // The paths are fixed per process: switching loop.project takes a restart (between tasks, like a loop update).
    if (!process.env.SCOPE_CREEP_PROJECT && configuredProject() !== PROJECT) {
      info(`loop.project changed to "${configuredProject()}"; restarting to work on it`);
      return EXIT_RESTART;
    }
    // Paused in agents/machines.json: no model server, no work, but keep syncing so un-pausing applies.
    if (machine.paused) {
      if (!pausedLogged) info(`"${local.machineId}" is paused in agents/machines.json; idling until it is unpaused`);
      pausedLogged = true;
      if (once) return 0;
      await sleep(fleet.loop.pollSeconds * 1000);
      continue;
    }
    pausedLogged = false;
    if (!(await ensureLlama(local))) return EXIT_NO_MODEL;

    const ctx: RunContext = { local, fleet, git };
    let worked = false;

    if (machine.roles.includes('po')) {
      // The PO machine hands out every id: inbox tasks first, then its own cycle takes the next ones.
      if ((await importInbox(git)).length > 0) worked = true;
      if (await releasePausedClaims(git, fleet)) worked = true;
      const reason = poDue(fleet, listTasks(true));
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
      // From the shared pool: the best task this machine can take (see tasks.ts pickTaskFor).
      const task = pickTaskFor(local.machineId, fleet, listTasks(true).tasks);
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
