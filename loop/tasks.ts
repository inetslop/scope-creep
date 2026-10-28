import fs from 'node:fs';
import path from 'node:path';
import { SIZE_ORDER, type FleetConfig } from './config.ts';
import { ARCHIVE_DIR, SALVAGE_DIR, TASKS_DIR } from './paths.ts';

/**
 * Task files live in one shared pool, tasks/T0042-short-slug.md: any machine that can take the
 * task's size claims it (pickTaskFor). Older tasks may sit in tasks/<machine-id>/ folders; those
 * belong to that machine only.
 *
 *   ---
 *   id: T0042
 *   title: Add a pause menu
 *   assignee: desktop          (set when a machine claims it; absent while it waits in the pool)
 *   size: M
 *   priority: 2
 *   status: todo
 *   depends_on: [T0040]
 *   ---
 *   ## Goal ... ## Acceptance criteria ... (free markdown)
 *
 * Lifecycle: design -> designing -> todo -> in-progress -> done | failed
 *   design       written by the PO, waiting for an architect
 *   designing    claimed by an architect (frontmatter `designer`), being designed
 *   todo         has an architect's "## Design" section; devs may pick it up
 *   in-progress  claimed by a machine's runner (its id in `assignee`)
 *   done/failed  result written by the runner; the PO reviews it, then it is archived
 * The PO writes tasks. Only the runner changes status/attempts and appends designs and results.
 */

export const TASK_STATUSES = ['design', 'designing', 'todo', 'in-progress', 'done', 'failed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_SIZES = ['S', 'M', 'L'] as const;
export type TaskSize = (typeof TASK_SIZES)[number];

export interface Task {
  id: string;
  title: string;
  assignee: string;
  size: TaskSize;
  /** 1 = most urgent, 3 = least. */
  priority: number;
  status: TaskStatus;
  dependsOn: string[];
  attempts: number;
  created?: string;
  claimedAt?: string;
  finishedAt?: string;
  commit?: string;
  /** Frontmatter keys we don't know about, preserved verbatim. */
  extra: Record<string, string>;
  /** Markdown after the frontmatter. */
  body: string;
  /** Absolute path of the file. */
  file: string;
}

export class TaskFormatError extends Error {}

const KNOWN_KEYS = ['id', 'title', 'assignee', 'size', 'priority', 'status', 'depends_on', 'attempts', 'created', 'claimed_at', 'finished_at', 'commit'];

function unquote(v: string): string {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function parseList(v: string): string[] {
  const t = v.trim();
  const inner = t.startsWith('[') && t.endsWith(']') ? t.slice(1, -1) : t;
  return inner
    .split(',')
    .map((s) => unquote(s))
    .filter(Boolean);
}

export function parseTask(text: string, file: string): Task {
  const normalized = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) throw new TaskFormatError('missing --- frontmatter --- block');
  const fields: Record<string, string> = {};
  for (const line of match[1]!.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx < 0) throw new TaskFormatError(`bad frontmatter line: "${line}"`);
    fields[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
  }
  const fromName = /^(T\d{3,})/i.exec(path.basename(file))?.[1]?.toUpperCase();
  const id = unquote(fields.id ?? '') || fromName;
  if (!id || !/^T\d{3,}$/.test(id)) throw new TaskFormatError(`invalid or missing id "${fields.id ?? ''}"`);
  const title = unquote(fields.title ?? '');
  if (!title) throw new TaskFormatError('missing title');
  const size = unquote(fields.size ?? 'M').toUpperCase() as TaskSize;
  if (!TASK_SIZES.includes(size)) throw new TaskFormatError(`size must be S, M or L (got "${size}")`);
  const status = unquote(fields.status ?? 'design').toLowerCase() as TaskStatus;
  if (!TASK_STATUSES.includes(status)) throw new TaskFormatError(`invalid status "${status}"`);
  const priority = Number(unquote(fields.priority ?? '2'));
  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) if (!KNOWN_KEYS.includes(k)) extra[k] = v;
  return {
    id,
    title,
    // Pool tasks belong to nobody until claimed; a task in a machine folder belongs to that machine.
    assignee: unquote(fields.assignee ?? '') || (path.dirname(file) === TASKS_DIR || path.dirname(file) === ARCHIVE_DIR ? '' : path.basename(path.dirname(file))),
    size,
    priority: Number.isFinite(priority) ? Math.min(3, Math.max(1, Math.round(priority))) : 2,
    status,
    dependsOn: fields.depends_on ? parseList(fields.depends_on).map((s) => s.toUpperCase()) : [],
    attempts: Number(unquote(fields.attempts ?? '0')) || 0,
    created: fields.created ? unquote(fields.created) : undefined,
    claimedAt: fields.claimed_at ? unquote(fields.claimed_at) : undefined,
    finishedAt: fields.finished_at ? unquote(fields.finished_at) : undefined,
    commit: fields.commit ? unquote(fields.commit) : undefined,
    extra,
    body: match[2]!.replace(/^\n+/, ''),
    file,
  };
}

function quoteIfNeeded(v: string): string {
  return /[:#\[\]{}"']|^\s|\s$/.test(v) ? JSON.stringify(v) : v;
}

export function serializeTask(t: Task): string {
  const lines = [
    `id: ${t.id}`,
    `title: ${quoteIfNeeded(t.title)}`,
    ...(t.assignee ? [`assignee: ${t.assignee}`] : []),
    `size: ${t.size}`,
    `priority: ${t.priority}`,
    `status: ${t.status}`,
    `depends_on: [${t.dependsOn.join(', ')}]`,
    `attempts: ${t.attempts}`,
  ];
  if (t.created) lines.push(`created: ${t.created}`);
  if (t.claimedAt) lines.push(`claimed_at: ${t.claimedAt}`);
  if (t.finishedAt) lines.push(`finished_at: ${t.finishedAt}`);
  if (t.commit) lines.push(`commit: ${t.commit}`);
  for (const [k, v] of Object.entries(t.extra)) lines.push(`${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n\n${t.body.trimEnd()}\n`;
}

export function writeTask(t: Task): void {
  fs.writeFileSync(t.file, serializeTask(t));
}

export function readTask(file: string): Task {
  return parseTask(fs.readFileSync(file, 'utf8'), file);
}

export function appendSection(t: Task, heading: string, content: string): void {
  t.body = `${t.body.trimEnd()}\n\n## ${heading}\n\n${content.trim()}\n`;
}

export const formatTaskId = (n: number): string => `T${String(n).padStart(4, '0')}`;

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .replace(/-+$/, '') || 'task'
  );
}

export function taskFileName(t: Pick<Task, 'id' | 'title'>): string {
  return `${t.id}-${slugify(t.title)}.md`;
}

export interface TaskListing {
  tasks: Task[];
  /** Files that failed to parse: absolute path -> error. */
  invalid: Map<string, string>;
}

function mdFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md') && d.name.toUpperCase() !== 'README.MD')
    .map((d) => path.join(dir, d.name));
}

/** A task in the shared pool (tasks/ itself), not in an older per-machine folder. */
export function isPoolTask(t: Task): boolean {
  return path.dirname(t.file) === TASKS_DIR;
}

/**
 * Every open task: the pool (tasks/) and any older per-machine folders (tasks/<machine>/).
 * Pass `includeArchive` to also read tasks/archive/.
 */
export function listTasks(includeArchive = false): TaskListing {
  const listing: TaskListing = { tasks: [], invalid: new Map() };
  const folders = fs.existsSync(TASKS_DIR)
    ? fs
        .readdirSync(TASKS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && path.join(TASKS_DIR, d.name) !== ARCHIVE_DIR && path.join(TASKS_DIR, d.name) !== SALVAGE_DIR)
        .map((d) => path.join(TASKS_DIR, d.name))
    : [];
  const dirs = [TASKS_DIR, ...folders.sort()];
  if (includeArchive) dirs.push(ARCHIVE_DIR);
  for (const dir of dirs) {
    for (const file of mdFiles(dir)) {
      try {
        listing.tasks.push(readTask(file));
      } catch (err) {
        listing.invalid.set(file, (err as Error).message);
      }
    }
  }
  return listing;
}

/** Highest numeric task id seen anywhere (including the archive). */
export function maxTaskNumber(tasks: readonly Task[]): number {
  return tasks.reduce((max, t) => Math.max(max, Number(t.id.slice(1)) || 0), 0);
}

/** Minutes a bigger machine leaves a small task to the smaller machines that can take it (default 20). */
const claimGrace = (fleet: FleetConfig): number => fleet.loop.claimGraceMinutes ?? fleet.loop.designGraceMinutes ?? 20;

/**
 * The task machine `me` should claim next: a todo task whose dependencies are done, that is its
 * own (an older per-machine task) or in the pool, and no bigger than it takes. Its own come first,
 * then best priority, then the biggest size it can take (big machines on big work), then lowest id.
 * A task a smaller active machine could also take is left to it for the claim grace, so the weak
 * machines always have something; after that anyone may take it.
 */
export function pickTaskFor(me: string, fleet: FleetConfig, all: readonly Task[], nowMs = Date.now()): Task | undefined {
  const mine = fleet.machines[me];
  if (!mine) return undefined;
  const myMax = SIZE_ORDER[mine.maxTaskSize];
  const done = new Set(all.filter((t) => t.status === 'done').map((t) => t.id));
  const smaller = Object.entries(fleet.machines)
    .filter(([id, m]) => id !== me && !m.paused && m.roles.includes('dev') && SIZE_ORDER[m.maxTaskSize] < myMax)
    .map(([, m]) => SIZE_ORDER[m.maxTaskSize]);
  const leaveUpTo = Math.max(0, ...smaller);
  const graceMs = claimGrace(fleet) * 60_000;
  const waited = (t: Task): boolean => {
    const since = t.created ? Date.parse(t.created) : Number.NaN;
    return !Number.isFinite(since) || nowMs - since >= graceMs;
  };
  return all
    .filter((t) => t.status === 'todo' && t.dependsOn.every((d) => done.has(d)))
    .filter((t) => t.assignee === me || (isPoolTask(t) && !t.assignee))
    .filter((t) => SIZE_ORDER[t.size] <= myMax)
    .filter((t) => t.assignee === me || SIZE_ORDER[t.size] > leaveUpTo || waited(t))
    .sort((a, b) => Number(b.assignee === me) - Number(a.assignee === me) || a.priority - b.priority || SIZE_ORDER[b.size] - SIZE_ORDER[a.size] || a.id.localeCompare(b.id))[0];
}

/** Files (relative to game/) named in a task's "## Design": what building it will touch. */
export function designedFiles(t: Task): string[] {
  const design = t.body.split(/\n## Design\b/)[1];
  if (!design) return [];
  return [...new Set([...design.matchAll(/`((?:src|tests|docs)\/[^`\s]+)`/g)].map((m) => m[1]!))];
}

const OPEN_STATUSES = new Set<TaskStatus>(['design', 'designing', 'todo', 'in-progress']);

/**
 * Ids of the open tasks (design to in-progress) that will get built: every dependency is done, or
 * is another such task in the same folder (in the pool, anyone builds the chain in order; in an
 * older machine folder, that machine). A task waiting on a failed or unknown task, or on another
 * machine's folder, is blocked.
 */
export function unblockedTaskIds(all: readonly Task[]): Set<string> {
  const byId = new Map(all.map((t) => [t.id, t]));
  const folderOf = (t: Task): string => path.basename(path.dirname(t.file));
  const memo = new Map<string, boolean>();
  const reachable = (t: Task): boolean => {
    const known = memo.get(t.id);
    if (known !== undefined) return known;
    memo.set(t.id, false); // a dependency cycle never unblocks
    const ok = t.dependsOn.every((d) => {
      const dep = byId.get(d);
      if (dep?.status === 'done') return true;
      return !!dep && OPEN_STATUSES.has(dep.status) && folderOf(dep) === folderOf(t) && reachable(dep);
    });
    memo.set(t.id, ok);
    return ok;
  };
  return new Set(all.filter((t) => OPEN_STATUSES.has(t.status) && reachable(t)).map((t) => t.id));
}
