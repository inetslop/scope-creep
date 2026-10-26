import fs from 'node:fs';
import path from 'node:path';
import { ARCHIVE_DIR, TASKS_DIR } from './paths.ts';

/**
 * Task files: tasks/<machine-id>/T0042-short-slug.md
 *
 *   ---
 *   id: T0042
 *   title: Add a pause menu
 *   assignee: desktop
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
 *   in-progress  claimed by the assignee's runner
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
    assignee: unquote(fields.assignee ?? '') || path.basename(path.dirname(file)),
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
    `assignee: ${t.assignee}`,
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

/** Tasks in tasks/<machine>/ folders. Pass `includeArchive` to also read tasks/archive/. */
export function listTasks(machineIds: readonly string[], includeArchive = false): TaskListing {
  const listing: TaskListing = { tasks: [], invalid: new Map() };
  const dirs = machineIds.map((m) => path.join(TASKS_DIR, m));
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

/** Next task this machine should work on: todo, dependencies done, best priority, lowest id. */
export function pickNextTask(mine: readonly Task[], all: readonly Task[]): Task | undefined {
  const done = new Set(all.filter((t) => t.status === 'done').map((t) => t.id));
  return mine
    .filter((t) => t.status === 'todo' && t.dependsOn.every((d) => done.has(d)))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))[0];
}
