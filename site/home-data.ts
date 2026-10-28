/**
 * What the front page (site/home.ts) shows, worked out from the repo: each project's tasks and
 * what every machine is doing. Pure apart from reading task files, so it is unit-tested.
 */
import fs from 'node:fs';
import path from 'node:path';
import { readTask, type Task } from '../loop/tasks.ts';
import { parseDesigner, parseResult } from './log-data.ts';

/** A machine as agents/machines.json describes it (the fields the page shows). */
export interface MachineConfig {
  label: string;
  model: string;
  roles?: string[];
  paused?: boolean;
  maxTaskSize?: string;
}

/**
 * Every task file of a project: the shared pool, older per-machine folders and the archive (not
 * salvage/, which holds diffs). Files that don't parse are skipped: the page never fails on one.
 */
export function projectTasks(projectDir: string): Task[] {
  const tasksDir = path.join(projectDir, 'tasks');
  if (!fs.existsSync(tasksDir)) return [];
  const dirs = [tasksDir, ...fs.readdirSync(tasksDir, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'salvage').map((d) => path.join(tasksDir, d.name))];
  const tasks: Task[] = [];
  for (const dir of dirs) {
    for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      try {
        tasks.push(readTask(path.join(dir, name)));
      } catch {
        /* not a task file */
      }
    }
  }
  return tasks;
}

export interface PoolCounts {
  /** In progress: a machine is building it. */
  building: number;
  /** Designed and ready for a machine to take. */
  ready: number;
  /** An architect is designing it. */
  designing: number;
  /** Waiting for an architect. */
  design: number;
  done: number;
  failed: number;
}

export function poolCounts(tasks: readonly Task[]): PoolCounts {
  const n = (s: string): number => tasks.filter((t) => t.status === s).length;
  return { building: n('in-progress'), ready: n('todo'), designing: n('designing'), design: n('design'), done: n('done'), failed: n('failed') };
}

/** When the project's last task was finished (ISO), if any. */
export function lastFinished(tasks: readonly Task[]): string | undefined {
  return tasks
    .filter((t) => t.status === 'done' && t.finishedAt)
    .map((t) => t.finishedAt!)
    .sort()
    .at(-1);
}

export type MachineState = 'paused' | 'building' | 'designing' | 'idle';

export interface MachineView {
  id: string;
  label: string;
  model: string;
  roles: string[];
  maxTaskSize?: string;
  state: MachineState;
  /** The task it is building or designing: since when (its claim), and its file. */
  task?: { id: string; title: string; since?: string; file: string };
  /** Tasks of the project it built (the last Result section names it). */
  built: number;
  /** Tasks of the project it designed. */
  designed: number;
  /** Its last commit (ISO), if any. */
  lastActive?: string;
}

/**
 * What one machine is doing in the project the fleet builds. Paused wins: a paused machine may
 * still hold a claim from before the pause. Building wins over designing.
 */
export function machineView(id: string, m: MachineConfig, tasks: readonly Task[], lastActive?: string): MachineView {
  const building = tasks.find((t) => t.status === 'in-progress' && t.assignee === id);
  const designing = tasks.find((t) => t.status === 'designing' && t.extra.designer === id);
  const task = building ?? designing;
  const state: MachineState = m.paused ? 'paused' : building ? 'building' : designing ? 'designing' : 'idle';
  return {
    id,
    label: m.label,
    model: m.model,
    roles: m.roles ?? ['dev'],
    maxTaskSize: m.maxTaskSize,
    state,
    task: task && state !== 'paused' ? { id: task.id, title: task.title, since: task.claimedAt, file: task.file } : undefined,
    built: tasks.filter((t) => t.status === 'done' && parseResult(t.body).machine === id).length,
    designed: tasks.filter((t) => parseDesigner(t.body) === id).length,
    lastActive,
  };
}

/** Busy machines first (building, then designing), then idle, then paused; config order within. */
export function sortMachines(views: readonly MachineView[]): MachineView[] {
  const rank: Record<MachineState, number> = { building: 0, designing: 1, idle: 2, paused: 3 };
  return views.map((v, i) => ({ v, i })).sort((a, b) => rank[a.v.state] - rank[b.v.state] || a.i - b.i).map((x) => x.v);
}
